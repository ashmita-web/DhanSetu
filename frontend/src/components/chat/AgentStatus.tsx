import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader, Brain, TrendingUp, Target, ShoppingBag, BarChart3, Zap } from 'lucide-react';
import type { WorkflowStage } from '../../types/index.js';

const STAGE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  profiling: { label: 'Profiling Concierge', icon: Brain, color: 'text-purple-400' },
  intelligence_building: { label: 'Intelligence Builder', icon: BarChart3, color: 'text-blue-400' },
  recommendation: { label: 'Recommendation Engine', icon: Zap, color: 'text-et-gold' },
  financial_navigation: { label: 'Financial Navigator', icon: Target, color: 'text-et-teal' },
  cross_sell: { label: 'Cross-Sell Engine', icon: TrendingUp, color: 'text-green-400' },
  marketplace: { label: 'Marketplace Agent', icon: ShoppingBag, color: 'text-pink-400' },
  feedback_learning: { label: 'Learning Engine', icon: Brain, color: 'text-orange-400' },
};

interface AgentStatusProps {
  activeAgents: { name: string; status: 'running' | 'complete' }[];
  completedStages: WorkflowStage[];
}

export function AgentStatus({ activeAgents, completedStages }: AgentStatusProps) {
  const runningAgents = activeAgents.filter(a => a.status === 'running');

  if (runningAgents.length === 0 && completedStages.length === 0) return null;

  return (
    <div className="px-4 py-3 border-t border-white/5">
      <p className="text-xs text-white/30 mb-2 font-medium uppercase tracking-wider">Workflow Engine</p>
      <div className="flex flex-wrap gap-2">
        {completedStages.map((stage) => {
          const config = STAGE_CONFIG[stage];
          if (!config) return null;
          const Icon = config.icon;
          return (
            <motion.div
              key={stage}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-et-teal/10 border border-et-teal/20"
            >
              <CheckCircle className="w-3 h-3 text-et-teal" />
              <span className="text-xs text-et-teal">{config.label}</span>
            </motion.div>
          );
        })}
        <AnimatePresence>
          {runningAgents.map((agent) => {
            const stageKey = Object.keys(STAGE_CONFIG).find(k =>
              STAGE_CONFIG[k].label === agent.name
            );
            const config = stageKey ? STAGE_CONFIG[stageKey] : null;
            const Icon = config?.icon || Brain;

            return (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-et-orange/10 border border-et-orange/30"
              >
                <Loader className="w-3 h-3 text-et-orange animate-spin" />
                <span className="text-xs text-et-orange">{agent.name}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
