export interface User {
  id: string;
  name: string;
  email: string;
  onboardingComplete: boolean;
}

export interface UserProfile {
  userId: string;
  demographics?: {
    age?: number;
    city?: string;
    occupation?: string;
    incomeRange?: string;
    familyStatus?: string;
  };
  financialGoals: string[];
  interests: string[];
  riskAppetite?: 'conservative' | 'moderate' | 'aggressive';
  investmentHorizon?: 'short' | 'medium' | 'long';
  currentProducts?: string[];
  etEngagementLevel?: string;
  persona?: string;
  segment?: string;
  lifestage?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  agentName?: string;
  metadata?: Record<string, unknown>;
}

export type WorkflowStage =
  | 'welcome'
  | 'profiling'
  | 'intelligence_building'
  | 'recommendation'
  | 'financial_navigation'
  | 'cross_sell'
  | 'marketplace'
  | 'feedback_learning'
  | 'completed';

export interface WorkflowUpdate {
  stage: WorkflowStage | 'completed';
  agentName?: string;
  status?: 'running' | 'complete' | 'error';
  data?: Record<string, unknown>;
  type?: string;
  message?: string;
}

export interface Recommendation {
  id: string;
  userId: string;
  type: 'article' | 'product' | 'service' | 'event' | 'fund' | 'insurance';
  title: string;
  description: string;
  reason: string;
  category: string;
  priority: number;
  ctaText?: string;
  ctaUrl?: string;
  tags: string[];
  createdAt: string;
  interacted?: boolean;
}

export interface FinancialGoal {
  id: string;
  userId: string;
  title: string;
  description: string;
  targetAmount?: number;
  currentAmount?: number;
  targetDate?: string;
  category: string;
  status: 'not_started' | 'in_progress' | 'achieved';
  progress: number;
  milestones: { title: string; completed: boolean }[];
  suggestedProducts?: string[];
}

export interface ETService {
  id: string;
  name: string;
  category: string;
  description: string;
  features: string[];
  provider: string;
  rating: number;
  minInvestment?: number;
  returns?: string;
  tags: string[];
  matchScore?: number;
}

export interface AgentDecisionLog {
  id: string;
  agentName: string;
  stage: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  reasoning?: string;
  tokensUsed?: number;
  latencyMs?: number;
  timestamp: string;
  success: boolean;
  error?: string;
}

export interface DashboardStats {
  recommendationsCount: number;
  goalsCount: number;
  completedGoals: number;
  recentSignals: number;
  agentDecisions: number;
}

export interface AppState {
  user: User | null;
  profile: UserProfile | null;
  token: string | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  currentWorkflowStage: WorkflowStage;
  activeAgents: { name: string; status: 'running' | 'complete' }[];
  recommendations: Recommendation[];
  goals: FinancialGoal[];
  isWorkflowComplete: boolean;
}
