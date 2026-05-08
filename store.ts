import { create } from 'zustand';
import { User } from './types';
import { authStorage } from './utils/persistentStorage';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  authStorage.migrateLegacySessionToLocal();

  const token = authStorage.getItem('access_token');
  const userStr = authStorage.getItem('user_data');
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    console.error("Failed to parse user data", e);
  }

  return {
    user: user,
    token: token,
    isAuthenticated: !!token,
    login: (user, token) => {
      authStorage.setItem('access_token', token);
      authStorage.setItem('user_data', JSON.stringify(user));
      authStorage.setItem('user_id', user.id);
      set({ user, token, isAuthenticated: true });
    },
    logout: () => {
      authStorage.clearAuth();
      set({ user: null, token: null, isAuthenticated: false });
    },
  };
});

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
