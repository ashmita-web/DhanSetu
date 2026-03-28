import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Star, ArrowRight, CheckCircle, TrendingUp, Shield, CreditCard, Building2, Landmark, PiggyBank } from 'lucide-react';
import { Header } from '../components/layout/Header.js';
import { Card } from '../components/shared/Card.js';
import { marketplaceAPI } from '../services/api.js';
import type { ETService } from '../types/index.js';

const CATEGORY_ICON: Record<string, React.ElementType> = {
  mutual_funds: TrendingUp,
  insurance: Shield,
  fd: PiggyBank,
  demat: BarChart,
  nps: Landmark,
  credit_card: CreditCard,
  loans: Building2,
};

function BarChart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="12" width="4" height="10" /><rect x="9" y="6" width="4" height="16" /><rect x="16" y="3" width="4" height="19" />
    </svg>
  );
}

type ETServiceWithUrl = ETService & { url?: string };

function ServiceCard({ service }: { service: ETServiceWithUrl }) {
  const Icon = CATEGORY_ICON[service.category] || ShoppingBag;
  const matchPct = service.matchScore || 70;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 hover:border-et-orange/30 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-et-orange/10 border border-et-orange/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-et-orange" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{service.name}</h3>
            <p className="text-xs text-white/40">{service.provider}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-et-gold fill-et-gold" />
            <span className="text-xs text-white font-medium">{service.rating}</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-et-teal/15 text-et-teal font-medium">
            {matchPct}% match
          </span>
        </div>
      </div>

      <p className="text-xs text-white/50 mb-4 leading-relaxed">{service.description}</p>

      {service.returns && (
        <div className="flex items-center gap-2 mb-3 p-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
          <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0" />
          <span className="text-xs text-green-400 font-medium">{service.returns}</span>
        </div>
      )}

      {service.minInvestment && (
        <p className="text-xs text-white/30 mb-3">
          Min. investment: <span className="text-white/60">₹{service.minInvestment.toLocaleString('en-IN')}</span>
        </p>
      )}

      <div className="space-y-1.5 mb-4">
        {service.features.slice(0, 3).map((f) => (
          <div key={f} className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-et-teal flex-shrink-0" />
            <span className="text-xs text-white/50">{f}</span>
          </div>
        ))}
      </div>

      {service.url ? (
        <a
          href={service.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 rounded-xl bg-et-orange/10 border border-et-orange/30 text-et-orange text-sm font-medium hover:bg-et-orange hover:text-white transition-all flex items-center justify-center gap-2"
        >
          Explore Service <ArrowRight className="w-4 h-4" />
        </a>
      ) : (
        <button className="w-full py-2.5 rounded-xl bg-et-orange/10 border border-et-orange/30 text-et-orange text-sm font-medium hover:bg-et-orange hover:text-white transition-all flex items-center justify-center gap-2">
          Explore Service <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}

export default function Marketplace() {
  const [services, setServices] = useState<ETServiceWithUrl[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    marketplaceAPI.getServices().then(res => {
      setServices(res.data.services || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Services Marketplace" subtitle="AI-matched financial services from ET ecosystem" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl bg-gradient-to-r from-et-orange/10 to-et-gold/10 border border-et-orange/20">
          <ShoppingBag className="w-5 h-5 text-et-orange flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">Personalized Service Matches</p>
            <p className="text-xs text-white/50">AI has matched these services to your specific financial profile and goals</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="glass-card p-5 h-64 shimmer" />
            ))}
          </div>
        ) : services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <ShoppingBag className="w-12 h-12 text-white/15 mx-auto mb-3" />
            <p className="text-white/50 text-sm mb-2">Services will appear after your AI profiling</p>
            <a href="/concierge" className="text-et-orange text-sm">Complete profiling →</a>
          </div>
        )}
      </div>
    </div>
  );
}
