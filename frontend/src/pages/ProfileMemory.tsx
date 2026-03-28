import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Brain, CheckCircle, Clock, Zap, AlertCircle,
  ChevronDown, ChevronUp, Edit3, Save, X
} from 'lucide-react';
import { Header } from '../components/layout/Header.js';
import { Card } from '../components/shared/Card.js';
import { behavioralAPI, dashboardAPI } from '../services/api.js';
import { useAppStore } from '../store/useAppStore.js';
import type { AgentDecisionLog } from '../types/index.js';

function AgentLogItem({ log }: { log: AgentDecisionLog }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${log.success ? 'bg-et-teal/15' : 'bg-red-500/15'}`}>
            {log.success
              ? <CheckCircle className="w-4 h-4 text-et-teal" />
              : <AlertCircle className="w-4 h-4 text-red-400" />
            }
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{log.agentName}</p>
            <p className="text-xs text-white/30">{log.stage} · {log.latencyMs}ms</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {log.tokensUsed && (
            <span className="text-xs text-white/30">{log.tokensUsed} tokens</span>
          )}
          <span className="text-xs text-white/30">
            {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
        </div>
      </button>

      {expanded && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          className="border-t border-white/5 p-4 space-y-3"
        >
          {log.reasoning && (
            <div>
              <p className="text-xs text-white/40 font-medium mb-1">Reasoning</p>
              <p className="text-xs text-white/60 leading-relaxed">{log.reasoning}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-white/40 font-medium mb-1">Output Summary</p>
            <pre className="text-xs text-white/50 bg-et-navy/50 rounded-lg p-3 overflow-x-auto">
              {JSON.stringify(log.output, null, 2).slice(0, 400)}
              {JSON.stringify(log.output).length > 400 ? '...' : ''}
            </pre>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function ProfileMemory() {
  const { user, profile, setProfile } = useAppStore();
  const [agentLogs, setAgentLogs] = useState<AgentDecisionLog[]>([]);
  const [stats, setStats] = useState<{ totalDecisions: number; successRate: number; agentsRun: string[] } | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    riskAppetite: profile?.riskAppetite || 'moderate',
    investmentHorizon: profile?.investmentHorizon || 'medium',
  });

  useEffect(() => {
    behavioralAPI.getProfile().then(res => {
      if (res.data.profile) setProfile(res.data.profile);
      if (res.data.agentLogs) setAgentLogs(res.data.agentLogs);
      if (res.data.stats) setStats(res.data.stats);
    }).catch(() => {});
  }, []);

  const handleSaveProfile = async () => {
    try {
      await behavioralAPI.updateProfile(editData);
      setEditing(false);
    } catch {}
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Profile Memory" subtitle="Transparent AI understanding of you" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile data */}
          <div className="lg:col-span-1 space-y-4">
            {/* User card */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-et-orange" />
                  Your Profile
                </h3>
                <button
                  onClick={() => setEditing(!editing)}
                  className="text-xs text-et-orange flex items-center gap-1"
                >
                  {editing ? <><X className="w-3 h-3" /> Cancel</> : <><Edit3 className="w-3 h-3" /> Edit</>}
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Name</span>
                  <span className="text-xs text-white font-medium">{user?.name}</span>
                </div>
                {profile?.persona && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-white/40 flex-shrink-0">AI Persona</span>
                    <span className="text-xs text-et-orange font-medium text-right">{profile.persona}</span>
                  </div>
                )}
                {profile?.demographics?.city && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">City</span>
                    <span className="text-xs text-white">{profile.demographics.city}</span>
                  </div>
                )}
                {profile?.demographics?.occupation && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">Occupation</span>
                    <span className="text-xs text-white">{profile.demographics.occupation}</span>
                  </div>
                )}

                {editing ? (
                  <div className="space-y-3 pt-2 border-t border-white/5">
                    <div>
                      <label className="text-xs text-white/40 block mb-1">Risk Appetite</label>
                      <select
                        value={editData.riskAppetite}
                        onChange={(e) => setEditData({ ...editData, riskAppetite: e.target.value as any })}
                        className="w-full bg-et-navy border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                      >
                        <option value="conservative">Conservative</option>
                        <option value="moderate">Moderate</option>
                        <option value="aggressive">Aggressive</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-white/40 block mb-1">Investment Horizon</label>
                      <select
                        value={editData.investmentHorizon}
                        onChange={(e) => setEditData({ ...editData, investmentHorizon: e.target.value as any })}
                        className="w-full bg-et-navy border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                      >
                        <option value="short">Short (0-2 years)</option>
                        <option value="medium">Medium (2-7 years)</option>
                        <option value="long">Long (7+ years)</option>
                      </select>
                    </div>
                    <button onClick={handleSaveProfile} className="w-full et-button text-xs py-2 flex items-center justify-center gap-1">
                      <Save className="w-3 h-3" /> Save Changes
                    </button>
                  </div>
                ) : (
                  <>
                    {profile?.riskAppetite && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/40">Risk Appetite</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${
                          profile.riskAppetite === 'aggressive' ? 'bg-red-500/20 text-red-400' :
                          profile.riskAppetite === 'moderate' ? 'bg-et-gold/20 text-et-gold' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {profile.riskAppetite}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>

            {/* Goals & Interests */}
            {profile?.financialGoals && profile.financialGoals.length > 0 && (
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Financial Goals</h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.financialGoals.map(goal => (
                    <span key={goal} className="text-xs px-2.5 py-1 rounded-full bg-et-orange/10 border border-et-orange/20 text-et-orange/80">
                      {goal}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Stats */}
            {stats && (
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-et-gold" />
                  AI Analysis Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs text-white/40">Agent Decisions</span>
                    <span className="text-xs font-bold text-white">{stats.totalDecisions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-white/40">Success Rate</span>
                    <span className="text-xs font-bold text-et-teal">{stats.successRate}%</span>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-1.5">Agents Run</p>
                    <div className="flex flex-wrap gap-1">
                      {stats.agentsRun.map(a => (
                        <span key={a} className="text-xs px-2 py-0.5 rounded bg-purple-500/15 text-purple-400">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Agent Decision Log */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-4 h-4 text-et-orange" />
              <h3 className="text-sm font-semibold text-white">Agent Decision Log</h3>
              <span className="text-xs text-white/30 ml-auto">Full audit trail</span>
            </div>

            {agentLogs.length > 0 ? (
              <div className="space-y-2">
                {agentLogs.map(log => (
                  <AgentLogItem key={log.id} log={log} />
                ))}
              </div>
            ) : (
              <div className="glass-card p-8 text-center">
                <Clock className="w-10 h-10 text-white/15 mx-auto mb-3" />
                <p className="text-sm text-white/40">Agent decisions will appear here after your profiling session</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
