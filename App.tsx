import React, { useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
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
import { Alumni } from "./pages/Alumni";
import { GroupDetails } from "./pages/GroupDetails";
import { AdminPanel } from "./pages/AdminPanel";
import { Settings } from "./pages/Settings";
import { Notifications } from "./pages/Notifications";
import { DownloadPage } from "./pages/Download";
import { ConfirmEmail } from "./pages/ConfirmEmail";
import { ConfirmIdentity } from "./pages/ConfirmIdentity";
import { useAuthStore } from "./store";
import { usePwaStore } from "./store/pwaStore";
import { PwaUpdater } from "./components/pwa/PwaUpdater";
import { API_URL, api } from "./services/api";
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
const AppLayout = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const isDiscover = location.pathname === '/discover';
  const isMessages = location.pathname === '/messages';

  return (
    <div className="flex h-screen bg-[#030303] text-white overflow-hidden selection:bg-white/20 relative">
      {!isMessages && <Sidebar />}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {!isMessages && (
          <div className="fixed top-0 right-0 left-0 md:left-64 lg:right-80 z-[100]">
            <TopNav />
          </div>
        )}
        <main
          className={`flex-1 overflow-y-auto hide-scrollbar ${
            isMessages ? 'p-0' : `md:pl-64 lg:pr-80 ${isDiscover ? 'pb-0' : 'pb-6'} md:pb-0 pt-16`
          }`}
        >
          <div className={isMessages ? "h-full w-full" : "px-4 py-6 md:px-8 max-w-5xl mx-auto"}>
            {children}
          </div>
        </main>
      </div>
      {!isMessages && <RightSidebar />}
      {!isMessages && <MobileNav />}
    </div>
  );
};

const PrivateRoute = ({ children }: { children?: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
};

const AppStartupSplash = () => {
  return (
    <div className="min-h-screen w-full bg-[#030303] text-white flex items-center justify-center px-6">
      <div className="glass-panel rounded-3xl p-10 w-full max-w-sm text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-white text-black flex items-center justify-center font-serif font-black text-3xl">
          G
        </div>
        <h1 className="mt-5 font-serif text-3xl tracking-tight">GoUnion</h1>
        <p className="mt-3 text-sm text-zinc-300 leading-relaxed">Loading</p>
        <p className="mt-4 text-2xl text-primary animate-pulse" aria-hidden="true">
          .
        </p>
      </div>
    </div>
  );
};

const PageLoadingDots = () => (
  <div className="fixed top-20 left-1/2 z-[220] -translate-x-1/2 rounded-full border border-white/10 bg-black/70 px-4 py-2 shadow-2xl backdrop-blur-xl">
    <div className="flex items-center gap-1.5" aria-label="Loading page">
      <span className="h-1.5 w-1.5 rounded-full bg-white/70 animate-bounce [animation-delay:-0.2s]" />
      <span className="h-1.5 w-1.5 rounded-full bg-white/70 animate-bounce [animation-delay:-0.1s]" />
      <span className="h-1.5 w-1.5 rounded-full bg-white/70 animate-bounce" />
    </div>
  </div>
);

const useWebSocket = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const reconnectTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const currentApiUrl = API_URL || 'http://127.0.0.1:8001';
    const wsUrl = currentApiUrl.replace('http', 'ws') + `/conversations/ws/${user.id}`;
    let socket: WebSocket | null = null;
    let closedByCleanup = false;

    const connect = () => {
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'new_message') {
            const msg = data.message;
            queryClient.invalidateQueries({ queryKey: ["messages", msg.conversation_id.toString()] });
            queryClient.invalidateQueries({ queryKey: ["chats"] });
            queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            if (String(msg.sender_id) !== String(user.id)) {
              toast("New message", "info");
              // Native push notification for messages
              if ('Notification' in window && Notification.permission === 'granted') {
                try {
                  new Notification("GoUnion", {
                    body: "You have a new message",
                    icon: '/pwa-192x192.png',
                    tag: `gounion-msg-${Date.now()}`,
                  });
                } catch {}
              }
            }
          }

          if (data.type === 'notification' || data.type === 'new_notification') {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
            queryClient.invalidateQueries({ queryKey: ["feed"] });
            queryClient.invalidateQueries({ queryKey: ["discover-reels"] });
            if (!window.location.pathname.startsWith("/notifications")) {
              toast(data.message || "New notification", "info");
            }
          }
        } catch (e) {
          console.error("WS Message error", e);
        }
      };

      socket.onclose = () => {
        if (closedByCleanup) return;
        reconnectTimer.current = window.setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      closedByCleanup = true;
      if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current);
      socket?.close();
    };
  }, [isAuthenticated, user?.id, toast]);
};

