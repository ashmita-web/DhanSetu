import type { WorkflowState, UserProfile } from '../types/index';
import db from '../database/store';

export interface IntelligenceReport {
  persona: string;
  segment: string;
  lifestage: string;
  behavioralTags: string[];
  contentAffinities: string[];
  productAffinities: string[];
  riskProfile: string;
  wealthPotential: 'low' | 'medium' | 'high' | 'very_high';
  engagementStrategy: string;
  insights: string[];
  etProductRecommended: string[];
}

const PERSONA_MAP: Record<string, { persona: string; segment: string; productAffinities: string[] }> = {
  'Young Learner': {
    persona: 'The Curious Starter',
    segment: 'Digital Native Learner',
    productAffinities: ['ET Prime Student', 'ET Money Lite', 'SIP Starter', 'Digital Savings Account'],
  },
  'Early Career Starter': {
    persona: 'The Ambitious Beginner',
    segment: 'First Salary Earner',
    productAffinities: ['ET Prime', 'ET Money SIP', 'Term Insurance', 'Digital FD', 'Index Funds'],
  },
  'Young Professional': {
    persona: 'The Growth Seeker',
    segment: 'Urban Wealth Builder',
    productAffinities: ['ET Prime', 'ET Money', 'Equity Mutual Funds', 'Health Insurance', 'NPS'],
  },
  'Life Milestone Builder': {
    persona: 'The Goal-Driven Planner',
    segment: 'Life Stage Transition',
    productAffinities: ['Home Loan', 'ET Money Goals', 'ULIP', 'Children Education Fund', 'Joint Account'],
  },
  'Wealth Accumulator': {
    persona: 'The Strategic Investor',
    segment: 'HNI Aspirant',
    productAffinities: ['ET Prime Markets', 'Direct Equity', 'Portfolio Management', 'Real Estate Funds', 'Tax Harvesting'],
  },
  'Prime Wealth Builder': {
    persona: 'The Seasoned Navigator',
    segment: 'Senior Wealth Manager',
    productAffinities: ['Portfolio Management', 'Debt Funds', 'Senior Citizen FD', 'Estate Planning', 'NPS'],
  },
  'Pre-Retirement Planner': {
    persona: 'The Legacy Builder',
    segment: 'Near-Retirement Planner',
    productAffinities: ['Annuity Plans', 'Debt Funds', 'Senior FD', 'Will Services', 'Medical Insurance'],
  },
};

function deriveWealthPotential(income: string, risk: string): 'low' | 'medium' | 'high' | 'very_high' {
  if (income === 'above_1L') return risk === 'aggressive' ? 'very_high' : 'high';
  if (income === '50k_1L') return 'high';
  if (income === '25k_50k') return 'medium';
  return 'low';
}

function deriveBehavioralTags(profile: Partial<UserProfile>): string[] {
  const tags: string[] = [];
  const goals = profile.financialGoals || [];
  const risk = profile.riskAppetite || 'moderate';
  const income = profile.demographics?.incomeRange || 'under_25k';

  if (risk === 'aggressive') tags.push('risk_taker', 'growth_focused', 'market_savvy');
  else if (risk === 'conservative') tags.push('safety_first', 'debt_lover', 'fd_preferrer');
  else tags.push('balanced', 'sip_friendly', 'hybrid_investor');

  if (goals.includes('wealth_creation')) tags.push('wealth_seeker', 'equity_curious');
  if (goals.includes('emergency_fund')) tags.push('planner', 'liquid_focused');
  if (goals.includes('home_purchase')) tags.push('real_estate_aspirer', 'loan_eligible');
  if (goals.includes('retirement')) tags.push('long_term_thinker', 'pension_aware');
  if (goals.includes('education')) tags.push('future_planner', 'education_focused');
  if (income === 'above_1L' || income === '50k_1L') tags.push('premium_eligible', 'tax_planning_needed');

  return [...new Set(tags)];
}

