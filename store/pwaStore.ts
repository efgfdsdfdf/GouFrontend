import { create } from 'zustand';

interface PwaState {
  isInstalled: boolean;
  installPrompt: any | null;
  setInstallPrompt: (prompt: any) => void;
  clearInstallPrompt: () => void;
  setInstalled: (status: boolean) => void;
}

export const usePwaStore = create<PwaState>((set) => ({
  isInstalled: false,
  installPrompt: null,
  setInstallPrompt: (prompt) => set({ installPrompt: prompt }),
  clearInstallPrompt: () => set({ installPrompt: null }),
  setInstalled: (status) => set({ isInstalled: status }),
}));
