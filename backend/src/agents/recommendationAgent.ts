import { v4 as uuidv4 } from 'uuid';
import type { WorkflowState, UserProfile, Recommendation } from '../types/index';
import type { IntelligenceReport } from './intelligenceBuilder';
import db from '../database/store';

// ─── ET-ecosystem content catalogue ─────────────────────────────────────────

interface RecommTemplate {
  type: Recommendation['type'];
  title: string;
  description: string;
  reason: string;
  category: string;
  ctaText: string;
  ctaUrl: string;
  tags: string[];
  forGoals?: string[];
  forRisk?: Array<'conservative' | 'moderate' | 'aggressive'>;
  forLifestage?: string[];
  priority: number;
}

const CATALOGUE: RecommTemplate[] = [
  // ── Mutual Funds ──
  {
    type: 'fund',
    title: 'Mirae Asset Large Cap Fund — SIP Start',
    description: 'One of India\'s most consistent large-cap funds. Start with just ₹500/month via SIP.',
    reason: 'Ideal for long-term wealth creation with lower volatility.',
    category: 'Mutual Funds',
    ctaText: 'Start SIP on ET Money',
    ctaUrl: 'https://www.etmoney.com/mutual-funds/mirae-asset-large-cap-fund/16190',
    tags: ['sip', 'large_cap', 'equity', 'beginner'],
    forGoals: ['wealth_creation', 'retirement'],
    forRisk: ['moderate', 'aggressive'],
    priority: 90,
  },
  {
    type: 'fund',
    title: 'Parag Parikh Flexi Cap Fund',
    description: 'A globally diversified flexi-cap fund with strong track record across market cycles.',
    reason: 'Great diversification combining Indian + international equity exposure.',
    category: 'Mutual Funds',
    ctaText: 'Invest via ET Money',
    ctaUrl: 'https://www.etmoney.com/mutual-funds/parag-parikh-flexi-cap-fund/21028',
    tags: ['flexi_cap', 'global', 'equity', 'diversified'],
    forGoals: ['wealth_creation'],
    forRisk: ['moderate', 'aggressive'],
    priority: 85,
  },
  {
    type: 'fund',
    title: 'SBI Liquid Fund — Emergency Corpus',
    description: 'Park your emergency fund in a safe liquid fund earning ~7% vs 3.5% in savings account.',
    reason: 'Better returns than savings account with same-day redemption flexibility.',
    category: 'Liquid Funds',
    ctaText: 'Park Emergency Fund',
    ctaUrl: 'https://www.etmoney.com/mutual-funds/liquid-funds',
    tags: ['liquid', 'emergency', 'safe', 'short_term'],
    forGoals: ['emergency_fund'],
    priority: 95,
  },
  {
    type: 'fund',
    title: 'HDFC Index Fund — Nifty 50',
    description: 'Low-cost passive investing tracking India\'s top 50 companies. Expense ratio: 0.2%.',
    reason: 'Most cost-efficient way to participate in India\'s growth story.',
    category: 'Index Funds',
    ctaText: 'Invest in Index Fund',
    ctaUrl: 'https://www.etmoney.com/mutual-funds/index-funds',
    tags: ['index', 'passive', 'nifty50', 'low_cost'],
    forGoals: ['wealth_creation', 'retirement'],
    forRisk: ['moderate', 'aggressive'],
    priority: 88,
  },
  {
    type: 'fund',
    title: 'Axis Small Cap Fund',
    description: 'High-growth potential small-cap fund for aggressive investors with 5+ year horizon.',
    reason: 'Small-caps historically deliver superior long-term returns for patient investors.',
    category: 'Mutual Funds',
    ctaText: 'Explore Small Cap SIP',
    ctaUrl: 'https://www.etmoney.com/mutual-funds/small-cap-funds',
    tags: ['small_cap', 'high_growth', 'aggressive', 'long_term'],
    forGoals: ['wealth_creation'],
    forRisk: ['aggressive'],
    priority: 75,
  },

  // ── Insurance ──
  {
    type: 'insurance',
    title: 'Term Life Insurance — HDFC Click2Protect',
    description: 'Pure term cover of ₹1 crore at just ₹600/month. Secure your family\'s future.',
    reason: 'Term insurance is the most essential financial protection — especially if you have dependents.',
    category: 'Life Insurance',
    ctaText: 'Get Free Quote',
    ctaUrl: 'https://www.etmoney.com/insurance/term-insurance',
    tags: ['term', 'life_insurance', 'protection', 'family'],
    forLifestage: ['Young Professional', 'Life Milestone Builder', 'Wealth Accumulator'],
    priority: 92,
  },
  {
    type: 'insurance',
    title: 'Star Health Insurance — Family Floater',
    description: 'Comprehensive health cover for your entire family at one premium.',
    reason: 'Medical inflation is 14%/year in India — health insurance is non-negotiable.',
    category: 'Health Insurance',
    ctaText: 'Compare & Buy on ET',
    ctaUrl: 'https://www.etmoney.com/insurance/health-insurance',
    tags: ['health', 'insurance', 'family', 'medical'],
    priority: 91,
  },
  {
    type: 'insurance',
    title: 'Accident & Disability Cover',
    description: 'Personal accident insurance covering disability and hospitalization from ₹15/day.',
    reason: 'Affordable cover often overlooked but critical for salaried professionals.',
    category: 'Personal Accident',
    ctaText: 'Get Covered Now',
    ctaUrl: 'https://www.etmoney.com/insurance',
    tags: ['accident', 'disability', 'protection', 'affordable'],
    forLifestage: ['Early Career Starter', 'Young Professional'],
    priority: 70,
  },

  // ── Articles / Content ──
  {
    type: 'article',
    title: 'The 50-30-20 Rule for Beginners — ET Money Guide',
    description: 'Master the foundational budgeting rule that every Indian millennial should know.',
    reason: 'Building a budget is the foundation of all wealth creation.',
    category: 'Personal Finance',
    ctaText: 'Read on ET Wealth',
    ctaUrl: 'https://economictimes.indiatimes.com/wealth/personal-finance-news',
    tags: ['budgeting', 'beginner', 'guide', 'financial_literacy'],
    forLifestage: ['Young Learner', 'Early Career Starter'],
    priority: 80,
  },
  {
    type: 'article',
    title: 'How to Build a ₹1 Crore Corpus by 40 — Step-by-Step',
    description: 'A practical roadmap showing exactly how much to invest, where, and for how long.',
    reason: 'Clear goal-based planning makes wealth creation feel achievable and structured.',
    category: 'Wealth Building',
    ctaText: 'Read the Roadmap',
    ctaUrl: 'https://economictimes.indiatimes.com/wealth/invest',
    tags: ['wealth', 'goal', 'planning', '1_crore'],
    forGoals: ['wealth_creation'],
    forRisk: ['moderate', 'aggressive'],
    priority: 82,
  },
  {
    type: 'article',
    title: 'NPS vs PPF vs EPF — Which is Best for Retirement?',
    description: 'An objective comparison of India\'s top retirement savings instruments.',
    reason: 'Choosing the right retirement vehicle can mean lakhs of difference in your corpus.',
    category: 'Retirement',
    ctaText: 'Read Comparison',
    ctaUrl: 'https://economictimes.indiatimes.com/wealth/plan',
    tags: ['nps', 'ppf', 'epf', 'retirement', 'comparison'],
    forGoals: ['retirement'],
    priority: 88,
  },
  {
    type: 'article',
    title: 'First Home Buyer\'s Complete Checklist — 2024',
    description: 'Everything from down payment to legal checks to tax benefits on home loans.',
    reason: 'Buying a home is complex — this guide prevents costly mistakes.',
    category: 'Real Estate',
    ctaText: 'Read Checklist',
    ctaUrl: 'https://economictimes.indiatimes.com/wealth/real-estate',
    tags: ['home', 'real_estate', 'first_buyer', 'checklist'],
    forGoals: ['home_purchase'],
    priority: 87,
  },

  // ── ET Products / Services ──
  {
    type: 'product',
    title: 'ET Prime Membership — ₹999/year',
    description: 'Unlimited access to premium ET news, market analysis, expert columns, and research.',
    reason: 'Staying informed is the highest-ROI investment a retail investor can make.',
    category: 'ET Products',
    ctaText: 'Start Free Trial',
    ctaUrl: 'https://economictimes.indiatimes.com/prime',
    tags: ['et_prime', 'news', 'premium', 'subscription'],
    priority: 78,
  },
  {
    type: 'product',
    title: 'ET Money — Direct Mutual Funds (0% Commission)',
    description: 'Invest in 1000+ direct mutual funds with zero commission. Track all investments in one place.',
    reason: 'Direct funds save ~1–1.5% annually vs regular funds — compounding this is huge over time.',
    category: 'Investment Platform',
    ctaText: 'Open ET Money',
    ctaUrl: 'https://www.etmoney.com/mutual-funds',
    tags: ['et_money', 'direct_funds', 'zero_commission', 'tracking'],
    forGoals: ['wealth_creation', 'retirement'],
    priority: 93,
  },
  {
    type: 'service',
    title: 'NPS — National Pension System via ET Money',
    description: 'Start your NPS account and get extra ₹50,000 tax deduction under Section 80CCD(1B).',
    reason: 'Additional ₹15,000–₹22,000 annual tax savings depending on your tax bracket.',
    category: 'Retirement',
    ctaText: 'Open NPS Account',
    ctaUrl: 'https://www.etmoney.com/nps',
    tags: ['nps', 'pension', 'tax_saving', 'retirement'],
    forGoals: ['retirement'],
    priority: 86,
  },

  // ── Events ──
  {
    type: 'event',
    title: 'ET Markets — Free Weekly Webinar: Market Outlook',
    description: 'Every Sunday 11AM — ET analysts discuss market trends, sector picks, and investor Q&A.',
    reason: 'Regular market exposure builds investor confidence and decision-making skills.',
    category: 'Events',
    ctaText: 'Visit ET Markets',
    ctaUrl: 'https://economictimes.indiatimes.com/markets',
    tags: ['webinar', 'market', 'free', 'learning'],
    forRisk: ['moderate', 'aggressive'],
    priority: 65,
  },
  {
    type: 'event',
    title: 'ET Money Festival of Investments 2024',
    description: 'India\'s biggest personal finance event — sessions on SIP, stocks, real estate & more.',
    reason: 'Network with experts and get personalized portfolio review.',
    category: 'Events',
    ctaText: 'Explore ET Events',
    ctaUrl: 'https://economictimes.indiatimes.com/events',
    tags: ['event', 'festival', 'networking', 'learning'],
    priority: 60,
  },
];

