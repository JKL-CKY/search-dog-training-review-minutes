from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..services.ai_analyzer import ai_analyzer

router = APIRouter()


@router.post("/analyze", response_model=schemas.AnalysisResponse)
async def analyze_session(
    request: schemas.AnalysisRequest,
    db: Session = Depends(get_db)
):
    session = db.query(models.TrainingSession).filter(
        models.TrainingSession.id == request.session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Training session not found")
    
    if not session.transcription:
        raise HTTPException(
            status_code=400,
            detail="Transcription not available. Please process audio first."
        )
    
    dog_info = {}
    if session.dog:
        dog_info = {
            "id": session.dog.id,
            "name": session.dog.name,
            "breed": session.dog.breed,
            "age": session.dog.age,
            "training_level": session.dog.training_level,
            "specializations": session.dog.specializations
        }
    
    session_info = {
        "id": session.id,
        "title": session.title,
        "date": session.date.isoformat() if session.date else "",
        "scenario_type": session.scenario_type,
        "difficulty_level": session.difficulty_level,
        "location": session.location,
        "description": session.description
    }
    
    speaker_segments = session.speaker_diarization or []
    
    analysis_result = await ai_analyzer.analyze_transcription(
        transcription=session.transcription,
        speaker_segments=speaker_segments,
        dog_info=dog_info,
        session_info=session_info
    )
    
    session.evaluation_scores = analysis_result.get("evaluation_scores", {})
    session.improvement_plan = analysis_result.get("improvement_plan", "")
    session.status = "analyzed"
    db.commit()
    
    return schemas.AnalysisResponse(
        session_id=request.session_id,
        evaluation_scores=analysis_result.get("evaluation_scores", {}),
        improvement_plan=analysis_result.get("improvement_plan", ""),
        meeting_summary=analysis_result.get("meeting_summary", "")
    )


@router.get("/{session_id}/scores")
async def get_evaluation_scores(
    session_id: int,
    db: Session = Depends(get_db)
):
    session = db.query(models.TrainingSession).filter(
        models.TrainingSession.id == session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Training session not found")
    
    return {
        "session_id": session_id,
        "evaluation_scores": session.evaluation_scores or {},
        "evaluation_criteria": [
            {
                "id": ec.id,
                "criterion_name": ec.criterion_name,
                "score": ec.score,
                "max_score": ec.max_score,
                "notes": ec.notes
            }
            for ec in session.evaluation_criteria
        ]
    }


@router.get("/{session_id}/improvement-plan")
async def get_improvement_plan(
    session_id: int,
    db: Session = Depends(get_db)
):
    session = db.query(models.TrainingSession).filter(
        models.TrainingSession.id == session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Training session not found")
    
    return {
        "session_id": session_id,
        "improvement_plan": session.improvement_plan or "",
        "status": session.status
    }


@router.post("/{session_id}/generate-report")
async def generate_full_report(
    session_id: int,
    db: Session = Depends(get_db)
):
    session = db.query(models.TrainingSession).filter(
        models.TrainingSession.id == session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Training session not found")
    
    dog_info = {}
    handler_info = {}
    
    if session.dog:
        dog_info = {
            "name": session.dog.name,
            "breed": session.dog.breed,
            "age": session.dog.age,
            "training_level": session.dog.training_level
        }
        if session.dog.handler:
            handler_info = {
                "name": session.dog.handler.name,
                "rank": session.dog.handler.rank,
                "team": session.dog.handler.team
            }
    
    report = {
        "session_info": {
            "id": session.id,
            "title": session.title,
            "description": session.description,
            "date": session.date.isoformat() if session.date else None,
            "location": session.location,
            "scenario_type": session.scenario_type,
            "difficulty_level": session.difficulty_level,
            "weather_conditions": session.weather_conditions,
            "status": session.status
        },
        "dog_info": dog_info,
        "handler_info": handler_info,
        "search_path": session.search_path or [],
        "scent_hotspots": session.scent_hotspots or [],
        "evaluation_scores": session.evaluation_scores or {},
        "improvement_plan": session.improvement_plan or "",
        "meeting_notes": session.meeting_notes or "",
        "transcription_summary": session.transcription[:500] + "..." if session.transcription else ""
    }
    
    return report
