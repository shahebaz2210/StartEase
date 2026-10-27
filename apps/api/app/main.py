import logging
from typing import Optional, Tuple, List
from fastapi import FastAPI, HTTPException, status, Path as FastApiPath
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from app.config import settings
from app.models.schemas import (
    App,
    StepResponse,
    CreateSessionRequest,
    RespondRequest,
    ResumeRequest,
    ErrorResponse,
    HealthResponse,
    StatusEnum,
    VariantEnum,
    UserResponseEnum,
    ResumeModeEnum,
    ErrorTypeEnum,
)
from app.safety.crisis import is_crisis, CRISIS_RESPONSE_TEXT
from app.retrieval.retriever import retriever
from app.retrieval.task_splitter import split_tasks
from app.llm.gemini_client import gemini_client, PLAIN_DOCUMENT_STEP
from app.sessions.session_manager import session_manager
from app.auth.routes import auth_router

# Configure privacy-safe logging: never log task text or step text
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("startease.api")

app = FastAPI(
    title="StartEase API",
    version="1.0.0",
    description="One step at a time. No response ever includes a step count, step index, remaining steps or a list of steps.",
)

# Mount authentication router
app.include_router(auth_router, prefix="/v1/auth", tags=["Authentication"])

# CORS Middleware locking origins to web app and Electron app
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NO_MATCH_MESSAGE = (
    "I can't find a good match for that yet. I can help with study and work tasks "
    "like writing, design, data, code and planning. Could you say it a different way?"
)


@app.get("/healthz", response_model=HealthResponse, tags=["Health"])
def health_check():
    """Health check endpoint."""
    return HealthResponse(ok=True)


def resolve_steps_for_task(task_text: str) -> Tuple[Optional[int], Optional[str], Optional[str], List[str]]:
    """Resolves app, reason, and steps for a single task using Hybrid RAG + LLM fallback.
    Returns (matched_task_id, app_name, app_reason, steps).
    """
    matches, score = retriever.retrieve(task_text, top_k=settings.TOP_K)
    if matches:
        matched_task_id, app_name, steps = gemini_client.generate_task_steps(task_text, matches)
        session_manager.record_llm_call()

        if matched_task_id is not None and steps:
            matched_row = retriever.id_to_row.get(matched_task_id)
            app_reason = matched_row.reason if matched_row else f"Recommended tool for this task."
            return matched_task_id, app_name, app_reason, steps

    # Fallback to open-ended LLM decomposition
    logger.info("No catalogue match above threshold. Falling back to open-ended LLM decomposition.")
    app_name, app_reason, steps = gemini_client.generate_open_ended_task_steps(task_text)
    session_manager.record_llm_call()
    if steps and app_name:
        return None, app_name, app_reason or f"Recommended tool for {task_text}.", steps

    return None, None, None, []


@app.post(
    "/v1/sessions",
    response_model=StepResponse,
    status_code=status.HTTP_200_OK,
    responses={
        400: {"model": ErrorResponse},
        429: {"model": ErrorResponse},
    },
    tags=["Sessions"],
)
def create_session(request: CreateSessionRequest):
    """Starts a task session and returns exactly the first tiny step.

    Never logs task text.
    """
    raw_task = request.task.strip()
    if not raw_task:
        return StepResponse(
            status=StatusEnum.NO_MATCH,
            step=NO_MATCH_MESSAGE,
        )

    # 1. Pre-retrieval Crisis Check (docs/safety.md)
    if is_crisis(raw_task):
        logger.info("Crisis language detected before retrieval. Returning emergency response.")
        return StepResponse(
            status=StatusEnum.CRISIS,
            step=CRISIS_RESPONSE_TEXT,
        )

    # 2. Check for rate limit
    if not session_manager.can_make_llm_call():
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content=ErrorResponse(
                error=ErrorTypeEnum.RATE_LIMITED,
                message="Daily request limit reached. Please take a calm rest and try again later.",
            ).model_dump(),
        )

    # 3. Split into discrete tasks for multi-task brain-dumps
    tasks = split_tasks(raw_task)
    if not tasks:
        return StepResponse(
            status=StatusEnum.NO_MATCH,
            step=NO_MATCH_MESSAGE,
        )

    active_task = tasks[0]
    task_queue = tasks[1:]

    # 4. Check for explicitly unsupported domain (taxes, legal, medical, etc.)
    if retriever.is_unsupported_domain(active_task):
        logger.info("Task matches explicitly unsupported domain. Returning no-match.")
        return StepResponse(
            status=StatusEnum.NO_MATCH,
            step=NO_MATCH_MESSAGE,
        )

    # 5. Resolve steps for active task
    matched_task_id, app_name, app_reason, steps = resolve_steps_for_task(active_task)
    if not steps or not app_name:
        return StepResponse(
            status=StatusEnum.NO_MATCH,
            step=NO_MATCH_MESSAGE,
        )

    session = session_manager.create_session(
        task=active_task,
        matched_task_id=matched_task_id,
        app_name=app_name,
        app_reason=app_reason,
        steps=steps,
        task_queue=task_queue,
    )

    logger.info("Session created successfully. Returning step 1.")
    return StepResponse(
        session_id=session.session_id,
        status=StatusEnum.STEP,
        task=session.task,
        step=session.current_step,
        app=App(name=session.app_name, reason=session.app_reason),
        variant=VariantEnum.NORMAL,
        has_more_tasks=session.has_more_tasks,
        next_task_title=session.next_task_title,
    )


