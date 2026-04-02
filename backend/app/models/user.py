from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum

# ========================
# Enums
# ========================

class AnxietyLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

class StudyPeriod(str, Enum):
    semester = "semester"
    internship = "internship"
    vacation = "vacation"
    personal = "personal"

# ========================
# User Models
# ========================

class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserProfile(BaseModel):
    """
    Collected during onboarding — defines how Seren adapts to the user.
    """
    anxiety_level: AnxietyLevel = AnxietyLevel.medium
    current_period: StudyPeriod = StudyPeriod.semester
    preferred_reminder_days: int = 3          # Days before deadline to remind
    productive_hours_start: int = 9           # e.g. 9 = 9:00 AM
    productive_hours_end: int = 17            # e.g. 17 = 5:00 PM
    max_daily_tasks: int = 5                  # Max tasks shown per day

class UserResponse(UserBase):
    id: int
    profile: Optional[UserProfile] = None

    class Config:
        from_attributes = True