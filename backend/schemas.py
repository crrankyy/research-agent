"""
Pydantic schemas for request validation and response serialization.
"""
from pydantic import BaseModel, field_validator, model_validator


class QueryRequest(BaseModel):
    """Validates incoming research query requests."""
    query: str

    @field_validator("query")
    @classmethod
    def query_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Query cannot be empty")
        if len(v) > 2000:
            raise ValueError("Query must be 2000 characters or fewer")
        return v


class SignupRequest(BaseModel):
    """Validates signup requests."""
    username: str
    password: str
    confirm_password: str
    openrouter_api_key: str

    @field_validator("username")
    @classmethod
    def username_valid(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters")
        if len(v) > 80:
            raise ValueError("Username must be 80 characters or fewer")
        return v

    @field_validator("password")
    @classmethod
    def password_valid(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("openrouter_api_key")
    @classmethod
    def api_key_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("OpenRouter API key cannot be empty")
        return v

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


class LoginRequest(BaseModel):
    """Validates login requests."""
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def username_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Username cannot be empty")
        return v

    @field_validator("password")
    @classmethod
    def password_not_empty(cls, v: str) -> str:
        if not v:
            raise ValueError("Password cannot be empty")
        return v