const useNotificationPopups = () => {
  const { isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const location = useLocation();
  const seenIds = useRef<Set<string>>(new Set());
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
              const urlBase64ToUint8Array = (base64String: string) => {
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
            } catch (e) {
              console.error('Failed to send push subscription to backend', e);
            }
          }
        } catch (error) {
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
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const sendNativeNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const n = new Notification(title, {
          body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: `gounion-${Date.now()}`,
          vibrate: [200, 100, 200],
        });
        n.onclick = () => {
          window.focus();
          n.close();
        };
      } catch {
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

    const unread = notifications.filter((n: any) => !n.read);
    const isNotificationsPage = location.pathname.startsWith("/notifications");

    if (!initialized.current) {
      unread.forEach((n: any) => seenIds.current.add(n.id));
      initialized.current = true;
      return;
    }

    if (isNotificationsPage) {
      unread.forEach((n: any) => seenIds.current.add(n.id));
      return;
    }

    const newNotifications = unread.filter((n: any) => !seenIds.current.has(n.id));
    if (newNotifications.length === 0) return;

    newNotifications.forEach((n: any) => {
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
          case 'like': msg = "liked your post."; break;
          case 'comment': msg = "commented on your post."; break;
          case 'follow': msg = "started following you."; break;
          case 'group_invite': msg = "invited you to a group."; break;
          case 'group_request': msg = "requested to join your group."; break;
          default: msg = "interacted with you."; break;
        }
      }
      const actor = notification.actor?.username || notification.actor?.fullName || "Someone";
      toast(`${actor} ${msg}`, "info");
      sendNativeNotification("GoUnion", `${actor} ${msg}`);
    } else {
      toast(`You have ${newNotifications.length} new notifications.`, "info");
      sendNativeNotification("GoUnion", `You have ${newNotifications.length} new notifications.`);
    }
  }, [isAuthenticated, notifications, toast, location.pathname]);
};

const AppRoutes = () => {
  const { isAuthenticated, updateUser } = useAuthStore();
  const location = useLocation();
  const [showStartupSplash, setShowStartupSplash] = useState(true);
  const [showPageDots, setShowPageDots] = useState(false);
  const { setInstalled } = usePwaStore();

  useEffect(() => {
    // Check if already installed via display-mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
    }
  }, [setInstalled]);

  useEffect(() => {
    const checkAuth = async () => {
      const refreshToken = authStorage.getItem("refresh_token");
      const accessToken = authStorage.getItem("access_token");
      
      if (refreshToken && !accessToken) {
        try {
          await api.auth.refresh(refreshToken);
          // Refresh handles store updates via interceptors/logic if set up, 
          // but let's ensure we reload to pick up new state
          window.location.reload();
          return;
        } catch (e) {
          console.error("Startup refresh failed", e);
        }
      }

      if (accessToken) {
        try {
          const freshUser = await api.auth.me();
          updateUser(freshUser);
        } catch (e) {
          console.error("Failed to sync user profile on startup", e);
        }
      }
    };
    
    void checkAuth();
    
    const timer = window.setTimeout(() => {
      setShowStartupSplash(false);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [updateUser]);

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
    return <AppStartupSplash />;
  }

  const currentPath = location.pathname.endsWith('/') && location.pathname !== '/' 
    ? location.pathname.slice(0, -1) 
    : location.pathname;

  if (!isAuthenticated && !PUBLIC_ROUTES.includes(currentPath)) {
    const hasResetToken = window.location.hash.includes("type=recovery") || 
                          window.location.hash.includes("access_token=") || 
                          window.location.search.includes("token=");
    
    if (hasResetToken) {
      return <Navigate to={`/reset-password${window.location.search}${window.location.hash}`} replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return (
    <ErrorBoundary>
      <>
        {showPageDots && <PageLoadingDots />}
        <PwaUpdater />
        <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" /> : <Login />}
        />
        <Route path="/download" element={<DownloadPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/confirm-email" element={<ConfirmEmail />} />
        <Route path="/confirm-identity" element={<ConfirmIdentity />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/groups"
          element={
            <PrivateRoute>
              <Groups />
            </PrivateRoute>
          }
        />
        <Route
          path="/groups/:id"
          element={
            <PrivateRoute>
              <GroupDetails />
            </PrivateRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <PrivateRoute>
              <Messages />
            </PrivateRoute>
          }
        />
        <Route
          path="/alumni"
          element={
            <PrivateRoute>
              <Alumni />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile/:username"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminPanel />
            </PrivateRoute>
          }
        />
        <Route
          path="/discover"
          element={
            <PrivateRoute>
              <Discover />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <PrivateRoute>
              <Notifications />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </>
    </ErrorBoundary>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
};

export default App;