@app.post(
    "/v1/sessions/{id}/respond",
    response_model=StepResponse,
    responses={
        404: {"model": ErrorResponse},
        429: {"model": ErrorResponse},
    },
    tags=["Sessions"],
)
def respond_to_step(
    id: str = FastApiPath(..., description="Opaque session identifier"),
    request: RespondRequest = ...,
):
    """Handles single-tap user responses: Done, Confused, Too big, Not now, Can't use app."""
    session = session_manager.get_session(id)
    if not session:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=ErrorResponse(
                error=ErrorTypeEnum.SESSION_NOT_FOUND,
                message="Session not found or expired. You can start the task again.",
            ).model_dump(),
        )

    user_resp = request.response

    if user_resp == UserResponseEnum.DONE:
        has_more = session.advance_step()
        session_manager.save()
        if not has_more:
            logger.info("Task completed.")
            return StepResponse(
                session_id=session.session_id,
                status=StatusEnum.COMPLETE,
                task=session.task,
                has_more_tasks=session.has_more_tasks,
                next_task_title=session.next_task_title,
            )
        return StepResponse(
            session_id=session.session_id,
            status=StatusEnum.STEP,
            task=session.task,
            step=session.current_step,
            app=App(name=session.app_name, reason=session.app_reason),
            variant=VariantEnum.NORMAL,
            has_more_tasks=session.has_more_tasks,
            next_task_title=session.next_task_title,
        )

    elif user_resp == UserResponseEnum.SIMPLER_STEP:
        if not session_manager.can_make_llm_call(session_id=session.session_id):
            smaller_steps = [
                f"Open {session.app_name} and wait for the screen to load.",
                f"Take one calm look at the options in {session.app_name}.",
            ]
        else:
            smaller_steps = gemini_client.make_step_simpler(
                session.current_step or "", session.task, session.app_name or ""
            )
            session_manager.record_llm_call(session_id=session.session_id)

        session.insert_smaller_steps(smaller_steps)
        session_manager.save()
        return StepResponse(
            session_id=session.session_id,
            status=StatusEnum.STEP,
            task=session.task,
            step=session.current_step,
            app=App(name=session.app_name, reason=session.app_reason),
            variant=VariantEnum.SIMPLER,
            has_more_tasks=session.has_more_tasks,
            next_task_title=session.next_task_title,
        )

    elif user_resp == UserResponseEnum.CONFUSED:
        if not session_manager.can_make_llm_call(session_id=session.session_id):
            explanation = f"Open {session.app_name} on your device and locate the search or create option."
        else:
            explanation = gemini_client.explain_step_confused(
                session.current_step or "", session.task, session.app_name or ""
            )
            session_manager.record_llm_call(session_id=session.session_id)

        session.replace_current_step(explanation, variant="explained")
        session_manager.save()
        return StepResponse(
            session_id=session.session_id,
            status=StatusEnum.STEP,
            task=session.task,
            step=explanation,
            app=App(name=session.app_name, reason=session.app_reason),
            variant=VariantEnum.EXPLAINED,
            has_more_tasks=session.has_more_tasks,
            next_task_title=session.next_task_title,
        )

    elif user_resp == UserResponseEnum.TOO_BIG:
        if not session_manager.can_make_llm_call(session_id=session.session_id):
            smaller_steps = [
                f"Open {session.app_name} and wait for the screen to load.",
                f"Take one calm look at the options in {session.app_name}.",
            ]
        else:
            smaller_steps = gemini_client.decompose_step_too_big(
                session.current_step or "", session.task, session.app_name or ""
            )
            session_manager.record_llm_call(session_id=session.session_id)

        session.insert_smaller_steps(smaller_steps)
        session_manager.save()
        return StepResponse(
            session_id=session.session_id,
            status=StatusEnum.STEP,
            task=session.task,
            step=session.current_step,
            app=App(name=session.app_name, reason=session.app_reason),
            variant=VariantEnum.SMALLER,
            has_more_tasks=session.has_more_tasks,
            next_task_title=session.next_task_title,
        )

    elif user_resp == UserResponseEnum.NOT_NOW:
        session.status = "rest"
        session_manager.save()
        return StepResponse(
            session_id=session.session_id,
            status=StatusEnum.REST,
            task=session.task,
            step=session.current_step,
            app=App(name=session.app_name, reason=session.app_reason),
            variant=VariantEnum(session.variant) if session.variant in ["normal", "explained", "smaller"] else None,
            has_more_tasks=session.has_more_tasks,
            next_task_title=session.next_task_title,
        )

    elif user_resp == UserResponseEnum.CANT_USE_APP:
        matches, _ = retriever.retrieve(session.task, top_k=settings.TOP_K)
        new_app, new_first_step = gemini_client.substitute_app(session.task, session.app_name or "", matches)
        session.app_name = new_app or "Plain Document"
        session.replace_current_step(new_first_step, variant="normal")
        session_manager.save()
        return StepResponse(
            session_id=session.session_id,
            status=StatusEnum.STEP,
            task=session.task,
            step=new_first_step,
            app=App(name=session.app_name, reason=session.app_reason),
            variant=VariantEnum.NORMAL,
            has_more_tasks=session.has_more_tasks,
            next_task_title=session.next_task_title,
        )

    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content=ErrorResponse(
            error=ErrorTypeEnum.INVALID_INPUT,
            message="Invalid response type received.",
        ).model_dump(),
    )


