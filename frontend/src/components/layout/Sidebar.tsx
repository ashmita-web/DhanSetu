import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageSquare, LayoutDashboard, Map, Compass,
  ShoppingBag, User, LogOut, TrendingUp, Zap
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore.js';
import { disconnectSocket } from '../../services/socket.js';

const NAV_ITEMS = [
  { path: '/concierge', icon: MessageSquare, label: 'AI Concierge', desc: 'Chat with DhanSetu' },
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', desc: 'Your overview' },
  { path: '/journey', icon: Map, label: 'Financial Journey', desc: 'Goals & progress' },
  { path: '/discover', icon: Compass, label: 'Discover ET', desc: 'Curated content' },
  { path: '/marketplace', icon: ShoppingBag, label: 'Marketplace', desc: 'Financial services' },
  { path: '/profile', icon: User, label: 'Profile Memory', desc: 'AI understanding' },
];

export function Sidebar() {
  const { user, profile, isWorkflowComplete, logout } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate('/');
  };

  return (
    <aside className="w-64 bg-et-navy-light border-r border-white/5 flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-et-gradient flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg leading-none">DhanSetu</h1>
            <p className="text-xs text-white/40">by Economic Times</p>
          </div>
        </div>
      </div>

      {/* User info */}
      {user && (
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-et-orange/20 border border-et-orange/30 flex items-center justify-center">
              <span className="text-et-orange font-semibold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-white/40 truncate">{profile?.persona || 'Building profile...'}</p>
            </div>
          </div>
          {isWorkflowComplete && (
            <div className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-et-teal/10 border border-et-teal/20">
              <Zap className="w-3 h-3 text-et-teal" />
              <span className="text-xs text-et-teal font-medium">AI Profile Complete</span>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <p className="text-xs text-white/25 font-medium uppercase tracking-wider px-3 mb-2">Navigation</p>
        <div className="space-y-1">
          {NAV_ITEMS.map(({ path, icon: Icon, label, desc }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
                  isActive
                    ? 'bg-et-orange text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-none">{label}</p>
                    <p className={`text-xs mt-0.5 ${isActive ? 'text-white/70' : 'text-white/30'}`}>{desc}</p>
                  </div>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/5 transition-all group"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
