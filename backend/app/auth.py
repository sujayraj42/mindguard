"""
MindGuard Backend – JWT Auth Utilities
"""
import os
import random
from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET", "fallback_secret")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Anonymous alias generator
ADJECTIVES = ["Brave", "Calm", "Kind", "Wise", "Bold", "Swift", "Gentle", "Noble", "Bright", "Steady",
              "Fierce", "Quiet", "Warm", "Cool", "Sharp", "Free", "Pure", "Strong", "True", "Deep"]
ANIMALS = ["Phoenix", "Eagle", "Dolphin", "Panda", "Tiger", "Fox", "Bear", "Wolf", "Owl", "Hawk",
           "Lion", "Raven", "Deer", "Falcon", "Otter", "Lynx", "Hare", "Crane", "Swan", "Elk"]


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=EXPIRE_MINUTES)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> str:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Token expired or invalid")


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    return decode_token(credentials.credentials)


def generate_alias() -> str:
    return f"{random.choice(ADJECTIVES)} {random.choice(ANIMALS)}"
