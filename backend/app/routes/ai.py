from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db, UserDB, EventDB, PDFDocumentDB, ConversationDB, MessageDB, UserMemorySummaryDB
from app.services.ai import (
    chat_with_seren,
    stream_chat_with_seren,
    get_onboarding_message,
    get_overwhelm_response,
    generate_memory_summary,
)
from app.auth import get_current_user_id, require_self
from app.rate_limit import rate_limit
from app.routes.conversations import get_owned_conversation
from fastapi.responses import StreamingResponse
from datetime import datetime, timedelta
import json

router = APIRouter(prefix="/ai", tags=["AI — Seren"])

MEMORY_SUMMARY_THRESHOLD = 20


class ChatRequest(BaseModel):
    conversation_id: int
    message: str


class OnboardingRequest(BaseModel):
    user_name: str
    step: int


class OverwhelmRequest(BaseModel):
    pass


def load_history(conversation_id: int, db: Session) -> list:
    messages = (
        db.query(MessageDB)
        .filter(MessageDB.conversation_id == conversation_id)
        .filter(MessageDB.type == "text")
        .order_by(MessageDB.sequence.asc())
        .all()
    )
    return [
        {"role": "assistant" if m.role == "assistant" else "user", "content": m.content}
        for m in messages
        if m.content
    ]


def next_sequence(conversation_id: int, db: Session) -> int:
    last = (
        db.query(MessageDB)
        .filter(MessageDB.conversation_id == conversation_id)
        .order_by(MessageDB.sequence.desc())
        .first()
    )
    return (last.sequence + 1) if last else 0


