from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, ConversationDB, MessageDB
from app.models.conversation import (
    ConversationCreate,
    ConversationResponse,
    ConversationWithMessages,
    MessageCreate,
    MessageResponse,
)
from app.auth import get_current_user_id
from typing import List
from datetime import datetime

router = APIRouter(prefix="/conversations", tags=["Conversations"])


def get_owned_conversation(conversation_id: int, current_user_id: int, db: Session) -> ConversationDB:
    conv = db.query(ConversationDB).filter(ConversationDB.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conv.user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this conversation")
    return conv


@router.post("/", response_model=ConversationResponse)
def create_conversation(
    payload: ConversationCreate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    conv = ConversationDB(user_id=current_user_id, title=payload.title or "New conversation")
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


@router.get("/", response_model=List[ConversationResponse])
def list_conversations(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    return (
        db.query(ConversationDB)
        .filter(ConversationDB.user_id == current_user_id)
        .filter(ConversationDB.archived == False)
        .order_by(ConversationDB.updated_at.desc())
        .all()
    )


@router.get("/{conversation_id}", response_model=ConversationWithMessages)
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    return get_owned_conversation(conversation_id, current_user_id, db)


@router.put("/{conversation_id}", response_model=ConversationResponse)
def rename_conversation(
    conversation_id: int,
    payload: ConversationCreate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    conv = get_owned_conversation(conversation_id, current_user_id, db)
    conv.title = payload.title or conv.title
    db.commit()
    db.refresh(conv)
    return conv


@router.delete("/{conversation_id}")
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    conv = get_owned_conversation(conversation_id, current_user_id, db)
    db.delete(conv)
    db.commit()
    return {"ok": True}


@router.delete("/{conversation_id}/messages/from/{sequence}")
def delete_messages_from(
    conversation_id: int,
    sequence: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    conv = get_owned_conversation(conversation_id, current_user_id, db)
    db.query(MessageDB).filter(
        MessageDB.conversation_id == conv.id,
        MessageDB.sequence >= sequence,
    ).delete()
    conv.updated_at = datetime.utcnow()
    db.commit()
    return {"ok": True}


@router.post("/{conversation_id}/messages", response_model=MessageResponse)
def add_message(
    conversation_id: int,
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    conv = get_owned_conversation(conversation_id, current_user_id, db)
    last = (
        db.query(MessageDB)
        .filter(MessageDB.conversation_id == conversation_id)
        .order_by(MessageDB.sequence.desc())
        .first()
    )
    next_sequence = (last.sequence + 1) if last else 0
    msg = MessageDB(
        conversation_id=conversation_id,
        user_id=current_user_id,
        role=payload.role,
        type=payload.type,
        content=payload.content,
        data=payload.data,
        sequence=next_sequence,
    )
    conv.updated_at = datetime.utcnow()
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg