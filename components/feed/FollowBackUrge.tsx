import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import { useAuthStore } from "../../store";
import { User } from "../../types";
import { X } from "lucide-react";

interface FollowBackUrgeProps {
  className?: string;
}

export const FollowBackUrge = ({ className = "" }: FollowBackUrgeProps) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("dismissed_follow_backs") || "[]"));
    } catch {
      return new Set();
    }
  });

  const { data: followers = [] } = useQuery({
    queryKey: ["followers", user?.id],
    queryFn: () => api.profiles.getFollowers(user!.id),
    enabled: !!user?.id,
  });

  const { data: following = [] } = useQuery({
    queryKey: ["following", user?.id],
    queryFn: () => api.profiles.getFollowing(user!.id),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (followers.length > 0 && following.length >= 0) {
      const followingIds = new Set(following.map((u) => u.id));
      const notFollowedBack = followers.find((u) => !followingIds.has(u.id) && !dismissedIds.has(u.id));
      if (notFollowedBack) {
        setTargetUser(notFollowedBack);
      } else {
        setTargetUser(null);
      }
    }
  }, [followers, following, dismissedIds]);

  const followMutation = useMutation({
    mutationFn: (userId: string) => api.profiles.follow(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["following", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["profile", targetUser?.username] });
      setTargetUser(null);
    },
  });

  const handleDismiss = () => {
    if (!targetUser) return;
    const newDismissed = new Set(dismissedIds);
    newDismissed.add(targetUser.id);
    setDismissedIds(newDismissed);
    localStorage.setItem("dismissed_follow_backs", JSON.stringify(Array.from(newDismissed)));
    setTargetUser(null);
  };

  if (!targetUser) return null;

  return (
    <div className={`glass-panel p-4 rounded-2xl mb-6 border-l-4 border-l-primary flex items-center justify-between gap-4 animate-in fade-in slide-in-from-right-4 duration-500 relative ${className}`}>
      <button 
        onClick={handleDismiss} 
        className="absolute top-2 right-2 text-white/40 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
      <div className="flex items-center gap-3 pr-4">
        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/10">
          <img src={targetUser.avatarUrl} alt={targetUser.fullName} className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="text-sm font-medium text-white line-clamp-1">{targetUser.fullName}</p>
          <p className="text-xs text-primary font-bold">Follows you! Follow back?</p>
        </div>
      </div>
      <button
        onClick={() => followMutation.mutate(targetUser.id)}
        disabled={followMutation.isPending}
        className="px-4 py-2 bg-primary text-black rounded-lg text-xs font-bold whitespace-nowrap hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
      >
        {followMutation.isPending ? "Following..." : "Follow Back"}
      </button>
    </div>
  );
};
