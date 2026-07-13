import os
from fastapi import Header, HTTPException
from jose import jwt, JWTError
from dotenv import load_dotenv

load_dotenv()

# ========================
# Config
# ========================
# SECRET_KEY must be set in the environment (.env locally, Railway variable in prod).
# No hardcoded fallback on purpose — the app should fail loudly at startup
# rather than silently run with a guessable secret.
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY environment variable is not set. "
        "Add it to your .env file (and to your Railway variables in prod)."
    )

ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 30


# ========================
# Dependency: get_current_user_id
# ========================
# Decodes the JWT from the Authorization header and returns the user_id
# it was issued for. Use this in every route that touches user-owned data.

def get_current_user_id(authorization: str = Header(None)) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.split(" ", 1)[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("user_id")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    return user_id


# ========================
# Helper: require_self
# ========================
# Call this whenever a route receives a user_id (path param or body field)
# and needs to confirm it matches the token's owner. Prevents IDOR —
# e.g. user A reading/editing/deleting user B's data by changing an ID in the URL.

def require_self(requested_user_id: int, current_user_id: int) -> None:
    if requested_user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this resource")