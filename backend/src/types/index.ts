export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  lastActive: string;
  onboardingComplete: boolean;
}

export interface UserProfile {
  userId: string;
  demographics: {
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
  currentProducts: string[];
  etEngagementLevel?: 'new' | 'casual' | 'regular' | 'power';
  persona?: string;
  segment?: string;
  lifestage?: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  agentName?: string;
  metadata?: Record<string, unknown>;
}

export interface ConversationSession {
  id: string;
  userId: string;
  messages: Message[];
  status: 'active' | 'completed' | 'paused';
  workflowStage: WorkflowStage;
  createdAt: string;
  updatedAt: string;
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

export interface AgentDecisionLog {
  id: string;
  sessionId: string;
  userId: string;
  agentName: string;
  stage: WorkflowStage;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  reasoning?: string;
  tokensUsed?: number;
  latencyMs?: number;
  timestamp: string;
  success: boolean;
  error?: string;
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
  imageUrl?: string;
  tags: string[];
  expiresAt?: string;
  createdAt: string;
  interacted?: boolean;
  interactionType?: 'clicked' | 'saved' | 'dismissed';
}

export interface FinancialGoal {
  id: string;
  userId: string;
  title: string;
  description: string;
  targetAmount?: number;
  currentAmount?: number;
  targetDate?: string;
  category: 'retirement' | 'education' | 'home' | 'travel' | 'emergency' | 'wealth' | 'other';
  status: 'not_started' | 'in_progress' | 'achieved';
  progress: number;
  milestones: { title: string; completed: boolean }[];
  suggestedProducts: string[];
}

export interface BehavioralSignal {
  id: string;
  userId: string;
  signalType: 'page_view' | 'click' | 'search' | 'scroll_depth' | 'time_spent' | 'recommendation_interaction';
  category?: string;
  value?: string | number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ETService {
  id: string;
  name: string;
  category: 'mutual_funds' | 'insurance' | 'loans' | 'stocks' | 'fd' | 'nps' | 'credit_card' | 'demat';
  description: string;
  features: string[];
  provider: string;
  rating: number;
  minInvestment?: number;
  returns?: string;
  tags: string[];
  matchScore?: number;
}

export interface WorkflowState {
  sessionId: string;
  userId: string;
  currentStage: WorkflowStage;
  profile: Partial<UserProfile>;
  extractedData: Record<string, unknown>;
  recommendations: Recommendation[];
  goals: FinancialGoal[];
  retryCount: number;
  lastError?: string;
  completedStages: WorkflowStage[];
}

export interface ProfilingQuestion {
  id: string;
  text: string;
  type: 'open' | 'choice' | 'scale';
  options?: string[];
  category: keyof UserProfile['demographics'] | 'financial' | 'interests' | 'goals';
}

export interface WeeklyBriefing {
  userId: string;
  weekOf: string;
  topStories: { title: string; summary: string; category: string }[];
  marketInsight: string;
  personalizedTip: string;
  goalProgress: { goalTitle: string; progress: number }[];
  actionItems: string[];
}
