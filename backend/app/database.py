from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Enum as SAEnum, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import enum

# ========================
# Database Setup
# ========================

DATABASE_URL = "sqlite:///./seren.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # Needed for SQLite
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ========================
# Enums
# ========================

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

# ========================
# Database Tables
# ========================

class UserDB(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    # Profile fields
    anxiety_level = Column(SAEnum(AnxietyLevelDB), default=AnxietyLevelDB.medium)
    current_period = Column(SAEnum(StudyPeriodDB), default=StudyPeriodDB.semester)
    preferred_reminder_days = Column(Integer, default=3)
    productive_hours_start = Column(Integer, default=9)
    productive_hours_end = Column(Integer, default=17)
    max_daily_tasks = Column(Integer, default=5)

    # Relationship — cascade="all, delete-orphan" means deleting a user
    # via the ORM (db.delete(user)) also deletes all their events.
    # Fixes the known "delete account doesn't really delete everything" bug.
    events = relationship(
        "EventDB",
        back_populates="user",
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

    # Foreign key — ondelete="CASCADE" backs up the ORM-level cascade above
    # at the database level too (belt and suspenders).
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    user = relationship("UserDB", back_populates="events")

# ========================
# Dependency
# Called in routes to get a DB session
# ========================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ========================
# Create all tables
# ========================

def init_db():
    Base.metadata.create_all(bind=engine)