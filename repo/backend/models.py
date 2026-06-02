from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime


class Dog(Base):
    __tablename__ = "dogs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    breed = Column(String(100), nullable=False)
    age = Column(Integer)
    gender = Column(String(20))
    weight = Column(Float)
    training_level = Column(String(50))
    specializations = Column(JSON, default=list)
    handler_id = Column(Integer, ForeignKey("handlers.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    handler = relationship("Handler", back_populates="dogs")
    training_sessions = relationship("TrainingSession", back_populates="dog")


class Handler(Base):
    __tablename__ = "handlers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    rank = Column(String(50))
    team = Column(String(100))
    contact_info = Column(JSON, default=dict)
    voice_profile_id = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    dogs = relationship("Dog", back_populates="handler")
    training_sessions = relationship("TrainingSession", back_populates="handler")


class TrainingSession(Base):
    __tablename__ = "training_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    date = Column(DateTime, nullable=False)
    location = Column(String(200))
    latitude = Column(Float)
    longitude = Column(Float)
    dog_id = Column(Integer, ForeignKey("dogs.id"))
    handler_id = Column(Integer, ForeignKey("handlers.id"))
    scenario_type = Column(String(100))
    difficulty_level = Column(String(50))
    weather_conditions = Column(JSON, default=dict)
    search_path = Column(JSON, default=list)
    scent_hotspots = Column(JSON, default=list)
    audio_recording_path = Column(String(500))
    transcription = Column(Text)
    speaker_diarization = Column(JSON, default=list)
    evaluation_scores = Column(JSON, default=dict)
    improvement_plan = Column(Text)
    meeting_notes = Column(Text)
    status = Column(String(50), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    dog = relationship("Dog", back_populates="training_sessions")
    handler = relationship("Handler", back_populates="training_sessions")
    evaluation_criteria = relationship("EvaluationCriterion", back_populates="session")
    email_notifications = relationship("EmailNotification", back_populates="session")


class EvaluationCriterion(Base):
    __tablename__ = "evaluation_criteria"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("training_sessions.id"))
    criterion_name = Column(String(100), nullable=False)
    score = Column(Float, nullable=False)
    max_score = Column(Float, default=10.0)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    session = relationship("TrainingSession", back_populates="evaluation_criteria")


class EmailNotification(Base):
    __tablename__ = "email_notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("training_sessions.id"))
    recipient = Column(String(200), nullable=False)
    subject = Column(String(300), nullable=False)
    body = Column(Text, nullable=False)
    sent_at = Column(DateTime)
    status = Column(String(50), default="pending")
    error_message = Column(Text)
    
    session = relationship("TrainingSession", back_populates="email_notifications")
