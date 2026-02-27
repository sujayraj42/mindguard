"""
MindGuard Backend – Pydantic Models
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ---- Auth Models ----
class UserSignup(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=6)
    role: str = Field(default="student")


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    anonymous_alias: str
    xp: int = 0
    level: int = 1
    streak: int = 0
    badges: List[str] = []
    created_at: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ---- Check-in Models ----
class CheckinCreate(BaseModel):
    sleep_hours: float = Field(..., ge=0, le=12)
    stress_level: int = Field(..., ge=1, le=10)
    socialization: int = Field(..., ge=1, le=10)
    study_hours: float = Field(..., ge=0, le=16)
    mood: int = Field(..., ge=1, le=5)


class CheckinResponse(BaseModel):
    id: str
    sleep_hours: float
    stress_level: int
    socialization: int
    study_hours: float
    mood: int
    risk_score: float
    risk_level: str
    logged_at: str


# ---- Journal Models ----
class JournalCreate(BaseModel):
    content: str = Field(..., min_length=1)


class JournalResponse(BaseModel):
    id: str
    content: str
    sentiment_score: float
    sentiment_label: str
    created_at: str


# ---- Forum Models ----
class ForumPostCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    content: str = Field(..., min_length=10)
    tags: List[str] = []


class ForumReplyCreate(BaseModel):
    text: str = Field(..., min_length=1)


class ForumPostResponse(BaseModel):
    id: str
    author: str
    title: str
    content: str
    tags: List[str]
    upvotes: int
    replies: list
    created_at: str


# ---- Prediction Model ----
class PredictRequest(BaseModel):
    sleep_hours: float
    stress_level: int
    socialization: int
    study_hours: float
    mood: int
