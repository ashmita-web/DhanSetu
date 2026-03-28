import type { WorkflowState, UserProfile } from '../types/index';
import db from '../database/store';

// ─── Profiling Flow: state-machine questions ───────────────────────────────
interface ProfilingStep {
  key: string;
  question: string;
  follow?: string; // warm acknowledgement prefix
}

const STEPS: ProfilingStep[] = [
  {
    key: 'name',
    question: "What's your name? I'd love to address you personally throughout our conversation!",
  },
  {
    key: 'age',
    follow: 'Great to meet you, {name}! 😊',
    question: 'How old are you? This helps me understand which life stage you\'re in and tailor advice accordingly.',
  },
  {
    key: 'occupation',
    follow: 'Perfect, that helps me understand your financial journey.',
    question: 'What do you do for a living — are you a student, salaried professional, business owner, or something else?',
  },
  {
    key: 'city',
    follow: 'Interesting! Location matters a lot for cost of living and investment options.',
    question: 'Which city do you live in?',
  },
  {
    key: 'income',
    follow: 'Got it!',
    question: 'What is your approximate monthly income range? (e.g., under ₹25k, ₹25k–₹50k, ₹50k–₹1L, above ₹1L)',
  },
  {
    key: 'goals',
    follow: 'Thanks for sharing that!',
    question: 'What are your top 1–2 financial goals right now? For example: building an emergency fund, saving for education, buying a home, growing wealth, or retirement planning.',
  },
  {
    key: 'risk',
    follow: "Those are meaningful goals — I'll keep them central to everything I suggest.",
    question: "How do you feel about investment risk?\n\u2022 **Conservative** \u2013 I prefer safety over high returns\n\u2022 **Moderate** \u2013 I'm okay with some ups and downs\n\u2022 **Aggressive** \u2013 I want maximum growth, even if volatile",
  },
];

// ─── NLP helpers ─────────────────────────────────────────────────────────────

function extractName(text: string): string {
  const clean = text.trim();
  // "I am Raj", "my name is Priya", "this is Ankit", "call me ..."
  const patterns = [
    /(?:i am|i'm|my name is|name is|this is|call me|myself)\s+([A-Za-z]+(?: [A-Za-z]+)?)/i,
    /^([A-Za-z]+(?: [A-Za-z]+)?)$/,
  ];
  for (const p of patterns) {
    const m = clean.match(p);
    if (m) return m[1].trim();
  }
  return clean.split(/\s+/).slice(0, 2).join(' ');
}

function extractAge(text: string): number {
  const m = text.match(/\b(\d{1,2})\b/);
  if (m) return parseInt(m[1]);
  // word numbers
  const words: Record<string, number> = {
    eighteen: 18, nineteen: 19, twenty: 20, 'twenty one': 21, 'twenty two': 22,
    'twenty three': 23, 'twenty five': 25, 'twenty six': 26, 'twenty seven': 27,
    'twenty eight': 28, 'twenty nine': 29, thirty: 30,
  };
  const lower = text.toLowerCase();
  for (const [word, age] of Object.entries(words)) {
    if (lower.includes(word)) return age;
  }
  return 25; // default
}

function extractOccupation(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('student')) return 'student';
  if (lower.includes('freelanc')) return 'freelancer';
  if (lower.includes('business') || lower.includes('entrepreneur') || lower.includes('self')) return 'business_owner';
  if (lower.includes('doctor') || lower.includes('physician')) return 'doctor';
  if (lower.includes('engineer')) return 'engineer';
  if (lower.includes('teacher') || lower.includes('professor')) return 'teacher';
  if (lower.includes('salary') || lower.includes('salaried') || lower.includes('job') || lower.includes('employee') || lower.includes('work')) return 'salaried';
  if (lower.includes('retir')) return 'retired';
  if (lower.includes('homemaker') || lower.includes('housewife')) return 'homemaker';
  return text.trim().split(/\s+/).slice(0, 3).join(' ');
}

