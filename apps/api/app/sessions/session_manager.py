import time
import uuid
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class SessionData(BaseModel):
    session_id: str
    task: str
    matched_task_id: Optional[int] = None
    app_name: Optional[str] = None
    app_reason: Optional[str] = None
    steps: List[str] = Field(default_factory=list)
    current_step_index: int = 0
    status: str = "step"
    variant: str = "normal"
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)
    llm_call_count: int = 0

    @property
    def current_step(self) -> Optional[str]:
        if 0 <= self.current_step_index < len(self.steps):
            return self.steps[self.current_step_index]
        return None

    def advance_step(self) -> bool:
        """Advances to the next step. Returns True if another step exists, False if complete."""
        self.current_step_index += 1
        self.variant = "normal"
        self.updated_at = time.time()
        if self.current_step_index >= len(self.steps):
            self.status = "complete"
            return False
        self.status = "step"
        return True

    def replace_current_step(self, new_text: str, variant: str = "explained"):
        """Replaces current step text with explanation."""
        if 0 <= self.current_step_index < len(self.steps):
            self.steps[self.current_step_index] = new_text
        else:
            self.steps.append(new_text)
        self.variant = variant
        self.updated_at = time.time()

    def insert_smaller_steps(self, smaller_steps: List[str]):
        """Replaces the current step with two smaller steps."""
        if not smaller_steps:
            return
        if 0 <= self.current_step_index < len(self.steps):
            # Replace current step with first smaller step, insert remainder right after it
            self.steps[self.current_step_index] = smaller_steps[0]
            for i, step in enumerate(smaller_steps[1:]):
                self.steps.insert(self.current_step_index + 1 + i, step)
        else:
            self.steps.extend(smaller_steps)
        self.variant = "smaller"
        self.status = "step"
        self.updated_at = time.time()


class SessionManager:
    def __init__(self, ttl_hours: int = 168, session_call_limit: int = 40, daily_call_limit: int = 500):
        self.ttl_seconds = ttl_hours * 3600
        self.session_call_limit = session_call_limit
        self.daily_call_limit = daily_call_limit
        self._sessions: Dict[str, SessionData] = {}
        self._daily_calls = 0
        self._last_day = time.strftime("%Y-%m-%d")

    def _check_and_reset_daily(self):
        current_day = time.strftime("%Y-%m-%d")
        if current_day != self._last_day:
            self._daily_calls = 0
            self._last_day = current_day

    def can_make_llm_call(self, session_id: Optional[str] = None) -> bool:
        self._check_and_reset_daily()
        if self._daily_calls >= self.daily_call_limit:
            return False
        if session_id and session_id in self._sessions:
            if self._sessions[session_id].llm_call_count >= self.session_call_limit:
                return False
        return True

    def record_llm_call(self, session_id: Optional[str] = None):
        self._check_and_reset_daily()
        self._daily_calls += 1
        if session_id and session_id in self._sessions:
            self._sessions[session_id].llm_call_count += 1
            self._sessions[session_id].updated_at = time.time()

    def create_session(
        self,
        task: str,
        matched_task_id: Optional[int],
        app_name: Optional[str],
        app_reason: Optional[str],
        steps: List[str],
    ) -> SessionData:
        self.cleanup_expired()
        session_id = str(uuid.uuid4())
        session = SessionData(
            session_id=session_id,
            task=task,
            matched_task_id=matched_task_id,
            app_name=app_name,
            app_reason=app_reason,
            steps=steps,
            current_step_index=0,
            status="step",
            variant="normal",
        )
        self._sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[SessionData]:
        self.cleanup_expired()
        return self._sessions.get(session_id)

    def delete_session(self, session_id: str) -> bool:
        if session_id in self._sessions:
            del self._sessions[session_id]
            return True
        return False

    def cleanup_expired(self) -> int:
        now = time.time()
        expired = [sid for sid, s in self._sessions.items() if (now - s.updated_at) > self.ttl_seconds]
        for sid in expired:
            del self._sessions[sid]
        return len(expired)


session_manager = SessionManager()
