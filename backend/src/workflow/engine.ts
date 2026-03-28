import { v4 as uuidv4 } from 'uuid';
import type { WorkflowState, WorkflowStage, UserProfile } from '../types/index';
import db from '../database/store';
import { runProfilingAgent } from '../agents/profilingAgent';
import { runIntelligenceBuilder } from '../agents/intelligenceBuilder';
import { runRecommendationAgent } from '../agents/recommendationAgent';
import { runFinancialNavigator } from '../agents/financialNavigator';
import { runCrossSellEngine } from '../agents/crossSellEngine';
import { runMarketplaceAgent } from '../agents/marketplaceAgent';
import { runFeedbackLearningAgent } from '../agents/feedbackAgent';
import { Server as SocketServer } from 'socket.io';

const MAX_RETRY = 3;

function emitWorkflowUpdate(io: SocketServer | null, userId: string, data: Record<string, unknown>) {
  if (io) {
    io.to(`user:${userId}`).emit('workflow_update', data);
  }
}

export function initWorkflowState(sessionId: string, userId: string): WorkflowState {
  const state: WorkflowState = {
    sessionId,
    userId,
    currentStage: 'welcome',
    profile: {},
    extractedData: {},
    recommendations: [],
    goals: [],
    retryCount: 0,
    completedStages: [],
  };
  db.setWorkflowState(state);
  return state;
}

// ─── Rule-based concierge chat (post-profiling) ──────────────────────────────

