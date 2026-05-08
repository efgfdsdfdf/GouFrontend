import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Download,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  ChevronLeft,
  AlertTriangle,
} from "lucide-react";
import { APK_DOWNLOAD_URL, APK_FILE_NAME, APK_VERSION } from "../release";

const installSteps = [
  "Tap Download APK and wait for the file to finish.",
  "Open the downloaded file from your browser or Files app.",
  "If prompted, allow installs from this source in Android settings.",
  "Tap Install and open GoUnion.",
];

export const DownloadPage = () => {
  const markApkDownloaded = () => {
    try {
      localStorage.setItem("gounion_apk_downloaded", "true");
    } catch {
      // Ignore storage errors in restricted contexts.
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#030303] text-white relative overflow-hidden selection:bg-primary/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[45%] h-[45%] bg-primary/20 rounded-full blur-[140px] opacity-35 animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[45%] h-[45%] bg-accent/25 rounded-full blur-[140px] opacity-35 animate-pulse" />
      </div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.12] mix-blend-overlay pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10 md:py-14">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
        >
          <ChevronLeft size={14} />
          Back to Login
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 glass-panel rounded-[2rem] p-8 md:p-12"
        >
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500 mb-3">
                Android Install
              </p>
              <h1 className="font-serif text-4xl md:text-5xl leading-tight tracking-tight">
                Download GoUnion APK
              </h1>
              <p className="mt-4 text-zinc-300 max-w-2xl leading-relaxed">
                Official Android package for the GoUnion community app. Install
                directly on your device in minutes.
              </p>
            </div>

            <a
              href={APK_DOWNLOAD_URL}
              download={APK_FILE_NAME}
              onClick={markApkDownloaded}
              className="inline-flex items-center justify-center gap-3 h-12 px-6 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-[0.16em] hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.14)]"
            >
              <Download size={16} />
              Download APK
            </a>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Smartphone size={16} />
                <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400">
                  Compatibility
                </p>
              </div>
              <p className="text-sm text-zinc-200">Android 8.0 and above</p>
            </div>
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
              <div className="flex items-center gap-2 text-primary mb-2">
                <ShieldCheck size={16} />
                <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400">
                  Package Name
                </p>
              </div>
              <p className="text-sm text-zinc-200">com.gounion.app</p>
            </div>
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Download size={16} />
                <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400">
                  File
                </p>
              </div>
              <p className="text-sm text-zinc-200">{APK_FILE_NAME}</p>
            </div>
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Download size={16} />
                <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400">
                  Version
                </p>
              </div>
              <p className="text-sm text-zinc-200">{APK_VERSION}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <section className="glass-panel rounded-[1.5rem] p-7">
            <h2 className="font-serif text-2xl mb-5">Installation Steps</h2>
            <div className="space-y-4">
              {installSteps.map((step, index) => (
                <div key={step} className="flex gap-3">
                  <div className="mt-0.5 text-primary">
                    <CheckCircle2 size={18} />
                  </div>
                  <p className="text-sm text-zinc-200 leading-relaxed">
                    <span className="font-bold text-white mr-2">
                      {index + 1}.
                    </span>
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel rounded-[1.5rem] p-7">
            <h2 className="font-serif text-2xl mb-5">If Install Is Blocked</h2>
            <div className="flex items-start gap-3 rounded-xl bg-amber-300/10 border border-amber-300/30 p-4">
              <AlertTriangle size={18} className="text-amber-300 mt-0.5" />
              <p className="text-sm text-zinc-100 leading-relaxed">
                Android may block direct APK installs by default. Open
                <span className="font-semibold"> Settings </span>
                and enable installs for your browser or file manager, then run
                the APK again.
              </p>
            </div>

            <a
              href={APK_DOWNLOAD_URL}
              download={APK_FILE_NAME}
              onClick={markApkDownloaded}
              className="mt-5 inline-flex w-full items-center justify-center gap-3 h-12 rounded-xl bg-primary text-black font-black text-xs uppercase tracking-[0.16em] hover:brightness-95 transition-all"
            >
              <Download size={16} />
              Download Again
            </a>
            <Link
              to="/login"
              onClick={markApkDownloaded}
              className="mt-3 inline-flex w-full items-center justify-center h-11 rounded-xl border border-white/20 text-white font-bold text-xs uppercase tracking-[0.16em] hover:bg-white/5 transition-all"
            >
              Continue To Login
            </Link>
          </section>
        </motion.div>
      </div>
    </div>
  );
};
