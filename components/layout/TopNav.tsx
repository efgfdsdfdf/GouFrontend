import React, { useState, useEffect, useRef } from "react";
import { Search, Bell, Menu } from "lucide-react";
import { useAuthStore, useUIStore } from "../../store";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import { NotificationDropdown } from "./NotificationDropdown";
import { motion, AnimatePresence } from "framer-motion";

export const TopNav = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const [showNotifications, setShowNotifications] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: api.notifications.getAll,
    refetchInterval: 30000,
  });

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["search", searchQuery],
    queryFn: () => api.search.users(searchQuery),
    enabled: searchQuery.length > 1,
  });

  const queryClient = useQueryClient();

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  const location = useLocation();
  const isDiscover = location.pathname === "/discover";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex sticky top-0 w-full h-16 md:h-20 bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-white/5 z-[100]">
      <div className="max-w-[1600px] mx-auto h-full w-full flex items-center justify-between px-4 md:px-8 relative">
        <div className="flex items-center gap-4">
          <button
            className="md:hidden p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            onClick={toggleSidebar}
          >
            <Menu size={24} />
          </button>
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
              <span className="font-black text-black text-xl md:text-2xl">U</span>
            </div>
            <span className="font-black text-2xl tracking-tighter text-white hidden sm:block">
              GoUnion
            </span>
          </Link>
        </div>

        <div className="flex-1 max-w-lg mx-4 md:mx-12 hidden md:block" ref={searchRef}>
          <div className="relative group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Search groups and people..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => {
                if (searchQuery.length > 1) setShowSearchResults(true);
              }}
              className="w-full bg-[#141417] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 transition-all text-sm font-medium"
            />

            <AnimatePresence>
              {showSearchResults && searchQuery.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-[#141417] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto"
                >
                  {isSearching ? (
                    <div className="p-4 text-center text-zinc-500 text-xs font-bold uppercase tracking-widest">Searching...</div>
                  ) : searchResults && searchResults.length > 0 ? (
                    <div className="flex flex-col">
                      {searchResults.map((user: any) => (
                        <Link
                          key={user.id}
                          to={`/profile/${user.username}`}
                          onClick={() => setShowSearchResults(false)}
                          className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                        >
                          <img src={user.avatarUrl} alt={user.username} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                          <div className="flex flex-col">
                            <span className="text-white text-sm font-bold">{user.fullName}</span>
                            <span className="text-zinc-500 text-xs font-medium">@{user.username}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-zinc-500 text-xs font-bold uppercase tracking-widest">No results found</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-5">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2.5 transition-all rounded-xl ${showNotifications ? "bg-primary text-black shadow-[0_0_20px_rgba(196,255,14,0.3)]" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
            >
              <Bell size={22} />
              {unreadCount > 0 && (
                <span
                  className={`absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center text-[10px] font-black rounded-lg border-2 border-[#0a0a0c] ${showNotifications ? "bg-white text-black" : "bg-red-500 text-white"}`}
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
                    await api.notifications.markRead();
                    queryClient.invalidateQueries({ queryKey: ["notifications"] });
                    setShowNotifications(false);
                  }}
                  onItemClick={(n) => {
                    setShowNotifications(false);
                    if (n.type === "follow") {
                      navigate(`/profile/${n.actor.username}`);
                    } else if (
                      n.message.includes("post") ||
                      n.message.includes("comment")
                    ) {
                      navigate(`/profile/${n.actor.username}`);
                    } else {
                      navigate("/");
                    }
                  }}
                />
              )}
            </AnimatePresence>
          </div>

          <div className="w-px h-8 bg-white/10 hidden md:block mx-1"></div>

          <Link to={`/profile/${user?.username}`} className="ml-1 md:ml-0">
            <div className="p-1 rounded-full border-2 border-transparent hover:border-primary/50 transition-colors">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-white/10 overflow-hidden bg-white/5">
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
