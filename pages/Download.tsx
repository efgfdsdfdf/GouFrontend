import React from 'react';
import { motion } from 'framer-motion';
import { Download, CheckCircle, Smartphone, Monitor } from 'lucide-react';
import { usePwaStore } from '../store/pwaStore';

export const DownloadPage = () => {
  const { installPrompt, isInstalled } = usePwaStore();

  const handleInstall = async () => {
    if (!installPrompt) return;
    
    // Show the install prompt
    installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    usePwaStore.getState().clearInstallPrompt();
  };

  return (
    <div className="min-h-[80vh] w-full flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] opacity-40 animate-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl z-10 px-6 text-center"
      >
        <div className="w-24 h-24 mx-auto rounded-3xl bg-white text-black flex items-center justify-center font-serif font-black text-5xl mb-8 shadow-[0_0_50px_rgba(255,255,255,0.15)] relative">
          G
          {isInstalled && (
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full border-[3px] border-[#030303]">
              <CheckCircle size={20} className="fill-current text-white bg-emerald-500 rounded-full" />
            </div>
          )}
        </div>

        <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          Install GoUnion
        </h1>
        <p className="text-zinc-400 text-lg mb-12 max-w-lg mx-auto">
          Experience the elite campus network natively on your device. Faster loading, offline access, and a seamless app experience.
        </p>

        <div className="glass-panel p-8 rounded-[2.5rem] relative overflow-hidden group mb-12 text-left">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent opacity-50 group-hover:opacity-100 transition-opacity" />
          
          <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-white">
                <Smartphone className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="font-bold">Mobile App</h3>
                  <p className="text-xs text-zinc-500">Install on iOS & Android</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white">
                <Monitor className="w-6 h-6 text-accent" />
                <div>
                  <h3 className="font-bold">Desktop App</h3>
                  <p className="text-xs text-zinc-500">Install on Windows & Mac</p>
                </div>
              </div>
            </div>

            <div className="w-full md:w-auto flex flex-col items-center gap-3">
              {isInstalled ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-6 py-4 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle size={18} />
                  Already Installed
                </div>
              ) : installPrompt ? (
                <button
                  onClick={handleInstall}
                  className="w-full md:w-auto bg-white text-black px-10 py-4 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98]"
                >
                  <Download size={18} />
                  Install App
                </button>
              ) : (
                <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-xl flex flex-col gap-2 max-w-xs text-center">
                  <span className="text-white font-bold text-sm">How to install:</span>
                  <span className="text-zinc-400 text-xs leading-relaxed">
                    Tap the share icon <span className="inline-block px-1 bg-white/10 rounded">⇧</span> and select <strong>"Add to Home Screen"</strong> or click the install icon in your browser address bar.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
};