def persist_message(conversation_id: int, user_id: int, role: str, msg_type: str, content: Optional[str], data, db: Session) -> MessageDB:
    msg = MessageDB(
        conversation_id=conversation_id,
        user_id=user_id,
        role=role,
        type=msg_type,
        content=content,
        data=data,
        sequence=next_sequence(conversation_id, db),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def maybe_update_memory_summary(user_id: int, db: Session) -> None:
    summary_row = db.query(UserMemorySummaryDB).filter(UserMemorySummaryDB.user_id == user_id).first()
    last_id = summary_row.last_summarized_message_id if summary_row else 0

    new_messages = (
        db.query(MessageDB)
        .filter(MessageDB.user_id == user_id)
        .filter(MessageDB.type == "text")
        .filter(MessageDB.id > (last_id or 0))
        .order_by(MessageDB.id.asc())
        .all()
    )

    if len(new_messages) < MEMORY_SUMMARY_THRESHOLD:
        return

    excerpt_text = "\n".join(f"{m.role}: {m.content}" for m in new_messages if m.content)[:6000]
    updated_summary = generate_memory_summary(
        previous_summary=summary_row.summary if summary_row else None,
        new_messages_text=excerpt_text
    )
    latest_id = new_messages[-1].id

    if summary_row:
        summary_row.summary = updated_summary
        summary_row.last_summarized_message_id = latest_id
    else:
        summary_row = UserMemorySummaryDB(
            user_id=user_id,
            summary=updated_summary,
            last_summarized_message_id=latest_id
        )
        db.add(summary_row)
    db.commit()


def build_user_context(conversation: ConversationDB, db: Session) -> dict:
    user = db.query(UserDB).filter(UserDB.id == conversation.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    now = datetime.utcnow()
    next_week = now + timedelta(days=7)
    upcoming = (
        db.query(EventDB)
        .filter(EventDB.user_id == conversation.user_id)
        .filter(EventDB.deadline >= now)
        .filter(EventDB.deadline <= next_week)
        .order_by(EventDB.deadline.asc())
        .all()
    )

    user_context = {
        "name": user.name,
        "anxiety_level": user.anxiety_level,
        "events": [
            {"title": e.title, "deadline": e.deadline.strftime("%A %B %d at %I:%M %p")}
            for e in upcoming
        ]
    }

    pdf_doc = (
        db.query(PDFDocumentDB)
        .filter(PDFDocumentDB.conversation_id == conversation.id)
        .first()
    )
    if pdf_doc:
        user_context["pdf_content"] = pdf_doc.content
        user_context["pdf_filename"] = pdf_doc.filename

    summary_row = db.query(UserMemorySummaryDB).filter(UserMemorySummaryDB.user_id == conversation.user_id).first()
    if summary_row and summary_row.summary:
        user_context["memory_summary"] = summary_row.summary

    return user_context


@router.post("/chat")
def chat(request: ChatRequest, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    conversation = get_owned_conversation(request.conversation_id, current_user_id, db)
    rate_limit(f"chat:{current_user_id}", max_requests=20, window_seconds=60)

    persist_message(conversation.id, current_user_id, "user", "text", request.message, None, db)

    user_context = build_user_context(conversation, db)
    history = load_history(conversation.id, db)[:-1]

    result = chat_with_seren(
        user_message=request.message,
        conversation_history=history,
        user_context=user_context
    )

    if result["type"] == "text":
        persist_message(conversation.id, current_user_id, "assistant", "text", result["content"], None, db)
    else:
        persist_message(conversation.id, current_user_id, "assistant", result["type"], None, result["content"], db)

    conversation.updated_at = datetime.utcnow()
    db.commit()

    maybe_update_memory_summary(current_user_id, db)

    return {
        "type": result["type"],
        "reply": result["content"] if result["type"] == "text" else "",
        "data": result["content"] if result["type"] != "text" else None,
        "conversation_id": conversation.id
    }


@router.post("/chat/stream")
def chat_stream(request: ChatRequest, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    conversation = get_owned_conversation(request.conversation_id, current_user_id, db)
    rate_limit(f"chat:{current_user_id}", max_requests=20, window_seconds=60)

    persist_message(conversation.id, current_user_id, "user", "text", request.message, None, db)

    user_context = build_user_context(conversation, db)
    history = load_history(conversation.id, db)[:-1]

    return make_stream_response(
        conversation, db, current_user_id,
        user_message_for_generation=request.message,
        history_for_generation=history,
        user_context=user_context
    )


def make_stream_response(conversation, db, current_user_id, user_message_for_generation, history_for_generation, user_context):
    inner_generator = stream_chat_with_seren(
        user_message=user_message_for_generation,
        conversation_history=history_for_generation,
        user_context=user_context
    )

    def wrapped_generator():
        accumulated_text = ""
        structured_result = None

        for chunk in inner_generator:
            yield chunk
            raw = chunk[len("data: "):].strip()
            try:
                event = json.loads(raw)
            except Exception:
                continue
            if event.get("event") == "token":
                accumulated_text += event.get("text", "")
            elif event.get("event") == "complete":
                structured_result = event

        if structured_result:
            persist_message(
                conversation.id, current_user_id, "assistant",
                structured_result["type"], None, structured_result["data"], db
            )
        elif accumulated_text:
            persist_message(
                conversation.id, current_user_id, "assistant",
                "text", accumulated_text, None, db
            )

        conversation.updated_at = datetime.utcnow()
        db.commit()
        maybe_update_memory_summary(current_user_id, db)

    return StreamingResponse(
        wrapped_generator(),
        media_type="text/event-stream",
        headers={
            "X-Accel-Buffering": "no",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


class RegenerateRequest(BaseModel):
    conversation_id: int


@router.post("/chat/regenerate/stream")
def regenerate_stream(request: RegenerateRequest, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    conversation = get_owned_conversation(request.conversation_id, current_user_id, db)
    rate_limit(f"chat:{current_user_id}", max_requests=20, window_seconds=60)

    all_messages = (
        db.query(MessageDB)
        .filter(MessageDB.conversation_id == conversation.id)
        .order_by(MessageDB.sequence.asc())
        .all()
    )

    if not all_messages or all_messages[-1].role != "user":
        trailing_assistant = all_messages[-1] if all_messages else None
        if trailing_assistant and trailing_assistant.role == "assistant":
            db.query(MessageDB).filter(MessageDB.id == trailing_assistant.id).delete()
            db.commit()
            all_messages = all_messages[:-1]

    if not all_messages or all_messages[-1].role != "user":
        raise HTTPException(status_code=400, detail="Nothing to regenerate")

    last_user_message = all_messages[-1].content or ""
    history_before = [
        {"role": "assistant" if m.role == "assistant" else "user", "content": m.content}
        for m in all_messages[:-1]
        if m.type == "text" and m.content
    ]

    user_context = build_user_context(conversation, db)

    return make_stream_response(
        conversation, db, current_user_id,
        user_message_for_generation=last_user_message,
        history_for_generation=history_before,
        user_context=user_context
    )


@router.post("/onboarding")
def onboarding(request: OnboardingRequest, current_user_id: int = Depends(get_current_user_id)):
    if request.step < 1 or request.step > 5:
        raise HTTPException(status_code=400, detail="Step must be between 1 and 5")
    message = get_onboarding_message(step=request.step, user_name=request.user_name)
    return {"step": request.step, "message": message}


@router.post("/overwhelm")
def overwhelm_mode(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    rate_limit(f"chat:{current_user_id}", max_requests=20, window_seconds=60)

    user = db.query(UserDB).filter(UserDB.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    now = datetime.utcnow()
    next_event = (
        db.query(EventDB)
        .filter(EventDB.user_id == current_user_id)
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

    return {"mode": "overwhelm", "message": message, "focus_event": event_dict}