function scoreRecommendation(
  item: RecommTemplate,
  profile: Partial<UserProfile>,
  intel: Record<string, unknown>
): number {
  let score = item.priority;
  const goals = profile.financialGoals || [];
  const risk = profile.riskAppetite || 'moderate';
  const lifestage = profile.lifestage || 'Young Professional';

  // Goal match boost
  if (item.forGoals && item.forGoals.some(g => goals.includes(g))) score += 20;
  // Risk match boost
  if (item.forRisk && item.forRisk.includes(risk as 'conservative' | 'moderate' | 'aggressive')) score += 15;
  // Lifestage match boost
  if (item.forLifestage && item.forLifestage.includes(lifestage)) score += 10;

  // Penalty for mismatch
  if (item.forRisk && !item.forRisk.includes(risk as 'conservative' | 'moderate' | 'aggressive')) score -= 20;

  return score;
}

export async function runRecommendationAgent(
  state: WorkflowState,
  profile: Partial<UserProfile>,
  intelligence: Record<string, unknown>
): Promise<Recommendation[]> {
  const startTime = Date.now();

  // Score and rank all catalogue items
  const scored = CATALOGUE.map(item => ({
    item,
    score: scoreRecommendation(item, profile, intelligence),
  })).sort((a, b) => b.score - a.score);

  // Take top 10 unique-category recommendations
  const selected: RecommTemplate[] = [];
  const usedCategories = new Set<string>();
  for (const { item } of scored) {
    if (selected.length >= 10) break;
    if (!usedCategories.has(item.type + item.category)) {
      selected.push(item);
      usedCategories.add(item.type + item.category);
    }
  }

  // Build Recommendation objects
  const now = new Date().toISOString();
  const recommendations: Recommendation[] = selected.map((item, idx) => ({
    id: uuidv4(),
    userId: state.userId,
    type: item.type,
    title: item.title,
    description: item.description,
    reason: item.reason,
    category: item.category,
    priority: 10 - idx,
    ctaText: item.ctaText,
    ctaUrl: item.ctaUrl,
    tags: item.tags,
    createdAt: now,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }));

  db.addRecommendations(state.userId, recommendations);

  db.logAgentDecision({
    sessionId: state.sessionId,
    userId: state.userId,
    agentName: 'RecommendationAgent',
    stage: 'recommendation',
    input: { goalsCount: (profile.financialGoals || []).length, risk: profile.riskAppetite },
    output: { recommendationsGenerated: recommendations.length },
    latencyMs: Date.now() - startTime,
    success: true,
  });

  return recommendations;
}
