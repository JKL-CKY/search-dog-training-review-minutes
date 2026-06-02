import axios from 'axios';
import type {
  Dog,
  Handler,
  TrainingSession,
  AudioProcessResponse,
  AnalysisResponse,
  EmailSendRequest,
  EmailResponse,
  TranscriptionSegment,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const dogsApi = {
  getAll: () => api.get<Dog[]>('/dogs'),
  getById: (id: number) => api.get<Dog>(`/dogs/${id}`),
  create: (data: Partial<Dog>) => api.post<Dog>('/dogs', data),
  update: (id: number, data: Partial<Dog>) => api.put<Dog>(`/dogs/${id}`, data),
  delete: (id: number) => api.delete(`/dogs/${id}`),
};

export const handlersApi = {
  getAll: () => api.get<Handler[]>('/handlers'),
  getById: (id: number) => api.get<Handler>(`/handlers/${id}`),
  create: (data: Partial<Handler>) => api.post<Handler>('/handlers', data),
  update: (id: number, data: Partial<Handler>) => api.put<Handler>(`/handlers/${id}`, data),
  delete: (id: number) => api.delete(`/handlers/${id}`),
};

export const sessionsApi = {
  getAll: (params?: { dog_id?: number; handler_id?: number; status?: string }) =>
    api.get<TrainingSession[]>('/sessions', { params }),
  getById: (id: number) => api.get<TrainingSession>(`/sessions/${id}`),
  create: (data: Partial<TrainingSession>) => api.post<TrainingSession>('/sessions', data),
  update: (id: number, data: Partial<TrainingSession>) =>
    api.put<TrainingSession>(`/sessions/${id}`, data),
  delete: (id: number) => api.delete(`/sessions/${id}`),
  uploadAudio: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/sessions/${id}/upload-audio`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const audioApi = {
  process: (sessionId: number, noiseReduction = true, speakerDiarization = true) =>
    api.post<AudioProcessResponse>('/audio/process', {
      session_id: sessionId,
      noise_reduction: noiseReduction,
      speaker_diarization: speakerDiarization,
    }),
  denoise: (sessionId: number) => api.post('/audio/denoise', { session_id: sessionId }),
  transcribe: (sessionId: number) =>
    api.post<{ transcription: string; segments: TranscriptionSegment[] }>('/audio/transcribe', {
      session_id: sessionId,
    }),
  diarize: (sessionId: number) => api.post('/audio/diarize', { session_id: sessionId }),
};

export const analysisApi = {
  analyze: (sessionId: number) =>
    api.post<AnalysisResponse>('/analysis/analyze', { session_id: sessionId }),
  getScores: (sessionId: number) => api.get(`/analysis/${sessionId}/scores`),
  getImprovementPlan: (sessionId: number) =>
    api.get<{ improvement_plan: string; status: string }>(`/analysis/${sessionId}/improvement-plan`),
  generateReport: (sessionId: number) => api.post(`/analysis/${sessionId}/generate-report`),
};

export const emailApi = {
  sendReport: (data: EmailSendRequest) =>
    api.post<EmailResponse>('/email/send-report', data),
  getHistory: (sessionId: number) => api.get(`/email/${sessionId}/history`),
  resend: (sessionId: number, notificationId: number) =>
    api.post(`/email/${sessionId}/resend/${notificationId}`),
};

export default api;