function buildConciergeReply(
  userMessage: string,
  profile: Partial<UserProfile> | null,
  userName: string
): string {
  const msg = userMessage.toLowerCase();
  const name = userName || 'there';
  const goals = profile?.financialGoals || [];
  const risk = profile?.riskAppetite || 'moderate';

  // Greetings
  if (/\b(hi|hello|hey|namaste|good morning|good evening)\b/.test(msg)) {
    return `Hello, ${name}! 👋 Your personalized dashboard is all set. You can check your recommendations, financial goals, and matched services. What would you like to explore today?`;
  }

  // SIP / mutual fund questions
  if (/\b(sip|mutual fund|invest|equity|fund)\b/.test(msg)) {
    const sipAmt = profile?.demographics?.incomeRange === 'under_25k' ? '₹500–₹1,000' :
      profile?.demographics?.incomeRange === '25k_50k' ? '₹2,000–₹5,000' : '₹5,000–₹10,000';
    return `Great question, ${name}! Given your ${risk} risk profile, a good starting SIP amount would be **${sipAmt}/month**. I'd recommend starting with a large-cap or index fund (like HDFC Nifty 50 or Mirae Asset Large Cap) before diversifying. Would you like to see your fund recommendations on the dashboard?`;
  }

  // Insurance questions
  if (/\b(insurance|term|health|cover|protect)\b/.test(msg)) {
    return `Insurance is the foundation of any financial plan, ${name}. At minimum, you need:\n1. **Term Life**: ₹1 crore cover costs ~₹500–₹700/month at your age — don't delay!\n2. **Health Insurance**: Medical inflation is 14%/year; a family floater of ₹5–10 lakh is a must.\n\nCheck your Insurance recommendations in the Services tab!`;
  }

  // Tax questions
  if (/\b(tax|80c|deduction|save tax|income tax|itr)\b/.test(msg)) {
    return `Smart thinking on tax planning! Here are your top deductions:\n• **80C** — ₹1.5L: ELSS funds, PPF, EPF, LIC\n• **80D** — ₹25,000: Health insurance premium\n• **80CCD(1B)** — ₹50,000: NPS (extra, over 80C)\n\nThese can save ₹30,000–₹80,000 in taxes annually depending on your slab. Want me to walk you through your specific situation?`;
  }

  // Emergency fund
  if (/\b(emergency|safety|liquid|savings)\b/.test(msg)) {
    return `Your emergency fund is your financial shock absorber! Target **3–6 months of expenses** in a liquid fund (not a savings account — liquid funds earn ~7% vs 3.5%).\n\nRecommended option: **SBI Liquid Fund** — same-day withdrawal, no exit load after 7 days, no risk.`;
  }

  // FD / fixed deposit
  if (/\b(fd|fixed deposit|recurring|rd)\b/.test(msg)) {
    return `For safe, guaranteed returns:\n• **FD**: Up to **8.75%** via ET Money Smart Deposit (NBFC, AA+ rated)\n• **RD**: Great for disciplined monthly saving goals\n• **Senior Citizen FD**: 0.25% extra if applicable\n\nFDs are perfect for your short-term goals (1–3 years). Check the Marketplace tab for options!`;
  }

  // NPS / retirement
  if (/\b(nps|ppf|retirement|pension|epf)\b/.test(msg)) {
    return `Excellent long-term thinking! For retirement:\n• **NPS** — Best for additional ₹50,000 tax deduction + market-linked returns (~11%)\n• **PPF** — Safest, guaranteed 7.1%, 15-year lock-in but EEE tax-free\n• **EPF** — Mandatory for salaried; maximize VPF if possible\n\nIdeal mix: NPS (growth) + PPF (safety) + Equity SIP (wealth). Your retirement goal is in your Journey Map!`;
  }

  // Home loan / property
  if (/\b(home|house|flat|property|loan|emi)\b/.test(msg)) {
    return `Buying a home is one of the biggest decisions, ${name}! Key steps:\n1. **Build CIBIL score** above 750 for the best rates\n2. **Save 20% down payment** to avoid higher EMIs\n3. **Compare rates** across lenders — even 0.25% matters over 20 years\n\nET's Home Loan Comparison tool can show you live rates from 25+ lenders. Check Services tab!`;
  }

  // Stock market
  if (/\b(stock|share|nifty|sensex|market|trading|demat)\b/.test(msg)) {
    if (risk === 'conservative') {
      return `Given your conservative risk profile, I'd suggest limiting direct stocks to max 10–15% of your portfolio. Instead, **index funds** give you market exposure with lower risk. If you'd like to explore, ET Markets' screener can help you find quality large-caps.`;
    }
    return `For direct equity investing, ${name}:\n• Start with **Nifty 50 index ETF** as your core (60–70%)\n• Add quality large-caps in sectors you understand\n• Use ET Markets' screener for **PE < 25, ROE > 15%** filters\n• Never put more than 5% in a single stock initially`;
  }

  // Goal / dashboard questions
  if (/\b(goal|dashboard|plan|journey|recommendation)\b/.test(msg)) {
    const goalText = goals.length > 0 ? `your goals (${goals.join(', ')})` : 'your financial goals';
    return `Your personalized dashboard has everything set up for ${goalText}! Head to:\n• **Dashboard** — Your recommendations and insights\n• **Journey Map** — Step-by-step roadmap for each goal\n• **Marketplace** — Best-matched ET services\n\nIs there a specific goal you'd like to dive into?`;
  }

  // Help / what can you do
  if (/\b(help|what can|how|guide|explain)\b/.test(msg)) {
    return `I'm DhanSetu, your AI financial concierge! Here's what I can help with:\n\n💰 **Investing** — SIP, mutual funds, direct equity\n🏦 **Saving** — FDs, liquid funds, recurring deposits\n🛡️ **Insurance** — Term life, health, accident cover\n🏠 **Goals** — Home, education, retirement planning\n📊 **Tax** — 80C, 80D, NPS deductions\n\nJust ask me anything, ${name}!`;
  }

  // Fallback — personalized generic
  if (goals.length > 0) {
    const primaryGoal = goals[0].replace(/_/g, ' ');
    return `That's a great point, ${name}! Based on your profile, your primary focus is **${primaryGoal}**. I've set up personalized recommendations and a step-by-step roadmap for this goal in your dashboard. Is there a specific aspect you'd like to explore?`;
  }

  return `Thanks for that, ${name}! I'm here to help with any financial questions — investing, saving, insurance, tax, or goal planning. What would you like to know?`;
}

