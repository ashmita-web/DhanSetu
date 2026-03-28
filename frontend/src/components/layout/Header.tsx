import { Bell, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore.js';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { recommendations } = useAppStore();
  const unreadCount = recommendations.filter(r => !r.interacted).length;

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-et-navy-light/50 backdrop-blur-sm">
      <div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {subtitle && <p className="text-sm text-white/40">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-et-orange/10 border border-et-orange/20">
          <Sparkles className="w-3.5 h-3.5 text-et-orange" />
          <span className="text-xs text-et-orange font-medium">AI-Powered</span>
        </div>
        <button className="relative w-9 h-9 rounded-xl bg-et-navy-card border border-white/10 flex items-center justify-center hover:border-white/20 transition-colors">
          <Bell className="w-4 h-4 text-white/50" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-et-orange text-white text-xs flex items-center justify-center font-bold">
              {Math.min(unreadCount, 9)}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
