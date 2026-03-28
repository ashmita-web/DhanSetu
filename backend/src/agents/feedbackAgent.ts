import type { WorkflowState, UserProfile, BehavioralSignal } from '../types/index';
import db from '../database/store';

interface FeedbackInsights {
  preferredCategories: string[];
  engagementScore: number;
  nextBestActions: string[];
  contentSuggestions: string[];
  weeklyBriefingTopics: string[];
  retentionRisk: 'low' | 'medium' | 'high';
  upsellReadiness: boolean;
}

function deriveEngagementScore(signals: BehavioralSignal[]): number {
  if (signals.length === 0) return 40; // first session baseline
  let score = 40;
  for (const s of signals) {
    if (s.signalType === 'recommendation_interaction') score += 10;
    if (s.signalType === 'click') score += 3;
    if (s.signalType === 'time_spent' && (s.value as number) > 60) score += 5;
    if (s.signalType === 'scroll_depth' && (s.value as number) > 70) score += 3;
  }
  return Math.min(score, 100);
}

function derivePreferredCategories(profile: Partial<UserProfile>, signals: BehavioralSignal[]): string[] {
  const cats = new Set<string>();
  const goals = profile.financialGoals || [];

  if (goals.includes('wealth_creation')) cats.add('Mutual Funds');
  if (goals.includes('retirement')) cats.add('Retirement');
  if (goals.includes('emergency_fund')) cats.add('Liquid Funds');
  if (goals.includes('home_purchase')) cats.add('Loans & Real Estate');
  if (goals.includes('education')) cats.add('Education Finance');

  // Add from signals
  for (const s of signals) {
    if (s.category) cats.add(s.category);
  }

  cats.add('Market News'); // always relevant
  return [...cats].slice(0, 5);
}

function generateNextBestActions(profile: Partial<UserProfile>, engagementScore: number): string[] {
  const actions: string[] = [];
  const goals = profile.financialGoals || [];
  const risk = profile.riskAppetite || 'moderate';
  const income = profile.demographics?.incomeRange || 'under_25k';

  actions.push('Complete your financial goals setup on the Journey Map page');

  if (goals.includes('wealth_creation')) {
    actions.push('Start your first SIP of ₹500 on ET Money — takes 3 minutes');
  }
  if (goals.includes('retirement')) {
    actions.push('Open NPS account to claim ₹50,000 extra tax deduction this year');
  }
  if (!goals.includes('emergency_fund')) {
    actions.push('Set up emergency fund — park ₹2,000/month in a liquid fund');
  }
  if (income === 'above_1L' || income === '50k_1L') {
    actions.push('Calculate your Section 80C investments — maximize ₹1.5L deduction');
  }
  if (engagementScore < 60) {
    actions.push('Explore ET Markets for free daily market briefings');
  }

  return actions.slice(0, 4);
}

function generateContentSuggestions(profile: Partial<UserProfile>): string[] {
  const suggestions: string[] = [];
  const goals = profile.financialGoals || [];
  const lifestage = profile.lifestage || 'Young Professional';
  const risk = profile.riskAppetite || 'moderate';

  if (lifestage === 'Young Learner' || lifestage === 'Early Career Starter') {
    suggestions.push('Beginner\'s Guide to Investing in India');
    suggestions.push('How to Build Your First Budget in 5 Steps');
  }
  if (goals.includes('wealth_creation')) {
    suggestions.push('SIP Calculator: What ₹2,000/month becomes in 20 years');
    suggestions.push('Top 5 Flexi-Cap Funds for 2024');
  }
  if (goals.includes('retirement')) {
    suggestions.push('NPS vs EPF: Which gives better retirement corpus?');
  }
  if (risk === 'aggressive') {
    suggestions.push('Small Cap vs Mid Cap: Where should you invest in 2024?');
  }
  suggestions.push('ET Markets: This Week\'s Top Analyst Picks');

  return suggestions.slice(0, 4);
}

function assessRetentionRisk(engagementScore: number, signals: BehavioralSignal[]): 'low' | 'medium' | 'high' {
  if (engagementScore > 70) return 'low';
  if (engagementScore > 50 || signals.length > 3) return 'medium';
  return 'high';
}

export async function runFeedbackLearningAgent(
  state: WorkflowState,
  profile: Partial<UserProfile>,
  signals: BehavioralSignal[]
): Promise<FeedbackInsights> {
  const startTime = Date.now();

  const engagementScore = deriveEngagementScore(signals);
  const preferredCategories = derivePreferredCategories(profile, signals);
  const retentionRisk = assessRetentionRisk(engagementScore, signals);

  const income = profile.demographics?.incomeRange || 'under_25k';

  const insights: FeedbackInsights = {
    preferredCategories,
    engagementScore,
    nextBestActions: generateNextBestActions(profile, engagementScore),
    contentSuggestions: generateContentSuggestions(profile),
    weeklyBriefingTopics: preferredCategories.slice(0, 3),
    retentionRisk,
    upsellReadiness: engagementScore > 60 && (income === 'above_1L' || income === '50k_1L'),
  };

  db.logAgentDecision({
    sessionId: state.sessionId,
    userId: state.userId,
    agentName: 'FeedbackLearningAgent',
    stage: 'feedback_learning',
    input: { signalCount: signals.length, engagementScore },
    output: insights as unknown as Record<string, unknown>,
    latencyMs: Date.now() - startTime,
    success: true,
  });

  return insights;
}
