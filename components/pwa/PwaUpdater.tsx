import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';

export const PwaUpdater = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-[9999] glass-panel rounded-2xl p-4 shadow-2xl border border-primary/20 flex flex-col gap-3 max-w-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-white font-bold text-sm mb-1 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Update Available
              </h3>
              <p className="text-zinc-400 text-xs">
                A new version of GoUnion is available. Update now for the latest features.
              </p>
            </div>
            <button
              onClick={() => setNeedRefresh(false)}
              className="text-zinc-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
            >
              <X size={16} />
            </button>
          </div>
          
          <button
            onClick={() => updateServiceWorker(true)}
            className="w-full bg-white text-black py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"
          >
            <RefreshCw size={14} className="animate-spin-slow" />
            Update Now
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
