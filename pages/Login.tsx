import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  ChevronLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuthStore } from "../store";
import { usePwaStore } from "../store/pwaStore";
import { api } from "../services/api";

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
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
    } catch (error: any) {
      console.error(error);
      setError(
        error.response?.data?.detail ||
          "Authentication failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#030303] flex items-center justify-center relative overflow-hidden selection:bg-primary/30">
      {/* Immersive Mesh Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] opacity-40 animate-pulse" />
      </div>

      <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg z-10 px-6"
      >
        <div className="glass-panel p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent opacity-50 group-hover:opacity-100 transition-opacity" />
          
          <div className="mb-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white text-black flex items-center justify-center font-serif font-black text-3xl mx-auto mb-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              G
            </div>
            <h1 className="font-serif text-4xl font-bold text-white mb-2 tracking-tight">
              {isSignup ? "Create Legacy" : "Welcome Back"}
            </h1>
            <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px]">
              {isSignup ? "Join the elite campus collective" : "Secure access to your network"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-500 text-xs font-bold flex items-center gap-3 overflow-hidden"
                >
                  <div className="w-1 h-1 rounded-full bg-red-500 animate-ping" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <AnimatePresence>
                {isSignup && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-2"
                    >
                      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Full Name</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-white/5 border border-white/5 rounded-xl py-4 px-6 text-white placeholder:text-zinc-700 focus:outline-none focus:border-primary/30 transition-all font-medium"
                        placeholder="Alex Rivera"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-2"
                    >
                      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Username</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-white/5 border border-white/5 rounded-xl py-4 px-6 text-white placeholder:text-zinc-700 focus:outline-none focus:border-primary/30 transition-all font-medium"
                        placeholder="arivera"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Student Email</label>
                <input
                  type="email"
                  required
                  className="w-full bg-white/5 border border-white/5 rounded-xl py-4 px-6 text-white placeholder:text-zinc-700 focus:outline-none focus:border-primary/30 transition-all font-medium"
                  placeholder="student@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Secret Key</label>
                  {!isSignup && (
                    <Link to="/forgot-password" size={2} className="text-[10px] font-bold text-zinc-600 hover:text-primary transition-colors uppercase tracking-widest">
                      Lost info?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full bg-white/5 border border-white/5 rounded-xl py-4 px-6 pr-12 text-white placeholder:text-zinc-700 focus:outline-none focus:border-primary/30 transition-all font-medium"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isSignup ? "Initialize Profile" : "Authenticate Account"}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError(null);
                }}
                className="text-sm text-zinc-500 hover:text-white transition-colors"
              >
                {isSignup ? (
                  <span className="flex items-center gap-2 justify-center">
                    Already a member? <span className="text-white font-bold">Sign In</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2 justify-center">
                    New to the network? <span className="text-white font-bold">Register Now</span>
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-12 flex justify-center gap-12 text-[#222]">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-primary opacity-30" />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Real-time</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-accent opacity-30" />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Encrypted</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
