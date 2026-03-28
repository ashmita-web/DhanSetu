import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import type { ChatMessage } from '../../types/index.js';

interface MessageBubbleProps {
  message: ChatMessage;
}

function formatContent(content: string): string {
  // Basic markdown-like formatting
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/•\s/g, '• ')
    .replace(/\n/g, '<br />');
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const timestamp = new Date(message.timestamp).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-end gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
        isUser
          ? 'bg-et-orange text-white'
          : 'bg-et-orange/20 border border-et-orange/30'
      }`}>
        {isUser
          ? <User className="w-4 h-4" />
          : <Bot className="w-4 h-4 text-et-orange" />
        }
      </div>

      {/* Message content */}
      <div className={`flex flex-col gap-1 max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        {!isUser && message.agentName && (
          <span className="text-xs text-white/40 px-1">{message.agentName}</span>
        )}
        <div className={
          isUser
            ? 'bg-et-orange text-white rounded-2xl rounded-tr-sm px-4 py-3'
            : 'bg-et-navy-card border border-white/10 text-white rounded-2xl rounded-tl-sm px-4 py-3'
        }>
          <p
            className="text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
          />
        </div>
        <span className="text-xs text-white/25 px-1">{timestamp}</span>
      </div>
    </motion.div>
  );
}
