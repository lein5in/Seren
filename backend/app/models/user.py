

from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from enum import Enum

class AnxietyLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

class StudyPeriod(str, Enum):
    semester = "semester"
    internship = "internship"
    vacation = "vacation"
    personal = "personal"

class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

   
    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters long")
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserIdentity(BaseModel):
    name: str
    email: EmailStr

class UserPasswordChange(BaseModel):
    old_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def new_password_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters long")
        return v

class UserProfile(BaseModel):
    anxiety_level: AnxietyLevel = AnxietyLevel.medium
    current_period: StudyPeriod = StudyPeriod.semester
    preferred_reminder_days: int = 3
    productive_hours_start: int = 9
    productive_hours_end: int = 17
    max_daily_tasks: int = 5

class UserResponse(UserBase):
    id: int
    profile: Optional[UserProfile] = None
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    token: str
    user_id: int
    name: str
    email: str