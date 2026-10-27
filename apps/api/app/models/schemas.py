from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class StatusEnum(str, Enum):
    STEP = "step"
    REST = "rest"
    COMPLETE = "complete"
    NO_MATCH = "no_match"
    CRISIS = "crisis"


class VariantEnum(str, Enum):
    NORMAL = "normal"
    EXPLAINED = "explained"
    SMALLER = "smaller"
    SIMPLER = "simpler"


class UserResponseEnum(str, Enum):
    DONE = "done"
    SIMPLER_STEP = "simpler_step"
    CONFUSED = "confused"
    TOO_BIG = "too_big"
    NOT_NOW = "not_now"
    CANT_USE_APP = "cant_use_app"


class ResumeModeEnum(str, Enum):
    SAME = "same"
    SMALLER = "smaller"


class ErrorTypeEnum(str, Enum):
    INVALID_INPUT = "invalid_input"
    SESSION_NOT_FOUND = "session_not_found"
    RATE_LIMITED = "rate_limited"
    SERVER_ERROR = "server_error"


class App(BaseModel):
    name: str = Field(..., description="Recommended application name, e.g. Canva")
    reason: Optional[str] = Field(None, description="One plain sentence reason why this app fits")


class StepResponse(BaseModel):
    session_id: Optional[str] = Field(None, description="Opaque session identifier")
    status: StatusEnum = Field(..., description="Current interaction status")
    task: Optional[str] = Field(None, description="Active task title")
    step: Optional[str] = Field(None, description="The single current step to display")
    app: Optional[App] = Field(None, description="Recommended application")
    variant: Optional[VariantEnum] = Field(None, description="Variant label indicator (normal, explained, smaller, simpler)")
    has_more_tasks: Optional[bool] = Field(False, description="Whether another task is queued")
    next_task_title: Optional[str] = Field(None, description="Title of next queued task if any")


class CreateSessionRequest(BaseModel):
    task: str = Field(..., min_length=1, max_length=300, description="Free-text academic or professional task")


class RespondRequest(BaseModel):
    response: UserResponseEnum = Field(..., description="One of the four/five allowed user actions")


class ResumeRequest(BaseModel):
    mode: ResumeModeEnum = Field(..., description="Resume mode: same step or smaller step")


class ErrorResponse(BaseModel):
    error: ErrorTypeEnum = Field(..., description="Error category code")
    message: str = Field(..., description="Calm, user-safe error message")


class HealthResponse(BaseModel):
    ok: bool = True
