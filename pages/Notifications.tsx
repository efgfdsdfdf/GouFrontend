import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Bell, Heart, MessageSquare, UserPlus, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { StatusCircles } from '../components/feed/StatusCircles';

const getIconForType = (type: string) => {
  switch (type) {
    case 'like': return <Heart size={16} className="text-red-400" />;
    case 'like_comment': return <Heart size={16} className="text-pink-400" />;
    case 'comment': return <MessageSquare size={16} className="text-blue-400" />;
    case 'follow': return <UserPlus size={16} className="text-emerald-400" />;
    case 'group_invite':
    case 'group_request': return <Users size={16} className="text-purple-400" />;
    default: return <Bell size={16} className="text-white/50" />;
  }
};

const getMessageForType = (type: string) => {
  switch (type) {
    case 'like': return "liked your post.";
    case 'like_comment': return "liked your comment.";
    case 'comment': return "commented on your post.";
    case 'follow': return "started following you.";
    case 'group_invite': return "invited you to a group.";
    case 'group_request': return "requested to join your group.";
    default: return "interacted with you.";
  }
};

export const Notifications = () => {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: api.notifications.getAll,
  });

  const markReadMutation = useMutation({
    mutationFn: api.notifications.markRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previousNotifications = queryClient.getQueryData(["notifications"]);
      queryClient.setQueryData(["notifications"], (old: any) => {
        if (!old) return old;
        return old.map((n: any) => ({ ...n, read: true }));
      });
      return { previousNotifications };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const markOneReadMutation = useMutation({
    mutationFn: (id: string) => api.notifications.markOneRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previousNotifications = queryClient.getQueryData(["notifications"]);
      queryClient.setQueryData(["notifications"], (old: any) =>
        old?.map((n: any) => String(n.id) === String(id) ? { ...n, read: true } : n),
      );
      return { previousNotifications };
    },
    onError: (_err, _id, context: any) => {
      queryClient.setQueryData(["notifications"], context?.previousNotifications);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const hasMarkedRead = React.useRef(false);

  useEffect(() => {
    const hasUnread = notifications?.some((notification: any) => !notification.read);
    if (!hasMarkedRead.current && hasUnread) {
      hasMarkedRead.current = true;
      markReadMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  return (
    <div className="max-w-3xl mx-auto w-full pb-24 pt-8">
      <div className="mb-4">
        <StatusCircles />
      </div>
      <div className="mb-8 relative p-8 rounded-[2rem] glass-panel overflow-hidden border border-white/5 shadow-2xl flex items-center gap-4">
        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
          <Bell size={28} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter">Notifications</h1>
          <p className="text-zinc-400 font-medium mt-1">Activity across your network.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 glass-panel rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (() => {
        const hasNotifications = notifications && notifications.length > 0;
        if (!hasNotifications) {
          return (
            <div className="glass-panel p-16 text-center rounded-[2rem] border border-dashed border-white/10">
              <Bell size={48} className="mx-auto text-white/10 mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">You're all caught up!</h2>
              <p className="text-white/40">When someone interacts with you, it will show up here.</p>
            </div>
          );
        }
        return (
          <div className="space-y-4">
            {notifications.map((notif: any, i: number) => {
              const targetPath = notif.postId ? `/post/${notif.postId}` : `/profile/${notif.actor?.username}`;
              return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`glass-panel p-4 rounded-2xl flex items-center gap-4 border transition-colors ${
                  !notif.read ? 'border-primary/30 bg-primary/5' : 'border-white/5 opacity-75 hover:opacity-100'
                }`}
              >
                <Link to={`/profile/${notif.actor?.username}`} className="relative shrink-0">
                  <img
                    src={notif.actor?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${notif.actor?.username}`}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover bg-white/5"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0a0a0c] rounded-full flex items-center justify-center">
                    {getIconForType(notif.type)}
                  </div>
                </Link>
                <Link
                  to={targetPath}
                  onClick={() => markOneReadMutation.mutate(String(notif.id))}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm text-white/80 leading-snug">
                    <span className="font-bold text-white hover:underline">
                      {notif.actor?.fullName || notif.actor?.username}
                    </span>{" "}
                    {notif.message || getMessageForType(notif.type)}
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    {notif.timestamp}
                  </p>
                </Link>
                {!notif.read && (
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                )}
              </motion.div>
            )})}
          </div>
        );
      })()}
    </div>
  );
};
