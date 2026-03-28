import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
});

// Attach auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dhansetu_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('dhansetu_token');
      localStorage.removeItem('dhansetu_user');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (email: string, name?: string) =>
    api.post('/auth/login', { email, name }),
  me: () => api.get('/auth/me'),
};

export const chatAPI = {
  sendMessage: (message: string, sessionId?: string) =>
    api.post('/chat/message', { message, sessionId }),
  getHistory: (sessionId: string) =>
    api.get(`/chat/history/${sessionId}`),
  getSession: () => api.get('/chat/session'),
};

export const recommendationsAPI = {
  getAll: () => api.get('/recommendations'),
  interact: (id: string, type: string) =>
    api.post(`/recommendations/${id}/interact`, { type }),
  explain: (id: string) =>
    api.get(`/recommendations/explain/${id}`),
};

export const dashboardAPI = {
  getOverview: () => api.get('/dashboard/overview'),
  getAgentLog: () => api.get('/dashboard/agent-log'),
  getBriefing: () => api.get('/dashboard/briefing'),
};

export const marketplaceAPI = {
  getServices: () => api.get('/marketplace/services'),
  getGoals: () => api.get('/marketplace/goals'),
  updateGoal: (id: string, data: { status?: string; progress?: number }) =>
    api.patch(`/marketplace/goals/${id}`, data),
};

export const behavioralAPI = {
  trackSignal: (data: { signalType: string; category?: string; value?: string | number }) =>
    api.post('/behavioral/signal', data),
  getProfile: () => api.get('/behavioral/profile'),
  updateProfile: (data: Record<string, unknown>) =>
    api.patch('/behavioral/profile', data),
};

export default api;
