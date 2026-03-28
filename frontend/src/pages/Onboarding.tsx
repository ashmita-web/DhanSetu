import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowRight, Sparkles, Shield, Zap, BarChart3 } from 'lucide-react';
import { authAPI } from '../services/api.js';
import { useAppStore } from '../store/useAppStore.js';
import { connectSocket } from '../services/socket.js';

const FEATURES = [
  { icon: Sparkles, label: 'AI Profiling', desc: '3-minute smart onboarding' },
  { icon: BarChart3, label: 'Multi-Agent AI', desc: '7 specialized AI agents' },
  { icon: Zap, label: 'Instant Insights', desc: 'Personalized recommendations' },
  { icon: Shield, label: 'Goal Tracking', desc: 'Your financial journey map' },
];

export default function Onboarding() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setAuth } = useAppStore();

  const handleStart = async () => {
    if (!email.trim()) {
      setError('Please enter your email to continue');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await authAPI.login(email.trim(), name.trim() || undefined);
      const { token, user, sessionId } = res.data;

      setAuth(user, token, sessionId);
      connectSocket(token);

      navigate('/concierge');
    } catch {
      setError('Unable to connect. Please check if the backend is running on port 3001.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-et-navy flex overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-et-orange/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-et-teal/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-et-orange/3 blur-3xl" />
      </div>

      {/* Left panel - Branding */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-11 h-11 rounded-2xl bg-et-gradient flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">DhanSetu</h1>
              <p className="text-sm text-white/40">by Economic Times</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-5xl font-bold text-white leading-tight mb-6">
              Your AI-Powered<br />
              <span className="gradient-text">Financial Concierge</span>
            </h2>
            <p className="text-lg text-white/50 leading-relaxed max-w-md">
              A multi-agent AI platform that understands your financial goals
              and delivers hyper-personalized guidance from The Economic Times ecosystem.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 gap-4 mt-12"
          >
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="glass-card p-4">
                <div className="w-9 h-9 rounded-xl bg-et-orange/10 border border-et-orange/20 flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4 text-et-orange" />
                </div>
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs text-white/40 mt-0.5">{desc}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {['A', 'R', 'S', 'M'].map((l) => (
              <div key={l} className="w-8 h-8 rounded-full bg-et-orange/20 border-2 border-et-navy flex items-center justify-center">
                <span className="text-xs text-et-orange font-semibold">{l}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-white/40">Join thousands building their financial future</p>
        </div>
      </div>

      {/* Right panel - Auth */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-et-gradient flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">DhanSetu</h1>
              <p className="text-xs text-white/40">by Economic Times</p>
            </div>
          </div>

          <div className="glass-card p-8">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Begin Your Journey</h3>
              <p className="text-white/50 text-sm">
                Enter your details to start your personalized financial profiling session
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rahul Sharma"
                  className="w-full bg-et-navy border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-et-orange/50 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                  placeholder="rahul@example.com"
                  className="w-full bg-et-navy border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-et-orange/50 transition-colors"
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2"
                >
                  {error}
                </motion.p>
              )}

              <motion.button
                onClick={handleStart}
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className="w-full et-button flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Starting your journey...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Start AI Profiling</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5">
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-et-teal mt-0.5 flex-shrink-0" />
                <p className="text-xs text-white/30 leading-relaxed">
                  Your data is used solely to personalize your ET experience.
                  No financial transactions are made through this platform.
                  This is an AI demonstration platform.
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-white/20 mt-4">
            © 2025 The Economic Times · AI-Powered by Anthropic Claude
          </p>
        </motion.div>
      </div>
    </div>
  );
}
