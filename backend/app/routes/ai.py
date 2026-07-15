from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.database import get_db, UserDB, EventDB
from app.services.ai import chat_with_seren, stream_chat_with_seren, get_onboarding_message, get_overwhelm_response
from app.auth import get_current_user_id, require_self
from app.rate_limit import rate_limit
from fastapi.responses import StreamingResponse
from datetime import datetime, timedelta

router = APIRouter(
    prefix="/ai",
    tags=["AI — Seren"]
)

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    user_id: int
    message: str
    conversation_history: List[Message] = []

class OnboardingRequest(BaseModel):
    user_name: str
    step: int

class OverwhelmRequest(BaseModel):
    user_id: int


def build_user_context(request_user_id: int, db: Session) -> dict:
    user = db.query(UserDB).filter(UserDB.id == request_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    now = datetime.utcnow()
    next_week = now + timedelta(days=7)
    upcoming = (
        db.query(EventDB)
        .filter(EventDB.user_id == request_user_id)
        .filter(EventDB.deadline >= now)
        .filter(EventDB.deadline <= next_week)
        .order_by(EventDB.deadline.asc())
        .all()
    )

    user_context = {
        "name": user.name,
        "anxiety_level": user.anxiety_level,
        "events": [
            {
                "title": e.title,
                "deadline": e.deadline.strftime("%A %B %d at %I:%M %p")
            }
            for e in upcoming
        ]
    }

    from app.routes.upload import pdf_store
    pdf_doc = pdf_store.get(request_user_id)
    if pdf_doc:
        user_context["pdf_content"] = pdf_doc["content"]
        user_context["pdf_filename"] = pdf_doc["filename"]

    return user_context


@router.post("/chat")
def chat(request: ChatRequest, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    require_self(request.user_id, current_user_id)
    rate_limit(f"chat:{current_user_id}", max_requests=20, window_seconds=60)

    user_context = build_user_context(request.user_id, db)
    history = [{"role": m.role, "content": m.content} for m in request.conversation_history]

    result = chat_with_seren(
        user_message=request.message,
        conversation_history=history,
        user_context=user_context
    )

    # result is now {"type": "text"|"flashcards"|"quiz", "content": ...}
    return {
        "type": result["type"],
        "reply": result["content"] if result["type"] == "text" else "",
        "data": result["content"] if result["type"] != "text" else None,
        "user_id": request.user_id
    }


@router.post("/chat/stream")
def chat_stream(request: ChatRequest, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """
    Same as /chat, but streams the response as Server-Sent Events instead
    of waiting for the full text. Events sent:
      - {"event": "token", "text": "..."}   → append to the message being built
      - {"event": "complete", "type": "flashcards"|"quiz"|"visual", "data": ...} → structured block, not streamed
      - {"event": "done"}                   → generation finished
      - {"event": "error", "message": "..."} → something went wrong
    """
    require_self(request.user_id, current_user_id)
    rate_limit(f"chat:{current_user_id}", max_requests=20, window_seconds=60)

    user_context = build_user_context(request.user_id, db)
    history = [{"role": m.role, "content": m.content} for m in request.conversation_history]

    generator = stream_chat_with_seren(
        user_message=request.message,
        conversation_history=history,
        user_context=user_context
    )

    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={
            # Tell any reverse proxy (Railway's included) not to buffer
            # the response — otherwise it waits for the connection to
            # close (or a buffer to fill) before sending anything to the
            # browser, which defeats the purpose of streaming and can look
            # like the request just hangs/times out on long responses.
            "X-Accel-Buffering": "no",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@router.post("/onboarding")
def onboarding(request: OnboardingRequest, current_user_id: int = Depends(get_current_user_id)):
    if request.step < 1 or request.step > 5:
        raise HTTPException(status_code=400, detail="Step must be between 1 and 5")
    message = get_onboarding_message(step=request.step, user_name=request.user_name)
    return {"step": request.step, "message": message}


@router.post("/overwhelm")
def overwhelm_mode(request: OverwhelmRequest, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    require_self(request.user_id, current_user_id)
    rate_limit(f"chat:{current_user_id}", max_requests=20, window_seconds=60)

    user = db.query(UserDB).filter(UserDB.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    now = datetime.utcnow()
    next_event = (
        db.query(EventDB)
        .filter(EventDB.user_id == request.user_id)
        .filter(EventDB.deadline >= now)
        .order_by(EventDB.deadline.asc())
        .first()
    )

    event_dict = None
    if next_event:
        event_dict = {
            "title": next_event.title,
            "deadline": next_event.deadline.strftime("%A %B %d at %I:%M %p")
        }

    message = get_overwhelm_response(user_name=user.name, next_event=event_dict)

    return {
        "mode": "overwhelm",
        "message": message,
        "focus_event": event_dict
    }