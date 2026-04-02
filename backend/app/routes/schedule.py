from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db, EventDB
from app.models.event import EventResponse, EventType, Priority
from typing import List
from datetime import datetime
import re

router = APIRouter(
    prefix="/schedule",
    tags=["Schedule"]
)

# ========================
# ICS Parser Helper
# ========================

def parse_ics(content: str) -> List[dict]:
    """
    Parse a .ics file content and extract events.
    """
    events = []
    current_event = {}
    in_event = False

    for line in content.splitlines():
        line = line.strip()

        if line == "BEGIN:VEVENT":
            in_event = True
            current_event = {}

        elif line == "END:VEVENT" and in_event:
            if "summary" in current_event and "deadline" in current_event:
                events.append(current_event)
            in_event = False
            current_event = {}

        elif in_event:
            if line.startswith("SUMMARY:"):
                current_event["summary"] = line.replace("SUMMARY:", "").strip()

            elif line.startswith("DTSTART") or line.startswith("DTEND"):
                # Extract datetime — handles DTSTART, DTSTART;TZID=..., etc.
                value = line.split(":")[-1].strip()
                try:
                    # Format: 20241015T120000Z or 20241015
                    if "T" in value:
                        dt = datetime.strptime(value[:15], "%Y%m%dT%H%M%S")
                    else:
                        dt = datetime.strptime(value[:8], "%Y%m%d")
                    current_event["deadline"] = dt
                except ValueError:
                    pass

            elif line.startswith("DESCRIPTION:"):
                current_event["description"] = line.replace("DESCRIPTION:", "").strip()

            elif line.startswith("LOCATION:"):
                current_event["location"] = line.replace("LOCATION:", "").strip()

    return events


def detect_event_type(title: str) -> EventType:
    """
    Detect event type from title keywords.
    """
    title_lower = title.lower()
    if any(word in title_lower for word in ["exam", "midterm", "final", "test", "quiz"]):
        return EventType.exam
    elif any(word in title_lower for word in ["project", "projet"]):
        return EventType.project
    elif any(word in title_lower for word in ["assignment", "homework", "devoir", "tp", "lab"]):
        return EventType.assignment
    elif any(word in title_lower for word in ["meeting", "réunion", "reunion"]):
        return EventType.meeting
    return EventType.assignment


def detect_priority(event_type: EventType) -> Priority:
    """
    Assign default priority based on event type.
    """
    if event_type == EventType.exam:
        return Priority.urgent
    elif event_type == EventType.project:
        return Priority.high
    return Priority.medium

# ========================
# Routes
# ========================

@router.post("/import/{user_id}", response_model=List[EventResponse])
async def import_ics(user_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Import a .ics file and save all events for a user.
    """
    if not file.filename.endswith(".ics"):
        raise HTTPException(status_code=400, detail="Only .ics files are supported")

    content = await file.read()
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    parsed_events = parse_ics(text)

    if not parsed_events:
        raise HTTPException(status_code=400, detail="No valid events found in the .ics file")

    saved_events = []
    for e in parsed_events:
        event_type = detect_event_type(e["summary"])
        priority = detect_priority(event_type)

        new_event = EventDB(
            title=e["summary"],
            description=e.get("description", None),
            event_type=event_type,
            priority=priority,
            deadline=e["deadline"],
            user_id=user_id
        )
        db.add(new_event)
        db.commit()
        db.refresh(new_event)
        saved_events.append(new_event)

    return saved_events


@router.get("/summary/{user_id}")
def get_schedule_summary(user_id: int, db: Session = Depends(get_db)):
    """
    Returns a calm summary of upcoming events for the user.
    Used to feed the AI for caring responses.
    """
    from datetime import timedelta
    now = datetime.utcnow()
    next_week = now + timedelta(days=7)

    upcoming = (
        db.query(EventDB)
        .filter(EventDB.user_id == user_id)
        .filter(EventDB.deadline >= now)
        .filter(EventDB.deadline <= next_week)
        .order_by(EventDB.deadline.asc())
        .all()
    )

    return {
        "user_id": user_id,
        "total_upcoming": len(upcoming),
        "events": [
            {
                "title": e.title,
                "deadline": e.deadline.strftime("%A %B %d at %I:%M %p"),
                "priority": e.priority,
                "course": e.course
            }
            for e in upcoming
        ]
    }