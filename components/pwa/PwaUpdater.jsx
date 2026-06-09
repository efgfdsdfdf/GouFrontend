import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';
export const PwaUpdater = () => {
    const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker, } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered:', r);
        },
        onRegisterError(error) {
            console.error('SW registration error', error);
        },
    });
    return (_jsx(AnimatePresence, { children: needRefresh && (_jsxs(motion.div, { initial: { opacity: 0, y: 50, scale: 0.9 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 50, scale: 0.9 }, className: "fixed bottom-6 right-6 z-[9999] glass-panel rounded-2xl p-4 shadow-2xl border border-primary/20 flex flex-col gap-3 max-w-sm", children: [_jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { children: [_jsxs("h3", { className: "text-white font-bold text-sm mb-1 flex items-center gap-2", children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-primary animate-pulse" }), "Update Available"] }), _jsx("p", { className: "text-zinc-400 text-xs", children: "A new version of GoUnion is available. Update now for the latest features." })] }), _jsx("button", { onClick: () => setNeedRefresh(false), className: "text-zinc-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5", children: _jsx(X, { size: 16 }) })] }), _jsxs("button", { onClick: () => updateServiceWorker(true), className: "w-full bg-white text-black py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors", children: [_jsx(RefreshCw, { size: 14, className: "animate-spin-slow" }), "Update Now"] })] })) }));
};
