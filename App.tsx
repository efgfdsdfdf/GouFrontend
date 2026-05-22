import React, { useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
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
import { useAuthStore } from "./store";
import { API_URL, api } from "./services/api";
import { authStorage } from "./utils/persistentStorage";
import { ToastProvider, useToast } from "./components/ui/Toast";
import { GoUnionLoader } from "./components/ui/GoUnionLoader";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
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

const useWebSocket = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const currentApiUrl = API_URL || 'http://127.0.0.1:8001';
    const wsUrl = currentApiUrl.replace('http', 'ws') + `/ws/${user.id}`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_message') {
          const msg = data.message;
          // Invalidate affected queries for instant refresh
          queryClient.invalidateQueries({ queryKey: ["messages", msg.conversation_id.toString()] });
          queryClient.invalidateQueries({ queryKey: ["chats"] });
          queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          if (String(msg.sender_id) !== String(user.id)) {
            toast("New message", "info");
          }
        }

        if (data.type === 'notification' || data.type === 'new_notification') {
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
          toast(data.message || "New notification", "info");
        }
      } catch (e) {
        console.error("WS Message error", e);
      }
    };

    socket.onclose = () => {
      console.log("WS Disconnected. Reconnecting in 5s...");
    };

    return () => socket.close();
  }, [isAuthenticated, user?.id, toast]);
};

const useNotificationPopups = () => {
  const { isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const seenIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: api.notifications.getAll,
    enabled: isAuthenticated,
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      seenIds.current.clear();
      initialized.current = false;
      return;
    }

    const unread = notifications.filter((n: any) => !n.read);

    if (!initialized.current) {
      unread.forEach((n: any) => seenIds.current.add(n.id));
      initialized.current = true;
      return;
    }

    unread.forEach((n: any) => {
      if (seenIds.current.has(n.id)) return;
      seenIds.current.add(n.id);
      toast(`${n.actor?.username || "Someone"} ${n.message}`, "info");
    });
  }, [isAuthenticated, notifications, toast]);
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const [showStartupSplash, setShowStartupSplash] = useState(true);
  const [showPageLoader, setShowPageLoader] = useState(true);

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
        } catch (e) {
          console.error("Startup refresh failed", e);
        }
      }
    };
    
    void checkAuth();
    
    const timer = window.setTimeout(() => {
      setShowStartupSplash(false);
    }, 850);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    setShowPageLoader(true);
    const timer = window.setTimeout(() => {
      setShowPageLoader(false);
    }, 520);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  useWebSocket();
  useNotificationPopups();

  const PUBLIC_ROUTES = [
    "/login",
    "/forgot-password",
    "/reset-password",
  ];

  if (showStartupSplash) {
    return <AppStartupSplash />;
  }

  if (!isAuthenticated && !PUBLIC_ROUTES.includes(location.pathname)) {
    // Check if it's a password reset link hitting the root or an unknown URL
    const hasResetToken = window.location.hash.includes("type=recovery") || 
                          window.location.hash.includes("access_token=") || 
                          window.location.search.includes("token=");
    
    if (hasResetToken) {
      return <Navigate to={`/reset-password${window.location.search}${window.location.hash}`} replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {showPageLoader && <GoUnionLoader message="Preparing page..." />}
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" /> : <Login />}
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
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
