import React, { useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, 
  Users, 
  MessageSquare, 
  User, 
  MoreHorizontal, 
  Compass, 
  GraduationCap, 
  ShieldCheck, 
  Settings, 
  LogOut,
  X,
  Bell
} from "lucide-react";
import { useAuthStore } from "../../store";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import { motion, AnimatePresence } from "framer-motion";

export const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isDiscover = location.pathname === "/discover";
  const { user, logout } = useAuthStore();
  const [isOthersOpen, setIsOthersOpen] = useState(false);

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: api.notifications.getUnreadCount,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    enabled: !!user,
  });
  const unreadCount = unreadData?.count || 0;

  const NAV_ITEMS = [
    { icon: Home, label: "Feed", path: "/" },
    { icon: Compass, label: "Discover", path: "/discover" },
    { icon: MessageSquare, label: "Chat", path: "/messages" },
    { icon: User, label: "Profile", path: user?.username ? `/profile/${user.username}` : "/" },
  ];

  const OTHER_ITEMS = [
    { icon: Bell, label: "Alerts", path: "/notifications", badge: unreadCount },
    { icon: Users, label: "Groups", path: "/groups" },
    { icon: GraduationCap, label: "Alumni", path: "/alumni" },
    ...(user?.role === "admin" || user?.role === "moderator" 
      ? [{ icon: ShieldCheck, label: "Admin Panel", path: "/admin" }] 
      : []),
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <>
      <div className={`
        md:hidden fixed bottom-0 left-0 w-full h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] bg-[#050505]/95 backdrop-blur-2xl border-t border-white/5 z-[160] flex items-center justify-around px-2
      `}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => {
              if (location.pathname === "/" && item.path === "/") {
                window.dispatchEvent(new Event("gounion-refresh-feed"));
              }
              if (location.pathname === "/discover" && item.path === "/discover") {
                window.dispatchEvent(new Event("gounion-refresh-discover"));
              }
            }}
            className={({ isActive }) => `
              relative flex flex-col items-center justify-center h-full flex-1 transition-all duration-300
              ${isActive ? "text-violet-400" : "text-zinc-500 hover:text-zinc-300"}
            `}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-violet-600/10 rounded-xl"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
                <item.icon
                  size={20}
                  className={`relative z-10 transition-transform ${isActive ? "scale-110" : ""}`}
                />
                <span className="relative z-10 text-[9px] mt-1 font-bold tracking-tight uppercase">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}

        <button
          onClick={() => setIsOthersOpen(true)}
          className={`relative flex flex-col items-center justify-center h-full flex-1 transition-all duration-300 ${isOthersOpen ? "text-violet-400" : "text-zinc-500"}`}
        >
          <div className="relative">
            <MoreHorizontal size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
            )}
          </div>
          <span className="text-[9px] mt-1 font-bold tracking-tight uppercase">Others</span>
        </button>
      </div>

      <AnimatePresence>
        {isOthersOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-24 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOthersOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-serif text-2xl text-white">More Pages</h2>
                <button 
                  onClick={() => setIsOthersOpen(false)}
                  className="p-2 bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {OTHER_ITEMS.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={(e) => {
                      if (item.label === "Alumni") {
                        e.preventDefault();
                        return;
                      }
                      setIsOthersOpen(false);
                    }}
                    className={`flex flex-col items-center justify-center p-6 bg-white/5 border border-white/5 rounded-3xl transition-all group ${item.label === "Alumni" ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10 hover:border-white/10"}`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-violet-600/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform relative">
                      <item.icon className="w-6 h-6 text-violet-400" />
                      {item.badge && item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-lg">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-white">{item.label}</span>
                    {item.label === "Alumni" && (
                      <span className="text-[8px] font-black uppercase tracking-widest text-violet-400 mt-1">Coming Soon</span>
                    )}
                  </Link>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-white/5">
                <button
                  onClick={() => {
                    logout();
                    setIsOthersOpen(false);
                    navigate("/login");
                  }}
                  className="w-full flex items-center justify-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-500/20 transition-all"
                >
                  <LogOut size={18} />
                  Logout Session
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
