import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick, hoverEffect = false }) => {
  return (
    <motion.div
      whileHover={hoverEffect ? { y: -4, boxShadow: '0 10px 40px -10px rgba(139, 92, 246, 0.15)' } : {}}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`
        bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] 
        rounded-2xl p-6 shadow-xl relative overflow-hidden group
        ${className}
      `}
    >
      {/* Subtle lighting sweep effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};