function deriveContentAffinities(profile: Partial<UserProfile>): string[] {
  const affinities: string[] = ['Market News', 'Economy'];
  const goals = profile.financialGoals || [];
  const occ = profile.demographics?.occupation || '';

  if (goals.includes('wealth_creation')) affinities.push('Mutual Funds', 'Stock Tips', 'SIP Guide');
  if (goals.includes('home_purchase')) affinities.push('Real Estate', 'Home Loan Guide');
  if (goals.includes('retirement')) affinities.push('Retirement Planning', 'NPS Guide', 'Pension');
  if (goals.includes('education')) affinities.push('Education Finance', 'Scholarship News');
  if (occ === 'business_owner') affinities.push('SME Finance', 'GST Updates', 'Business Loans');
  if (occ === 'student') affinities.push('Career Finance', 'First Job Guide', 'Budgeting 101');

  return [...new Set(affinities)];
}

function generateInsights(profile: Partial<UserProfile>): string[] {
  const insights: string[] = [];
  const age = profile.demographics?.age || 25;
  const income = profile.demographics?.incomeRange || 'under_25k';
  const goals = profile.financialGoals || [];
  const risk = profile.riskAppetite || 'moderate';
  const horizon = profile.investmentHorizon || 'medium';

  insights.push(`User is in the ${profile.lifestage || 'early career'} stage with a ${risk} risk appetite.`);

  if (age < 30 && risk !== 'conservative') {
    insights.push('Prime age for equity SIPs — time is the biggest compounding advantage.');
  }
  if (income === 'under_25k' || income === '25k_50k') {
    insights.push('Focus on disciplined savings first; even ₹500/month SIP builds strong habits.');
  }
  if (goals.includes('emergency_fund')) {
    insights.push('Emergency fund is the right first step — target 3–6 months of expenses in liquid funds.');
  }
  if (goals.includes('retirement') && age < 35) {
    insights.push('Starting NPS now at young age can create significant tax-free corpus at retirement.');
  }
  if (horizon === 'long') {
    insights.push('Long investment horizon allows for higher equity allocation for maximum compounding.');
  }

  return insights;
}

function deriveEngagementStrategy(lifestage: string, risk: string): string {
  if (lifestage === 'Young Learner' || lifestage === 'Early Career Starter') {
    return 'Education-first approach: teach basics, celebrate small wins, focus on habit formation.';
  }
  if (risk === 'aggressive') {
    return 'Data-driven premium experience: market analysis, portfolio tracking, alpha generation ideas.';
  }
  if (risk === 'conservative') {
    return 'Trust-building approach: emphasize safety, government schemes, capital protection.';
  }
  return 'Balanced nudge strategy: SIP reminders, goal progress updates, diversification prompts.';
}

export async function runIntelligenceBuilder(
  state: WorkflowState,
  profile: Partial<UserProfile>
): Promise<IntelligenceReport> {
  const startTime = Date.now();

  const lifestage = profile.lifestage || 'Young Professional';
  const personaData = PERSONA_MAP[lifestage] || PERSONA_MAP['Young Professional'];
  const income = profile.demographics?.incomeRange || 'under_25k';
  const risk = profile.riskAppetite || 'moderate';

  const report: IntelligenceReport = {
    persona: personaData.persona,
    segment: personaData.segment,
    lifestage,
    behavioralTags: deriveBehavioralTags(profile),
    contentAffinities: deriveContentAffinities(profile),
    productAffinities: personaData.productAffinities,
    riskProfile: `${risk.charAt(0).toUpperCase() + risk.slice(1)} investor with ${profile.investmentHorizon || 'medium'}-term horizon`,
    wealthPotential: deriveWealthPotential(income, risk),
    engagementStrategy: deriveEngagementStrategy(lifestage, risk),
    insights: generateInsights(profile),
    etProductRecommended: personaData.productAffinities.slice(0, 3),
  };

  db.logAgentDecision({
    sessionId: state.sessionId,
    userId: state.userId,
    agentName: 'IntelligenceBuilder',
    stage: 'intelligence_building',
    input: { lifestage, income, risk },
    output: report as unknown as Record<string, unknown>,
    latencyMs: Date.now() - startTime,
    success: true,
  });

  return report;
}
