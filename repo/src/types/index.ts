export interface Dog {
  id: number;
  name: string;
  breed: string;
  age?: number;
  gender?: string;
  weight?: number;
  training_level?: string;
  specializations?: string[];
  handler_id?: number;
  created_at: string;
  updated_at: string;
}

export interface Handler {
  id: number;
  name: string;
  rank?: string;
  team?: string;
  contact_info?: Record<string, any>;
  voice_profile_id?: string;
  created_at: string;
  updated_at: string;
}

export interface EvaluationCriterion {
  id: number;
  session_id: number;
  criterion_name: string;
  score: number;
  max_score: number;
  notes?: string;
  created_at: string;
}

export interface TrainingSession {
  id: number;
  title: string;
  description?: string;
  date: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  dog_id?: number;
  handler_id?: number;
  scenario_type?: string;
  difficulty_level?: string;
  weather_conditions?: Record<string, any>;
  search_path?: SearchPathPoint[];
  scent_hotspots?: ScentHotspot[];
  audio_recording_path?: string;
  transcription?: string;
  speaker_diarization?: SpeakerSegment[];
  evaluation_scores?: Record<string, EvaluationScore>;
  improvement_plan?: string;
  meeting_notes?: string;
  status: string;
  created_at: string;
  updated_at: string;
  dog?: Dog;
  handler?: Handler;
  evaluation_criteria: EvaluationCriterion[];
}

export interface SearchPathPoint {
  lat: number;
  lng: number;
  timestamp?: string;
  altitude?: number;
}

export interface ScentHotspot {
  id: string;
  lat: number;
  lng: number;
  intensity: number;
  type: string;
  radius: number;
  detected_at?: string;
  notes?: string;
}

export interface SpeakerSegment {
  speaker: string;
  start: number;
  end: number;
  duration?: number;
  text?: string;
}

export interface EvaluationScore {
  score: number;
  notes: string;
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export interface AudioProcessResponse {
  session_id: number;
  transcription: string;
  segments: TranscriptionSegment[];
  speaker_diarization: SpeakerSegment[];
}

export interface AnalysisResponse {
  session_id: number;
  evaluation_scores: Record<string, EvaluationScore>;
  improvement_plan: string;
  meeting_summary: string;
}

export interface EmailSendRequest {
  session_id: number;
  recipients: string[];
  include_improvement_plan: boolean;
  include_transcription: boolean;
}

export interface EmailResponse {
  session_id: number;
  sent_count: number;
  failed_count: number;
  recipients: string[];
}

export type SessionStatus = 'pending' | 'audio_uploaded' | 'transcribed' | 'analyzed' | 'completed';
