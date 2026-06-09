import { create } from 'zustand';
export const usePwaStore = create((set) => ({
    isInstalled: false,
    installPrompt: null,
    setInstallPrompt: (prompt) => set({ installPrompt: prompt }),
    clearInstallPrompt: () => set({ installPrompt: null }),
    setInstalled: (status) => set({ isInstalled: status }),
}));
