import { v4 as uuidv4 } from 'uuid';
import type { WorkflowState, UserProfile, FinancialGoal } from '../types/index';
import db from '../database/store';

// ─── Goal templates keyed by goal name ──────────────────────────────────────

interface GoalTemplate {
  title: string;
  description: string;
  category: FinancialGoal['category'];
  targetMultiplier: number; // months of income
  milestones: string[];
  suggestedProducts: string[];
  years: number; // default horizon
}

const GOAL_TEMPLATES: Record<string, GoalTemplate> = {
  emergency_fund: {
    title: 'Emergency Fund — 6 Months Cover',
    description: 'Build a liquid safety net covering 6 months of living expenses in a high-interest savings or liquid fund.',
    category: 'emergency',
    targetMultiplier: 6,
    years: 1,
    milestones: [
      'Calculate your monthly expenses',
      'Open a high-interest savings or liquid fund account',
      'Set up auto-debit of ₹2,000–₹5,000/month',
      'Reach 1-month expense target',
      'Reach 3-month expense target',
      'Complete 6-month emergency corpus',
    ],
    suggestedProducts: ['SBI Liquid Fund', 'Paytm Money Liquid', 'High-interest Savings Account'],
  },
  wealth_creation: {
    title: 'Wealth Creation via SIP — ₹1 Crore Goal',
    description: 'Systematically invest via SIPs in equity mutual funds to build a ₹1 crore+ corpus.',
    category: 'wealth',
    targetMultiplier: 0,
    years: 10,
    milestones: [
      'Start first SIP of ₹500–₹2,000/month',
      'Increase SIP by 10% each year (step-up)',
      'Diversify across large-cap, mid-cap, flexi-cap',
      'Review portfolio every 6 months',
      'Reach ₹1 lakh corpus milestone',
      'Reach ₹10 lakh corpus milestone',
    ],
    suggestedProducts: ['ET Money Direct Funds', 'Mirae Asset Large Cap', 'Parag Parikh Flexi Cap', 'HDFC Index Fund Nifty 50'],
  },
  retirement: {
    title: 'Retirement Planning — Secure Your Future',
    description: 'Build a retirement corpus through NPS, PPF, and equity funds to sustain your lifestyle post-retirement.',
    category: 'retirement',
    targetMultiplier: 0,
    years: 25,
    milestones: [
      'Open NPS account for ₹50,000 extra tax deduction',
      'Maximize EPF contributions if salaried',
      'Start PPF account for guaranteed 7.1% returns',
      'Allocate 20% of savings to equity for growth',
      'Review retirement plan at every salary hike',
      'Increase NPS contribution after age 40',
    ],
    suggestedProducts: ['NPS via ET Money', 'PPF Account', 'HDFC Retirement Fund', 'SBI Retirement Benefit Fund'],
  },
  home_purchase: {
    title: 'Home Down Payment Fund',
    description: 'Save for 20% down payment on your dream home and build CIBIL score for best loan rates.',
    category: 'home',
    targetMultiplier: 0,
    years: 5,
    milestones: [
      'Determine target property budget',
      'Calculate 20% down payment target',
      'Open dedicated savings account / RD',
      'Check and improve CIBIL score above 750',
      'Research home loan eligibility',
      'Reach 50% of down payment goal',
    ],
    suggestedProducts: ['ET Money Home Loan Comparison', 'Bank RD', 'HDFC Home Loan', 'SBI MaxGain Home Loan'],
  },
  education: {
    title: 'Education Fund — Invest in Knowledge',
    description: 'Systematically save for higher education (yours or your child\'s) through a dedicated fund.',
    category: 'education',
    targetMultiplier: 0,
    years: 5,
    milestones: [
      'Define education goal — course, college, year',
      'Estimate total cost including inflation',
      'Start a dedicated education mutual fund SIP',
      'Explore scholarship options alongside savings',
      'Review corpus annually',
      'Apply for education loan if needed for top-up',
    ],
    suggestedProducts: ['Axis Long Term Equity Fund', 'Education Loan via ET', 'Sukanya Samriddhi (for daughter)'],
  },
  travel: {
    title: 'Dream Travel Fund',
    description: 'Save systematically for your dream vacation without dipping into emergency funds.',
    category: 'travel',
    targetMultiplier: 0,
    years: 2,
    milestones: [
      'Set travel destination and estimated budget',
      'Open dedicated RD or short-term debt fund',
      'Book early for flight discounts',
      'Reach 50% of travel budget',
      'Complete full travel corpus',
    ],
    suggestedProducts: ['Ultra Short Term Debt Fund', 'RD', 'Travel Credit Card with rewards'],
  },
  vehicle_purchase: {
    title: 'Vehicle Purchase Fund',
    description: 'Save for down payment and avoid high-interest vehicle loans.',
    category: 'other',
    targetMultiplier: 0,
    years: 2,
    milestones: [
      'Fix target vehicle and on-road price',
      'Calculate 30% down payment goal',
      'Start recurring deposit or short-term fund',
      'Compare vehicle loan rates if needed',
      'Reach down payment target',
    ],
    suggestedProducts: ['RD', 'Ultra Short Term Fund', 'SBI Car Loan', 'HDFC Auto Loan'],
  },
  wedding: {
    title: 'Wedding Fund',
    description: 'Plan and save for your wedding without taking on unnecessary debt.',
    category: 'other',
    targetMultiplier: 0,
    years: 3,
    milestones: [
      'Estimate wedding budget with all expenses',
      'Break into monthly savings target',
      'Start dedicated FD or balanced fund',
      'Reach 25% of wedding fund',
      'Reach 75% of wedding fund',
      'Complete wedding corpus',
    ],
    suggestedProducts: ['FD Laddering', 'Conservative Hybrid Fund', 'Gold ETF (5–10% hedge)'],
  },
};

