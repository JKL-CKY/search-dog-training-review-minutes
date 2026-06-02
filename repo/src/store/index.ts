import { create } from 'zustand';
import type { TrainingSession, Dog, Handler } from '../types';

interface AppState {
  sessions: TrainingSession[];
  dogs: Dog[];
  handlers: Handler[];
  currentSession: TrainingSession | null;
  isLoading: boolean;
  error: string | null;
  
  setSessions: (sessions: TrainingSession[]) => void;
  setDogs: (dogs: Dog[]) => void;
  setHandlers: (handlers: Handler[]) => void;
  setCurrentSession: (session: TrainingSession | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  addSession: (session: TrainingSession) => void;
  updateSession: (session: TrainingSession) => void;
  removeSession: (id: number) => void;
  
  addDog: (dog: Dog) => void;
  updateDog: (dog: Dog) => void;
  removeDog: (id: number) => void;
  
  addHandler: (handler: Handler) => void;
  updateHandler: (handler: Handler) => void;
  removeHandler: (id: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sessions: [],
  dogs: [],
  handlers: [],
  currentSession: null,
  isLoading: false,
  error: null,

  setSessions: (sessions) => set({ sessions }),
  setDogs: (dogs) => set({ dogs }),
  setHandlers: (handlers) => set({ handlers }),
  setCurrentSession: (currentSession) => set({ currentSession }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  addSession: (session) =>
    set((state) => ({ sessions: [session, ...state.sessions] })),
  updateSession: (session) =>
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === session.id ? session : s)),
      currentSession:
        state.currentSession?.id === session.id ? session : state.currentSession,
    })),
  removeSession: (id) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      currentSession: state.currentSession?.id === id ? null : state.currentSession,
    })),

  addDog: (dog) => set((state) => ({ dogs: [...state.dogs, dog] })),
  updateDog: (dog) =>
    set((state) => ({
      dogs: state.dogs.map((d) => (d.id === dog.id ? dog : d)),
    })),
  removeDog: (id) =>
    set((state) => ({ dogs: state.dogs.filter((d) => d.id !== id) })),

  addHandler: (handler) =>
    set((state) => ({ handlers: [...state.handlers, handler] })),
  updateHandler: (handler) =>
    set((state) => ({
      handlers: state.handlers.map((h) => (h.id === handler.id ? handler : h)),
    })),
  removeHandler: (id) =>
    set((state) => ({ handlers: state.handlers.filter((h) => h.id !== id) })),
}));
