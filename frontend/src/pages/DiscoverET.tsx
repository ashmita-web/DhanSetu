import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Newspaper, TrendingUp, BarChart2, Landmark, Globe, Smartphone,
  Car, Building, Heart, Zap, Filter, ArrowRight, Star
} from 'lucide-react';
import { Header } from '../components/layout/Header.js';
import { Card } from '../components/shared/Card.js';
import { recommendationsAPI, behavioralAPI } from '../services/api.js';
import { useAppStore } from '../store/useAppStore.js';
import type { Recommendation } from '../types/index.js';

const ET_CATEGORIES = [
  { id: 'all', label: 'All', icon: Globe },
  { id: 'markets', label: 'Markets', icon: TrendingUp },
  { id: 'economy', label: 'Economy', icon: Landmark },
  { id: 'mutual_funds', label: 'Mutual Funds', icon: BarChart2 },
  { id: 'insurance', label: 'Insurance', icon: Star },
  { id: 'tech', label: 'Tech', icon: Smartphone },
  { id: 'auto', label: 'Auto', icon: Car },
  { id: 'realty', label: 'Realty', icon: Building },
  { id: 'health', label: 'Health', icon: Heart },
];

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  article: { label: 'Article', color: 'bg-blue-500/20 text-blue-400' },
  product: { label: 'Product', color: 'bg-et-gold/20 text-et-gold' },
  fund: { label: 'Fund', color: 'bg-green-500/20 text-green-400' },
  insurance: { label: 'Insurance', color: 'bg-pink-500/20 text-pink-400' },
  service: { label: 'Service', color: 'bg-purple-500/20 text-purple-400' },
  event: { label: 'Event', color: 'bg-et-teal/20 text-et-teal' },
};

export default function DiscoverET() {
  const [activeCategory, setActiveCategory] = useState('all');
  const { recommendations, setRecommendations } = useAppStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (recommendations.length === 0) {
      setLoading(true);
      recommendationsAPI.getAll().then(res => {
        setRecommendations(res.data.recommendations || []);
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, []);

  const filtered = activeCategory === 'all'
    ? recommendations
    : recommendations.filter(r =>
        r.category.toLowerCase().includes(activeCategory) ||
        r.tags.some(t => t.toLowerCase().includes(activeCategory))
      );

  const handleInteract = async (rec: Recommendation) => {
    try {
      await recommendationsAPI.interact(rec.id, 'clicked');
      await behavioralAPI.trackSignal({ signalType: 'click', category: rec.category, value: rec.title });
    } catch {}
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Discover ET" subtitle="AI-curated content from the ET ecosystem" />

      <div className="flex-1 overflow-y-auto">
        {/* Category filters */}
        <div className="px-6 pt-5 pb-1">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {ET_CATEGORIES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveCategory(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  activeCategory === id
                    ? 'bg-et-orange text-white'
                    : 'bg-et-navy-card border border-white/10 text-white/50 hover:border-white/20 hover:text-white/70'
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-4">
          {/* Featured AI-picked section */}
          {filtered.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-et-orange" />
                <h3 className="text-sm font-semibold text-white">AI-Picked for You</h3>
                <span className="text-xs text-white/30">({filtered.length})</span>
              </div>

              {/* Featured card */}
              {filtered[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-5 mb-4 border-et-orange/20 cursor-pointer hover:border-et-orange/40 transition-colors"
                  onClick={() => handleInteract(filtered[0])}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGE[filtered[0].type]?.color || 'bg-white/10 text-white/50'}`}>
                          {TYPE_BADGE[filtered[0].type]?.label || filtered[0].type}
                        </span>
                        <span className="text-xs text-et-orange font-medium flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Top Pick
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mb-2 leading-snug">{filtered[0].title}</h4>
                      <p className="text-sm text-white/50 leading-relaxed">{filtered[0].description}</p>
                      <div className="mt-3 p-2.5 rounded-xl bg-et-orange/10 border border-et-orange/20">
                        <p className="text-xs text-et-orange/80">
                          <strong>Why for you:</strong> {filtered[0].reason}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <button className="text-sm text-et-orange font-semibold flex items-center gap-1">
                      {filtered[0].ctaText || 'Explore'} <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Grid of remaining */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filtered.slice(1).map((rec) => (
                  <Card
                    key={rec.id}
                    hover
                    onClick={() => handleInteract(rec)}
                    className="p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_BADGE[rec.type]?.color || 'bg-white/10 text-white/50'}`}>
                            {TYPE_BADGE[rec.type]?.label || rec.type}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-white leading-snug line-clamp-2">{rec.title}</p>
                        <p className="text-xs text-white/40 mt-1 line-clamp-2">{rec.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {rec.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-white/30">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="glass-card p-4 h-24 shimmer" />
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-16">
              <Newspaper className="w-12 h-12 text-white/15 mx-auto mb-3" />
              <p className="text-white/40 text-sm">No content found for this category</p>
              <button onClick={() => setActiveCategory('all')} className="text-et-orange text-sm mt-2">
                Show all content
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
