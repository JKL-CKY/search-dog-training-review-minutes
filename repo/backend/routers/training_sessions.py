from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid
from ..database import get_db
from .. import models, schemas
from ..config import settings

router = APIRouter()


@router.get("/", response_model=List[schemas.TrainingSession])
def get_sessions(
    skip: int = 0,
    limit: int = 100,
    dog_id: Optional[int] = None,
    handler_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.TrainingSession)
    
    if dog_id:
        query = query.filter(models.TrainingSession.dog_id == dog_id)
    if handler_id:
        query = query.filter(models.TrainingSession.handler_id == handler_id)
    if status:
        query = query.filter(models.TrainingSession.status == status)
    
    sessions = query.order_by(models.TrainingSession.date.desc()).offset(skip).limit(limit).all()
    return sessions


@router.post("/", response_model=schemas.TrainingSession)
def create_session(session: schemas.TrainingSessionCreate, db: Session = Depends(get_db)):
    db_session = models.TrainingSession(**session.model_dump())
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


@router.get("/{session_id}", response_model=schemas.TrainingSession)
def get_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(models.TrainingSession).filter(models.TrainingSession.id == session_id).first()
    if session is None:
        raise HTTPException(status_code=404, detail="Training session not found")
    return session


@router.put("/{session_id}", response_model=schemas.TrainingSession)
def update_session(
    session_id: int,
    session_update: schemas.TrainingSessionUpdate,
    db: Session = Depends(get_db)
):
    session = db.query(models.TrainingSession).filter(models.TrainingSession.id == session_id).first()
    if session is None:
        raise HTTPException(status_code=404, detail="Training session not found")
    
    for key, value in session_update.model_dump(exclude_unset=True).items():
        setattr(session, key, value)
    
    db.commit()
    db.refresh(session)
    return session


@router.delete("/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(models.TrainingSession).filter(models.TrainingSession.id == session_id).first()
    if session is None:
        raise HTTPException(status_code=404, detail="Training session not found")
    
    db.delete(session)
    db.commit()
    return {"message": "Training session deleted successfully"}


@router.post("/{session_id}/upload-audio")
async def upload_audio(
    session_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    session = db.query(models.TrainingSession).filter(models.TrainingSession.id == session_id).first()
    if session is None:
        raise HTTPException(status_code=404, detail="Training session not found")
    
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    file_extension = os.path.splitext(file.filename)[1] if file.filename else ".wav"
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    session.audio_recording_path = file_path
    session.status = "audio_uploaded"
    db.commit()
    db.refresh(session)
    
    return {
        "message": "Audio uploaded successfully",
        "file_path": file_path,
        "session_id": session_id
    }


@router.post("/{session_id}/evaluation-criteria", response_model=schemas.EvaluationCriterion)
def add_evaluation_criterion(
    session_id: int,
    criterion: schemas.EvaluationCriterionCreate,
    db: Session = Depends(get_db)
):
    session = db.query(models.TrainingSession).filter(models.TrainingSession.id == session_id).first()
    if session is None:
        raise HTTPException(status_code=404, detail="Training session not found")
    
    db_criterion = models.EvaluationCriterion(
        session_id=session_id,
        **criterion.model_dump()
    )
    db.add(db_criterion)
    db.commit()
    db.refresh(db_criterion)
    return db_criterion
