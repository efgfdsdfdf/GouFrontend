import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
const ToastContext = createContext(undefined);
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const toast = useCallback((message, type = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);
    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };
    return (_jsxs(ToastContext.Provider, { value: { toast }, children: [children, _jsx("div", { className: "fixed bottom-24 md:bottom-8 right-8 z-[999] flex flex-col gap-3 pointer-events-none", children: _jsx(AnimatePresence, { children: toasts.map((t) => (_jsx(motion.div, { initial: { opacity: 0, x: 50, scale: 0.9 }, animate: { opacity: 1, x: 0, scale: 1 }, exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }, className: "pointer-events-auto", children: _jsxs("div", { className: `
                flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-2xl border
                ${t.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                t.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                    'bg-white/10 border-white/10 text-white'}
              `, children: [t.type === 'success' && _jsx(CheckCircle, { size: 18 }), t.type === 'error' && _jsx(XCircle, { size: 18 }), t.type === 'info' && _jsx(AlertCircle, { size: 18 }), _jsx("p", { className: "text-[11px] font-black uppercase tracking-widest", children: t.message }), _jsx("button", { onClick: () => removeToast(t.id), className: "ml-2 p-1 hover:bg-white/5 rounded-lg transition-colors", children: _jsx(X, { size: 14 }) })] }) }, t.id))) }) })] }));
};
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context)
        throw new Error('useToast must be used within ToastProvider');
    return context;
};
