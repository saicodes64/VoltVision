"""
JWT Authentication helpers.
- create_access_token: signs a JWT with user_id payload
- get_current_user: FastAPI Depends() that reads & validates Bearer token
"""
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

load_dotenv()

_JWT_SECRET = os.getenv("JWT_SECRET_KEY", "")
if not _JWT_SECRET or _JWT_SECRET == "change-me-to-a-very-long-random-secret-key":
    raise RuntimeError(
        "JWT_SECRET_KEY is not set or is still using the placeholder. "
        "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
    )
SECRET_KEY = _JWT_SECRET
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))  # 7 days default

_bearer_scheme = HTTPBearer(auto_error=False)


def create_access_token(user_id: str, email: str) -> str:
    """Create a signed JWT containing user_id and email."""
    expire = datetime.utcnow() + timedelta(minutes=EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "email": email,
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> str:
    """
    FastAPI dependency — reads 'Authorization: Bearer <token>' header.
    Returns user_id string. Raises 401 if token is missing or invalid.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated — please log in",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise ValueError("Token missing user ID")
        return user_id
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or expired — please log in again",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
