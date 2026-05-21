import React from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Compass,
  Users,
  MessageSquare,
  GraduationCap,
  User,
  Settings,
  LogOut,
  Search,
  ShieldCheck,
  Bell,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import { useAuthStore } from "../../store";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Compass, label: "Discover", path: "/discover" },
  { icon: Users, label: "Groups", path: "/groups" },
  { icon: MessageSquare, label: "Messages", path: "/messages" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
  { icon: GraduationCap, label: "Alumni", path: "/alumni", comingSoon: true },
];

export const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: api.notifications.getUnreadCount,
    refetchInterval: 30000,
  });
  const unreadCount = unreadData?.count || 0;

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed left-0 top-0 h-screen w-64 border-r border-white/5 bg-black/40 backdrop-blur-3xl hidden md:flex flex-col z-40"
    >
      <div className="p-6">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-serif font-bold text-xl transition-transform group-hover:scale-105">
            G
          </div>
          <span className="font-serif text-2xl tracking-tight text-white">GoUnion</span>
        </Link>
      </div>

      <div className="px-4 pb-6">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-white transition-colors" />
          <input
            type="text"
            placeholder="Search GoUnion..."
            className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
          />
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const isComingSoon = item.comingSoon;
          
          return (
            <NavLink
              key={item.path}
              to={isComingSoon ? "#" : item.path}
              onClick={(e) => {
                if (isComingSoon) {
                  e.preventDefault();
                }
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                ${
                  isActive && !isComingSoon
                    ? "bg-gradient-to-r from-white/10 to-white/5 text-white border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                    : isComingSoon 
                      ? "text-white/30 cursor-not-allowed border border-transparent"
                      : "text-white/60 hover:bg-white/5 hover:text-white border border-transparent"
                }
              `}
            >
              <item.icon
                className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                  isActive && !isComingSoon ? "text-white" : "text-white/60"
                }`}
              />
              {item.label}
              {isComingSoon && (
                <span className="ml-auto text-[8px] font-black uppercase tracking-widest text-white/20 px-2 py-0.5 rounded-md border border-white/5">
                  Soon
                </span>
              )}
              {item.path === '/notifications' && unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </NavLink>
          );
        })}

        <NavLink
          to={user?.username ? `/profile/${user.username}` : "/"}
          className={({ isActive }) => `
            flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group mt-1
            ${
              isActive
                ? "bg-gradient-to-r from-white/10 to-white/5 text-white border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                : "text-white/60 hover:bg-white/5 hover:text-white border border-transparent"
            }
          `}
        >
          <User className="w-5 h-5" />
          Profile
        </NavLink>

        {(user?.role === "admin" || user?.role === "moderator") && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group mt-1
              ${
                isActive
                  ? "bg-emerald-400/20 text-emerald-400 border border-emerald-400/20"
                  : "text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-400/10 border border-transparent"
              }
            `}
          >
            <ShieldCheck className="w-5 h-5" />
            Admin Panel
          </NavLink>
        )}
      </nav>

      <div className="p-4 mt-auto">
        <div className="glass-panel rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <img
              src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.fullName}&background=random`}
              alt="Profile"
              className="w-10 h-10 rounded-full border border-white/10 object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.fullName || "Student"}
              </p>
              <p className="text-xs text-white/50 truncate">
                {user?.university || "University Student"}
              </p>
            </div>
          </div>
          <div className="h-px w-full bg-white/10" />
          <div className="flex items-center justify-between">
            <Link to="/settings" className="text-white/50 hover:text-white transition-colors p-1">
              <Settings className="w-4 h-4" />
            </Link>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="text-white/50 hover:text-red-400 transition-colors p-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};
