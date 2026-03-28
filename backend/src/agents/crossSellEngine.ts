import type { WorkflowState, UserProfile, Recommendation } from '../types/index';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/store';

interface CrossSellOpportunity {
  trigger: string;
  product: string;
  pitch: string;
  relevanceScore: number;
}

function generateCrossSellOpportunities(
  profile: Partial<UserProfile>,
  recommendations: Recommendation[]
): CrossSellOpportunity[] {
  const opportunities: CrossSellOpportunity[] = [];
  const goals = profile.financialGoals || [];
  const risk = profile.riskAppetite || 'moderate';
  const income = profile.demographics?.incomeRange || 'under_25k';
  const age = profile.demographics?.age || 25;
  const lifestage = profile.lifestage || 'Young Professional';

  // Rule-based cross-sell logic
  if (goals.includes('wealth_creation') && risk !== 'conservative') {
    opportunities.push({
      trigger: 'user_has_wealth_creation_goal',
      product: 'ET Prime Markets Subscription',
      pitch: 'Get expert equity research + stock screener to support your wealth creation journey.',
      relevanceScore: 85,
    });
  }

  if (goals.includes('retirement')) {
    opportunities.push({
      trigger: 'retirement_goal_present',
      product: 'NPS Tier-2 Account',
      pitch: 'Open NPS Tier-2 for flexible withdrawals while continuing Tier-1 for tax benefits.',
      relevanceScore: 80,
    });
  }

  if (income === 'above_1L' || income === '50k_1L') {
    opportunities.push({
      trigger: 'high_income_user',
      product: 'ET Wealth Tax Planning Advisory',
      pitch: 'At your income level, smart tax planning via 80C, 80D, NPS can save ₹50,000–₹1,50,000/year.',
      relevanceScore: 90,
    });
  }

  if (goals.includes('home_purchase')) {
    opportunities.push({
      trigger: 'home_purchase_goal',
      product: 'ET Home Loan Comparison Tool',
      pitch: 'Compare 20+ home loan offers — even a 0.25% lower rate saves ₹3–5 lakhs over the loan tenure.',
      relevanceScore: 88,
    });
  }

  if (age < 30 && lifestage !== 'Young Learner') {
    opportunities.push({
      trigger: 'young_user_no_insurance',
      product: 'Term Life Insurance (Super Early Bird Rate)',
      pitch: 'At your age, ₹1 crore term insurance costs just ₹450–₹600/month — rates double after 35.',
      relevanceScore: 82,
    });
  }

  if (goals.includes('education')) {
    opportunities.push({
      trigger: 'education_goal',
      product: 'Education Loan Pre-Approval Check',
      pitch: 'Check your education loan eligibility instantly — know your limit before you need it.',
      relevanceScore: 75,
    });
  }

  if (recommendations.some(r => r.type === 'fund')) {
    opportunities.push({
      trigger: 'fund_recommendations_present',
      product: 'ET Money Smart Deposit',
      pitch: 'Park idle savings in ET Money Smart Deposit — up to 8.75% FD rates from top NBFCs.',
      relevanceScore: 70,
    });
  }

  return opportunities.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 3);
}

export async function runCrossSellEngine(
  state: WorkflowState,
  profile: Partial<UserProfile>,
  recommendations: Recommendation[]
): Promise<CrossSellOpportunity[]> {
  const startTime = Date.now();

  const opportunities = generateCrossSellOpportunities(profile, recommendations);

  // Add cross-sell as extra recommendations
  const now = new Date().toISOString();
  const crossSellRecs: Recommendation[] = opportunities.map(opp => ({
    id: uuidv4(),
    userId: state.userId,
    type: 'service' as Recommendation['type'],
    title: opp.product,
    description: opp.pitch,
    reason: `Cross-sell opportunity: ${opp.trigger.replace(/_/g, ' ')}`,
    category: 'ET Cross-Sell',
    priority: Math.round(opp.relevanceScore / 10),
    ctaText: 'Explore Now',
    tags: ['cross_sell', opp.trigger],
    createdAt: now,
  }));

  db.addRecommendations(state.userId, crossSellRecs);

  db.logAgentDecision({
    sessionId: state.sessionId,
    userId: state.userId,
    agentName: 'CrossSellEngine',
    stage: 'cross_sell',
    input: { goalsCount: (profile.financialGoals || []).length, income: profile.demographics?.incomeRange },
    output: { opportunitiesFound: opportunities.length },
    latencyMs: Date.now() - startTime,
    success: true,
  });

  return opportunities;
}
