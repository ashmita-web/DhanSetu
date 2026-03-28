import { v4 as uuidv4 } from 'uuid';
import type {
  User, UserProfile, ConversationSession, Message,
  AgentDecisionLog, Recommendation, FinancialGoal,
  BehavioralSignal, WorkflowState, WorkflowStage
} from '../types/index';

// In-memory store — replace with Supabase client for production
class InMemoryStore {
  private users = new Map<string, User>();
  private profiles = new Map<string, UserProfile>();
  private sessions = new Map<string, ConversationSession>();
  private agentLogs: AgentDecisionLog[] = [];
  private recommendations = new Map<string, Recommendation[]>();
  private goals = new Map<string, FinancialGoal[]>();
  private signals: BehavioralSignal[] = [];
  private workflowStates = new Map<string, WorkflowState>();

  // Users
  createUser(data: Omit<User, 'id' | 'createdAt' | 'lastActive'>): User {
    const user: User = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      ...data,
    };
    this.users.set(user.id, user);
    return user;
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  createUserWithId(id: string, data: Omit<User, 'id' | 'createdAt' | 'lastActive'>): User {
    const user: User = {
      id,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      ...data,
    };
    this.users.set(id, user);
    return user;
  }

  getUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  updateUser(id: string, data: Partial<User>): User | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...data, lastActive: new Date().toISOString() };
    this.users.set(id, updated);
    return updated;
  }

  // Profiles
  upsertProfile(profile: UserProfile): UserProfile {
    this.profiles.set(profile.userId, profile);
    return profile;
  }

  getProfile(userId: string): UserProfile | undefined {
    return this.profiles.get(userId);
  }

  updateProfile(userId: string, data: Partial<UserProfile>): UserProfile {
    const existing = this.profiles.get(userId) || {
      userId,
      demographics: {},
      financialGoals: [],
      interests: [],
      currentProducts: [],
    };
    const updated = {
      ...existing,
      ...data,
      demographics: { ...existing.demographics, ...(data.demographics || {}) },
      financialGoals: data.financialGoals || existing.financialGoals,
      interests: data.interests || existing.interests,
    };
    this.profiles.set(userId, updated);
    return updated;
  }

  // Sessions
  createSession(userId: string): ConversationSession {
    const session: ConversationSession = {
      id: uuidv4(),
      userId,
      messages: [],
      status: 'active',
      workflowStage: 'welcome',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.sessions.set(session.id, session);
    return session;
  }

  getSession(id: string): ConversationSession | undefined {
    return this.sessions.get(id);
  }

  getLatestUserSession(userId: string): ConversationSession | undefined {
    const userSessions = Array.from(this.sessions.values())
      .filter(s => s.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return userSessions[0];
  }

  updateSession(id: string, data: Partial<ConversationSession>): ConversationSession | undefined {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    const updated = { ...session, ...data, updatedAt: new Date().toISOString() };
    this.sessions.set(id, updated);
    return updated;
  }

  addMessage(sessionId: string, message: Omit<Message, 'id' | 'sessionId' | 'timestamp'>): Message {
    let session = this.sessions.get(sessionId);
    if (!session) {
      // Session missing (e.g. server restarted) — recreate it silently
      session = {
        id: sessionId,
        userId: '',
        messages: [],
        status: 'active',
        workflowStage: 'profiling',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.sessions.set(sessionId, session);
    }
    const msg: Message = {
      id: uuidv4(),
      sessionId,
      timestamp: new Date().toISOString(),
      ...message,
    };
    session.messages.push(msg);
    session.updatedAt = new Date().toISOString();
    return msg;
  }

  // Agent Logs
  logAgentDecision(log: Omit<AgentDecisionLog, 'id' | 'timestamp'>): AgentDecisionLog {
    const entry: AgentDecisionLog = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      ...log,
    };
    this.agentLogs.push(entry);
    return entry;
  }

  getAgentLogs(sessionId: string): AgentDecisionLog[] {
    return this.agentLogs.filter(l => l.sessionId === sessionId);
  }

  getAllAgentLogs(): AgentDecisionLog[] {
    return [...this.agentLogs];
  }

  // Recommendations
  addRecommendations(userId: string, recs: Omit<Recommendation, 'id' | 'createdAt'>[]): Recommendation[] {
    const created = recs.map(r => ({
      ...r,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    } as Recommendation));
    const existing = this.recommendations.get(userId) || [];
    this.recommendations.set(userId, [...existing, ...created]);
    return created;
  }

  getRecommendations(userId: string): Recommendation[] {
    return this.recommendations.get(userId) || [];
  }

  updateRecommendation(userId: string, recId: string, data: Partial<Recommendation>): void {
    const recs = this.recommendations.get(userId) || [];
    const idx = recs.findIndex(r => r.id === recId);
    if (idx !== -1) recs[idx] = { ...recs[idx], ...data };
    this.recommendations.set(userId, recs);
  }

  // Financial Goals
  addGoals(userId: string, goals: Omit<FinancialGoal, 'id'>[]): FinancialGoal[] {
    const created = goals.map(g => ({ ...g, id: uuidv4() } as FinancialGoal));
    const existing = this.goals.get(userId) || [];
    this.goals.set(userId, [...existing, ...created]);
    return created;
  }

  getGoals(userId: string): FinancialGoal[] {
    return this.goals.get(userId) || [];
  }

  updateGoal(userId: string, goalId: string, data: Partial<FinancialGoal>): void {
    const goals = this.goals.get(userId) || [];
    const idx = goals.findIndex(g => g.id === goalId);
    if (idx !== -1) goals[idx] = { ...goals[idx], ...data };
    this.goals.set(userId, goals);
  }

  // Behavioral Signals
  trackSignal(signal: Omit<BehavioralSignal, 'id' | 'timestamp'>): BehavioralSignal {
    const entry: BehavioralSignal = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      ...signal,
    };
    this.signals.push(entry);
    return entry;
  }

  getUserSignals(userId: string, limit = 50): BehavioralSignal[] {
    return this.signals
      .filter(s => s.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Workflow State
  getWorkflowState(sessionId: string): WorkflowState | undefined {
    return this.workflowStates.get(sessionId);
  }

  setWorkflowState(state: WorkflowState): void {
    this.workflowStates.set(state.sessionId, state);
  }

  updateWorkflowState(sessionId: string, data: Partial<WorkflowState>): WorkflowState | undefined {
    const existing = this.workflowStates.get(sessionId);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.workflowStates.set(sessionId, updated);
    return updated;
  }
}

export const db = new InMemoryStore();
export default db;
