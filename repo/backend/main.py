from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import training_sessions, audio_processing, analysis, email_notifications, dogs, handlers
from .config import settings
import os

Base.metadata.create_all(bind=engine)

app = FastAPI(title="K9 Search Rescue Training Review System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.PROCESSED_DIR, exist_ok=True)

app.include_router(training_sessions.router, prefix="/api/sessions", tags=["Training Sessions"])
app.include_router(audio_processing.router, prefix="/api/audio", tags=["Audio Processing"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(email_notifications.router, prefix="/api/email", tags=["Email Notifications"])
app.include_router(dogs.router, prefix="/api/dogs", tags=["Dogs"])
app.include_router(handlers.router, prefix="/api/handlers", tags=["Handlers"])


@app.get("/")
async def root():
    return {"message": "K9 Search Rescue Training Review System API"}
