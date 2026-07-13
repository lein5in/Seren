from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routes import users, events, schedule, ai, upload 

# Initialize the app
app = FastAPI(
    title="Seren API",
    description="Backend API for Seren — a calm and intelligent student companion.",
    version="0.1.0"
)

# ========================
# CORS Middleware
# ========================
# Explicit allow-list instead of "*". Wildcard origins combined with
# allow_credentials=True is both rejected by modern browsers and a
# security risk (any site could call the API using a logged-in user's
# cookies/token if it were ever sent that way).
#
# Add new frontend URLs here as they're deployed (e.g. a new Vercel
# preview URL, or the final production domain).
ALLOWED_ORIGINS = [
    "http://localhost:5173",              # local dev
    "https://seren-blond.vercel.app",     # beta frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://seren-.*\.vercel\.app",  # Vercel preview deployments
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
app.include_router(upload.router)

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