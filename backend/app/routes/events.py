from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, EventDB
from app.models.event import EventCreate, EventResponse, Priority
from app.auth import get_current_user_id, require_self
from typing import List
from datetime import datetime, timedelta

router = APIRouter(
    prefix="/events",
    tags=["Events"]
)

def get_owned_event(event_id: int, current_user_id: int, db: Session) -> EventDB:
    """Fetch an event and confirm the current user owns it, or raise 404/403."""
    event = db.query(EventDB).filter(EventDB.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this event")
    return event



@router.post("/", response_model=EventResponse)
def create_event(event: EventCreate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """
    Create a new event / deadline. The event is always created for the
    authenticated user — the user_id in the body must match the token.
    """
    require_self(event.user_id, current_user_id)
    new_event = EventDB(
        title=event.title,
        description=event.description,
        event_type=event.event_type,
        priority=event.priority,
        deadline=event.deadline,
        course=event.course,
        user_id=event.user_id
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event


@router.get("/user/{user_id}", response_model=List[EventResponse])
def get_user_events(user_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """
    Get all events for a user, ordered by deadline.
    """
    require_self(user_id, current_user_id)
    events = (
        db.query(EventDB)
        .filter(EventDB.user_id == user_id)
        .order_by(EventDB.deadline.asc())
        .all()
    )
    return events


@router.get("/user/{user_id}/upcoming", response_model=List[EventResponse])
def get_upcoming_events(user_id: int, days: int = 7, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """
    Get events due within the next X days (default: 7).
    """
    require_self(user_id, current_user_id)
    now = datetime.utcnow()
    future = now + timedelta(days=days)
    events = (
        db.query(EventDB)
        .filter(EventDB.user_id == user_id)
        .filter(EventDB.deadline >= now)
        .filter(EventDB.deadline <= future)
        .order_by(EventDB.deadline.asc())
        .all()
    )
    return events


@router.get("/user/{user_id}/reminders", response_model=List[EventResponse])
def get_events_needing_reminders(user_id: int, reminder_days: int = 3, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """
    Get events whose deadline is within reminder_days and reminder not yet sent.
    """
    require_self(user_id, current_user_id)
    now = datetime.utcnow()
    reminder_threshold = now + timedelta(days=reminder_days)
    events = (
        db.query(EventDB)
        .filter(EventDB.user_id == user_id)
        .filter(EventDB.deadline <= reminder_threshold)
        .filter(EventDB.deadline >= now)
        .filter(EventDB.reminder_sent == False)
        .all()
    )
    return events


@router.put("/{event_id}", response_model=EventResponse)
def update_event(event_id: int, event: EventCreate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """
    Update an existing event. Only the owner can update it.
    """
    db_event = get_owned_event(event_id, current_user_id, db)

    db_event.title = event.title
    db_event.description = event.description
    db_event.event_type = event.event_type
    db_event.priority = event.priority
    db_event.deadline = event.deadline
    db_event.course = event.course

    db.commit()
    db.refresh(db_event)
    return db_event


@router.delete("/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """
    Delete an event. Only the owner can delete it.
    """
    db_event = get_owned_event(event_id, current_user_id, db)
    db.delete(db_event)
    db.commit()
    return {"message": "Event deleted successfully"}