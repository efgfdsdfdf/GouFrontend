import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";

export const ConfirmEmail = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "your email";

  return (
    <div className="min-h-screen w-full bg-[#030303] flex items-center justify-center px-4 py-10 text-white">
      <div className="w-full max-w-xl rounded-[2.5rem] border border-white/10 bg-[#111115]/90 p-10 shadow-2xl backdrop-blur-2xl">
        <div className="mx-auto mb-8 w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-primary">
          <Mail size={34} />
        </div>
        <h1 className="text-4xl font-black text-white text-center mb-4">Check your inbox</h1>
        <p className="text-center text-white/60 mb-8 leading-relaxed">
          We sent a confirmation link to <span className="text-white font-semibold">{email}</span>.
          Open your email, confirm your address, then come back and sign in to GoUnion.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <a
            href="mailto:"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white transition hover:bg-white/10"
          >
            <ArrowLeft size={16} /> Open email app
          </a>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-4 text-sm font-bold uppercase tracking-[0.2em] text-black transition hover:brightness-95"
          >
            Back to Login
          </Link>
        </div>
        <p className="mt-6 text-center text-xs uppercase tracking-[0.25em] text-white/20">
          If you did not receive the email, please try again or contact support.
        </p>
      </div>
    </div>
  );
};
