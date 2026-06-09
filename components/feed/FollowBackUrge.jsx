import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import { useAuthStore } from "../../store";
import { X } from "lucide-react";
export const FollowBackUrge = ({ className = "" }) => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [targetUser, setTargetUser] = useState(null);
    const [dismissedIds, setDismissedIds] = useState(() => {
        try {
            return new Set(JSON.parse(localStorage.getItem("dismissed_follow_backs") || "[]"));
        }
        catch {
            return new Set();
        }
    });
    const { data: followers = [] } = useQuery({
        queryKey: ["followers", user?.id],
        queryFn: () => api.profiles.getFollowers(user.id),
        enabled: !!user?.id,
    });
    const { data: following = [] } = useQuery({
        queryKey: ["following", user?.id],
        queryFn: () => api.profiles.getFollowing(user.id),
        enabled: !!user?.id,
    });
    useEffect(() => {
        if (followers.length > 0 && following.length >= 0) {
            const followingIds = new Set(following.map((u) => u.id));
            const notFollowedBack = followers.find((u) => !followingIds.has(u.id) && !dismissedIds.has(u.id));
            if (notFollowedBack) {
                setTargetUser(notFollowedBack);
            }
            else {
                setTargetUser(null);
            }
        }
    }, [followers, following, dismissedIds]);
    const followMutation = useMutation({
        mutationFn: (userId) => api.profiles.follow(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["following", user?.id] });
            queryClient.invalidateQueries({ queryKey: ["profile", targetUser?.username] });
            setTargetUser(null);
        },
    });
    const handleDismiss = () => {
        if (!targetUser)
            return;
        const newDismissed = new Set(dismissedIds);
        newDismissed.add(targetUser.id);
        setDismissedIds(newDismissed);
        localStorage.setItem("dismissed_follow_backs", JSON.stringify(Array.from(newDismissed)));
        setTargetUser(null);
    };
    if (!targetUser)
        return null;
    return (_jsxs("div", { className: `glass-panel p-4 rounded-2xl mb-6 border-l-4 border-l-primary flex items-center justify-between gap-4 animate-in fade-in slide-in-from-right-4 duration-500 relative ${className}`, children: [_jsx("button", { onClick: handleDismiss, className: "absolute top-2 right-2 text-white/40 hover:text-white transition-colors", "aria-label": "Dismiss", children: _jsx(X, { size: 14 }) }), _jsxs("div", { className: "flex items-center gap-3 pr-4", children: [_jsx("div", { className: "w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/10", children: _jsx("img", { src: targetUser.avatarUrl, alt: targetUser.fullName, className: "w-full h-full object-cover" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-white line-clamp-1", children: targetUser.fullName }), _jsx("p", { className: "text-xs text-primary font-bold", children: "Follows you! Follow back?" })] })] }), _jsx("button", { onClick: () => followMutation.mutate(targetUser.id), disabled: followMutation.isPending, className: "px-4 py-2 bg-primary text-black rounded-lg text-xs font-bold whitespace-nowrap hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0", children: followMutation.isPending ? "Following..." : "Follow Back" })] }));
};
