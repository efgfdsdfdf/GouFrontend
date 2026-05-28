import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../store";

export const WelcomeBack = () => {
  const { user, unlockSession, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleWelcomeBack = () => {
    unlockSession();
    navigate("/");
  };

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-[#030303] flex items-center justify-center relative overflow-hidden selection:bg-primary/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] opacity-40 animate-pulse" />
      </div>

      <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm z-10 px-6"
      >
        <div className="glass-panel p-8 md:p-10 rounded-[2.5rem] relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent opacity-50" />
          
          <div className="mx-auto w-24 h-24 rounded-full overflow-hidden mb-6 border-2 border-white/10">
            <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
          </div>
          
          <h1 className="font-serif text-3xl font-bold text-white mb-2">
            Welcome back, {user.fullName.split(' ')[0]}!
          </h1>
          <p className="text-zinc-400 text-sm mb-8">
            Continue to your network
          </p>

          <button
            onClick={handleWelcomeBack}
            className="w-full h-14 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98] mb-4"
          >
            Welcome Back
          </button>

          <button
            onClick={handleSignOut}
            className="text-sm text-zinc-500 hover:text-white transition-colors"
          >
            Sign in with another account
          </button>
        </div>
      </motion.div>
    </div>
  );
};
