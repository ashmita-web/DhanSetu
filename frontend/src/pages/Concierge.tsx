import { Header } from '../components/layout/Header.js';
import { ChatInterface } from '../components/chat/ChatInterface.js';
import { useAppStore } from '../store/useAppStore.js';
import { motion } from 'framer-motion';
import { Brain, CheckCircle, Loader } from 'lucide-react';

const WORKFLOW_STAGES = [
  { key: 'profiling', label: 'Profiling' },
  { key: 'intelligence_building', label: 'Intelligence' },
  { key: 'recommendation', label: 'Recommendations' },
  { key: 'financial_navigation', label: 'Goals' },
  { key: 'cross_sell', label: 'Opportunities' },
  { key: 'marketplace', label: 'Services' },
  { key: 'feedback_learning', label: 'Learning' },
];

export default function Concierge() {
  const { completedStages, currentWorkflowStage, isWorkflowComplete } = useAppStore();

  return (
    <div className="flex flex-col h-full">
      <Header
        title="AI Concierge"
        subtitle="Powered by multi-agent workflow"
      />

      <div className="flex flex-1 min-h-0">
        {/* Chat Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChatInterface />
        </div>

        {/* Workflow Panel */}
        <div className="w-64 border-l border-white/5 p-4 hidden xl:block overflow-y-auto">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-et-orange" />
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                Agent Workflow
              </p>
            </div>

            <div className="space-y-2">
              {WORKFLOW_STAGES.map((stage) => {
                const isCompleted = completedStages.includes(stage.key as any);
                const isCurrent = currentWorkflowStage === stage.key;

                return (
                  <motion.div
                    key={stage.key}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      isCompleted ? 'bg-et-teal/10' :
                      isCurrent ? 'bg-et-orange/10' :
                      'bg-white/3'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-3.5 h-3.5 text-et-teal flex-shrink-0" />
                    ) : isCurrent ? (
                      <Loader className="w-3.5 h-3.5 text-et-orange animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-white/20 flex-shrink-0" />
                    )}
                    <span className={`text-xs font-medium ${
                      isCompleted ? 'text-et-teal' :
                      isCurrent ? 'text-et-orange' :
                      'text-white/30'
                    }`}>
                      {stage.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {isWorkflowComplete && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 border-et-teal/20"
            >
              <CheckCircle className="w-5 h-5 text-et-teal mb-2" />
              <p className="text-xs font-semibold text-et-teal mb-1">Profile Complete!</p>
              <p className="text-xs text-white/40">
                All 7 agents have analyzed your profile. Your dashboard is ready.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
