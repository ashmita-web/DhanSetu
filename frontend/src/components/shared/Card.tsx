import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  glow?: boolean;
}

export function Card({ children, className = '', onClick, hover = false, glow = false }: CardProps) {
  const base = `glass-card ${glow ? 'glow-orange' : ''} ${hover ? 'cursor-pointer transition-all duration-200 hover:border-et-orange/30 hover:bg-et-navy-light' : ''} ${className}`;

  if (onClick || hover) {
    return (
      <motion.div
        className={base}
        onClick={onClick}
        whileHover={hover ? { scale: 1.01, y: -2 } : undefined}
        whileTap={onClick ? { scale: 0.99 } : undefined}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={base}>{children}</div>;
}
