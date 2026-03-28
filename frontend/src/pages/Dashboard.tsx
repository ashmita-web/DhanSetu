import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Target, Zap, BarChart2, ArrowRight,
  Star, Clock, RefreshCw, BookOpen, DollarSign, Newspaper
} from 'lucide-react';
import { Header } from '../components/layout/Header.js';
import { Card } from '../components/shared/Card.js';
import { dashboardAPI, recommendationsAPI } from '../services/api.js';
import { useAppStore } from '../store/useAppStore.js';
import type { Recommendation } from '../types/index.js';

const TYPE_ICON: Record<string, React.ElementType> = {
  article: Newspaper,
  product: DollarSign,
  service: Star,
  fund: TrendingUp,
  insurance: Target,
  event: Clock,
};

const TYPE_COLOR: Record<string, string> = {
  article: 'text-blue-400 bg-blue-400/10',
  product: 'text-et-gold bg-et-gold/10',
  service: 'text-purple-400 bg-purple-400/10',
  fund: 'text-green-400 bg-green-400/10',
  insurance: 'text-pink-400 bg-pink-400/10',
  event: 'text-et-teal bg-et-teal/10',
};

function RecommendationCard({ rec, onInteract }: { rec: Recommendation; onInteract: (id: string) => void }) {
  const [showExplainer, setShowExplainer] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [loadingExplain, setLoadingExplain] = useState(false);

  const Icon = TYPE_ICON[rec.type] || Star;
  const colorClass = TYPE_COLOR[rec.type] || 'text-white/60 bg-white/10';

  const handleExplain = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (explanation) { setShowExplainer(!showExplainer); return; }
    setLoadingExplain(true);
    try {
      const res = await recommendationsAPI.explain(rec.id);
      setExplanation(res.data.explanation);
      setShowExplainer(true);
    } catch {
      setExplanation(rec.reason);
      setShowExplainer(true);
    } finally {
      setLoadingExplain(false);
    }
  };

  return (
    <Card
      hover
      onClick={() => onInteract(rec.id)}
      className="p-4"
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-snug line-clamp-2">{rec.title}</p>
          <p className="text-xs text-white/40 mt-1 line-clamp-2">{rec.description}</p>

          {showExplainer && explanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 p-2 rounded-lg bg-et-orange/10 border border-et-orange/20"
            >
              <p className="text-xs text-et-orange/80">{explanation}</p>
            </motion.div>
          )}

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleExplain}
              className="text-xs text-et-orange/70 hover:text-et-orange flex items-center gap-1 transition-colors"
            >
              {loadingExplain ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Zap className="w-3 h-3" />
              )}
              Why this?
            </button>
            <span className="text-white/20">·</span>
            <span className="text-xs text-et-orange font-medium">{rec.ctaText || 'Learn More'}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [briefing, setBriefing] = useState<any>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const { user, profile, recommendations, goals, setRecommendations, setGoals } = useAppStore();

  useEffect(() => {
    dashboardAPI.getOverview().then(res => {
      setStats(res.data.stats);
      if (res.data.topRecommendations) setRecommendations(res.data.topRecommendations);
      if (res.data.activeGoals) setGoals(res.data.activeGoals);
    }).catch(() => {});

    setLoadingBriefing(true);
    dashboardAPI.getBriefing().then(res => {
      setBriefing(res.data.briefing);
    }).catch(() => {}).finally(() => setLoadingBriefing(false));
  }, []);

  const handleInteract = async (id: string) => {
    try {
      await recommendationsAPI.interact(id, 'clicked');
    } catch {}
  };

  const STAT_CARDS = [
    { label: 'Recommendations', value: recommendations.length || stats?.recommendationsCount || 0, icon: Zap, color: 'et-orange' },
    { label: 'Active Goals', value: goals.filter(g => g.status !== 'achieved').length || stats?.goalsCount || 0, icon: Target, color: 'et-teal' },
    { label: 'AI Decisions', value: stats?.agentDecisions || 7, icon: BarChart2, color: 'purple-400' },
    { label: 'Completed Goals', value: goals.filter(g => g.status === 'achieved').length || 0, icon: Star, color: 'et-gold' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${user?.name?.split(' ')[0] || 'there'}! 👋`}
        subtitle={profile?.persona || 'Your personalized financial overview'}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4"
            >
              <div className={`w-9 h-9 rounded-xl bg-${color}/10 flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 text-${color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-white/40 mt-0.5">{label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Briefing */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-et-orange" />
                Weekly AI Briefing
              </h3>
            </div>
            <Card className="p-5">
              {loadingBriefing ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-4 rounded shimmer" />)}
                </div>
              ) : briefing ? (
                <div className="space-y-4">
                  <p className="text-sm text-white font-medium">{briefing.greeting}</p>
                  <div className="p-3 rounded-xl bg-et-orange/10 border border-et-orange/20">
                    <p className="text-xs text-et-orange font-semibold mb-1">Market Snapshot</p>
                    <p className="text-xs text-white/60">{briefing.marketSnapshot}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white/60 mb-1">💡 Weekly Tip</p>
                    <p className="text-xs text-white/70">{briefing.personalTip}</p>
                  </div>
                  {briefing.weeklyChallenge && (
                    <div className="p-3 rounded-xl bg-et-teal/10 border border-et-teal/20">
                      <p className="text-xs text-et-teal font-semibold">🎯 Weekly Challenge</p>
                      <p className="text-xs text-white/60 mt-1">{briefing.weeklyChallenge}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-white/40">Complete your profile to get your personalized briefing</p>
              )}
            </Card>
          </div>

          {/* Recommendations */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-et-orange" />
                For You
              </h3>
              <Link to="/discover" className="text-xs text-et-orange hover:text-et-orange-light flex items-center gap-1">
                See all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid gap-3">
              {recommendations.slice(0, 4).length > 0 ? (
                recommendations.slice(0, 4).map(rec => (
                  <RecommendationCard key={rec.id} rec={rec} onInteract={handleInteract} />
                ))
              ) : (
                <div className="glass-card p-8 text-center">
                  <BookOpen className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="text-sm text-white/40">Complete your AI profiling to unlock personalized recommendations</p>
                  <Link to="/concierge" className="et-button inline-flex mt-4 text-sm">
                    Start Profiling
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Goals preview */}
        {goals.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-et-teal" />
                Financial Goals
              </h3>
              <Link to="/journey" className="text-xs text-et-orange hover:text-et-orange-light flex items-center gap-1">
                View journey <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {goals.slice(0, 3).map(goal => (
                <Card key={goal.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{goal.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                        goal.status === 'achieved' ? 'bg-et-teal/20 text-et-teal' :
                        goal.status === 'in_progress' ? 'bg-et-orange/20 text-et-orange' :
                        'bg-white/10 text-white/40'
                      }`}>
                        {goal.status.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-et-teal">{goal.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${goal.progress}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className="h-full bg-et-teal rounded-full"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
