import { create } from 'zustand';

export type LoadingStage = 'idle' | 'checking' | 'fetching' | 'transforming' | 'aggregating' | 'complete' | 'error';

interface LoadingState {
  stage: LoadingStage;
  error: string | null;
  setStage: (stage: LoadingStage) => void;
  setError: (error: string) => void;
  reset: () => void;
}

const initialState = {
  stage: 'idle' as LoadingStage,
  error: null,
};

export const useLoadingStore = create<LoadingState>((set) => ({
  ...initialState,
  setStage: (stage) => set({ stage, error: null }),
  setError: (error) => set({ stage: 'error', error }),
  reset: () => set(initialState),
}));
