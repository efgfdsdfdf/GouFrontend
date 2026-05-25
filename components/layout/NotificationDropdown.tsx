import React from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Heart, MessageCircle, UserPlus, X } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  actor: any;
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationDropdownProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkRead: () => void;
  onItemClick: (n: Notification) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  onClose,
  onMarkRead,
  onItemClick,
}) => {
  const navigate = useNavigate();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart size={14} className="text-primary fill-primary" />;
      case "comment":
        return <MessageCircle size={14} className="text-accent fill-accent" />;
      case "follow":
        return <UserPlus size={14} className="text-blue-400" />;
      default:
        return <Bell size={14} className="text-zinc-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="fixed left-3 right-3 top-20 md:absolute md:left-auto md:right-0 md:top-full md:mt-4 md:w-96 md:max-w-[380px] bg-[#111113]/98 backdrop-blur-2xl border border-white/10 rounded-2xl md:rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[180]"
    >
      <div className="p-4 md:p-6 border-b border-white/5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-white font-black text-sm md:text-xs uppercase tracking-widest">
            Notifications
          </h3>
          <p className="text-[11px] text-zinc-500 mt-1">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'No new notifications'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead();
            }}
            className="h-9 px-3 rounded-xl bg-white/5 text-[10px] font-black text-primary uppercase tracking-widest hover:bg-white/10 transition-colors"
          >
            Read
          </button>
          <button
            onClick={onClose}
            className="h-9 w-9 md:hidden rounded-xl bg-white/5 text-zinc-400 flex items-center justify-center"
            aria-label="Close notifications"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="max-h-[min(70vh,430px)] overflow-y-auto custom-scrollbar">
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={(e) => {
                e.preventDefault();
                onItemClick(n);
              }}
              className={`p-5 border-b border-white/5 flex gap-4 hover:bg-white/[0.04] transition-all cursor-pointer relative group active:scale-[0.98] ${!n.read ? "bg-primary/[0.03]" : ""}`}
            >
              <div className="relative shrink-0">
                <img
                  src={n.actor.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.actor.username}`}
                  className="w-10 h-10 rounded-full object-cover border border-white/10"
                  alt={n.actor.username}
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0a0a0c] rounded-full flex items-center justify-center border border-white/5 shadow-lg">
                  {getIcon(n.type)}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-zinc-300 leading-snug">
                  <span className="font-black text-white">
                    {n.actor.fullName || n.actor.username}
                  </span>{" "}
                  {n.message}
                </p>
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tight mt-1 group-hover:text-zinc-500 transition-colors">
                  {n.timestamp}
                </span>
              </div>

              {!n.read && (
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0 animate-pulse" />
              )}
            </div>
          ))
        ) : (
          <div className="py-12 text-center">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-600">
              <Bell size={24} />
            </div>
            <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">
              No notifications yet
            </p>
          </div>
        )}
      </div>

      <div className="p-4 bg-[#0a0a0c]/50 text-center">
        <button
          onClick={() => {
            onClose();
            navigate("/notifications");
          }}
          className="text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-colors"
        >
          View All History
        </button>
      </div>
    </motion.div>
  );
};
