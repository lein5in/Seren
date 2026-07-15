import pdfplumber
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, UserDB
from app.auth import get_current_user_id, require_self
import io

router = APIRouter(prefix="/upload", tags=["Upload"])

# Stockage en mémoire (simple pour la démo)
pdf_store = {}

MAX_PDF_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB

@router.post("/pdf/{user_id}")
async def upload_pdf(user_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    require_self(user_id, current_user_id)

    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    contents = await file.read()
    if len(contents) > MAX_PDF_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="PDF is too large (max 15 MB)")
    text = ""
    with pdfplumber.open(io.BytesIO(contents)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"

    if not text.strip():
        raise HTTPException(status_code=422, detail="Could not extract text from this PDF")

    # Garder seulement les 8000 premiers caractères pour ne pas exploser le contexte
    pdf_store[user_id] = {
        "filename": file.filename,
        "content": text[:8000]
    }

    return {"filename": file.filename, "characters": len(text), "status": "ready"}


@router.get("/pdf/{user_id}")
def get_pdf_context(user_id: int, current_user_id: int = Depends(get_current_user_id)):
    require_self(user_id, current_user_id)
    doc = pdf_store.get(user_id)
    if not doc:
        return {"content": None}
    return doc