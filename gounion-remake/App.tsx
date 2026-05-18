import React, { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import { DownloadPage } from "./pages/DownloadPage";
import { Settings } from "./pages/Settings";
import { Notifications } from "./pages/Notifications";
import { useAuthStore } from "./store";
import { API_URL, api } from "./services/api";
import { authStorage } from "./utils/persistentStorage";
import { ToastProvider } from "./components/ui/Toast";
import { GoUnionLoader } from "./components/ui/GoUnionLoader";
import { APK_VERSION } from "./release";

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

  return (
    <div className="flex h-screen bg-[#030303] text-white overflow-hidden selection:bg-white/20 relative">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className="fixed top-0 right-0 left-0 md:left-64 lg:right-80 z-[100]">
          <TopNav />
        </div>
        <main className={`flex-1 overflow-y-auto hide-scrollbar md:pl-64 lg:pr-80 ${isDiscover ? 'pb-0' : 'pb-6'} md:pb-0 pt-40 md:pt-16`}>
          <div className="px-4 py-6 md:px-8 max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <RightSidebar />
      <MobileNav />
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

type MobileUpdateInfo = {
  latest_version: string;
  min_supported_version: string;
  apk_url: string;
  force_update: boolean;
  has_update: boolean;
  current_version?: string | null;
  release_notes?: string | null;
};

const MobileUpdateModal = ({
  updateInfo,
  onDismiss,
}: {
  updateInfo: MobileUpdateInfo;
  onDismiss: () => void;
}) => {
  const openUpdate = () => {
    if (Capacitor.isNativePlatform()) {
      window.open(updateInfo.apk_url, "_blank");
      return;
    }
    window.location.href = updateInfo.apk_url;
  };

  return (
    <div className="fixed inset-0 z-[140] bg-black/80 backdrop-blur-sm flex items-center justify-center px-6">
      <div className="glass-panel rounded-3xl p-8 w-full max-w-md text-white">
        <p className="text-[10px] uppercase tracking-[0.22em] text-primary font-black">
          App Update
        </p>
        <h2 className="mt-3 font-serif text-3xl tracking-tight">Update Available</h2>
        <p className="mt-3 text-sm text-zinc-300 leading-relaxed">
          Version {updateInfo.latest_version} is available.
          {updateInfo.force_update
            ? " This update is required to continue using GoUnion."
            : " Install now for the latest fixes and improvements."}
        </p>
        {updateInfo.release_notes && (
          <p className="mt-3 text-xs text-zinc-400">{updateInfo.release_notes}</p>
        )}
        <div className="mt-7 flex items-center gap-3">
          <button
            onClick={openUpdate}
            className="flex-1 h-11 rounded-xl bg-primary text-black text-xs font-black uppercase tracking-[0.16em] hover:brightness-95 transition-all"
          >
            Update Now
          </button>
          {!updateInfo.force_update && (
            <button
              onClick={onDismiss}
              className="flex-1 h-11 rounded-xl border border-white/20 text-white text-xs font-black uppercase tracking-[0.16em] hover:bg-white/5 transition-all"
            >
              Later
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const useWebSocket = () => {
  const { user, isAuthenticated } = useAuthStore();

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
        }
      } catch (e) {
        console.error("WS Message error", e);
      }
    };

    socket.onclose = () => {
      console.log("WS Disconnected. Reconnecting in 5s...");
    };

    return () => socket.close();
  }, [isAuthenticated, user?.id]);
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const [showStartupSplash, setShowStartupSplash] = useState(true);
  const [showPageLoader, setShowPageLoader] = useState(true);
  const [mobileUpdateInfo, setMobileUpdateInfo] = useState<MobileUpdateInfo | null>(null);

  const isNativeApp = Capacitor.isNativePlatform();
  const hasDownloadedApk = useMemo(() => {
    try {
      return localStorage.getItem("gounion_apk_downloaded") === "true";
    } catch {
      return false;
    }
  }, []);

  const defaultPublicRoute = isNativeApp || hasDownloadedApk ? "/login" : "/download";

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
    if (!isNativeApp) return;

    const loadUpdateStatus = async () => {
      try {
        const info = await api.mobile.getVersionInfo(APK_VERSION);
        if (!info.has_update && !info.force_update) {
          setMobileUpdateInfo(null);
          return;
        }

        const dismissedKey = `gounion_update_dismissed_${info.latest_version}`;
        const dismissed = localStorage.getItem(dismissedKey) === "true";
        if (!info.force_update && dismissed) {
          setMobileUpdateInfo(null);
          return;
        }
        setMobileUpdateInfo(info);
      } catch (error) {
        console.error("Mobile update check failed", error);
      }
    };

    void loadUpdateStatus();
  }, [isNativeApp]);

  useEffect(() => {
    setShowPageLoader(true);
    const timer = window.setTimeout(() => {
      setShowPageLoader(false);
    }, 520);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  useWebSocket();

  const PUBLIC_ROUTES = [
    "/login",
    "/forgot-password",
    "/reset-password",
    "/download",
  ];

  if (showStartupSplash) {
    return <AppStartupSplash />;
  }

  if (!isAuthenticated && !PUBLIC_ROUTES.includes(location.pathname)) {
    return <Navigate to={defaultPublicRoute} replace />;
  }

  return (
    <>
      {showPageLoader && <GoUnionLoader message="Preparing page..." />}
      {mobileUpdateInfo && (
        <MobileUpdateModal
          updateInfo={mobileUpdateInfo}
          onDismiss={() => {
            try {
              localStorage.setItem(
                `gounion_update_dismissed_${mobileUpdateInfo.latest_version}`,
                "true"
              );
            } catch {
              // Ignore storage errors in restricted contexts.
            }
            setMobileUpdateInfo(null);
          }}
        />
      )}
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" /> : <Login />}
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/download"
          element={isNativeApp ? <Navigate to="/login" replace /> : <DownloadPage />}
        />
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
