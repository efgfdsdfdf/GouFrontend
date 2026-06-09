import { create } from 'zustand';
import { authStorage } from './utils/persistentStorage';
export const useAuthStore = create((set) => {
    authStorage.migrateLegacySessionToLocal();
    const token = authStorage.getItem('access_token');
    const isSessionLockedStr = authStorage.getItem('session_locked');
    const isSessionLocked = isSessionLockedStr === 'true';
    const refreshToken = authStorage.getItem('refresh_token');
    const userStr = authStorage.getItem('user_data');
    let user = null;
    try {
        user = userStr ? JSON.parse(userStr) : null;
    }
    catch (e) {
        console.error("Failed to parse user data", e);
    }
    return {
        user: user,
        token: token,
        isAuthenticated: !!user && (!!token || !!refreshToken) && !isSessionLocked,
        isSessionLocked: isSessionLocked,
        login: (user, token) => {
            authStorage.setItem('access_token', token);
            authStorage.setItem('user_data', JSON.stringify(user));
            authStorage.setItem('user_id', user.id);
            set({ user, token, isAuthenticated: true });
        },
        updateUser: (user) => {
            authStorage.setItem('user_data', JSON.stringify(user));
            set({ user });
        },
        logout: () => {
            authStorage.clearAuth();
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('gounion-auth-logout'));
            }
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
export const useUIStore = create((set) => ({
    sidebarOpen: false,
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
