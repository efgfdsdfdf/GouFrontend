import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "../components/ui/Skeleton";
import {
  MapPin,
  Calendar,
  Users,
  MessageSquare,
  Edit3,
  Share2,
  Check,
  Play,
} from "lucide-react";
import { useAuthStore } from "../store";
import { motion, AnimatePresence } from "framer-motion";
import { EditProfileModal } from "../components/profile/EditProfileModal";
import { PostCard } from "../components/feed/PostCard";
import { CreatePost } from "../components/feed/CreatePost";
import { CreateReel } from "../components/feed/CreateReel";
import { api } from "../services/api";

export const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isOwnProfile = currentUser?.username === username;
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isCreateReelOpen, setIsCreateReelOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"posts" | "reels" | "media" | "following" | "followers">("posts");

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["profile", username],
    queryFn: () => api.profiles.get(username || ""),
    enabled: !!username,
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ["profile-posts", username],
    queryFn: () => api.profiles.getPosts(username || ""),
    enabled: !!username,
  });

  const { data: reels, isLoading: reelsLoading } = useQuery({
    queryKey: ["profile-reels", username],
    queryFn: () => api.profiles.getReels(username || ""),
    enabled: !!username,
  });

  const { data: following, isLoading: followingLoading } = useQuery({
    queryKey: ["profile-following", user?.id],
    queryFn: () => api.profiles.getFollowing(user?.id || ""),
    enabled: !!user?.id && activeTab === "following",
  });

  const { data: followers, isLoading: followersLoading } = useQuery({
    queryKey: ["profile-followers", user?.id],
    queryFn: () => api.profiles.getFollowers(user?.id || ""),
    enabled: !!user?.id && activeTab === "followers",
  });

  const computedTotalLikes = [...(posts || []), ...(reels || [])].reduce((acc, curr) => acc + (curr.likes || 0), 0);
  const displayFollowers = followers?.length ?? user?.followers ?? 0;
  const displayFollowing = following?.length ?? user?.following ?? 0;

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => api.profiles.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", username] });
    },
  });

  const chatMutation = useMutation({
    mutationFn: (userId: string) => api.chats.createConversation([userId]),
    onSuccess: () => {
      navigate(
        `/messages?userId=${encodeURIComponent(user.id)}&username=${encodeURIComponent(user.username)}&name=${encodeURIComponent(user.fullName)}&avatar=${encodeURIComponent(user.avatarUrl || "")}`,
      );
    },
  });

  const followMutation = useMutation({
    mutationFn: () => {
      if (!user) return Promise.reject();
      return user.isFollowing
        ? api.profiles.unfollow(user.id)
        : api.profiles.follow(user.id);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["profile", username] });
      const previousProfile = queryClient.getQueryData(["profile", username]);

      queryClient.setQueryData(["profile", username], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          isFollowing: !old.isFollowing,
          followers: old.isFollowing ? old.followers - 1 : old.followers + 1,
        };
      });

      return { previousProfile };
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(["profile", username], context?.previousProfile);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", username] });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto w-full pb-24 pt-8 space-y-8">
        <Skeleton className="h-64 rounded-3xl w-full" />
        <div className="flex gap-6 px-8">
          <Skeleton className="w-32 h-32 rounded-3xl -mt-16 border-4 border-[#030303]" />
          <div className="space-y-2 mt-4">
            <Skeleton className="h-8 w-48 rounded-full" />
            <Skeleton className="h-4 w-32 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="max-w-4xl mx-auto w-full py-32 text-center">
        <h2 className="text-2xl text-white font-serif mb-2">User not found</h2>
        <p className="text-white/40">The profile you're looking for doesn't exist.</p>
        <Link to="/" className="text-white underline mt-4 block">Go home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full pb-28 pt-6 md:pt-8">
      {/* Header */}
      <div className="relative mb-20 group px-1 sm:px-0">
        <div className="h-64 rounded-3xl overflow-hidden bg-white/5 border border-white/10 relative">
          {user.coverUrl ? (
            <img src={user.coverUrl} className="w-full h-full object-cover" alt="Cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5" />
          )}
          
          {/* Cover Photo Upload Overlay */}
          {isOwnProfile && (
            <label className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 shadow-xl overflow-hidden group/btn">
              <span className="relative z-10 flex items-center gap-2">
                <Edit3 size={14} /> Update Cover
              </span>
              <div className="absolute inset-0 bg-white/10 scale-x-0 group-hover/btn:scale-x-100 transform origin-left transition-transform duration-300 pointer-events-none" />
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    updateProfileMutation.mutate({ coverImage: e.target.files[0] });
                  }
                }} 
              />
            </label>
          )}
        </div>
        
        <div className="absolute -bottom-12 left-8 flex items-end gap-6">
          <img
            src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.fullName}&background=random`}
            className="w-32 h-32 rounded-3xl object-cover border-4 border-[#030303] bg-white/5"
            alt={user.fullName}
            referrerPolicy="no-referrer"
          />
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-serif text-white">{user.fullName}</h1>
              <div className="bg-blue-500/10 p-1 rounded-full">
                <Check className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <p className="text-white/40">@{user.username}</p>
          </div>
        </div>

        <div className="absolute top-4 right-4 flex gap-2">
          {isOwnProfile ? (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="bg-black/50 backdrop-blur-md border border-white/10 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-black/70 transition-colors"
            >
              Edit profile
            </button>
          ) : (
            <>
              <button 
                onClick={() => chatMutation.mutate(user.id)}
                disabled={chatMutation.isPending}
                className="p-2.5 bg-black/50 backdrop-blur-md border border-white/10 text-white rounded-xl hover:bg-black/70 transition-colors disabled:opacity-50"
              >
                <MessageSquare size={20} />
              </button>
              <button
                onClick={() => followMutation.mutate()}
                className={`px-6 py-2 rounded-xl text-sm font-medium transition-colors ${
                  user.isFollowing 
                  ? "bg-white/10 text-white border border-white/10" 
                  : "bg-white text-black"
                }`}
              >
                {user.isFollowing ? "Following" : "Follow"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 px-2 sm:px-4">
        {/* Sidebar */}
        <div className="md:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-3xl">
            <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">About</h3>
            <p className="text-white/80 text-sm leading-relaxed mb-6">
              {user.bio || "No bio yet."}
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-white/50 text-sm">
                <MapPin size={16} />
                <span>{user.university}</span>
              </div>
              <div className="flex items-center gap-3 text-white/50 text-sm">
                <Calendar size={16} />
                <span>Joined {new Date().getFullYear()}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-x-8 gap-y-4 mt-8 pt-6 border-t border-white/5">
              <div className="cursor-pointer" onClick={() => setActiveTab("followers")}>
                <p className="text-white font-serif text-xl">{displayFollowers}</p>
                <p className="text-[10px] text-white/30 uppercase font-bold tracking-wider">Followers</p>
              </div>
              <div className="cursor-pointer" onClick={() => setActiveTab("following")}>
                <p className="text-white font-serif text-xl">{displayFollowing}</p>
                <p className="text-[10px] text-white/30 uppercase font-bold tracking-wider">Following</p>
              </div>
              <div>
                <p className="text-primary font-serif text-xl">{computedTotalLikes}</p>
                <p className="text-[10px] text-white/30 uppercase font-bold tracking-wider">Total Likes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="md:col-span-8 space-y-6 min-w-0">
          <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
            <div className="px-4 sm:px-6 pt-5">
              <div>
                <h2 className="text-xl font-serif text-white">Profile activity</h2>
                <p className="text-xs text-white/40 mt-1">Posts and short reels from @{user.username}</p>
              </div>
            </div>
            <div className="mt-4 flex overflow-x-auto border-b border-white/5 px-2 sm:px-4 hide-scrollbar">
            {[
              { id: "posts", label: "Posts" },
              { id: "reels", label: "Short Reels" },
              { id: "media", label: "Media" },
              { id: "following", label: "Following" },
              { id: "followers", label: "Followers" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-4 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id ? "text-white" : "text-white/40 hover:text-white"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="profileTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                )}
              </button>
            ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/5 bg-white/[0.025] p-3 sm:p-5 md:p-6">
            {(activeTab === "posts" || activeTab === "media" || activeTab === "reels") ? (
              postsLoading ? (
                <Skeleton className="h-64 rounded-3xl w-full" />
              ) : activeTab === "reels" ? (
                reelsLoading ? (
                  <Skeleton className="h-64 rounded-3xl w-full" />
                ) : (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between gap-4 px-1">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-white/80">Short Reels</h3>
                        <p className="text-xs text-white/35 mt-1">Videos posted only to Discover.</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-white/40">{reels?.length || 0} reels</span>
                        {isOwnProfile && (
                          <button 
                            onClick={() => setIsCreateReelOpen(true)}
                            className="text-primary hover:text-white font-bold text-sm bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20"
                          >
                            + Add Reel
                          </button>
                        )}
                      </div>
                    </div>
                    {reels?.length ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                        {reels.map((reel: any) => (
                          <Link
                            key={reel.id}
                            to="/discover"
                            className="group relative aspect-[9/16] overflow-hidden rounded-2xl bg-black border border-white/10 shadow-lg"
                          >
                            <video
                              src={reel.imageUrl}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              muted
                              playsInline
                              preload="metadata"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />
                            <div className="absolute left-3 top-3 h-8 w-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/10">
                              <Play size={14} className="text-white fill-white ml-0.5" />
                            </div>
                            <div className="absolute inset-x-0 bottom-0 p-3">
                              <p className="line-clamp-2 text-xs font-medium text-white/90">
                                {reel.content || "Short reel"}
                              </p>
                              <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-white/45">
                                {reel.likes} likes
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <p className="text-white/35">No short reels yet.</p>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="space-y-7 text-white">
                  {activeTab === "posts" && isOwnProfile && (
                    <div className="mb-2">
                      <CreatePost profileUsername={username} />
                    </div>
                  )}
                  {(activeTab === "media" ? posts?.filter((p: any) => p.imageUrl) : posts)?.map((post: any) => (
                    <div key={post.id} className="mx-0 sm:mx-1 md:mx-2">
                      <PostCard post={post} />
                    </div>
                  ))}
                  {((activeTab === "media" ? posts?.filter((p: any) => p.imageUrl) : posts)?.length === 0) && (
                    <div className="py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                      <p className="text-white/30">No {activeTab} yet.</p>
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(activeTab === "following" ? following : followers)?.map((u: any) => (
                  <Link
                    key={u.id}
                    to={`/profile/${u.username}`}
                    className="glass-panel p-4 rounded-2xl flex items-center gap-3 hover:bg-white/5 transition-colors"
                  >
                    <img
                      src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.fullName}`}
                      className="w-10 h-10 rounded-full border border-white/10"
                      alt={u.fullName}
                    />
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{u.fullName}</p>
                      <p className="text-white/40 text-xs truncate">@{u.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={user}
        onSave={(data) => updateProfileMutation.mutate(data)}
      />

      <CreateReel 
        isOpen={isCreateReelOpen}
        onClose={() => setIsCreateReelOpen(false)}
      />
    </div>
  );
};
