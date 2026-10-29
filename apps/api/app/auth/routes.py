import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.responses import JSONResponse

from app.auth.schemas import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse,
    AuthErrorResponse,
)
from app.auth.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)
from app.auth.repository import (
    get_user_repository,
    BaseUserRepository,
    SupabaseUserRepository,
)

logger = logging.getLogger("startease.auth.routes")

auth_router = APIRouter()


def get_current_user(
    authorization: Optional[str] = Header(None),
    repo: BaseUserRepository = Depends(get_user_repository),
) -> dict:
    """Dependency to extract and validate the currently authenticated user from Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token. Please sign in.",
        )
    
    token = authorization.split("Bearer ", 1)[1].strip()

    # 1. If Supabase repository is in use, verify with Supabase Auth endpoint
    if hasattr(repo, "verify_token"):
        supabase_user = repo.verify_token(token)
        if supabase_user:
            return supabase_user

    # 2. Check local JWT
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or is invalid. Please sign in again.",
        )
    
    user_id = payload["sub"]
    user = repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found.",
        )
    return user


@auth_router.post(
    "/register",
    response_model=TokenResponse,
    responses={
        400: {"model": AuthErrorResponse},
    },
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
def register(
    user_data: UserCreate,
    repo: BaseUserRepository = Depends(get_user_repository),
):
    """Registers a new user account and returns an access token."""
    existing = repo.get_by_email(user_data.email)
    if existing:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=AuthErrorResponse(
                error="EMAIL_EXISTS",
                message="An account with this email address already exists.",
            ).model_dump(),
        )

    if isinstance(repo, SupabaseUserRepository):
        try:
            user_record = repo.create_user_with_password(
                email=user_data.email,
                password=user_data.password,
                name=user_data.name,
            )
            # Authenticate immediately to obtain access token
            auth_result = repo.authenticate(user_data.email, user_data.password)
            access_token = (
                auth_result["access_token"]
                if auth_result and "access_token" in auth_result
                else create_access_token(user_record["id"], user_record["email"])
            )
        except Exception as e:
            logger.error(f"Supabase registration error: {e}")
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content=AuthErrorResponse(
                    error="REGISTRATION_FAILED",
                    message=str(e),
                ).model_dump(),
            )
    else:
        password_hash, salt = hash_password(user_data.password)
        user_record = repo.create_user(
            email=user_data.email,
            password_hash=password_hash,
            salt=salt,
            name=user_data.name,
        )
        access_token = create_access_token(user_record["id"], user_record["email"])

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user_record["id"],
            email=user_record["email"],
            name=user_record.get("name"),
            created_at=user_record["created_at"],
        ),
    )


@auth_router.post(
    "/login",
    response_model=TokenResponse,
    responses={
        401: {"model": AuthErrorResponse},
    },
    summary="Sign in to an existing account",
)
def login(
    credentials: UserLogin,
    repo: BaseUserRepository = Depends(get_user_repository),
):
    """Authenticates credentials and returns a secure JWT access token."""
    if isinstance(repo, SupabaseUserRepository):
        auth_result = repo.authenticate(credentials.email, credentials.password)
        if not auth_result or not auth_result.get("access_token"):
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content=AuthErrorResponse(
                    error="INVALID_CREDENTIALS",
                    message="Incorrect email or password. Please try again.",
                ).model_dump(),
            )
        user_info = auth_result["user"]
        return TokenResponse(
            access_token=auth_result["access_token"],
            token_type="bearer",
            user=UserResponse(
                id=user_info["id"],
                email=user_info["email"],
                name=user_info.get("name"),
                created_at=user_info.get("created_at") or "",
            ),
        )

    user_record = repo.get_by_email(credentials.email)
    if not user_record:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content=AuthErrorResponse(
                error="INVALID_CREDENTIALS",
                message="Incorrect email or password. Please try again.",
            ).model_dump(),
        )

    if not verify_password(
        credentials.password, user_record["password_hash"], user_record["salt"]
    ):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content=AuthErrorResponse(
                error="INVALID_CREDENTIALS",
                message="Incorrect email or password. Please try again.",
            ).model_dump(),
        )

    access_token = create_access_token(user_record["id"], user_record["email"])

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user_record["id"],
            email=user_record["email"],
            name=user_record.get("name"),
            created_at=user_record["created_at"],
        ),
    )


@auth_router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
)
def get_me(current_user: dict = Depends(get_current_user)):
    """Returns the authenticated user's profile."""
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user.get("name"),
        created_at=current_user["created_at"],
    )


@auth_router.post(
    "/logout",
    summary="Log out of current session",
)
def logout():
    """Acknowledge logout on client side."""
    return {"ok": True, "message": "Successfully logged out."}
