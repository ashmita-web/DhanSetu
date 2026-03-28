export function TypingIndicator({ agentName }: { agentName?: string }) {
  return (
    <div className="flex items-end gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-et-orange/20 border border-et-orange/30 flex items-center justify-center flex-shrink-0">
        <span className="text-et-orange text-xs font-bold">AI</span>
      </div>
      <div className="flex flex-col gap-1">
        {agentName && (
          <span className="text-xs text-white/40 px-1">{agentName}</span>
        )}
        <div className="bg-et-navy-card border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        </div>
      </div>
    </div>
  );
}
