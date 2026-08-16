from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import users, events, schedule, ai, upload, conversations

app = FastAPI(
    title="Seren API",
    description="Backend API for Seren — a calm and intelligent student companion.",
    version="0.2.0"
)

ALLOWED_ORIGINS = [
    "http://localhost:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(events.router)
app.include_router(schedule.router)
app.include_router(ai.router)
app.include_router(upload.router)
app.include_router(conversations.router)


@app.on_event("startup")
def on_startup():
    print("✅ Seren API starting — schema is managed by Alembic (run `alembic upgrade head` if needed)")


@app.get("/")
def root():
    return {"message": "🌿 Seren API is running", "version": "0.2.0", "status": "ok"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}