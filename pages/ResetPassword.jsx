import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ArrowRight, CheckCircle2, AlertTriangle, Sparkles, Zap, Eye, EyeOff } from "lucide-react";
import { api } from "../services/api";
/**
 * Supabase appends the recovery token to the URL hash fragment when
 * redirecting after a password reset email click. It looks like:
 *   https://yourapp.com/reset-password#access_token=XXX&type=recovery&...
 *
 * Legacy links from HashRouter may still look like:
 *   https://yourapp.com/#/reset-password#access_token=XXX&type=recovery&...
 *
 * We support both formats.
 */
function getTokenFromUrl() {
    // Preferred format: /reset-password#access_token=... or /reset-password#token=...
    if (window.location.hash.startsWith("#access_token=") || window.location.hash.startsWith("#token=")) {
        const params = new URLSearchParams(window.location.hash.slice(1));
        return params.get("access_token") || params.get("token");
    }
    // Legacy format: #/reset-password#access_token=...
    const fullHash = window.location.hash;
    const secondHash = fullHash.indexOf("#", 1);
    if (secondHash !== -1) {
        const params = new URLSearchParams(fullHash.slice(secondHash + 1));
        return params.get("access_token") || params.get("token");
    }
    // Final fallback in case token is provided via query params.
    const queryParams = new URLSearchParams(window.location.search);
    return queryParams.get("access_token") || queryParams.get("token");
}
export const ResetPassword = () => {
    const navigate = useNavigate();
    const [token, setToken] = useState(null);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        const t = getTokenFromUrl();
        setToken(t);
    }, []);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (!token) {
            setError("No reset token found. Please request a new reset link.");
            return;
        }
        setLoading(true);
        try {
            await api.auth.resetPassword(token, password);
            setSuccess(true);
            setTimeout(() => navigate("/login"), 3000);
        }
        catch (err) {
            setError(err.response?.data?.detail || "Reset failed. The link may have expired.");
        }
        finally {
            setLoading(false);
        }
    };
    const noToken = token === null && !loading;
    return (_jsxs("div", { className: "min-h-screen w-full bg-[#050505] flex items-center justify-center relative overflow-hidden font-sans", children: [_jsxs("div", { className: "absolute inset-0 overflow-hidden pointer-events-none", children: [_jsx(motion.div, { animate: { scale: [1, 1.2, 1], x: [0, 60, 0], y: [0, 30, 0] }, transition: { duration: 20, repeat: Infinity, ease: "linear" }, className: "absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-500/20 rounded-full blur-[150px] opacity-30" }), _jsx(motion.div, { animate: { scale: [1, 1.3, 1], x: [0, -40, 0], y: [0, -50, 0] }, transition: { duration: 25, repeat: Infinity, ease: "linear" }, className: "absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-400/10 rounded-full blur-[120px] opacity-20" })] }), _jsx("div", { className: "absolute inset-0 opacity-[0.03] pointer-events-none bg-[length:50px_50px] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)]" }), _jsx(motion.div, { initial: { opacity: 0, scale: 0.95, y: 20 }, animate: { opacity: 1, scale: 1, y: 0 }, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }, className: "w-full max-w-lg relative z-10 px-6", children: _jsxs("div", { className: "relative group", children: [_jsx("div", { className: "absolute -inset-1 bg-gradient-to-tr from-blue-400/20 via-blue-400/5 to-blue-500/20 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition duration-1000" }), _jsxs("div", { className: "bg-[#0f0f11]/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden relative", children: [_jsxs("div", { className: "pt-12 pb-8 px-10 text-center relative", children: [_jsxs(motion.div, { initial: { rotate: -10, scale: 0.8 }, animate: { rotate: 0, scale: 1 }, transition: { delay: 0.3, type: "spring" }, className: "w-24 h-24 bg-white/5 mx-auto mb-8 rounded-[2.5rem] flex items-center justify-center relative overflow-hidden shadow-[0_20px_40px_rgba(255,255,255,0.05)] border border-white/10", children: [_jsx(motion.div, { animate: { y: [0, -100] }, transition: { duration: 3, repeat: Infinity, ease: "linear" }, className: "absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent h-[200%]" }), _jsx("img", { src: "/logo.png", alt: "GoUnion", className: "w-16 h-16 object-contain relative z-10" })] }), _jsx("h1", { className: "text-4xl font-black text-white tracking-tighter mb-3", children: "New Password" }), _jsx("p", { className: "text-zinc-500 font-bold uppercase tracking-widest text-[10px]", children: success ? "All set — redirecting..." : "Choose a strong new password" })] }), _jsxs("div", { className: "px-10 pb-12 space-y-5", children: [_jsx(AnimatePresence, { mode: "popLayout", children: error && (_jsxs(motion.div, { initial: { opacity: 0, y: -10, scale: 0.95 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, scale: 0.95 }, className: "p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-3", children: [_jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" }), error] }, "error")) }), _jsx(AnimatePresence, { mode: "wait", children: success ? (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "flex flex-col items-center gap-5 py-6 text-center", children: [_jsx(motion.div, { initial: { scale: 0 }, animate: { scale: 1 }, transition: { type: "spring", delay: 0.1 }, className: "w-20 h-20 bg-green-500/10 rounded-[2rem] flex items-center justify-center border border-green-500/20", children: _jsx(CheckCircle2, { size: 36, className: "text-green-400" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-white font-black text-lg tracking-tight mb-2", children: "Password Updated!" }), _jsx("p", { className: "text-zinc-500 text-sm font-medium", children: "Redirecting you to login in a moment..." })] })] }, "success")) : noToken ? (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "flex flex-col items-center gap-5 py-6 text-center", children: [_jsx("div", { className: "w-20 h-20 bg-yellow-500/10 rounded-[2rem] flex items-center justify-center border border-yellow-500/20", children: _jsx(AlertTriangle, { size: 36, className: "text-yellow-400" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-white font-black text-lg tracking-tight mb-2", children: "Link Invalid" }), _jsxs("p", { className: "text-zinc-500 text-sm font-medium leading-relaxed", children: ["This reset link is invalid or has already been used.", _jsx("br", {}), "Please request a new one."] })] }), _jsx(Link, { to: "/forgot-password", className: "px-8 py-3 bg-blue-500 text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-blue-500/20", children: "Request New Link" })] }, "no-token")) : (_jsxs(motion.form, { onSubmit: handleSubmit, className: "space-y-5", initial: { opacity: 0 }, animate: { opacity: 1 }, children: [_jsxs("div", { className: "space-y-2", children: [_jsxs("label", { className: "text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-2", children: [_jsx(Lock, { size: 12, className: "text-blue-400" }), "New Password"] }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: showPassword ? "text" : "password", required: true, value: password, onChange: (e) => setPassword(e.target.value), placeholder: "Minimum 8 characters", className: "w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 px-6 pr-14 text-white placeholder:text-zinc-700 focus:outline-none focus:border-blue-400/30 focus:bg-white/[0.05] transition-all font-bold text-sm" }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors", children: showPassword ? _jsx(EyeOff, { size: 16 }) : _jsx(Eye, { size: 16 }) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("label", { className: "text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-2", children: [_jsx(Lock, { size: 12, className: "text-blue-400" }), "Confirm Password"] }), _jsx("input", { type: showPassword ? "text" : "password", required: true, value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), placeholder: "Repeat your new password", className: "w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 px-6 text-white placeholder:text-zinc-700 focus:outline-none focus:border-blue-400/30 focus:bg-white/[0.05] transition-all font-bold text-sm" })] }), password.length > 0 && (_jsxs("div", { className: "space-y-1.5", children: [_jsx("div", { className: "flex gap-1", children: [1, 2, 3, 4].map((level) => (_jsx("div", { className: `h-1 flex-1 rounded-full transition-all duration-300 ${password.length >= level * 3
                                                                        ? level <= 1
                                                                            ? "bg-red-500"
                                                                            : level <= 2
                                                                                ? "bg-yellow-500"
                                                                                : level <= 3
                                                                                    ? "bg-blue-400"
                                                                                    : "bg-green-400"
                                                                        : "bg-white/10"}` }, level))) }), _jsx("p", { className: "text-[10px] text-zinc-600 font-bold ml-1", children: password.length < 4
                                                                    ? "Too weak"
                                                                    : password.length < 8
                                                                        ? "Getting stronger"
                                                                        : password.length < 12
                                                                            ? "Good"
                                                                            : "Strong ✓" })] })), _jsx("div", { className: "pt-2", children: _jsx(motion.button, { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, type: "submit", disabled: loading, className: "w-full h-14 bg-blue-500 text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl shadow-blue-500/20 group/btn disabled:opacity-60", children: loading ? (_jsx(motion.div, { animate: { rotate: 360 }, transition: { duration: 1, repeat: Infinity, ease: "linear" }, className: "w-5 h-5 border-2 border-black/30 border-t-black rounded-full" })) : (_jsxs(_Fragment, { children: [_jsx("span", { children: "Update Password" }), _jsx(ArrowRight, { size: 18, className: "transition-transform group-hover/btn:translate-x-1" })] })) }) })] }, "form")) })] })] }), _jsxs("div", { className: "mt-12 flex justify-center gap-12 text-zinc-700", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Sparkles, { size: 14, className: "text-blue-400/40" }), _jsx("span", { className: "text-[10px] font-black uppercase tracking-widest", children: "Secure" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Zap, { size: 14, className: "text-blue-400/40" }), _jsx("span", { className: "text-[10px] font-black uppercase tracking-widest", children: "Encrypted" })] })] })] }) })] }));
};
