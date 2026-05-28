import { create } from 'zustand';
import { User } from './types';
import { authStorage } from './utils/persistentStorage';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isSessionLocked: boolean;
  login: (user: User, token: string) => void;
  updateUser: (user: User) => void;
  logout: () => void;
  lockSession: () => void;
  unlockSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  authStorage.migrateLegacySessionToLocal();

  const token = authStorage.getItem('access_token');
  const refreshToken = authStorage.getItem('refresh_token');
  const isSessionLockedStr = authStorage.getItem('session_locked');
  const isSessionLocked = isSessionLockedStr === 'true';
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
    isAuthenticated: !!user && (!!token || !!refreshToken) && !isSessionLockedStr,
    isSessionLocked: isSessionLocked,
    login: (user, token) => {
      authStorage.setItem('access_token', token);
      authStorage.setItem('user_data', JSON.stringify(user));
      authStorage.setItem('user_id', user.id);
      authStorage.removeItem('session_locked');
      set({ user, token, isAuthenticated: true, isSessionLocked: false });
    },
    updateUser: (user) => {
      authStorage.setItem('user_data', JSON.stringify(user));
      set({ user });
    },
    logout: () => {
      authStorage.clearAuth();
      set({ user: null, token: null, isAuthenticated: false, isSessionLocked: false });
    },
    lockSession: () => {
      authStorage.setItem('session_locked', 'true');
      set({ isAuthenticated: false, isSessionLocked: true });
    },
    unlockSession: () => {
      authStorage.removeItem('session_locked');
      set((state) => ({ isAuthenticated: true, isSessionLocked: false }));
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
