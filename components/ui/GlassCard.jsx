import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { motion } from 'framer-motion';
export const GlassCard = ({ children, className = '', onClick, hoverEffect = false }) => {
    return (_jsxs(motion.div, { whileHover: hoverEffect ? { y: -4, boxShadow: '0 10px 40px -10px rgba(139, 92, 246, 0.15)' } : {}, transition: { duration: 0.2 }, onClick: onClick, className: `
        bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] 
        rounded-2xl p-6 shadow-xl relative overflow-hidden group
        ${className}
      `, children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" }), _jsx("div", { className: "relative z-10", children: children })] }));
};