@app.post(
    "/v1/sessions/{id}/resume",
    response_model=StepResponse,
    responses={
        404: {"model": ErrorResponse},
    },
    tags=["Sessions"],
)
def resume_session(
    id: str = FastApiPath(..., description="Opaque session identifier"),
    request: ResumeRequest = ...,
):
    """Resumes a paused task from the same step or a smaller variant."""
    session = session_manager.get_session(id)
    if not session:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=ErrorResponse(
                error=ErrorTypeEnum.SESSION_NOT_FOUND,
                message="Session expired. You can start the task again from the beginning.",
            ).model_dump(),
        )

    if request.mode == ResumeModeEnum.SMALLER:
        if session_manager.can_make_llm_call(session_id=session.session_id):
            smaller_steps = gemini_client.decompose_step_too_big(
                session.current_step or "", session.task, session.app_name or ""
            )
            session_manager.record_llm_call(session_id=session.session_id)
        else:
            smaller_steps = [
                f"Open {session.app_name} and take a gentle first breath.",
                f"Focus only on the single first action in {session.app_name}.",
            ]
        session.insert_smaller_steps(smaller_steps)
    else:
        session.status = "step"

    session_manager.save()
    return StepResponse(
        session_id=session.session_id,
        status=StatusEnum.STEP,
        task=session.task,
        step=session.current_step,
        app=App(name=session.app_name, reason=session.app_reason),
        variant=VariantEnum(session.variant) if session.variant in ["normal", "explained", "smaller"] else VariantEnum.NORMAL,
        has_more_tasks=session.has_more_tasks,
        next_task_title=session.next_task_title,
    )


@app.post(
    "/v1/sessions/{id}/next-task",
    response_model=StepResponse,
    responses={
        404: {"model": ErrorResponse},
        429: {"model": ErrorResponse},
    },
    tags=["Sessions"],
)
def start_next_task(
    id: str = FastApiPath(..., description="Opaque session identifier"),
):
    """Starts the next queued task in a multi-task brain-dump session."""
    session = session_manager.get_session(id)
    if not session:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=ErrorResponse(
                error=ErrorTypeEnum.SESSION_NOT_FOUND,
                message="Session not found or expired. You can start the task again.",
            ).model_dump(),
        )

    if not session.has_more_tasks:
        return StepResponse(
            session_id=session.session_id,
            status=StatusEnum.COMPLETE,
            has_more_tasks=False,
        )

    next_task_name = session.task_queue[0]
    matched_id, app_name, app_reason, steps = resolve_steps_for_task(next_task_name)
    if not steps or not app_name:
        session.task_queue.pop(0)
        session_manager.save()
        if session.has_more_tasks:
            return start_next_task(id)
        return StepResponse(
            session_id=session.session_id,
            status=StatusEnum.COMPLETE,
            has_more_tasks=False,
        )

    session.load_next_task(
        app_name=app_name,
        app_reason=app_reason,
        steps=steps,
        matched_task_id=matched_id,
    )
    session_manager.save()
    logger.info(f"Loaded next queued task: {session.task}")
    return StepResponse(
        session_id=session.session_id,
        status=StatusEnum.STEP,
        task=session.task,
        step=session.current_step,
        app=App(name=session.app_name, reason=session.app_reason),
        variant=VariantEnum.NORMAL,
        has_more_tasks=session.has_more_tasks,
        next_task_title=session.next_task_title,
    )


@app.delete(
    "/v1/sessions/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Sessions"],
)
def delete_session(id: str = FastApiPath(..., description="Opaque session identifier")):
    """Deletes all session progress and data from the server."""
    session_manager.delete_session(id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
