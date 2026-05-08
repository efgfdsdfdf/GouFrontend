import React from "react";
import { Search, Bell, Menu } from "lucide-react";
import { useAuthStore, useUIStore } from "../../store";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import { NotificationDropdown } from "./NotificationDropdown";
import { AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

export const TopNav = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const [showNotifications, setShowNotifications] = React.useState(false);

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: api.notifications.getAll,
    refetchInterval: 30000,
  });

  const queryClient = useQueryClient();

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  const location = useLocation();
  const isDiscover = location.pathname === "/discover";

  return (
    <header className="flex sticky top-0 w-full h-16 bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-white/5 z-[100]">
      <div className="max-w-[1600px] mx-auto h-full flex items-center justify-between px-4 md:px-6 relative">
        <div className="flex items-center gap-4">
          <button
            className="md:hidden text-zinc-400 hover:text-white transition-colors"
            onClick={toggleSidebar}
          >
            <Menu size={24} />
          </button>
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
              <span className="font-black text-black text-xl">U</span>
            </div>
            <span className="font-black text-2xl tracking-tighter text-white hidden sm:block">
              GoUnion
            </span>
          </Link>
        </div>

        <div className="flex-1 max-w-lg mx-4 md:mx-12 hidden md:block">
          <div className="relative group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Search groups and people..."
              className="w-full bg-[#141417] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 transition-all text-xs font-bold uppercase tracking-widest"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2.5 transition-all rounded-xl ${showNotifications ? "bg-primary text-black shadow-[0_0_20px_rgba(196,255,14,0.3)]" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span
                  className={`absolute top-1 right-1 h-5 min-w-[20px] px-1 flex items-center justify-center text-[10px] font-black rounded-lg border-2 border-[#0a0a0c] ${showNotifications ? "bg-white text-black" : "bg-primary text-black"}`}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <NotificationDropdown
                  notifications={notifications || []}
                  onClose={() => setShowNotifications(false)}
                  onMarkRead={async () => {
                    await api.notifications.markAsRead();
                    queryClient.invalidateQueries({ queryKey: ["notifications"] });
                    setShowNotifications(false);
                  }}
                  onItemClick={(n) => {
                    setShowNotifications(false);
                    // Prioritize specific content routes
                    if (n.type === "follow") {
                      navigate(`/profile/${n.actor.username}`);
                    } else if (
                      n.message.includes("post") ||
                      n.message.includes("comment")
                    ) {
                      // If we had post routes: navigate(`/post/${n.contentId}`);
                      // For now, navigate to profile of actor to see their activity
                      navigate(`/profile/${n.actor.username}`);
                    } else {
                      navigate("/");
                    }
                  }}
                />
              )}
            </AnimatePresence>
          </div>

          <Link to={`/profile/${user?.username}`} className="ml-1">
            <div className="p-[2.5px] rounded-full story-ring transition-transform hover:scale-110">
              <div className="w-8 h-8 rounded-full border-2 border-[#0a0a0c] overflow-hidden">
                <img
                  src={
                    user?.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${user?.fullName}&background=random`
                  }
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
};