function extractIncome(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('1l') || lower.includes('1 l') || lower.includes('lakh') || lower.includes('above 1') || lower.includes('more than 1')) return 'above_1L';
  if (lower.includes('50k') || lower.includes('50,000') || lower.includes('50 to 1') || lower.includes('50k-1l')) return '50k_1L';
  if (lower.includes('25k') || lower.includes('25,000') || lower.includes('25 to 50') || lower.includes('25k-50k')) return '25k_50k';
  if (lower.includes('student') || lower.includes('no income') || lower.includes('stipend')) return 'under_25k';
  // extract number
  const m = text.match(/(\d[\d,]*)/);
  if (m) {
    const n = parseInt(m[1].replace(/,/g, ''));
    if (n >= 100000) return 'above_1L';
    if (n >= 50000) return '50k_1L';
    if (n >= 25000) return '25k_50k';
    return 'under_25k';
  }
  return 'under_25k';
}

function extractGoals(text: string): string[] {
  const lower = text.toLowerCase();
  const goals: string[] = [];
  if (lower.includes('emergenc') || lower.includes('safety') || lower.includes('save')) goals.push('emergency_fund');
  if (lower.includes('educat') || lower.includes('college') || lower.includes('study') || lower.includes('degree')) goals.push('education');
  if (lower.includes('home') || lower.includes('house') || lower.includes('flat') || lower.includes('property')) goals.push('home_purchase');
  if (lower.includes('retire') || lower.includes('pension')) goals.push('retirement');
  if (lower.includes('travel') || lower.includes('trip') || lower.includes('vacation')) goals.push('travel');
  if (lower.includes('wealth') || lower.includes('invest') || lower.includes('grow') || lower.includes('stock') || lower.includes('sip') || lower.includes('mutual')) goals.push('wealth_creation');
  if (lower.includes('car') || lower.includes('vehicle') || lower.includes('bike')) goals.push('vehicle_purchase');
  if (lower.includes('wedding') || lower.includes('marriage') || lower.includes('marr')) goals.push('wedding');
  if (goals.length === 0) goals.push('wealth_creation');
  return goals;
}

function extractRisk(text: string): 'conservative' | 'moderate' | 'aggressive' {
  const lower = text.toLowerCase();
  if (lower.includes('safe') || lower.includes('conserv') || lower.includes('fd') || lower.includes('fixed') || lower.includes('low risk') || lower.includes('1')) return 'conservative';
  if (lower.includes('aggress') || lower.includes('high') || lower.includes('maximum') || lower.includes('3')) return 'aggressive';
  return 'moderate';
}

function extractCity(text: string): string {
  const cities = ['mumbai', 'delhi', 'bangalore', 'bengaluru', 'chennai', 'hyderabad', 'kolkata', 'pune', 'ahmedabad', 'jaipur', 'lucknow', 'surat', 'noida', 'gurgaon', 'bhopal', 'chandigarh', 'indore', 'vadodara', 'nagpur', 'patna', 'ranchi', 'kochi', 'coimbatore'];
  const lower = text.toLowerCase();
  for (const city of cities) {
    if (lower.includes(city)) return city.charAt(0).toUpperCase() + city.slice(1);
  }
  return text.trim().split(/\s+/).slice(0, 2).join(' ');
}

function deriveLifestage(age: number, occupation: string, goals: string[]): string {
  if (occupation === 'student') return 'Young Learner';
  if (age <= 24) return 'Early Career Starter';
  if (age <= 30) return 'Young Professional';
  if (age <= 40) return goals.includes('home_purchase') || goals.includes('wedding') ? 'Life Milestone Builder' : 'Wealth Accumulator';
  if (age <= 50) return 'Prime Wealth Builder';
  return 'Pre-Retirement Planner';
}

function deriveInvestmentHorizon(age: number, goals: string[]): 'short' | 'medium' | 'long' {
  if (goals.includes('emergency_fund') || goals.includes('travel')) return 'short';
  if (age > 50 || goals.includes('retirement')) return 'long';
  if (goals.includes('home_purchase') || goals.includes('education')) return 'medium';
  return 'long';
}

// ─── Conversation tracking (stored in extractedData) ─────────────────────────

function getStepIndex(state: WorkflowState): number {
  const data = state.extractedData;
  const collected = [data.name, data.age, data.occupation, data.city, data.income, data.goals, data.risk];
  for (let i = 0; i < collected.length; i++) {
    if (collected[i] === undefined || collected[i] === null) return i;
  }
  return STEPS.length;
}

