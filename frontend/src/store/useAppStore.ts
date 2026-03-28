import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  User, UserProfile, WorkflowStage, Recommendation,
  FinancialGoal, ChatMessage
} from '../types/index.js';

interface ActiveAgent {
  name: string;
  status: 'running' | 'complete';
}

interface AppStore {
  // Auth
  user: User | null;
  token: string | null;
  sessionId: string | null;
  isAuthenticated: boolean;

  // Profile
  profile: UserProfile | null;

  // Chat
  messages: ChatMessage[];
  isTyping: boolean;

  // Workflow
  currentWorkflowStage: WorkflowStage;
  activeAgents: ActiveAgent[];
  isWorkflowComplete: boolean;
  completedStages: WorkflowStage[];

  // Data
  recommendations: Recommendation[];
  goals: FinancialGoal[];

  // Actions
  setAuth: (user: User, token: string, sessionId: string) => void;
  logout: () => void;
  setProfile: (profile: UserProfile) => void;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setTyping: (typing: boolean) => void;
  setWorkflowStage: (stage: WorkflowStage) => void;
  addActiveAgent: (agent: ActiveAgent) => void;
  completeAgent: (name: string) => void;
  setWorkflowComplete: (complete: boolean) => void;
  setRecommendations: (recs: Recommendation[]) => void;
  setGoals: (goals: FinancialGoal[]) => void;
  addCompletedStage: (stage: WorkflowStage) => void;
  setSessionId: (id: string) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      sessionId: null,
      isAuthenticated: false,
      profile: null,
      messages: [],
      isTyping: false,
      currentWorkflowStage: 'welcome',
      activeAgents: [],
      isWorkflowComplete: false,
      completedStages: [],
      recommendations: [],
      goals: [],

      setAuth: (user, token, sessionId) => {
        localStorage.setItem('dhansetu_token', token);
        set({ user, token, sessionId, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('dhansetu_token');
        localStorage.removeItem('dhansetu_user');
        set({
          user: null, token: null, sessionId: null,
          isAuthenticated: false, profile: null,
          messages: [], isWorkflowComplete: false,
          currentWorkflowStage: 'welcome', completedStages: [],
          recommendations: [], goals: [],
        });
      },

      setProfile: (profile) => set({ profile }),

      addMessage: (message) => set((state) => ({
        messages: [...state.messages, message],
      })),

      setMessages: (messages) => set({ messages }),

      setTyping: (typing) => set({ isTyping: typing }),

      setWorkflowStage: (stage) => set({ currentWorkflowStage: stage }),

      addActiveAgent: (agent) => set((state) => ({
        activeAgents: [...state.activeAgents.filter(a => a.name !== agent.name), agent],
      })),

      completeAgent: (name) => set((state) => ({
        activeAgents: state.activeAgents.map(a =>
          a.name === name ? { ...a, status: 'complete' as const } : a
        ),
      })),

      setWorkflowComplete: (complete) => set({ isWorkflowComplete: complete }),

      setRecommendations: (recs) => set({ recommendations: recs }),

      setGoals: (goals) => set({ goals }),

      addCompletedStage: (stage) => set((state) => ({
        completedStages: [...new Set([...state.completedStages, stage])],
      })),

      setSessionId: (id) => set({ sessionId: id }),
    }),
    {
      name: 'dhansetu-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        sessionId: state.sessionId,
        isAuthenticated: state.isAuthenticated,
        profile: state.profile,
        isWorkflowComplete: state.isWorkflowComplete,
        currentWorkflowStage: state.currentWorkflowStage,
      }),
    }
  )
);
