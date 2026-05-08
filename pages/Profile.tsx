import React from "react";
import { useParams, Link } from "react-router-dom";
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
} from "lucide-react";
import { useAuthStore } from "../store";
import { motion, AnimatePresence } from "framer-motion";
import { EditProfileModal } from "../components/profile/EditProfileModal";
import { PostCard } from "../components/feed/PostCard";
import { CreatePost } from "../components/feed/CreatePost";
import { api } from "../services/api";

export const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const isOwnProfile = currentUser?.username === username;
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"posts" | "media" | "following" | "followers">("posts");

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

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => api.profiles.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", username] });
    },
  });

  const chatMutation = useMutation({
    mutationFn: (userId: string) => api.chats.createConversation([userId]),
    onSuccess: () => {
      window.location.href = '/#/messages';
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
    <div className="max-w-4xl mx-auto w-full pb-24 pt-8">
      {/* Header */}
      <div className="relative mb-16 group">
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
              <Link 
                to={`/messages?userId=${user.id}`}
                className="p-2.5 bg-black/50 backdrop-blur-md border border-white/10 text-white rounded-xl hover:bg-black/70 transition-colors"
              >
                <MessageSquare size={20} />
              </Link>
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

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 px-4">
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
                <p className="text-white font-serif text-xl">{user.followers}</p>
                <p className="text-[10px] text-white/30 uppercase font-bold tracking-wider">Followers</p>
              </div>
              <div className="cursor-pointer" onClick={() => setActiveTab("following")}>
                <p className="text-white font-serif text-xl">{user.following}</p>
                <p className="text-[10px] text-white/30 uppercase font-bold tracking-wider">Following</p>
              </div>
              <div>
                <p className="text-primary font-serif text-xl">{user.totalLikes || 0}</p>
                <p className="text-[10px] text-white/30 uppercase font-bold tracking-wider">Total Likes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="md:col-span-8 space-y-6">
          <div className="flex border-b border-white/5">
            {[
              { id: "posts", label: "Posts" },
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

          <div className="space-y-6">
            {(activeTab === "posts" || activeTab === "media") ? (
              postsLoading ? (
                <Skeleton className="h-64 rounded-3xl w-full" />
              ) : (
                <div className="space-y-6 text-white">
                  {activeTab === "posts" && isOwnProfile && (
                    <CreatePost profileUsername={username} />
                  )}
                  {(activeTab === "media" ? posts?.filter((p: any) => p.imageUrl) : posts)?.map((post: any) => (
                    <PostCard key={post.id} post={post} />
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
    </div>
  );
};