export async function runProfilingAgent(
  state: WorkflowState,
  userMessage: string
): Promise<{ response: string; profileComplete: boolean; extractedProfile?: Partial<UserProfile> }> {
  const startTime = Date.now();
  let data = { ...state.extractedData };
  const stepIdx = getStepIndex(state);

  // Parse the user's response for the current step
  if (stepIdx < STEPS.length) {
    const step = STEPS[stepIdx];
    switch (step.key) {
      case 'name':    data.name = extractName(userMessage); break;
      case 'age':     data.age = extractAge(userMessage); break;
      case 'occupation': data.occupation = extractOccupation(userMessage); break;
      case 'city':    data.city = extractCity(userMessage); break;
      case 'income':  data.income = extractIncome(userMessage); break;
      case 'goals':   data.goals = extractGoals(userMessage); break;
      case 'risk':    data.risk = extractRisk(userMessage); break;
    }
    db.updateWorkflowState(state.sessionId, { extractedData: data });
  }

  const nextIdx = getStepIndex({ ...state, extractedData: data });

  // All questions answered → build profile
  if (nextIdx >= STEPS.length) {
    const age = (data.age as number) || 25;
    const goals = (data.goals as string[]) || ['wealth_creation'];
    const occupation = (data.occupation as string) || 'salaried';
    const name = (data.name as string) || 'there';

    const extractedProfile: Partial<UserProfile> = {
      demographics: {
        age,
        city: (data.city as string) || 'India',
        occupation,
        incomeRange: (data.income as string) || 'under_25k',
        familyStatus: 'single',
      },
      financialGoals: goals,
      interests: deriveInterests(goals, occupation),
      riskAppetite: (data.risk as 'conservative' | 'moderate' | 'aggressive') || 'moderate',
      investmentHorizon: deriveInvestmentHorizon(age, goals),
      currentProducts: [],
      lifestage: deriveLifestage(age, occupation, goals),
      persona: `${name} is a ${deriveLifestage(age, occupation, goals).toLowerCase()} focused on ${goals.join(', ')}.`,
    };

    if (name && name !== 'there') db.updateUser(state.userId, { name });

    db.logAgentDecision({
      sessionId: state.sessionId,
      userId: state.userId,
      agentName: 'ProfilingAgent',
      stage: 'profiling',
      input: { userMessage, stepIdx },
      output: { profileComplete: true, extractedProfile },
      latencyMs: Date.now() - startTime,
      success: true,
    });

    const response = `Excellent, ${name}! 🎯 I now have a clear picture of your financial world. Let me fire up my intelligence engine to build a completely personalized experience for you. Give me just a moment...`;
    return { response, profileComplete: true, extractedProfile };
  }

  // Ask the next question
  const nextStep = STEPS[nextIdx];
  const nameStr = (data.name as string) || '';
  let response = '';
  if (nextStep.follow) {
    response = nextStep.follow.replace('{name}', nameStr) + ' ' + nextStep.question;
  } else {
    response = nextStep.question;
  }

  db.logAgentDecision({
    sessionId: state.sessionId,
    userId: state.userId,
    agentName: 'ProfilingAgent',
    stage: 'profiling',
    input: { userMessage, stepIdx },
    output: { response, profileComplete: false },
    latencyMs: Date.now() - startTime,
    success: true,
  });

  return { response, profileComplete: false };
}

function deriveInterests(goals: string[], occupation: string): string[] {
  const interests: string[] = ['personal_finance'];
  if (goals.includes('wealth_creation')) interests.push('mutual_funds', 'stock_market');
  if (goals.includes('retirement')) interests.push('nps', 'ppf', 'long_term_planning');
  if (goals.includes('home_purchase')) interests.push('home_loans', 'real_estate');
  if (goals.includes('education')) interests.push('education_loans', 'scholarships');
  if (goals.includes('emergency_fund')) interests.push('liquid_funds', 'fd');
  if (occupation === 'business_owner') interests.push('business_loans', 'gst', 'tax_planning');
  if (occupation === 'student') interests.push('scholarships', 'credit_cards', 'budgeting');
  return [...new Set(interests)];
}
