import type { WorkflowState, UserProfile, ETService } from '../types/index';
import db from '../database/store';

// ─── ET Ecosystem Services Catalogue ─────────────────────────────────────────

const ET_SERVICES: ETService[] = [
  {
    id: 'etm-sip-001',
    name: 'ET Money — SIP Investment Platform',
    category: 'mutual_funds',
    description: 'Invest in 1000+ direct mutual funds with zero commission. Track all investments in one dashboard.',
    features: ['Zero commission', 'Direct plans only', 'SIP auto-debit', 'Tax-loss harvesting', '1-click redemption'],
    provider: 'ET Money',
    rating: 4.7,
    minInvestment: 500,
    returns: '12–18% p.a. (equity, 5yr avg)',
    tags: ['mutual_funds', 'sip', 'direct', 'zero_commission'],
    matchScore: 0,
  },
  {
    id: 'etm-insurance-001',
    name: 'ET Money Insurance Marketplace',
    category: 'insurance',
    description: 'Compare and buy term, health, and life insurance from 20+ top insurers in minutes.',
    features: ['Side-by-side comparison', 'Instant quotes', 'Claim assistance', 'Digital policy', 'No agent commission'],
    provider: 'ET Money',
    rating: 4.5,
    tags: ['insurance', 'term', 'health', 'comparison'],
    matchScore: 0,
  },
  {
    id: 'et-homeloan-001',
    name: 'ET Home Loan Comparison',
    category: 'loans',
    description: 'Compare home loan rates from 25+ banks and NBFCs. Get instant eligibility check.',
    features: ['Compare 25+ lenders', 'Instant eligibility', 'EMI calculator', 'CIBIL check', 'Door-step documentation'],
    provider: 'Economic Times',
    rating: 4.3,
    tags: ['home_loan', 'property', 'loan', 'comparison'],
    matchScore: 0,
  },
  {
    id: 'et-demat-001',
    name: 'ET Markets — Demat & Trading Account',
    category: 'demat',
    description: 'Open a demat account with zero AMC for the first year. Trade stocks, ETFs, and derivatives.',
    features: ['Zero AMC 1st year', 'Advanced charting', 'Research reports', 'Portfolio analytics', 'Mobile trading'],
    provider: 'ET Markets',
    rating: 4.4,
    tags: ['demat', 'trading', 'stocks', 'equity'],
    matchScore: 0,
  },
  {
    id: 'et-nps-001',
    name: 'NPS Account — ET Money',
    category: 'nps',
    description: 'Open NPS Tier-1 and get ₹50,000 extra tax deduction (Section 80CCD). Low-cost pension fund.',
    features: ['₹50K extra 80CCD(1B) deduction', 'Low fund management charges', 'E/G/C asset allocation', 'Auto rebalancing'],
    provider: 'ET Money',
    rating: 4.6,
    minInvestment: 500,
    returns: '10–12% p.a. (equity tier, 10yr avg)',
    tags: ['nps', 'pension', 'tax_saving', 'retirement'],
    matchScore: 0,
  },
  {
    id: 'et-fd-001',
    name: 'ET Money Smart Deposit (FD)',
    category: 'fd',
    description: 'Book FDs with up to 8.75% interest from top-rated NBFCs directly from ET Money.',
    features: ['Up to 8.75% interest', 'NBFC rated AA+', 'Auto-renew option', 'Premature withdrawal', 'Senior citizen rate +0.25%'],
    provider: 'ET Money',
    rating: 4.5,
    minInvestment: 10000,
    returns: '7.5–8.75% p.a.',
    tags: ['fd', 'fixed_deposit', 'safe', 'nbfc'],
    matchScore: 0,
  },
  {
    id: 'et-creditcard-001',
    name: 'ET Money Credit Card Marketplace',
    category: 'credit_card',
    description: 'Find the best credit card for your spending pattern — cashback, travel, fuel, or rewards.',
    features: ['50+ cards compared', 'Spending-based match', 'Instant approval check', 'Annual fee comparison', 'Hidden fee alert'],
    provider: 'Economic Times',
    rating: 4.2,
    tags: ['credit_card', 'cashback', 'rewards', 'travel'],
    matchScore: 0,
  },
  {
    id: 'et-stocks-001',
    name: 'ET Markets Stocks — Research & Screener',
    category: 'stocks',
    description: 'Advanced stock screener with 200+ filters, analyst ratings, and portfolio tracking.',
    features: ['200+ filter screener', 'Analyst ratings', 'PE/PB alerts', 'Portfolio P&L', 'F&O data'],
    provider: 'ET Markets',
    rating: 4.6,
    tags: ['stocks', 'screener', 'research', 'equity'],
    matchScore: 0,
  },
];

// ─── Scoring logic ────────────────────────────────────────────────────────────

function scoreService(service: ETService, profile: Partial<UserProfile>): number {
  let score = 50; // base score
  const goals = profile.financialGoals || [];
  const risk = profile.riskAppetite || 'moderate';
  const income = profile.demographics?.incomeRange || 'under_25k';
  const age = profile.demographics?.age || 25;

  // Goal-based scoring
  if (goals.includes('wealth_creation') && ['mutual_funds', 'demat', 'stocks'].includes(service.category)) score += 30;
  if (goals.includes('retirement') && service.category === 'nps') score += 40;
  if (goals.includes('emergency_fund') && service.category === 'fd') score += 35;
  if (goals.includes('home_purchase') && service.category === 'loans') score += 40;
  if (goals.includes('wealth_creation') && service.category === 'mutual_funds') score += 25;

  // Risk-based scoring
  if (risk === 'aggressive' && ['demat', 'stocks', 'mutual_funds'].includes(service.category)) score += 20;
  if (risk === 'conservative' && ['fd', 'nps'].includes(service.category)) score += 25;
  if (risk === 'moderate' && ['mutual_funds', 'nps'].includes(service.category)) score += 15;

  // Income-based scoring
  if (income === 'above_1L' || income === '50k_1L') {
    if (service.category === 'nps') score += 20; // tax planning
    if (service.category === 'credit_card') score += 10;
  }

  // Age-based scoring
  if (age < 30 && service.category === 'insurance') score += 15;
  if (age > 45 && service.category === 'nps') score += 20;

  return Math.min(score, 100);
}

export async function runMarketplaceAgent(
  state: WorkflowState,
  profile: Partial<UserProfile>
): Promise<ETService[]> {
  const startTime = Date.now();

  const scored = ET_SERVICES.map(service => ({
    ...service,
    matchScore: scoreService(service, profile),
  })).sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));

  // Return top 6 matched services
  const topServices = scored.slice(0, 6);

  db.logAgentDecision({
    sessionId: state.sessionId,
    userId: state.userId,
    agentName: 'MarketplaceAgent',
    stage: 'marketplace',
    input: { goals: profile.financialGoals, risk: profile.riskAppetite },
    output: { servicesMatched: topServices.length, topService: topServices[0]?.name },
    latencyMs: Date.now() - startTime,
    success: true,
  });

  return topServices;
}
