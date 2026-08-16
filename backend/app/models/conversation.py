from pydantic import BaseModel
from typing import Optional, Any, List
from datetime import datetime
from enum import Enum


class MessageRole(str, Enum):
    user = "user"
    assistant = "assistant"


class MessageType(str, Enum):
    text = "text"
    flashcards = "flashcards"
    quiz = "quiz"
    visual = "visual"


class MessageCreate(BaseModel):
    role: MessageRole
    type: MessageType = MessageType.text
    content: Optional[str] = None
    data: Optional[Any] = None


class MessageResponse(BaseModel):
    id: int
    role: MessageRole
    type: MessageType
    content: Optional[str] = None
    data: Optional[Any] = None
    sequence: int
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationCreate(BaseModel):
    title: Optional[str] = "New conversation"


class ConversationResponse(BaseModel):
    id: int
    title: str
    archived: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConversationWithMessages(ConversationResponse):
    messages: List[MessageResponse] = []