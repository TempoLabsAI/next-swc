import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TutorialState, TutorialStep, TutorialProgress } from '../types';

interface TutorialStore {
  // State
  tutorialState: TutorialState | null;
  currentSteps: TutorialStep[];
  progress: Record<string, TutorialProgress>;
  isLoading: boolean;
  error: string | null;

  // Actions
  setTutorialState: (state: Partial<TutorialState>) => void;
  setCurrentSteps: (steps: TutorialStep[]) => void;
  updateProgress: (siteId: string, progress: Partial<TutorialProgress>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetTutorial: () => void;
  completeTutorial: (siteId: string) => void;
}

export const useTutorialStore = create<TutorialStore>()(n  persist(
    (set, get) => ({
      // Initial state
      tutorialState: null,
      currentSteps: [],
      progress: {},
      isLoading: false,
      error: null,

      // Actions
      setTutorialState: (newState) => {
        set((state) => ({
          tutorialState: state.tutorialState
            ? { ...state.tutorialState, ...newState }
            : newState as TutorialState,
        }));
      },

      setCurrentSteps: (steps) => {
        set({ currentSteps: steps });
      },

      updateProgress: (siteId, progressUpdate) => {
        set((state) => ({
          progress: {
            ...state.progress,
            [siteId]: {
              ...state.progress[siteId],
              ...progressUpdate,
              lastVisited: Date.now(),
            },
          },
        }));
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error });
      },

      resetTutorial: () => {
        set({
          tutorialState: null,
          currentSteps: [],
          error: null,
        });
      },

      completeTutorial: (siteId) => {
        const { progress } = get();
        const siteProgress = progress[siteId];
        if (siteProgress) {
          set((state) => ({
            progress: {
              ...state.progress,
              [siteId]: {
                ...siteProgress,
                isCompleted: true,
                completionPercentage: 100,
                lastVisited: Date.now(),
              },
            },
          }));
        }
      },
    }),
    {
      name: 'ai-tutor-store',
      partialize: (state) => ({
        progress: state.progress,
        tutorialState: state.tutorialState,
      }),
    }
  )
);
