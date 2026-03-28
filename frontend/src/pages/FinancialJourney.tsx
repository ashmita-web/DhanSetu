import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Target, CheckCircle, Circle, ArrowRight, TrendingUp, Home, BookOpen, Plane, Shield, Briefcase } from 'lucide-react';
import { Header } from '../components/layout/Header.js';
import { Card } from '../components/shared/Card.js';
import { marketplaceAPI } from '../services/api.js';
import { useAppStore } from '../store/useAppStore.js';
import type { FinancialGoal } from '../types/index.js';

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  retirement: { icon: Briefcase, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  education: { icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  home: { icon: Home, color: 'text-et-gold', bg: 'bg-et-gold/10' },
  travel: { icon: Plane, color: 'text-pink-400', bg: 'bg-pink-400/10' },
  emergency: { icon: Shield, color: 'text-green-400', bg: 'bg-green-400/10' },
  wealth: { icon: TrendingUp, color: 'text-et-teal', bg: 'bg-et-teal/10' },
  other: { icon: Target, color: 'text-et-orange', bg: 'bg-et-orange/10' },
};

function GoalCard({ goal }: { goal: FinancialGoal }) {
  const config = CATEGORY_CONFIG[goal.category] || CATEGORY_CONFIG.other;
  const Icon = config.icon;
  const completedMilestones = goal.milestones.filter(m => m.completed).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{goal.title}</h3>
            <p className="text-xs text-white/40 capitalize">{goal.category.replace('_', ' ')}</p>
          </div>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
          goal.status === 'achieved' ? 'bg-et-teal/20 text-et-teal' :
          goal.status === 'in_progress' ? 'bg-et-orange/20 text-et-orange' :
          'bg-white/10 text-white/40'
        }`}>
          {goal.status.replace('_', ' ')}
        </span>
      </div>

      <p className="text-xs text-white/50 mb-4 leading-relaxed">{goal.description}</p>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-white/50">Progress</span>
          <span className={`text-sm font-bold ${config.color}`}>{goal.progress}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${goal.progress}%` }}
            transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }}
            className={`h-full rounded-full bg-gradient-to-r ${
              goal.category === 'retirement' ? 'from-purple-500 to-purple-400' :
              goal.category === 'wealth' ? 'from-et-teal to-teal-400' :
              'from-et-orange to-et-gold'
            }`}
          />
        </div>
      </div>

      {/* Amount info */}
      {goal.targetAmount && (
        <div className="flex items-center gap-4 mb-4 p-3 rounded-xl bg-white/3">
          <div>
            <p className="text-xs text-white/30">Current</p>
            <p className="text-sm font-semibold text-white">
              ₹{((goal.currentAmount || 0) / 100000).toFixed(1)}L
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-white/20" />
          <div>
            <p className="text-xs text-white/30">Target</p>
            <p className="text-sm font-semibold text-white">
              ₹{(goal.targetAmount / 100000).toFixed(1)}L
            </p>
          </div>
          {goal.targetDate && (
            <>
              <ArrowRight className="w-4 h-4 text-white/20" />
              <div>
                <p className="text-xs text-white/30">By</p>
                <p className="text-sm font-semibold text-white">
                  {new Date(goal.targetDate).getFullYear()}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Milestones */}
      {goal.milestones.length > 0 && (
        <div>
          <p className="text-xs text-white/40 font-medium mb-2">
            Milestones ({completedMilestones}/{goal.milestones.length})
          </p>
          <div className="space-y-1.5">
            {goal.milestones.map((m, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {m.completed
                  ? <CheckCircle className="w-3.5 h-3.5 text-et-teal flex-shrink-0" />
                  : <Circle className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
                }
                <span className={`text-xs ${m.completed ? 'text-et-teal' : 'text-white/40'}`}>
                  {m.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested products */}
      {goal.suggestedProducts && goal.suggestedProducts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-xs text-white/30 mb-2">Suggested Products</p>
          <div className="flex flex-wrap gap-1.5">
            {goal.suggestedProducts.map(p => (
              <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-et-orange/10 text-et-orange/70 border border-et-orange/20">
                {p}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function FinancialJourney() {
  const { goals, setGoals } = useAppStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (goals.length === 0) {
      setLoading(true);
      marketplaceAPI.getGoals().then(res => {
        setGoals(res.data.goals || []);
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, []);

  const totalProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
    : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Financial Journey" subtitle="Your personalized goal roadmap" />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Overview banner */}
        {goals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 mb-6 border-et-teal/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Overall Journey Progress</p>
                <p className="text-4xl font-bold gradient-text">{totalProgress}%</p>
                <p className="text-sm text-white/50 mt-1">{goals.length} goals · {goals.filter(g => g.status === 'achieved').length} achieved</p>
              </div>
              <div className="w-20 h-20 relative">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="3"
                  />
                  <motion.path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#FF6B35"
                    strokeWidth="3"
                    strokeDasharray={`${totalProgress}, 100`}
                    initial={{ strokeDasharray: '0, 100' }}
                    animate={{ strokeDasharray: `${totalProgress}, 100` }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Target className="w-6 h-6 text-et-orange" />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="glass-card p-5 h-48 shimmer" />
            ))}
          </div>
        ) : goals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map(goal => <GoalCard key={goal.id} goal={goal} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Target className="w-14 h-14 text-white/15 mb-4" />
            <p className="text-white/50 font-medium mb-2">No goals yet</p>
            <p className="text-white/30 text-sm mb-6">Complete your AI profiling to generate your personalized financial journey</p>
            <a href="/concierge" className="et-button">Start AI Profiling</a>
          </div>
        )}
      </div>
    </div>
  );
}
