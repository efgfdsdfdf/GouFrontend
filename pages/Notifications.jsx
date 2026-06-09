import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Bell, Heart, MessageSquare, UserPlus, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { StatusCircles } from '../components/feed/StatusCircles';
import { Avatar } from '../components/ui/Avatar';
const getIconForType = (type) => {
    switch (type) {
        case 'like': return _jsx(Heart, { size: 16, className: "text-red-400" });
        case 'like_comment': return _jsx(Heart, { size: 16, className: "text-pink-400" });
        case 'comment': return _jsx(MessageSquare, { size: 16, className: "text-blue-400" });
        case 'follow': return _jsx(UserPlus, { size: 16, className: "text-emerald-400" });
        case 'group_invite':
        case 'group_request': return _jsx(Users, { size: 16, className: "text-purple-400" });
        default: return _jsx(Bell, { size: 16, className: "text-white/50" });
    }
};
const getMessageForType = (type) => {
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
            queryClient.setQueryData(["notifications"], (old) => {
                if (!old)
                    return old;
                return old.map((n) => ({ ...n, read: true }));
            });
            return { previousNotifications };
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
        },
    });
    const markOneReadMutation = useMutation({
        mutationFn: (id) => api.notifications.markOneRead(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["notifications"] });
            const previousNotifications = queryClient.getQueryData(["notifications"]);
            queryClient.setQueryData(["notifications"], (old) => old?.map((n) => String(n.id) === String(id) ? { ...n, read: true } : n));
            return { previousNotifications };
        },
        onError: (_err, _id, context) => {
            queryClient.setQueryData(["notifications"], context?.previousNotifications);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
        },
    });
    // The effect to auto-mark read has been removed so notifications remain unread
    // until the user specifically clicks on one.
    return (_jsxs("div", { className: "max-w-3xl mx-auto w-full pb-24 pt-8", children: [_jsx("div", { className: "mb-4", children: _jsx(StatusCircles, {}) }), _jsxs("div", { className: "mb-8 relative p-8 rounded-[2rem] glass-panel overflow-hidden border border-white/5 shadow-2xl flex items-center gap-4", children: [_jsx("div", { className: "w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10", children: _jsx(Bell, { size: 28, className: "text-white" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl md:text-3xl font-black text-white tracking-tighter", children: "Notifications" }), _jsx("p", { className: "text-zinc-400 font-medium mt-1", children: "Activity across your network." })] })] }), isLoading ? (_jsx("div", { className: "space-y-4", children: [1, 2, 3].map((i) => (_jsx("div", { className: "h-24 glass-panel rounded-2xl animate-pulse" }, i))) })) : (() => {
                const hasNotifications = notifications && notifications.length > 0;
                if (!hasNotifications) {
                    return (_jsxs("div", { className: "glass-panel p-16 text-center rounded-[2rem] border border-dashed border-white/10", children: [_jsx(Bell, { size: 48, className: "mx-auto text-white/10 mb-4" }), _jsx("h2", { className: "text-xl font-bold text-white mb-2", children: "You're all caught up!" }), _jsx("p", { className: "text-white/40", children: "When someone interacts with you, it will show up here." })] }));
                }
                return (_jsx("div", { className: "space-y-4", children: notifications.map((notif, i) => {
                        const targetPath = notif.postId ? `/post/${notif.postId}` : `/profile/${notif.actor?.username}`;
                        return (_jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05 }, className: `glass-panel p-4 rounded-2xl flex items-center gap-4 border transition-colors ${!notif.read ? 'border-primary/30 bg-primary/5' : 'border-white/5 opacity-75 hover:opacity-100'}`, children: [_jsxs(Link, { to: `/profile/${notif.actor?.username}`, className: "relative shrink-0", children: [_jsx(Avatar, { src: notif.actor?.avatarUrl, label: notif.actor?.fullName || notif.actor?.username, alt: "", className: "w-12 h-12 rounded-xl object-cover bg-white/5" }), _jsx("div", { className: "absolute -bottom-1 -right-1 w-5 h-5 bg-[#0a0a0c] rounded-full flex items-center justify-center", children: getIconForType(notif.type) })] }), _jsxs(Link, { to: targetPath, onClick: () => markOneReadMutation.mutate(String(notif.id)), className: "flex-1 min-w-0", children: [_jsxs("p", { className: "text-sm text-white/80 leading-snug", children: [_jsx("span", { className: "font-bold text-white hover:underline", children: notif.actor?.fullName || notif.actor?.username }), " ", notif.message || getMessageForType(notif.type)] }), _jsx("p", { className: "text-xs text-white/40 mt-1", children: notif.timestamp })] }), !notif.read && (_jsx("div", { className: "w-2 h-2 rounded-full bg-primary shrink-0" }))] }, notif.id));
                    }) }));
            })()] }));
};