export async function processUserMessage(
  sessionId: string,
  userId: string,
  userMessage: string,
  io: SocketServer | null = null
): Promise<{ response: string; stage: WorkflowStage; agentName: string; data?: Record<string, unknown> }> {
  let state = db.getWorkflowState(sessionId) || initWorkflowState(sessionId, userId);

  db.addMessage(sessionId, { role: 'user', content: userMessage });

  const currentStage = state.currentStage;

  try {
    if (currentStage === 'welcome' || currentStage === 'profiling') {
      emitWorkflowUpdate(io, userId, { stage: 'profiling', agentName: 'Profiling Concierge', status: 'thinking' });

      const result = await runProfilingAgent(state, userMessage);

      db.addMessage(sessionId, {
        role: 'assistant',
        content: result.response,
        agentName: 'Profiling Concierge',
      });

      if (result.profileComplete && result.extractedProfile) {
        const updatedProfile = db.updateProfile(userId, {
          ...result.extractedProfile,
          userId,
        });

        state = db.updateWorkflowState(sessionId, {
          currentStage: 'intelligence_building',
          profile: updatedProfile as Partial<UserProfile>,
          completedStages: [...state.completedStages, 'profiling'],
        }) || state;

        setTimeout(() => {
          runPostProfilingWorkflow(sessionId, userId, updatedProfile as UserProfile, io).catch(console.error);
        }, 500);
      } else {
        db.updateWorkflowState(sessionId, { currentStage: 'profiling' });
      }

      emitWorkflowUpdate(io, userId, { stage: 'profiling', agentName: 'Profiling Concierge', status: 'complete' });

      return {
        response: result.response,
        stage: 'profiling',
        agentName: 'Profiling Concierge',
      };
    }

    // Post-profiling: rule-based concierge
    const profile = db.getProfile(userId);
    const recommendations = db.getRecommendations(userId);
    const goals = db.getGoals(userId);
    const user = db.getUserById(userId);
    const userName = user?.name || '';

    const contextualResponse = buildConciergeReply(userMessage, profile || null, userName);

    db.addMessage(sessionId, {
      role: 'assistant',
      content: contextualResponse,
      agentName: 'DhanSetu Concierge',
    });

    return {
      response: contextualResponse,
      stage: currentStage,
      agentName: 'DhanSetu Concierge',
      data: { recommendations: recommendations.slice(0, 3), goals: goals.slice(0, 2) },
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'An error occurred';
    state.retryCount = (state.retryCount || 0) + 1;

    if (state.retryCount < MAX_RETRY) {
      db.updateWorkflowState(sessionId, { retryCount: state.retryCount, lastError: errorMsg });
    }

    const fallbackResponse = "I'm having a moment — could you please repeat that? I'm here to help with your financial journey!";
    db.addMessage(sessionId, { role: 'assistant', content: fallbackResponse, agentName: 'DhanSetu' });

    return { response: fallbackResponse, stage: currentStage, agentName: 'DhanSetu' };
  }
}

async function runPostProfilingWorkflow(
  sessionId: string,
  userId: string,
  profile: UserProfile,
  io: SocketServer | null
) {
  let state = db.getWorkflowState(sessionId);
  if (!state) return;

  // Stage 2: Intelligence Building
  emitWorkflowUpdate(io, userId, { stage: 'intelligence_building', agentName: 'Intelligence Builder', status: 'running' });
  const intelligence = await runIntelligenceBuilder(state, profile);
  state = db.updateWorkflowState(sessionId, {
    currentStage: 'recommendation',
    extractedData: { ...state.extractedData, intelligence },
    completedStages: [...(state.completedStages || []), 'intelligence_building'],
  }) || state;
  emitWorkflowUpdate(io, userId, { stage: 'intelligence_building', status: 'complete', data: intelligence });

  await delay(300);

  // Stage 3: Recommendations
  emitWorkflowUpdate(io, userId, { stage: 'recommendation', agentName: 'Recommendation Engine', status: 'running' });
  const recommendations = await runRecommendationAgent(state, profile, intelligence as unknown as Record<string, unknown>);
  state = db.updateWorkflowState(sessionId, {
    currentStage: 'financial_navigation',
    recommendations,
    completedStages: [...(state.completedStages || []), 'recommendation'],
  }) || state;
  emitWorkflowUpdate(io, userId, { stage: 'recommendation', status: 'complete', data: { count: recommendations.length } });

  await delay(300);

  // Stage 4: Financial Navigation
  emitWorkflowUpdate(io, userId, { stage: 'financial_navigation', agentName: 'Financial Navigator', status: 'running' });
  const goals = await runFinancialNavigator(state, profile);
  state = db.updateWorkflowState(sessionId, {
    currentStage: 'cross_sell',
    goals,
    completedStages: [...(state.completedStages || []), 'financial_navigation'],
  }) || state;
  emitWorkflowUpdate(io, userId, { stage: 'financial_navigation', status: 'complete', data: { goalsCount: goals.length } });

  await delay(300);

  // Stage 5: Cross-Sell
  emitWorkflowUpdate(io, userId, { stage: 'cross_sell', agentName: 'Cross-Sell Engine', status: 'running' });
  await runCrossSellEngine(state, profile, recommendations);
  state = db.updateWorkflowState(sessionId, {
    currentStage: 'marketplace',
    completedStages: [...(state.completedStages || []), 'cross_sell'],
  }) || state;
  emitWorkflowUpdate(io, userId, { stage: 'cross_sell', status: 'complete' });

  await delay(200);

  // Stage 6: Marketplace
  emitWorkflowUpdate(io, userId, { stage: 'marketplace', agentName: 'Marketplace Agent', status: 'running' });
  const services = await runMarketplaceAgent(state, profile);
  state = db.updateWorkflowState(sessionId, {
    currentStage: 'feedback_learning',
    extractedData: { ...state.extractedData, services },
    completedStages: [...(state.completedStages || []), 'marketplace'],
  }) || state;
  emitWorkflowUpdate(io, userId, { stage: 'marketplace', status: 'complete', data: { servicesCount: services.length } });

  await delay(200);

  // Stage 7: Feedback Learning
  const signals = db.getUserSignals(userId);
  emitWorkflowUpdate(io, userId, { stage: 'feedback_learning', agentName: 'Learning Engine', status: 'running' });
  const feedbackInsights = await runFeedbackLearningAgent(state, profile, signals);
  db.updateWorkflowState(sessionId, {
    currentStage: 'completed',
    extractedData: { ...state.extractedData, feedbackInsights },
    completedStages: [...(state.completedStages || []), 'feedback_learning'],
  });
  emitWorkflowUpdate(io, userId, { stage: 'feedback_learning', status: 'complete' });

  db.updateSession(sessionId, { workflowStage: 'completed' });
  db.updateUser(userId, { onboardingComplete: true });

  emitWorkflowUpdate(io, userId, {
    stage: 'completed',
    status: 'complete',
    data: {
      recommendations: db.getRecommendations(userId),
      goals: db.getGoals(userId),
      profile: db.getProfile(userId),
      intelligence,
      feedbackInsights,
      services,
    },
  });

  const completionMessage = `🎉 Your personalized DhanSetu dashboard is ready! I've analyzed your financial goals and created:

• **${recommendations.length} personalized recommendations** tailored to your profile
• **${goals.length} financial goal roadmaps** with step-by-step milestones
• **${services.length} matched ET services** from the ecosystem

Head to your **Dashboard** to explore everything. I'm here whenever you have questions about your financial journey!`;

  db.addMessage(sessionId, {
    role: 'assistant',
    content: completionMessage,
    agentName: 'DhanSetu',
    metadata: { workflowComplete: true },
  });

  emitWorkflowUpdate(io, userId, { type: 'new_message', message: completionMessage });
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
