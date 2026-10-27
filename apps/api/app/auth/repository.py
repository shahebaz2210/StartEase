import json
import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any, List
import logging

from app.config import settings

logger = logging.getLogger("startease.auth.repository")


class BaseUserRepository(ABC):
    """Abstract interface for user repository, allowing seamless database swap."""

    @abstractmethod
    def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    def get_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    def create_user(
        self, email: str, password_hash: str, salt: str, name: Optional[str] = None
    ) -> Dict[str, Any]:
        pass


class FileUserRepository(BaseUserRepository):
    """File-backed persistent storage for users in JSON format.
    
    Used before external database details are provided. Persists across restarts.
    """

    def __init__(self, file_path: Path):
        self.file_path = file_path
        self._ensure_file()

    def _ensure_file(self):
        if not self.file_path.parent.exists():
            self.file_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.file_path.exists():
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump({"users": []}, f, indent=2)

    def _read_users(self) -> List[Dict[str, Any]]:
        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("users", [])
        except Exception as e:
            logger.error(f"Error reading users file: {e}")
            return []

    def _write_users(self, users: List[Dict[str, Any]]):
        try:
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump({"users": users}, f, indent=2)
        except Exception as e:
            logger.error(f"Error writing users file: {e}")

    def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        normalized = email.strip().lower()
        users = self._read_users()
        for user in users:
            if user.get("email", "").lower() == normalized:
                return user
        return None

    def get_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        users = self._read_users()
        for user in users:
            if user.get("id") == user_id:
                return user
        return None

    def create_user(
        self, email: str, password_hash: str, salt: str, name: Optional[str] = None
    ) -> Dict[str, Any]:
        users = self._read_users()
        normalized_email = email.strip().lower()
        now_iso = datetime.now(timezone.utc).isoformat()
        
        user_record = {
            "id": f"usr_{uuid.uuid4().hex[:12]}",
            "email": normalized_email,
            "password_hash": password_hash,
            "salt": salt,
            "name": name.strip() if name else None,
            "created_at": now_iso,
        }
        users.append(user_record)
        self._write_users(users)
        logger.info(f"Created new user account for: {normalized_email}")
        return user_record


class DatabaseUserRepository(BaseUserRepository):
    """Database adapter ready to connect to PostgreSQL / MySQL / SQLite / MongoDB.
    
    Will be populated with connection logic once database credentials are provided.
    """

    def __init__(self, db_url: str):
        self.db_url = db_url
        logger.info(f"DatabaseUserRepository initialized with connection string.")

    def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        # Database query will execute here
        raise NotImplementedError("Database connection will be activated once DB details are provided.")

    def get_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        raise NotImplementedError("Database connection will be activated once DB details are provided.")

    def create_user(
        self, email: str, password_hash: str, salt: str, name: Optional[str] = None
    ) -> Dict[str, Any]:
        raise NotImplementedError("Database connection will be activated once DB details are provided.")


# Repository Singleton
_repository_instance: Optional[BaseUserRepository] = None


def get_user_repository() -> BaseUserRepository:
    """Returns the configured user repository instance (Pluggable architecture)."""
    global _repository_instance
    if _repository_instance is None:
        if settings.DATABASE_URL.strip():
            logger.info("Using DatabaseUserRepository.")
            _repository_instance = DatabaseUserRepository(settings.DATABASE_URL)
        else:
            storage_path = settings.DATA_DIR / "users.json"
            logger.info(f"Using FileUserRepository at {storage_path}.")
            _repository_instance = FileUserRepository(storage_path)
    return _repository_instance
