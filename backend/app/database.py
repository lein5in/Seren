import os
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Enum as SAEnum, ForeignKey, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
from dotenv import load_dotenv
import enum

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./seren.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class AnxietyLevelDB(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"

class StudyPeriodDB(str, enum.Enum):
    semester = "semester"
    internship = "internship"
    vacation = "vacation"
    personal = "personal"

class EventTypeDB(str, enum.Enum):
    assignment = "assignment"
    exam = "exam"
    project = "project"
    meeting = "meeting"
    personal = "personal"
    reminder = "reminder"

class PriorityDB(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"

class MessageRoleDB(str, enum.Enum):
    user = "user"
    assistant = "assistant"

class MessageTypeDB(str, enum.Enum):
    text = "text"
    flashcards = "flashcards"
    quiz = "quiz"
    visual = "visual"


class UserDB(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    anxiety_level = Column(SAEnum(AnxietyLevelDB), default=AnxietyLevelDB.medium)
    current_period = Column(SAEnum(StudyPeriodDB), default=StudyPeriodDB.semester)
    preferred_reminder_days = Column(Integer, default=3)
    productive_hours_start = Column(Integer, default=9)
    productive_hours_end = Column(Integer, default=17)
    max_daily_tasks = Column(Integer, default=5)

    events = relationship(
        "EventDB",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    conversations = relationship(
        "ConversationDB",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    memory_summary = relationship(
        "UserMemorySummaryDB",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class EventDB(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    event_type = Column(SAEnum(EventTypeDB), default=EventTypeDB.assignment)
    priority = Column(SAEnum(PriorityDB), default=PriorityDB.medium)
    deadline = Column(DateTime, nullable=False)
    course = Column(String, nullable=True)
    reminder_sent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    user = relationship("UserDB", back_populates="events")


class ConversationDB(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False, default="New conversation")
    archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("UserDB", back_populates="conversations")
    messages = relationship(
        "MessageDB",
        back_populates="conversation",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="MessageDB.sequence",
    )
    pdf_documents = relationship(
        "PDFDocumentDB",
        back_populates="conversation",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class MessageDB(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(SAEnum(MessageRoleDB), nullable=False)
    type = Column(SAEnum(MessageTypeDB), nullable=False, default=MessageTypeDB.text)
    content = Column(Text, nullable=True)
    data = Column(JSON, nullable=True)
    sequence = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("ConversationDB", back_populates="messages")


class PDFDocumentDB(Base):
    __tablename__ = "pdf_documents"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("ConversationDB", back_populates="pdf_documents")


class UserMemorySummaryDB(Base):
    __tablename__ = "user_memory_summaries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    summary = Column(Text, nullable=True)
    last_summarized_message_id = Column(Integer, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("UserDB", back_populates="memory_summary")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)