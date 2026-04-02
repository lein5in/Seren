from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routes import users, events, schedule, ai

# Initialize the app
app = FastAPI(
    title="Seren API",
    description="Backend API for Seren — a calm and intelligent student companion.",
    version="0.1.0"
)

# ========================
# CORS Middleware
# ========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================
# Routers
# ========================
app.include_router(users.router)
app.include_router(events.router)
app.include_router(schedule.router)
app.include_router(ai.router)

# ========================
# Startup Event
# ========================
@app.on_event("startup")
def on_startup():
    init_db()
    print("✅ Database initialized")

# ========================
# Root Route
# ========================
@app.get("/")
def root():
    return {
        "message": "🌿 Seren API is running",
        "version": "0.1.0",
        "status": "ok"
    }

# ========================
# Health Check
# ========================
@app.get("/health")
def health_check():
    return {"status": "healthy"}