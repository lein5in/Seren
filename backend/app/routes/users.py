from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, UserDB
from app.models.user import UserCreate, UserResponse, UserProfile, UserLogin, TokenResponse, UserIdentity, UserPasswordChange
from app.auth import get_current_user_id, require_self, SECRET_KEY, ALGORITHM, TOKEN_EXPIRE_DAYS
from passlib.context import CryptContext
from jose import jwt
import datetime

router = APIRouter(prefix="/users", tags=["Users"])

# ========================
# Password hashing — bcrypt via passlib (replaces the old raw SHA256 hash)
# ========================
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)


def create_token(user_id: int, name: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "name": name,
        "email": email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=TOKEN_EXPIRE_DAYS)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ========================
# Public routes — no auth required (that's the point)
# ========================

@router.post("/register", response_model=TokenResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(UserDB).filter(UserDB.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = UserDB(name=user.name, email=user.email, hashed_password=hash_password(user.password))
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    token = create_token(new_user.id, new_user.name, new_user.email)
    return TokenResponse(token=token, user_id=new_user.id, name=new_user.name, email=new_user.email)


@router.post("/login", response_model=TokenResponse)
def login_user(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user.id, user.name, user.email)
    return TokenResponse(token=token, user_id=user.id, name=user.name, email=user.email)


# ========================
# Protected routes — require a valid token AND ownership of the resource
# ========================

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    require_self(user_id, current_user_id)
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}/identity", response_model=UserResponse)
def update_identity(user_id: int, data: UserIdentity, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    require_self(user_id, current_user_id)
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if data.email != user.email:
        existing = db.query(UserDB).filter(UserDB.email == data.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
    user.name  = data.name
    user.email = data.email
    db.commit()
    db.refresh(user)
    return user

@router.put("/{user_id}/password")
def change_password(user_id: int, data: UserPasswordChange, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    require_self(user_id, current_user_id)
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(data.old_password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    user.hashed_password = hash_password(data.new_password)
    db.commit()
    return {"ok": True}

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    require_self(user_id, current_user_id)
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)  # cascade="all, delete-orphan" on the relationship also removes their events
    db.commit()
    return {"ok": True}

@router.put("/{user_id}/profile", response_model=UserResponse)
def update_profile(user_id: int, profile: UserProfile, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    require_self(user_id, current_user_id)
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.anxiety_level           = profile.anxiety_level
    user.current_period          = profile.current_period
    user.preferred_reminder_days = profile.preferred_reminder_days
    user.productive_hours_start  = profile.productive_hours_start
    user.productive_hours_end    = profile.productive_hours_end
    user.max_daily_tasks         = profile.max_daily_tasks
    db.commit()
    db.refresh(user)
    return user