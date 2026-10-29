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


class SupabaseUserRepository(BaseUserRepository):
    """User repository connected directly to Supabase Auth and Database."""

    def __init__(self, supabase_url: str, secret_key: str, anon_key: str):
        import httpx
        self.supabase_url = supabase_url.rstrip("/")
        self.secret_key = secret_key
        self.anon_key = anon_key
        self.client = httpx.Client(timeout=10.0)
        logger.info(f"SupabaseUserRepository initialized with {self.supabase_url}")

    def _admin_headers(self) -> Dict[str, str]:
        return {
            "apikey": self.secret_key,
            "Authorization": f"Bearer {self.secret_key}",
            "User-Agent": "StartEase-Server/1.0",
            "Content-Type": "application/json",
        }

    def _anon_headers(self) -> Dict[str, str]:
        return {
            "apikey": self.anon_key,
            "User-Agent": "StartEase-Server/1.0",
            "Content-Type": "application/json",
        }

    def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        normalized = email.strip().lower()
        try:
            res = self.client.get(
                f"{self.supabase_url}/auth/v1/admin/users?page=1&per_page=100",
                headers=self._admin_headers(),
            )
            if res.status_code == 200:
                data = res.json()
                users = data.get("users", [])
                for u in users:
                    if u.get("email", "").lower() == normalized:
                        return {
                            "id": u["id"],
                            "email": u["email"],
                            "name": u.get("user_metadata", {}).get("name"),
                            "created_at": u.get("created_at"),
                            "raw": u,
                        }
        except Exception as e:
            logger.error(f"Supabase get_by_email error: {e}")
        return None

    def get_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        try:
            res = self.client.get(
                f"{self.supabase_url}/auth/v1/admin/users/{user_id}",
                headers=self._admin_headers(),
            )
            if res.status_code == 200:
                u = res.json()
                return {
                    "id": u["id"],
                    "email": u["email"],
                    "name": u.get("user_metadata", {}).get("name"),
                    "created_at": u.get("created_at"),
                    "raw": u,
                }
        except Exception as e:
            logger.error(f"Supabase get_by_id error: {e}")
        return None

    def create_user_with_password(
        self, email: str, password: str, name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Creates an immediately confirmed user in Supabase Auth."""
        payload = {
            "email": email.strip().lower(),
            "password": password,
            "email_confirm": True,
            "user_metadata": {"name": name.strip()} if name else {},
        }
        res = self.client.post(
            f"{self.supabase_url}/auth/v1/admin/users",
            headers=self._admin_headers(),
            json=payload,
        )
        if res.status_code not in (200, 201):
            err_msg = res.json().get("msg") or res.json().get("message") or "Failed to create user in Supabase"
            raise ValueError(err_msg)

        u = res.json()
        logger.info(f"Supabase user created successfully: {email}")
        return {
            "id": u["id"],
            "email": u["email"],
            "name": u.get("user_metadata", {}).get("name"),
            "created_at": u.get("created_at"),
            "raw": u,
        }

    def create_user(
        self, email: str, password_hash: str, salt: str, name: Optional[str] = None
    ) -> Dict[str, Any]:
        return self.create_user_with_password(email, password_hash, name)

    def authenticate(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticates against Supabase password grant and returns token & user info."""
        payload = {
            "email": email.strip().lower(),
            "password": password,
        }
        try:
            res = self.client.post(
                f"{self.supabase_url}/auth/v1/token?grant_type=password",
                headers=self._anon_headers(),
                json=payload,
            )
            if res.status_code == 200:
                data = res.json()
                user = data.get("user", {})
                return {
                    "access_token": data.get("access_token"),
                    "user": {
                        "id": user.get("id"),
                        "email": user.get("email"),
                        "name": user.get("user_metadata", {}).get("name"),
                        "created_at": user.get("created_at"),
                    },
                }
            logger.warning(f"Supabase login failed: {res.status_code} {res.text}")
        except Exception as e:
            logger.error(f"Supabase authenticate error: {e}")
        return None

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verifies a Supabase bearer token against Supabase /auth/v1/user endpoint."""
        try:
            res = self.client.get(
                f"{self.supabase_url}/auth/v1/user",
                headers={
                    "apikey": self.anon_key,
                    "Authorization": f"Bearer {token}",
                    "User-Agent": "StartEase-Server/1.0",
                },
            )
            if res.status_code == 200:
                u = res.json()
                return {
                    "id": u["id"],
                    "email": u["email"],
                    "name": u.get("user_metadata", {}).get("name"),
                    "created_at": u.get("created_at"),
                }
        except Exception as e:
            logger.error(f"Supabase verify_token error: {e}")
        return None


# Repository Singleton
_repository_instance: Optional[BaseUserRepository] = None


def get_user_repository() -> BaseUserRepository:
    """Returns the configured user repository instance (Pluggable architecture)."""
    global _repository_instance
    if _repository_instance is None:
        if settings.SUPABASE_URL.strip() and settings.SUPABASE_SECRET_KEY.strip():
            logger.info("Using SupabaseUserRepository connected to live Supabase project.")
            _repository_instance = SupabaseUserRepository(
                settings.SUPABASE_URL,
                settings.SUPABASE_SECRET_KEY,
                settings.SUPABASE_ANON_KEY,
            )
        elif settings.DATABASE_URL.strip():
            logger.info("Using DatabaseUserRepository.")
            _repository_instance = DatabaseUserRepository(settings.DATABASE_URL)
        else:
            storage_path = settings.DATA_DIR / "users.json"
            logger.info(f"Using FileUserRepository at {storage_path}.")
            _repository_instance = FileUserRepository(storage_path)
    return _repository_instance

