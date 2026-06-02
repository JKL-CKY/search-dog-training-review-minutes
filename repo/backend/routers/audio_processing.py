from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
import os
from ..database import get_db
from .. import models, schemas
from ..services.audio_processor import audio_processor

router = APIRouter()


@router.post("/process", response_model=schemas.AudioProcessResponse)
async def process_audio(
    request: schemas.AudioProcessRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    session = db.query(models.TrainingSession).filter(
        models.TrainingSession.id == request.session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Training session not found")
    
    if not session.audio_recording_path or not os.path.exists(session.audio_recording_path):
        raise HTTPException(status_code=400, detail="Audio file not found for this session")
    
    audio_path = session.audio_recording_path
    
    if request.noise_reduction:
        audio_path = audio_processor.reduce_noise(audio_path)
    
    transcription, segments = audio_processor.transcribe_with_whisper(audio_path)
    
    speaker_diarization = []
    if request.speaker_diarization:
        speaker_diarization = audio_processor.diarize_speakers(audio_path)
        segments = audio_processor.merge_transcription_and_diarization(segments, speaker_diarization)
    
    session.transcription = transcription
    session.speaker_diarization = speaker_diarization
    session.status = "transcribed"
    db.commit()
    
    return schemas.AudioProcessResponse(
        session_id=request.session_id,
        transcription=transcription,
        segments=[schemas.TranscriptionSegment(**seg) for seg in segments],
        speaker_diarization=speaker_diarization
    )


@router.post("/denoise")
async def denoise_audio(
    session_id: int,
    db: Session = Depends(get_db)
):
    session = db.query(models.TrainingSession).filter(
        models.TrainingSession.id == session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Training session not found")
    
    if not session.audio_recording_path or not os.path.exists(session.audio_recording_path):
        raise HTTPException(status_code=400, detail="Audio file not found")
    
    denoised_path = audio_processor.reduce_noise(session.audio_recording_path)
    
    return {
        "message": "Noise reduction completed",
        "original_path": session.audio_recording_path,
        "denoised_path": denoised_path
    }


@router.post("/transcribe")
async def transcribe_audio(
    session_id: int,
    db: Session = Depends(get_db)
):
    session = db.query(models.TrainingSession).filter(
        models.TrainingSession.id == session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Training session not found")
    
    if not session.audio_recording_path or not os.path.exists(session.audio_recording_path):
        raise HTTPException(status_code=400, detail="Audio file not found")
    
    transcription, segments = audio_processor.transcribe_with_whisper(session.audio_recording_path)
    
    session.transcription = transcription
    session.status = "transcribed"
    db.commit()
    
    return {
        "session_id": session_id,
        "transcription": transcription,
        "segments": segments
    }


@router.post("/diarize")
async def diarize_speakers(
    session_id: int,
    db: Session = Depends(get_db)
):
    session = db.query(models.TrainingSession).filter(
        models.TrainingSession.id == session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Training session not found")
    
    if not session.audio_recording_path or not os.path.exists(session.audio_recording_path):
        raise HTTPException(status_code=400, detail="Audio file not found")
    
    speaker_diarization = audio_processor.diarize_speakers(session.audio_recording_path)
    
    session.speaker_diarization = speaker_diarization
    db.commit()
    
    return {
        "session_id": session_id,
        "speaker_diarization": speaker_diarization
    }