function calculateTarget(template: GoalTemplate, income: string): number {
  if (template.targetMultiplier > 0) {
    const monthlyIncome: Record<string, number> = {
      under_25k: 20000, '25k_50k': 37500, '50k_1L': 75000, above_1L: 150000,
    };
    return (monthlyIncome[income] || 25000) * template.targetMultiplier;
  }
  // Fixed targets by goal
  const fixedTargets: Record<string, number> = {
    wealth_creation: 10000000,
    retirement: 20000000,
    home_purchase: 2000000,
    education: 1500000,
    travel: 150000,
    vehicle_purchase: 300000,
    wedding: 500000,
  };
  return fixedTargets[template.category] || 500000;
}

export async function runFinancialNavigator(
  state: WorkflowState,
  profile: Partial<UserProfile>
): Promise<FinancialGoal[]> {
  const startTime = Date.now();
  const goals: FinancialGoal[] = [];
  const userGoals = profile.financialGoals || ['wealth_creation'];
  const income = profile.demographics?.incomeRange || 'under_25k';
  const now = new Date().toISOString();

  for (const goalKey of userGoals.slice(0, 3)) {
    const template = GOAL_TEMPLATES[goalKey];
    if (!template) continue;

    const targetAmount = calculateTarget(template, income);
    const targetDate = new Date(Date.now() + template.years * 365 * 24 * 60 * 60 * 1000).toISOString();

    const goal: FinancialGoal = {
      id: uuidv4(),
      userId: state.userId,
      title: template.title,
      description: template.description,
      targetAmount,
      currentAmount: 0,
      targetDate,
      category: template.category,
      status: 'not_started',
      progress: 0,
      milestones: template.milestones.map((m, i) => ({ title: m, completed: i === 0 ? false : false })),
      suggestedProducts: template.suggestedProducts,
    };
    goals.push(goal);
  }

  // Always add emergency fund if not already present and not a student
  const occupation = profile.demographics?.occupation || '';
  if (!userGoals.includes('emergency_fund') && occupation !== 'student' && goals.length < 3) {
    const t = GOAL_TEMPLATES['emergency_fund'];
    goals.push({
      id: uuidv4(),
      userId: state.userId,
      title: t.title,
      description: t.description,
      targetAmount: calculateTarget(t, income),
      currentAmount: 0,
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      category: t.category,
      status: 'not_started',
      progress: 0,
      milestones: t.milestones.map(m => ({ title: m, completed: false })),
      suggestedProducts: t.suggestedProducts,
    });
  }

  db.addGoals(state.userId, goals);

  db.logAgentDecision({
    sessionId: state.sessionId,
    userId: state.userId,
    agentName: 'FinancialNavigator',
    stage: 'financial_navigation',
    input: { userGoals, income },
    output: { goalsCreated: goals.length },
    latencyMs: Date.now() - startTime,
    success: true,
  });

  return goals;
}
