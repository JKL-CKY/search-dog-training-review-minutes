from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime


class DogBase(BaseModel):
    name: str
    breed: str
    age: Optional[int] = None
    gender: Optional[str] = None
    weight: Optional[float] = None
    training_level: Optional[str] = None
    specializations: Optional[List[str]] = None
    handler_id: Optional[int] = None


class DogCreate(DogBase):
    pass


class DogUpdate(DogBase):
    pass


class Dog(DogBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class HandlerBase(BaseModel):
    name: str
    rank: Optional[str] = None
    team: Optional[str] = None
    contact_info: Optional[Dict[str, Any]] = None
    voice_profile_id: Optional[str] = None


class HandlerCreate(HandlerBase):
    pass


class HandlerUpdate(HandlerBase):
    pass


class Handler(HandlerBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class EvaluationCriterionBase(BaseModel):
    criterion_name: str
    score: float
    max_score: float = 10.0
    notes: Optional[str] = None


class EvaluationCriterionCreate(EvaluationCriterionBase):
    pass


class EvaluationCriterion(EvaluationCriterionBase):
    id: int
    session_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class TrainingSessionBase(BaseModel):
    title: str
    description: Optional[str] = None
    date: datetime
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    dog_id: Optional[int] = None
    handler_id: Optional[int] = None
    scenario_type: Optional[str] = None
    difficulty_level: Optional[str] = None
    weather_conditions: Optional[Dict[str, Any]] = None
    search_path: Optional[List[Dict[str, Any]]] = None
    scent_hotspots: Optional[List[Dict[str, Any]]] = None
    meeting_notes: Optional[str] = None
    status: Optional[str] = "pending"


class TrainingSessionCreate(TrainingSessionBase):
    pass


class TrainingSessionUpdate(TrainingSessionBase):
    transcription: Optional[str] = None
    speaker_diarization: Optional[List[Dict[str, Any]]] = None
    evaluation_scores: Optional[Dict[str, Any]] = None
    improvement_plan: Optional[str] = None


class TrainingSession(TrainingSessionBase):
    id: int
    audio_recording_path: Optional[str] = None
    transcription: Optional[str] = None
    speaker_diarization: Optional[List[Dict[str, Any]]] = None
    evaluation_scores: Optional[Dict[str, Any]] = None
    improvement_plan: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    evaluation_criteria: List[EvaluationCriterion] = []
    
    class Config:
        from_attributes = True


class AudioProcessRequest(BaseModel):
    session_id: int
    noise_reduction: bool = True
    speaker_diarization: bool = True


class TranscriptionSegment(BaseModel):
    start: float
    end: float
    text: str
    speaker: Optional[str] = None


class AudioProcessResponse(BaseModel):
    session_id: int
    transcription: str
    segments: List[TranscriptionSegment]
    speaker_diarization: List[Dict[str, Any]]


class AnalysisRequest(BaseModel):
    session_id: int


class AnalysisResponse(BaseModel):
    session_id: int
    evaluation_scores: Dict[str, Any]
    improvement_plan: str
    meeting_summary: str


class EmailSendRequest(BaseModel):
    session_id: int
    recipients: List[EmailStr]
    include_improvement_plan: bool = True
    include_transcription: bool = False


class EmailResponse(BaseModel):
    session_id: int
    sent_count: int
    failed_count: int
    recipients: List[str]
