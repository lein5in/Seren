from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, UserDB
from app.models.user import UserCreate, UserResponse, UserProfile
import hashlib

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

# ========================
# Helper
# ========================

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# ========================
# Routes
# ========================

@router.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.
    """
    # Check if email already exists
    existing = db.query(UserDB).filter(UserDB.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = UserDB(
        name=user.name,
        email=user.email,
        hashed_password=hash_password(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """
    Get a user by ID.
    """
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}/profile", response_model=UserResponse)
def update_profile(user_id: int, profile: UserProfile, db: Session = Depends(get_db)):
    """
    Update user profile — called after onboarding questions.
    """
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.anxiety_level = profile.anxiety_level
    user.current_period = profile.current_period
    user.preferred_reminder_days = profile.preferred_reminder_days
    user.productive_hours_start = profile.productive_hours_start
    user.productive_hours_end = profile.productive_hours_end
    user.max_daily_tasks = profile.max_daily_tasks

    db.commit()
    db.refresh(user)
    return user