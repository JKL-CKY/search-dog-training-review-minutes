from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from .. import models, schemas
from ..services.email_service import email_service

router = APIRouter()


@router.post("/send-report", response_model=schemas.EmailResponse)
async def send_training_report(
    request: schemas.EmailSendRequest,
    db: Session = Depends(get_db)
):
    session = db.query(models.TrainingSession).filter(
        models.TrainingSession.id == request.session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Training session not found")
    
    dog_data = {}
    handler_data = {}
    
    if session.dog:
        dog_data = {
            "id": session.dog.id,
            "name": session.dog.name,
            "breed": session.dog.breed,
            "age": session.dog.age,
            "training_level": session.dog.training_level
        }
        if session.dog.handler:
            handler_data = {
                "id": session.dog.handler.id,
                "name": session.dog.handler.name,
                "rank": session.dog.handler.rank,
                "team": session.dog.handler.team
            }
    
    session_data = {
        "id": session.id,
        "title": session.title,
        "description": session.description,
        "date": session.date.strftime('%Y-%m-%d') if session.date else "",
        "location": session.location,
        "scenario_type": session.scenario_type,
        "difficulty_level": session.difficulty_level
    }
    
    improvement_plan = session.improvement_plan or "改进方案尚未生成"
    evaluation_scores = session.evaluation_scores or {}
    transcription = session.transcription if request.include_transcription else ""
    
    result = await email_service.send_training_report(
        recipients=request.recipients,
        session_data=session_data,
        dog_data=dog_data,
        handler_data=handler_data,
        improvement_plan=improvement_plan,
        evaluation_scores=evaluation_scores,
        include_transcription=request.include_transcription,
        transcription=transcription
    )
    
    for recipient in request.recipients:
        email_notification = models.EmailNotification(
            session_id=request.session_id,
            recipient=recipient,
            subject=f"【训练报告】{dog_data.get('name', '搜救犬')} - {session_data.get('title', '')}",
            body=improvement_plan,
            sent_at=datetime.utcnow() if result.get("success") else None,
            status="sent" if result.get("success") else "failed",
            error_message=None if result.get("success") else "; ".join(result.get("errors", []))
        )
        db.add(email_notification)
    
    db.commit()
    
    return schemas.EmailResponse(
        session_id=request.session_id,
        sent_count=result.get("sent_count", 0),
        failed_count=result.get("failed_count", 0),
        recipients=request.recipients
    )


@router.get("/{session_id}/history")
async def get_email_history(
    session_id: int,
    db: Session = Depends(get_db)
):
    session = db.query(models.TrainingSession).filter(
        models.TrainingSession.id == session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Training session not found")
    
    notifications = db.query(models.EmailNotification).filter(
        models.EmailNotification.session_id == session_id
    ).order_by(models.EmailNotification.sent_at.desc()).all()
    
    return {
        "session_id": session_id,
        "email_history": [
            {
                "id": n.id,
                "recipient": n.recipient,
                "subject": n.subject,
                "sent_at": n.sent_at.isoformat() if n.sent_at else None,
                "status": n.status,
                "error_message": n.error_message
            }
            for n in notifications
        ]
    }


@router.post("/{session_id}/resend/{notification_id}")
async def resend_email(
    session_id: int,
    notification_id: int,
    db: Session = Depends(get_db)
):
    notification = db.query(models.EmailNotification).filter(
        models.EmailNotification.id == notification_id,
        models.EmailNotification.session_id == session_id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Email notification not found")
    
    session = db.query(models.TrainingSession).filter(
        models.TrainingSession.id == session_id
    ).first()
    
    dog_data = {}
    handler_data = {}
    if session and session.dog:
        dog_data = {
            "name": session.dog.name,
            "breed": session.dog.breed,
            "age": session.dog.age,
            "training_level": session.dog.training_level
        }
        if session.dog.handler:
            handler_data = {"name": session.dog.handler.name}
    
    session_data = {
        "title": session.title if session else "",
        "date": session.date.strftime('%Y-%m-%d') if session and session.date else "",
        "scenario_type": session.scenario_type if session else "",
        "difficulty_level": session.difficulty_level if session else ""
    }
    
    result = await email_service.send_training_report(
        recipients=[notification.recipient],
        session_data=session_data,
        dog_data=dog_data,
        handler_data=handler_data,
        improvement_plan=notification.body,
        evaluation_scores=session.evaluation_scores if session else {},
        include_transcription=False,
        transcription=""
    )
    
    if result.get("success"):
        notification.status = "sent"
        notification.sent_at = datetime.utcnow()
        notification.error_message = None
        db.commit()
    
    return {
        "success": result.get("success"),
        "recipient": notification.recipient,
        "message": "Email resent successfully" if result.get("success") else "Failed to resend email"
    }
