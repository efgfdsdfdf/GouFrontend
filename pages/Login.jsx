import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Zap, Sparkles, Eye, EyeOff, } from "lucide-react";
import { useAuthStore } from "../store";
import { api, keepAlive } from "../services/api";
export const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [isWakingUp, setIsWakingUp] = useState(false);

    // Wake the Render free-tier server as soon as the login page loads
    useEffect(() => {
        keepAlive();
        const handler = (e) => setIsWakingUp(e.detail.isWaking);
        window.addEventListener('gounion-server-waking', handler);
        return () => window.removeEventListener('gounion-server-waking', handler);
    }, []);
    const [isSignup, setIsSignup] = useState(false);
    const [error, setError] = useState(null);
    const [confirmationEmail, setConfirmationEmail] = useState(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (isSignup) {
                await api.auth.signup({ username, email, password, fullName });
                setConfirmationEmail(email);
                navigate(`/confirm-email?email=${encodeURIComponent(email)}`);
                return;
            }
            const response = await api.auth.login({ email, password });
            login(response.user, response.access_token);
        }
        catch (error) {
            console.error(error);
            const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
            setError(
                isTimeout
                    ? "Server is still waking up. Please try again in a moment."
                    : error.response?.data?.detail || "Authentication failed. Please try again."
            );
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen w-full bg-[#030303] flex items-center justify-center relative overflow-hidden selection:bg-primary/30", children: [_jsxs("div", { className: "absolute inset-0 overflow-hidden pointer-events-none", children: [_jsx("div", { className: "absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] opacity-40 animate-pulse" }), _jsx("div", { className: "absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] opacity-40 animate-pulse" })] }), _jsx("div", { className: "absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none" }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }, className: "w-full max-w-lg z-10 px-6", children: [_jsxs("div", { className: "glass-panel p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden group", children: [_jsx("div", { className: "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent opacity-50 group-hover:opacity-100 transition-opacity" }), _jsxs("div", { className: "mb-10 text-center", children: [_jsx("div", { className: "w-16 h-16 rounded-2xl bg-white text-black flex items-center justify-center font-serif font-black text-3xl mx-auto mb-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]", children: "G" }), _jsx("h1", { className: "font-serif text-4xl font-bold text-white mb-2 tracking-tight", children: isSignup ? "Create Profile" : "Sign In" }), _jsx("p", { className: "text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px]", children: isSignup ? "Join your campus network" : "Access your account" })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsx(AnimatePresence, { mode: "wait", children: error && (_jsxs(motion.div, { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: "auto" }, exit: { opacity: 0, height: 0 }, className: "bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-500 text-xs font-bold flex items-center gap-3 overflow-hidden", children: [_jsx("div", { className: "w-1 h-1 rounded-full bg-red-500 animate-ping" }), error] })) }), _jsxs("div", { className: "space-y-4", children: [_jsx(AnimatePresence, { children: isSignup && (_jsxs(_Fragment, { children: [_jsxs(motion.div, { initial: { opacity: 0, x: -10 }, animate: { opacity: 1, x: 0 }, className: "space-y-2", children: [_jsx("label", { className: "text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1", children: "Full Name" }), _jsx("input", { type: "text", required: true, className: "w-full bg-white/5 border border-white/5 rounded-xl py-4 px-6 text-white placeholder:text-zinc-700 focus:outline-none focus:border-primary/30 transition-all font-medium", placeholder: "Alex Rivera", value: fullName, onChange: (e) => setFullName(e.target.value) })] }), _jsxs(motion.div, { initial: { opacity: 0, x: 10 }, animate: { opacity: 1, x: 0 }, className: "space-y-2", children: [_jsx("label", { className: "text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1", children: "Username" }), _jsx("input", { type: "text", required: true, className: "w-full bg-white/5 border border-white/5 rounded-xl py-4 px-6 text-white placeholder:text-zinc-700 focus:outline-none focus:border-primary/30 transition-all font-medium", placeholder: "arivera", value: username, onChange: (e) => setUsername(e.target.value) })] })] })) }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1", children: "Student Email" }), _jsx("input", { type: "email", required: true, className: "w-full bg-white/5 border border-white/5 rounded-xl py-4 px-6 text-white placeholder:text-zinc-700 focus:outline-none focus:border-primary/30 transition-all font-medium", placeholder: "student@university.edu", value: email, onChange: (e) => setEmail(e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between items-center ml-1", children: [_jsx("label", { className: "text-[10px] font-black text-zinc-600 uppercase tracking-widest", children: "Secret Key" }), !isSignup && (_jsx(Link, { to: "/forgot-password", size: 2, className: "text-[10px] font-bold text-zinc-600 hover:text-primary transition-colors uppercase tracking-widest", children: "Lost info?" }))] }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: showPassword ? "text" : "password", required: true, className: "w-full bg-white/5 border border-white/5 rounded-xl py-4 px-6 pr-12 text-white placeholder:text-zinc-700 focus:outline-none focus:border-primary/30 transition-all font-medium", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: password, onChange: (e) => setPassword(e.target.value) }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors", children: showPassword ? _jsx(EyeOff, { size: 18 }) : _jsx(Eye, { size: 18 }) })] })] })] }), isWakingUp && _jsxs("div", { className: "flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-400 text-xs font-bold", children: [_jsx("div", { className: "w-4 h-4 border-2 border-amber-400/40 border-t-amber-400 rounded-full animate-spin shrink-0" }), "Server is waking up, this may take up to 30 seconds…"] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full h-14 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98]", children: loading ? (_jsx("div", { className: "w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" })) : (_jsxs(_Fragment, { children: [_jsx("span", { children: isSignup ? "Initialize Profile" : "Authenticate Account" }), _jsx(ArrowRight, { size: 16 })] })) }), _jsx("div", { className: "text-center pt-4", children: _jsx("button", { type: "button", onClick: () => {
                                                setIsSignup(!isSignup);
                                                setError(null);
                                            }, className: "text-sm text-zinc-500 hover:text-white transition-colors", children: isSignup ? (_jsxs("span", { className: "flex items-center gap-2 justify-center", children: ["Already a member? ", _jsx("span", { className: "text-white font-bold", children: "Sign In" })] })) : (_jsxs("span", { className: "flex items-center gap-2 justify-center", children: ["New to the network? ", _jsx("span", { className: "text-white font-bold", children: "Register Now" })] })) }) })] })] }), _jsxs("div", { className: "mt-12 flex justify-center gap-12 text-[#222]", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Sparkles, { size: 14, className: "text-primary opacity-30" }), _jsx("span", { className: "text-[10px] font-black uppercase tracking-widest opacity-30", children: "Real-time" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Zap, { size: 14, className: "text-accent opacity-30" }), _jsx("span", { className: "text-[10px] font-black uppercase tracking-widest opacity-30", children: "Encrypted" })] })] })] })] }));
};
