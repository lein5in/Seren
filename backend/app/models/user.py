from pydantic import BaseModel, EmailStr
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

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserIdentity(BaseModel):
    name: str
    email: EmailStr

class UserPasswordChange(BaseModel):
    old_password: str
    new_password: str

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