import pdfplumber
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, PDFDocumentDB
from app.auth import get_current_user_id
from app.routes.conversations import get_owned_conversation
import io

router = APIRouter(prefix="/upload", tags=["Upload"])

MAX_PDF_SIZE_BYTES = 15 * 1024 * 1024
PDF_MAGIC_BYTES = b"%PDF-"


@router.post("/pdf/{conversation_id}")
async def upload_pdf(
    conversation_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    conversation = get_owned_conversation(conversation_id, current_user_id, db)

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    contents = await file.read()
    if len(contents) > MAX_PDF_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="PDF is too large (max 15 MB)")

    if not contents.startswith(PDF_MAGIC_BYTES):
        raise HTTPException(status_code=400, detail="This file is not a valid PDF")

    text = ""
    try:
        with pdfplumber.open(io.BytesIO(contents)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception:
        raise HTTPException(status_code=422, detail="Could not read this PDF — it may be corrupted or malformed")

    if not text.strip():
        raise HTTPException(status_code=422, detail="Could not extract text from this PDF")

    truncated_content = text[:8000]

    existing = db.query(PDFDocumentDB).filter(PDFDocumentDB.conversation_id == conversation.id).first()
    if existing:
        existing.filename = file.filename
        existing.content = truncated_content
    else:
        existing = PDFDocumentDB(
            filename=file.filename,
            content=truncated_content,
            conversation_id=conversation.id,
            user_id=current_user_id
        )
        db.add(existing)
    db.commit()

    return {"filename": file.filename, "characters": len(text), "status": "ready"}


@router.get("/pdf/{conversation_id}")
def get_pdf_context(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    conversation = get_owned_conversation(conversation_id, current_user_id, db)
    doc = db.query(PDFDocumentDB).filter(PDFDocumentDB.conversation_id == conversation.id).first()
    if not doc:
        return {"content": None}
    return {"filename": doc.filename, "content": doc.content}