from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class EventType(str, Enum):
    assignment = "assignment"
    exam = "exam"
    project = "project"
    meeting = "meeting"
    personal = "personal"
    reminder = "reminder"

class Priority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"



class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    event_type: EventType = EventType.assignment
    priority: Priority = Priority.medium
    deadline: datetime
    course: Optional[str] = None             

class EventCreate(EventBase):
    user_id: int

class EventResponse(EventBase):
    id: int
    user_id: int
    reminder_sent: bool = False
    created_at: datetime

    class Config:
        from_attributes = True