import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { Sidebar } from "./components/layout/Sidebar";
import { RightSidebar } from "./components/layout/RightSidebar";
import { TopNav } from "./components/layout/TopNav";
import { MobileNav } from "./components/layout/MobileNav";
import { Dashboard } from "./pages/Dashboard";
import { Discover } from "./pages/Discover";
import { Login } from "./pages/Login";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { Groups } from "./pages/Groups";
import { Messages } from "./pages/Messages";
import { Profile } from "./pages/Profile";
import { PostDetail } from "./pages/PostDetail";
import { Alumni } from "./pages/Alumni";
import { GroupDetails } from "./pages/GroupDetails";
import { AdminPanel } from "./pages/AdminPanel";
import { Settings } from "./pages/Settings";
import { Notifications } from "./pages/Notifications";
import { DownloadPage } from "./pages/Download";
import { SoundFeed } from "./pages/SoundFeed";
import { ConfirmEmail } from "./pages/ConfirmEmail";
import { ConfirmIdentity } from "./pages/ConfirmIdentity";
import { useAuthStore } from "./store";
import { usePwaStore } from "./store/pwaStore";
import { PwaUpdater } from "./components/pwa/PwaUpdater";
import { API_URL, api } from "./services/api";
import { io as ioClient } from "socket.io-client";
import { authStorage } from "./utils/persistentStorage";
import { ToastProvider, useToast } from "./components/ui/Toast";
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 20,
            refetchOnWindowFocus: false,
        },
    },
});
// Layout Component to wrap authenticated routes
const AppLayout = ({ children }) => {
    const location = useLocation();
    const isDiscover = location.pathname === '/discover';
    const isMessages = location.pathname === '/messages';
    const isHomeFeed = location.pathname === '/';
    return (_jsxs("div", { className: "flex h-screen bg-[#030303] text-white overflow-hidden selection:bg-white/20 relative", children: [!isMessages && _jsx(Sidebar, {}), _jsxs("div", { className: "flex-1 flex flex-col min-w-0 relative", children: [!isMessages && (_jsx("div", { className: "fixed top-0 right-0 left-0 md:left-64 lg:right-80 z-[100]", children: _jsx(TopNav, {}) })), _jsx("main", { className: `flex-1 overflow-y-auto hide-scrollbar ${isMessages ? 'p-0' : `md:pl-64 lg:pr-80 ${isDiscover ? 'pb-0' : 'pb-6'} md:pb-0 pt-16`}`, children: _jsx("div", { className: isMessages
                                ? "h-full w-full"
                                : isHomeFeed
                                    ? "w-full py-4 md:px-8 md:py-6"
                                    : "px-4 py-6 md:px-8 max-w-5xl mx-auto", children: children }) })] }), !isMessages && _jsx(RightSidebar, {}), !isMessages && _jsx(MobileNav, {})] }));
};
const PrivateRoute = ({ children }) => {
    const { isAuthenticated } = useAuthStore();
    if (!isAuthenticated)
        return _jsx(Navigate, { to: "/login", replace: true });
    return _jsx(AppLayout, { children: children });
};
const AppStartupSplash = () => {
    return (_jsx("div", { className: "min-h-screen w-full bg-[#030303] text-white flex items-center justify-center px-6", children: _jsxs("div", { className: "glass-panel rounded-3xl p-10 w-full max-w-sm text-center", children: [_jsx("div", { className: "mx-auto w-16 h-16 rounded-2xl bg-white text-black flex items-center justify-center font-serif font-black text-3xl", children: "G" }), _jsx("h1", { className: "mt-5 font-serif text-3xl tracking-tight", children: "GoUnion" }), _jsx("p", { className: "mt-3 text-sm text-zinc-300 leading-relaxed", children: "Loading" }), _jsx("p", { className: "mt-4 text-2xl text-primary animate-pulse", "aria-hidden": "true", children: "." })] }) }));
};
const PageLoadingDots = () => (_jsx("div", { className: "fixed top-20 left-1/2 z-[220] -translate-x-1/2 rounded-full border border-white/10 bg-black/70 px-4 py-2 shadow-2xl backdrop-blur-xl", children: _jsxs("div", { className: "flex items-center gap-1.5", "aria-label": "Loading page", children: [_jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-white/70 animate-bounce [animation-delay:-0.2s]" }), _jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-white/70 animate-bounce [animation-delay:-0.1s]" }), _jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-white/70 animate-bounce" })] }) }));
const useWebSocket = () => {
    const { user, isAuthenticated } = useAuthStore();
    const { toast } = useToast();
    useEffect(() => {
        if (!isAuthenticated || !user?.id)
            return;
        const currentApiUrl = API_URL || 'http://127.0.0.1:8001';
        const socket = ioClient(currentApiUrl, { transports: ['websocket'], withCredentials: true });
        socket.on('connect', () => {
            socket.emit('authenticate', { userId: user.id });
            socket.emit('user_online', { userId: user.id });
        });
        socket.on('new_message', (data) => {
            try {
                const msg = data?.message || data;
                queryClient.invalidateQueries({ queryKey: ["messages", String(msg.conversation_id)] });
                queryClient.invalidateQueries({ queryKey: ["chats"] });
                queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
                queryClient.invalidateQueries({ queryKey: ["notifications"] });
                if (String(msg.sender_id) !== String(user.id)) {
                    socket.emit('message_delivered', { messageId: msg.id, conversationId: msg.conversation_id, userId: user.id });
                    toast("New message", "info");
                    if ('Notification' in window && Notification.permission === 'granted') {
                        try {
                            new Notification("GoUnion", {
                                body: "You have a new message",
                                icon: '/pwa-192x192.png',
                                tag: `gounion-msg-${Date.now()}`,
                            });
                        }
                        catch { }
                    }
                }
            }
            catch (e) {
                console.error('Socket new_message handler error', e);
            }
        });
        socket.on('message_read', (data) => {
            try {
                const conversationId = String(data?.conversationId || data?.conversation_id);
                if (conversationId) {
                    queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
                    queryClient.invalidateQueries({ queryKey: ["chats"] });
                }
            }
            catch (e) { }
        });
        socket.on('user_online', (data) => {
            try {
                const userId = String(data?.userId || data?.user_id);
                queryClient.setQueryData(["chats"], (old) => {
                    if (!old)
                        return old;
                    return old.map((chat) => {
                        if (String(chat.partner?.id) === userId) {
                            return { ...chat, partner: { ...chat.partner, isOnline: true, lastSeen: null } };
                        }
                        return chat;
                    });
                });
            }
            catch (e) { }
        });
        socket.on('user_offline', (data) => {
            try {
                const userId = String(data?.userId || data?.user_id);
                const lastSeen = data?.lastSeen || data?.last_seen || new Date().toISOString();
                queryClient.setQueryData(["chats"], (old) => {
                    if (!old)
                        return old;
                    return old.map((chat) => {
                        if (String(chat.partner?.id) === userId) {
                            const ago = formatLastSeen(lastSeen);
                            return { ...chat, partner: { ...chat.partner, isOnline: false, lastSeen: ago } };
                        }
                        return chat;
                    });
                });
            }
            catch (e) { }
        });
        socket.on('notification', (data) => {
            try {
                queryClient.invalidateQueries({ queryKey: ["notifications"] });
                queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
                queryClient.invalidateQueries({ queryKey: ["feed"] });
                queryClient.invalidateQueries({ queryKey: ["discover-reels"] });
                if (!window.location.pathname.startsWith("/notifications")) {
                    toast(data.message || "New notification", "info");
                }
            }
            catch (e) {
                console.error('Socket notification handler error', e);
            }
        });
        return () => {
            try {
                socket.emit('user_offline', { userId: user.id });
                socket.disconnect();
            }
            catch (e) { }
        };
    }, [isAuthenticated, user?.id, toast]);
};
const formatLastSeen = (isoString) => {
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime()))
            return "recently";
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1)
            return "just now";
        if (diffMin < 60)
            return `${diffMin}m ago`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24)
            return `${diffHr}h ago`;
        const diffDays = Math.floor(diffHr / 24);
        if (diffDays === 1)
            return "yesterday";
        return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
    catch {
        return "recently";
    }
};
const useNotificationPopups = () => {
    const { isAuthenticated } = useAuthStore();
    const { toast } = useToast();
    const location = useLocation();
    const seenIds = useRef(new Set());
    const initialized = useRef(false);
    const permissionAsked = useRef(false);
    // Request notification permission and subscribe to Push Manager
    useEffect(() => {
        const subscribeToPush = async () => {
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                try {
                    const registration = await navigator.serviceWorker.register('/sw.js');
                    console.log('Service Worker registered for push notifications.');
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted') {
                        // Check if already subscribed
                        let subscription = await registration.pushManager.getSubscription();
                        if (!subscription) {
                            // Convert VAPID key to Uint8Array (Mock VAPID key for now, backend must provide the real one)
                            const publicVapidKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLcg0zTpqhF8';
                            const urlBase64ToUint8Array = (base64String) => {
                                const padding = '='.repeat((4 - base64String.length % 4) % 4);
                                const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
                                const rawData = window.atob(base64);
                                return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
                            };
                            subscription = await registration.pushManager.subscribe({
                                userVisibleOnly: true,
                                applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
                            });
                        }
                        // Send subscription to backend
                        try {
                            // await api.notifications.subscribePush(subscription);
                            console.log('Push subscription ready:', subscription);
                        }
                        catch (e) {
                            console.error('Failed to send push subscription to backend', e);
                        }
                    }
                }
                catch (error) {
                    console.error('Service Worker registration or push subscription failed:', error);
                }
            }
        };
        if (isAuthenticated && !permissionAsked.current) {
            permissionAsked.current = true;
            subscribeToPush();
        }
    }, [isAuthenticated]);
    const { data: notifications = [] } = useQuery({
        queryKey: ["notifications"],
        queryFn: api.notifications.getAll,
        enabled: isAuthenticated,
    });
    const sendNativeNotification = (title, body) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                const n = new Notification(title, {
                    body,
                    icon: '/pwa-192x192.png',
                    badge: '/pwa-192x192.png',
                    tag: `gounion-${Date.now()}`,
                    // Some DOM lib versions omit the Notification vibration option.
                    ...{ vibrate: [200, 100, 200] },
                });
                n.onclick = () => {
                    window.focus();
                    n.close();
                };
            }
            catch {
                // Silent fail on environments that don't support Notification constructor
            }
        }
    };
    useEffect(() => {
        if (!isAuthenticated) {
            seenIds.current.clear();
            initialized.current = false;
            return;
        }
        const unread = notifications.filter((n) => !n.read);
        const isNotificationsPage = location.pathname.startsWith("/notifications");
        if (!initialized.current) {
            unread.forEach((n) => seenIds.current.add(n.id));
            initialized.current = true;
            return;
        }
        if (isNotificationsPage) {
            unread.forEach((n) => seenIds.current.add(n.id));
            return;
        }
        const newNotifications = unread.filter((n) => !seenIds.current.has(n.id));
        if (newNotifications.length === 0)
            return;
        newNotifications.forEach((n) => {
            seenIds.current.add(n.id);
            queryClient.invalidateQueries({ queryKey: ["feed"] });
            queryClient.invalidateQueries({ queryKey: ["discover-reels"] });
            if (n.postId) {
                queryClient.invalidateQueries({ queryKey: ["comments", String(n.postId)] });
            }
        });
        if (newNotifications.length === 1) {
            const notification = newNotifications[0];
            let msg = notification.message;
            if (!msg) {
                switch (notification.type) {
                    case 'like':
                        msg = "liked your post.";
                        break;
                    case 'comment':
                        msg = "commented on your post.";
                        break;
                    case 'follow':
                        msg = "started following you.";
                        break;
                    case 'group_invite':
                        msg = "invited you to a group.";
                        break;
                    case 'group_request':
                        msg = "requested to join your group.";
                        break;
                    default:
                        msg = "interacted with you.";
                        break;
                }
            }
            const actor = notification.actor?.username || notification.actor?.fullName || "Someone";
            toast(`${actor} ${msg}`, "info");
            sendNativeNotification("GoUnion", `${actor} ${msg}`);
        }
        else {
            toast(`You have ${newNotifications.length} new notifications.`, "info");
            sendNativeNotification("GoUnion", `You have ${newNotifications.length} new notifications.`);
        }
    }, [isAuthenticated, notifications, toast, location.pathname]);
};
const AppRoutes = () => {
    const { isAuthenticated, isSessionLocked, login, logout } = useAuthStore();
    const location = useLocation();
    const [showStartupSplash, setShowStartupSplash] = useState(true);
    const [showPageDots, setShowPageDots] = useState(false);
    const { setInstalled } = usePwaStore();
    const { toast } = useToast();
    useEffect(() => {
        // Check if already installed via display-mode
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setInstalled(true);
        }
    }, [setInstalled]);
    useEffect(() => {
        const clearAuthenticatedQueries = () => {
            queryClient.cancelQueries();
            queryClient.clear();
        };
        window.addEventListener("gounion-auth-logout", clearAuthenticatedQueries);
        return () => window.removeEventListener("gounion-auth-logout", clearAuthenticatedQueries);
    }, []);
    useEffect(() => {
        const handleOffline = () => toast("You are offline. Some features may be unavailable.", "error");
        const handleOnline = () => toast("Back online!", "success");
        window.addEventListener("offline", handleOffline);
        window.addEventListener("online", handleOnline);
        return () => {
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("online", handleOnline);
        };
    }, [toast]);
    useEffect(() => {
        const checkAuth = async () => {
            if (authStorage.getItem("session_locked") === "true")
                return;
            const refreshToken = authStorage.getItem("refresh_token");
            const accessToken = authStorage.getItem("access_token");
            if (refreshToken && !accessToken) {
                try {
                    const refreshed = await api.auth.refresh(refreshToken);
                    const freshUser = await api.auth.me();
                    login(freshUser, refreshed.access_token);
                    return;
                }
                catch (e) {
                    const status = e?.response?.status;
                    if (status === 401 || status === 403)
                        logout();
                    return;
                }
            }
            if (accessToken) {
                try {
                    const freshUser = await api.auth.me();
                    login(freshUser, authStorage.getItem("access_token") || accessToken);
                }
                catch (e) {
                    const status = e?.response?.status;
                    const cachedUser = authStorage.getItem("user_data");
                    if ((status === 401 || status === 403) && refreshToken) {
                        try {
                            const refreshed = await api.auth.refresh(refreshToken);
                            const freshUser = await api.auth.me();
                            login(freshUser, refreshed.access_token);
                            return;
                        }
                        catch (refreshError) {
                            const refreshStatus = refreshError?.response?.status;
                            if (refreshStatus === 401 || refreshStatus === 403)
                                logout();
                            return;
                        }
                    }
                    if (status === 401 || status === 403 || (!cachedUser && status !== undefined)) {
                        logout();
                    }
                }
                return;
            }
            logout();
        };
        let cancelled = false;
        const minimumSplash = new Promise((resolve) => window.setTimeout(resolve, 350));
        void Promise.all([checkAuth(), minimumSplash]).finally(() => {
            if (!cancelled)
                setShowStartupSplash(false);
        });
        return () => {
            cancelled = true;
        };
    }, [login, logout]);
    useEffect(() => {
        if (location.pathname === "/messages" || location.pathname === "/discover") {
            setShowPageDots(false);
            return;
        }
        setShowPageDots(true);
        const timer = window.setTimeout(() => setShowPageDots(false), 360);
        return () => window.clearTimeout(timer);
    }, [location.pathname]);
    useWebSocket();
    useNotificationPopups();
    const PUBLIC_ROUTES = [
        "/login",
        "/forgot-password",
        "/reset-password",
        "/download",
        "/confirm-email",
        "/confirm-identity",
    ];
    if (showStartupSplash) {
        return _jsx(AppStartupSplash, {});
    }
    const currentPath = location.pathname.endsWith('/') && location.pathname !== '/'
        ? location.pathname.slice(0, -1)
        : location.pathname;
    if (!isAuthenticated && !PUBLIC_ROUTES.includes(currentPath) && currentPath !== "/welcome-back") {
        const hasResetToken = window.location.hash.includes("type=recovery") ||
            window.location.hash.includes("access_token=") ||
            window.location.search.includes("token=");
        if (hasResetToken) {
            return _jsx(Navigate, { to: `/reset-password${window.location.search}${window.location.hash}`, replace: true });
        }
        if (isSessionLocked) {
            return _jsx(Navigate, { to: "/welcome-back", replace: true });
        }
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    return (_jsx(ErrorBoundary, { children: _jsxs(_Fragment, { children: [showPageDots && _jsx(PageLoadingDots, {}), _jsx(PwaUpdater, {}), _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: isAuthenticated ? _jsx(Navigate, { to: "/" }) : _jsx(Login, {}) }), _jsx(Route, { path: "/download", element: _jsx(DownloadPage, {}) }), _jsx(Route, { path: "/forgot-password", element: _jsx(ForgotPassword, {}) }), _jsx(Route, { path: "/reset-password", element: _jsx(ResetPassword, {}) }), _jsx(Route, { path: "/confirm-email", element: _jsx(ConfirmEmail, {}) }), _jsx(Route, { path: "/confirm-identity", element: _jsx(ConfirmIdentity, {}) }), _jsx(Route, { path: "/", element: _jsx(PrivateRoute, { children: _jsx(Dashboard, {}) }) }), _jsx(Route, { path: "/groups", element: _jsx(PrivateRoute, { children: _jsx(Groups, {}) }) }), _jsx(Route, { path: "/groups/:id", element: _jsx(PrivateRoute, { children: _jsx(GroupDetails, {}) }) }), _jsx(Route, { path: "/messages", element: _jsx(PrivateRoute, { children: _jsx(Messages, {}) }) }), _jsx(Route, { path: "/alumni", element: _jsx(PrivateRoute, { children: _jsx(Alumni, {}) }) }), _jsx(Route, { path: "/profile/:username", element: _jsx(PrivateRoute, { children: _jsx(Profile, {}) }) }), _jsx(Route, { path: "/post/:id", element: _jsx(PrivateRoute, { children: _jsx(PostDetail, {}) }) }), _jsx(Route, { path: "/admin", element: _jsx(PrivateRoute, { children: _jsx(AdminPanel, {}) }) }), _jsx(Route, { path: "/discover", element: _jsx(PrivateRoute, { children: _jsx(Discover, {}) }) }), _jsx(Route, { path: "/sound/:soundName", element: _jsx(PrivateRoute, { children: _jsx(SoundFeed, {}) }) }), _jsx(Route, { path: "/settings", element: _jsx(PrivateRoute, { children: _jsx(Settings, {}) }) }), _jsx(Route, { path: "/notifications", element: _jsx(PrivateRoute, { children: _jsx(Notifications, {}) }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/" }) })] })] }) }));
};
const App = () => {
    return (_jsx(QueryClientProvider, { client: queryClient, children: _jsx(ToastProvider, { children: _jsx(BrowserRouter, { children: _jsx(AppRoutes, {}) }) }) }));
};
export default App;
