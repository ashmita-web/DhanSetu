import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore.js';
import { chatAPI } from '../../services/api.js';
import { MessageBubble } from './MessageBubble.js';
import { TypingIndicator } from './TypingIndicator.js';
import { AgentStatus } from './AgentStatus.js';
import type { ChatMessage } from '../../types/index.js';

const QUICK_PROMPTS = [
  'What are the best SIPs for me?',
  'Help me plan for retirement',
  'How should I build an emergency fund?',
  'Explain my top recommendations',
];

// Simple uuid fallback
function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function ChatInterface() {
  const [input, setInput] = useState('');
  const [currentAgentName, setCurrentAgentName] = useState('DhanSetu Concierge');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages, isTyping, sessionId, user, activeAgents, completedStages,
    addMessage, setTyping, setWorkflowStage, addActiveAgent, completeAgent,
    setWorkflowComplete, setRecommendations, setGoals, addCompletedStage,
  } = useAppStore();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Add welcome message if no messages
  useEffect(() => {
    if (messages.length === 0 && user) {
      const welcome: ChatMessage = {
        id: genId(),
        role: 'assistant',
        content: `Namaste ${user.name}! 🙏 I'm **DhanSetu**, your personal AI financial concierge from The Economic Times.\n\nI'm here to understand your financial goals and create a personalized journey for you. This will take just 3 minutes.\n\nTo start — could you tell me a bit about yourself? What brings you here today?`,
        timestamp: new Date().toISOString(),
        agentName: 'DhanSetu Concierge',
      };
      addMessage(welcome);
    }
  }, [user]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: genId(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };
    addMessage(userMsg);
    setInput('');
    setTyping(true);

    try {
      const res = await chatAPI.sendMessage(text.trim(), sessionId || undefined);
      const { response, stage, agentName, data } = res.data;

      setCurrentAgentName(agentName || 'DhanSetu');
      setWorkflowStage(stage);

      const assistantMsg: ChatMessage = {
        id: genId(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
        agentName,
      };
      addMessage(assistantMsg);

      if (data?.recommendations) setRecommendations(data.recommendations);
      if (data?.goals) setGoals(data.goals);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: genId(),
        role: 'assistant',
        content: "I apologize for the brief interruption. Could you please try again?",
        timestamp: new Date().toISOString(),
        agentName: 'DhanSetu',
      };
      addMessage(errorMsg);
    } finally {
      setTyping(false);
    }
  }, [isTyping, sessionId, addMessage, setTyping, setWorkflowStage, setRecommendations, setGoals]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </AnimatePresence>

        {isTyping && (
          <TypingIndicator agentName={currentAgentName} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Agent workflow status */}
      <AgentStatus activeAgents={activeAgents} completedStages={completedStages} />

      {/* Quick prompts */}
      {messages.length < 3 && (
        <div className="px-4 py-2 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              className="text-xs px-3 py-1.5 rounded-full border border-et-orange/30 text-et-orange/80 hover:bg-et-orange/10 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 bg-et-navy-card border border-white/10 rounded-2xl px-4 py-2 focus-within:border-et-orange/50 transition-colors">
          <Sparkles className="w-4 h-4 text-et-orange/50 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your finances..."
            className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
            disabled={isTyping}
          />
          <motion.button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 rounded-xl bg-et-orange flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 transition-opacity"
          >
            <Send className="w-4 h-4 text-white" />
          </motion.button>
        </div>
        <p className="text-xs text-white/20 text-center mt-2">
          AI-powered financial guidance · Not investment advice
        </p>
      </div>
    </div>
  );
}
