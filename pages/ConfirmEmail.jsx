import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";
import { api } from "../services/api";

const OTP_LENGTH = 6;

export const ConfirmEmail = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const navigate = useNavigate();

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);
  const cooldownRef = useRef(null);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(cooldownRef.current);
  }, [resendCooldown]);

  const focusNext = (index) => {
    if (index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };
  const focusPrev = (index) => {
    if (index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setErrorMsg("");
    if (digit) focusNext(index);
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      } else {
        focusPrev(index);
      }
    } else if (e.key === "ArrowLeft") {
      focusPrev(index);
    } else if (e.key === "ArrowRight") {
      focusNext(index);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleVerify = async () => {
    const otp = digits.join("");
    if (otp.length < OTP_LENGTH) {
      setErrorMsg("Please enter all 6 digits.");
      return;
    }
    if (!email) {
      setErrorMsg("Email address is missing. Please sign up again.");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      await api.auth.verifyOtp(email, otp);
      setStatus("success");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setStatus("idle");
      setErrorMsg(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Invalid or expired code. Please try again."
      );
      setDigits(Array(OTP_LENGTH).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
  };

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return;
    try {
      await api.auth.resendOtp(email);
      setResendCooldown(60);
      setErrorMsg("");
      setDigits(Array(OTP_LENGTH).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch {
      setErrorMsg("Could not resend code. Please try again.");
    }
  };

  const handleFormKeyDown = (e) => {
    if (e.key === "Enter" && digits.join("").length === OTP_LENGTH) {
      handleVerify();
    }
  };

  return (
    <div
      className="min-h-screen w-full bg-[#030303] flex items-center justify-center px-4 py-10 text-white"
      onKeyDown={handleFormKeyDown}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="relative rounded-[2.5rem] border border-white/10 bg-[#111115]/90 px-8 py-10 shadow-2xl backdrop-blur-2xl overflow-hidden">
          {/* top accent line */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary via-accent to-primary opacity-60" />

          <AnimatePresence mode="wait">
            {status === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center gap-5 py-4"
              >
                <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 size={40} className="text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white tracking-tighter mb-2">Verified!</h1>
                  <p className="text-white/50 text-sm leading-relaxed">
                    Your email has been confirmed.<br />Redirecting you to login…
                  </p>
                </div>
                <Link
                  to="/login"
                  className="mt-2 w-full py-4 bg-white text-black font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-white/90 transition-colors text-center"
                >
                  Go to Login
                </Link>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5">
                    <span className="font-serif font-black text-3xl text-white">G</span>
                  </div>
                  <h1 className="text-3xl font-black text-white tracking-tighter mb-2">
                    Verify your email
                  </h1>
                  <p className="text-white/40 text-sm leading-relaxed">
                    We sent a 6-digit code to{" "}
                    {email ? (
                      <span className="text-white font-semibold">{email}</span>
                    ) : (
                      "your email address"
                    )}
                    . It expires in 15 minutes.
                  </p>
                </div>

                {/* OTP inputs */}
                <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => (inputRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className={[
                        "w-12 h-14 rounded-xl border text-center text-2xl font-black outline-none transition-all",
                        d
                          ? "border-primary bg-primary/10 text-white"
                          : "border-white/10 bg-white/5 text-white",
                        "focus:border-primary focus:bg-primary/10 focus:ring-2 focus:ring-primary/20",
                        errorMsg ? "border-red-500/60 bg-red-500/10" : "",
                      ].join(" ")}
                    />
                  ))}
                </div>

                {/* Error message */}
                <AnimatePresence>
                  {errorMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5 text-red-400 text-xs font-bold"
                    >
                      <AlertTriangle size={14} className="shrink-0" />
                      {errorMsg}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Verify button */}
                <button
                  onClick={handleVerify}
                  disabled={status === "loading" || digits.join("").length < OTP_LENGTH}
                  className="w-full h-14 bg-white text-black font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-40 mb-5"
                >
                  {status === "loading" ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full"
                    />
                  ) : (
                    "Verify Email"
                  )}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                    Didn't get it?
                  </span>
                  <div className="h-px flex-1 bg-white/5" />
                </div>

                {/* Resend */}
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all text-xs font-black uppercase tracking-widest disabled:opacity-40"
                >
                  <RotateCcw size={14} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </button>

                {/* Back to login */}
                <div className="mt-6 text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors"
                  >
                    <ArrowLeft size={12} />
                    Back to Login
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
