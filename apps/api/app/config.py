from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List



class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"
    GEMINI_EMBEDDING_MODEL: str = "text-embedding-004"
    SIMILARITY_THRESHOLD: float = 0.22
    TOP_K: int = 3
    MIN_STEPS: int = 3
    MAX_STEPS: int = 8
    MAX_WORDS_PER_STEP: int = 20
    MAX_WORDS_PER_EXPLANATION: int = 30
    SESSION_TTL_HOURS: int = 168
    SESSION_CALL_LIMIT: int = 40
    DAILY_CALL_LIMIT: int = 500
    ALLOWED_ORIGINS: str = "http://localhost:3000,app://startease"
    REDIS_URL: str = ""
    LOG_LEVEL: str = "info"

    # Base directory paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent.parent
    DATA_DIR: Path = Path(__file__).resolve().parent.parent.parent.parent / "data"
    KNOWLEDGE_BASE_PATH: Path = (
        Path(__file__).resolve().parent.parent.parent.parent / "data" / "knowledge_base.csv"
    )

    model_config = SettingsConfigDict(
        env_file=[
            ".env",
            str(Path(__file__).resolve().parent.parent / ".env"),
            str(Path(__file__).resolve().parent.parent.parent.parent / ".env"),
        ],
        env_file_encoding="utf-8",
        extra="ignore",
    )


    @property
    def allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]



settings = Settings()
