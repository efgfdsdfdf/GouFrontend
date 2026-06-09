import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "../components/ui/Skeleton";
import { MapPin, Calendar, MessageSquare, Edit3, Check, Play, Trash2, X, } from "lucide-react";
import { useAuthStore } from "../store";
import { motion, AnimatePresence } from "framer-motion";
import { EditProfileModal } from "../components/profile/EditProfileModal";
import { PostCard } from "../components/feed/PostCard";
import { CreatePost } from "../components/feed/CreatePost";
import { CreateReel } from "../components/feed/CreateReel";
import { api, getApiErrorMessage } from "../services/api";
import { Avatar } from "../components/ui/Avatar";
import { useToast } from "../components/ui/Toast";
export const Profile = () => {
    const { username } = useParams();
    const { user: currentUser, updateUser } = useAuthStore();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const isOwnProfile = currentUser?.username === username;
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [isCreateReelOpen, setIsCreateReelOpen] = React.useState(false);
    const [selectedReel, setSelectedReel] = React.useState(null);
    const [activeTab, setActiveTab] = React.useState("posts");
    const coverInputRef = React.useRef(null);
    const { data: user, isLoading, isError, } = useQuery({
        queryKey: ["profile", username],
        queryFn: () => api.profiles.get(username || ""),
        enabled: !!username,
        staleTime: 1000 * 60 * 5,
    });
    const { data: posts, isLoading: postsLoading } = useQuery({
        queryKey: ["profile-posts", username],
        queryFn: () => api.profiles.getPosts(username || ""),
        enabled: !!username,
        staleTime: 1000 * 60 * 5,
    });
    const { data: reels, isLoading: reelsLoading } = useQuery({
        queryKey: ["profile-reels", username],
        queryFn: () => api.profiles.getReels(username || ""),
        enabled: !!username,
        staleTime: 1000 * 60 * 5,
    });
    const { data: following, isLoading: followingLoading } = useQuery({
        queryKey: ["profile-following", user?.id],
        queryFn: () => api.profiles.getFollowing(user?.id || ""),
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 5,
    });
    const { data: followers, isLoading: followersLoading } = useQuery({
        queryKey: ["profile-followers", user?.id],
        queryFn: () => api.profiles.getFollowers(user?.id || ""),
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 5,
    });
    const computedTotalLikes = [...(posts || []), ...(reels || [])].reduce((acc, curr) => acc + (curr.likes || 0), 0);
    const displayFollowers = followers?.length ?? user?.followers ?? 0;
    const displayFollowing = following?.length ?? user?.following ?? 0;
    const isFollowingProfile = Boolean(user?.isFollowing) ||
        Boolean(followers?.some((follower) => String(follower.id) === String(currentUser?.id)));
    const updateProfileMutation = useMutation({
        mutationFn: (data) => api.profiles.update(data),
        onSuccess: (updatedUser) => {
            if (isOwnProfile && updatedUser) {
                updateUser(updatedUser);
            }
            setIsEditModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ["profile", username] });
            queryClient.invalidateQueries({ queryKey: ["profile-posts", username] });
            queryClient.invalidateQueries({ queryKey: ["feed"] });
            queryClient.invalidateQueries({ queryKey: ["discover-reels"] });
        },
        onError: (error) => {
            toast(getApiErrorMessage(error, "Unable to update profile"), "error");
        },
    });
    const followMutation = useMutation({
        mutationFn: () => {
            if (!user)
                return Promise.reject();
            return isFollowingProfile
                ? api.profiles.unfollow(user.id)
                : api.profiles.follow(user.id);
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["profile", username] });
            const previousProfile = queryClient.getQueryData(["profile", username]);
            queryClient.setQueryData(["profile", username], (old) => {
                if (!old)
                    return old;
                return {
                    ...old,
                    isFollowing: !isFollowingProfile,
                    followers: isFollowingProfile ? old.followers - 1 : old.followers + 1,
                };
            });
            await queryClient.cancelQueries({ queryKey: ["profile-followers", user.id] });
            const previousFollowers = queryClient.getQueryData(["profile-followers", user.id]);
            queryClient.setQueryData(["profile-followers", user.id], (old) => {
                if (!old)
                    return old;
                if (isFollowingProfile) {
                    return old.filter((u) => u.id !== currentUser?.id);
                }
                else {
                    return [...old, currentUser];
                }
            });
            return { previousProfile, previousFollowers };
        },
        onError: (err, newTodo, context) => {
            queryClient.setQueryData(["profile", username], context?.previousProfile);
            queryClient.setQueryData(["profile-followers", user.id], context?.previousFollowers);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["profile", username] });
            queryClient.invalidateQueries({ queryKey: ["profile-followers", user.id] });
        },
    });
    const listUnfollowMutation = useMutation({
        mutationFn: (userId) => api.profiles.unfollow(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["profile-following", user?.id] });
            queryClient.invalidateQueries({ queryKey: ["profile", username] });
        }
    });
    const deleteReelMutation = useMutation({
        mutationFn: (postId) => api.posts.delete(postId),
        onSuccess: () => {
            setSelectedReel(null);
            queryClient.invalidateQueries({ queryKey: ["profile-reels", username] });
            queryClient.invalidateQueries({ queryKey: ["profile-posts", username] });
            queryClient.invalidateQueries({ queryKey: ["discover-reels"] });
            queryClient.invalidateQueries({ queryKey: ["feed"] });
            toast("Reel deleted", "success");
        },
        onError: (error) => {
            toast(getApiErrorMessage(error, "Unable to delete reel"), "error");
        },
    });
    if (isLoading) {
        return (_jsxs("div", { className: "max-w-4xl mx-auto w-full pb-24 pt-8 space-y-8", children: [_jsx(Skeleton, { className: "h-64 rounded-3xl w-full" }), _jsxs("div", { className: "flex gap-6 px-8", children: [_jsx(Skeleton, { className: "w-32 h-32 rounded-3xl -mt-16 border-4 border-[#030303]" }), _jsxs("div", { className: "space-y-2 mt-4", children: [_jsx(Skeleton, { className: "h-8 w-48 rounded-full" }), _jsx(Skeleton, { className: "h-4 w-32 rounded-full" })] })] })] }));
    }
    if (isError || !user) {
        return (_jsxs("div", { className: "max-w-4xl mx-auto w-full py-32 text-center", children: [_jsx("h2", { className: "text-2xl text-white font-serif mb-2", children: "User not found" }), _jsx("p", { className: "text-white/40", children: "The profile you're looking for doesn't exist." }), _jsx(Link, { to: "/", className: "text-white underline mt-4 block", children: "Go home" })] }));
    }
    return (_jsxs("div", { className: "max-w-5xl mx-auto w-full pb-28 pt-6 md:pt-8", children: [_jsxs("div", { className: "relative mb-20 group px-1 sm:px-0", children: [_jsxs("div", { className: "h-64 rounded-3xl overflow-hidden bg-white/5 border border-white/10 relative", children: [user.coverUrl ? (_jsx("img", { src: user.coverUrl, className: "w-full h-full object-cover", alt: "Cover" })) : (_jsx("div", { className: "w-full h-full bg-gradient-to-br from-white/10 to-white/5" })), isOwnProfile && (_jsx("div", { className: "absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-30 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity", children: _jsxs("div", { className: "relative bg-black/65 backdrop-blur-md px-4 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer border border-white/10 shadow-xl overflow-hidden group/btn", children: [_jsxs("span", { className: "relative z-10 flex items-center gap-2", children: [_jsx(Edit3, { size: 14 }), " Update Cover"] }), _jsx("div", { className: "absolute inset-0 bg-white/10 scale-x-0 group-hover/btn:scale-x-100 transform origin-left transition-transform duration-300 pointer-events-none" }), _jsx("input", { ref: coverInputRef, type: "file", className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-40", accept: "image/*", onChange: (e) => {
                                                if (e.target.files?.[0]) {
                                                    updateProfileMutation.mutate({ coverImage: e.target.files[0] });
                                                }
                                            } })] }) }))] }), _jsxs("div", { className: "absolute -bottom-12 left-8 flex items-end gap-6", children: [_jsx(Avatar, { src: user.avatarUrl, label: user.fullName, className: "w-32 h-32 rounded-3xl object-cover border-4 border-[#030303] bg-white/5", alt: user.fullName }), _jsxs("div", { className: "mb-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h1", { className: "text-3xl font-serif text-white", children: user.fullName }), _jsx("div", { className: "bg-blue-500/10 p-1 rounded-full", children: _jsx(Check, { className: "w-4 h-4 text-blue-400" }) })] }), _jsxs("p", { className: "text-white/40", children: ["@", user.username] })] })] }), _jsx("div", { className: "absolute top-4 right-4 flex gap-2", children: isOwnProfile ? (_jsx("button", { onClick: () => setIsEditModalOpen(true), className: "bg-black/50 backdrop-blur-md border border-white/10 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-black/70 transition-colors", children: "Edit profile" })) : (_jsxs(_Fragment, { children: [isFollowingProfile ? (_jsx(Link, { to: `/messages?userId=${encodeURIComponent(user.id)}&username=${encodeURIComponent(user.username)}&name=${encodeURIComponent(user.fullName)}&avatar=${encodeURIComponent(user.avatarUrl || "")}`, className: "p-2.5 flex items-center justify-center bg-black/50 backdrop-blur-md border border-white/10 text-white rounded-xl hover:bg-black/70 transition-colors", "aria-label": "Message user", title: "Message", children: _jsx(MessageSquare, { size: 20 }) })) : (_jsx("button", { onClick: () => followMutation.mutate(), disabled: followMutation.isPending, className: "px-4 py-2 rounded-xl text-sm font-medium bg-black/50 backdrop-blur-md border border-white/10 text-white hover:bg-black/70 transition-colors disabled:opacity-50", children: "Follow to message" })), _jsx("button", { onClick: () => followMutation.mutate(), className: `px-6 py-2 rounded-xl text-sm font-medium transition-colors ${isFollowingProfile
                                        ? "bg-white/10 text-white border border-white/10"
                                        : "bg-white text-black"}`, children: isFollowingProfile ? "Following" : "Follow" })] })) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-12 gap-8 px-2 sm:px-4", children: [_jsx("div", { className: "md:col-span-4 space-y-6", children: _jsxs("div", { className: "glass-panel p-6 rounded-3xl", children: [_jsx("h3", { className: "text-xs font-bold text-white/30 uppercase tracking-widest mb-4", children: "About" }), _jsx("p", { className: "text-white/80 text-sm leading-relaxed mb-6", children: user.bio || "No bio yet." }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-3 text-white/50 text-sm", children: [_jsx(MapPin, { size: 16 }), _jsx("span", { children: user.university })] }), _jsxs("div", { className: "flex items-center gap-3 text-white/50 text-sm", children: [_jsx(Calendar, { size: 16 }), _jsxs("span", { children: ["Joined ", new Date().getFullYear()] })] })] }), _jsxs("div", { className: "flex flex-wrap gap-x-8 gap-y-4 mt-8 pt-6 border-t border-white/5", children: [_jsxs("div", { className: "cursor-pointer", onClick: () => setActiveTab("followers"), children: [_jsx("p", { className: "text-white font-serif text-xl", children: displayFollowers }), _jsx("p", { className: "text-[10px] text-white/30 uppercase font-bold tracking-wider", children: "Followers" })] }), _jsxs("div", { className: "cursor-pointer", onClick: () => setActiveTab("following"), children: [_jsx("p", { className: "text-white font-serif text-xl", children: displayFollowing }), _jsx("p", { className: "text-[10px] text-white/30 uppercase font-bold tracking-wider", children: "Following" })] }), _jsxs("div", { children: [_jsx("p", { className: "text-primary font-serif text-xl", children: computedTotalLikes }), _jsx("p", { className: "text-[10px] text-white/30 uppercase font-bold tracking-wider", children: "Total Likes" })] })] })] }) }), _jsxs("div", { className: "md:col-span-8 space-y-6 min-w-0", children: [_jsxs("div", { className: "glass-panel rounded-3xl border border-white/5 overflow-hidden", children: [_jsx("div", { className: "px-4 sm:px-6 pt-5", children: _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-serif text-white", children: "Profile activity" }), _jsxs("p", { className: "text-xs text-white/40 mt-1", children: ["Posts and short reels from @", user.username] })] }) }), _jsx("div", { className: "mt-4 flex overflow-x-auto border-b border-white/5 px-2 sm:px-4 hide-scrollbar", children: [
                                            { id: "posts", label: "Posts" },
                                            { id: "reels", label: "Short Reels" },
                                            { id: "media", label: "Media" },
                                            { id: "following", label: "Following" },
                                            { id: "followers", label: "Followers" },
                                        ].map((tab) => (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `px-6 py-4 text-sm font-medium transition-colors relative ${activeTab === tab.id ? "text-white" : "text-white/40 hover:text-white"}`, children: [tab.label, activeTab === tab.id && (_jsx(motion.div, { layoutId: "profileTab", className: "absolute bottom-0 left-0 right-0 h-0.5 bg-white" }))] }, tab.id))) })] }), _jsx("div", { className: "rounded-3xl border border-white/5 bg-white/[0.025] p-3 sm:p-5 md:p-6", children: (activeTab === "posts" || activeTab === "media" || activeTab === "reels") ? (postsLoading ? (_jsx(Skeleton, { className: "h-64 rounded-3xl w-full" })) : activeTab === "reels" ? (reelsLoading ? (_jsx(Skeleton, { className: "h-64 rounded-3xl w-full" })) : (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "flex items-center justify-between gap-4 px-1", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-black uppercase tracking-widest text-white/80", children: "Short Reels" }), _jsx("p", { className: "text-xs text-white/35 mt-1", children: "Videos posted only to Discover." })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("span", { className: "text-xs text-white/40", children: [reels?.length || 0, " reels"] }), isOwnProfile && (_jsx("button", { onClick: () => setIsCreateReelOpen(true), className: "text-primary hover:text-white font-bold text-sm bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20", children: "+ Add Reel" }))] })] }), reels?.length ? (_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4", children: reels.map((reel) => (_jsxs("button", { type: "button", onClick: () => setSelectedReel(reel), className: "group relative aspect-[9/16] overflow-hidden rounded-2xl bg-black border border-white/10 shadow-lg", children: [_jsx("video", { src: reel.imageUrl, className: "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105", muted: true, playsInline: true, preload: "metadata" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" }), _jsx("div", { className: "absolute left-3 top-3 h-8 w-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/10", children: _jsx(Play, { size: 14, className: "text-white fill-white ml-0.5" }) }), _jsxs("div", { className: "absolute inset-x-0 bottom-0 p-3", children: [_jsx("p", { className: "line-clamp-2 text-xs font-medium text-white/90", children: reel.content || "Short reel" }), _jsxs("p", { className: "mt-2 text-[10px] font-bold uppercase tracking-widest text-white/45", children: [reel.likes, " likes"] })] })] }, reel.id))) })) : (_jsx("div", { className: "py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10", children: _jsx("p", { className: "text-white/35", children: "No short reels yet." }) }))] }))) : (_jsxs("div", { className: "space-y-7 text-white", children: [activeTab === "posts" && isOwnProfile && (_jsx("div", { className: "mb-2", children: _jsx(CreatePost, { profileUsername: username }) })), (activeTab === "media" ? posts?.filter((p) => p.imageUrl) : posts)?.map((post) => (_jsx("div", { className: "mx-0 sm:mx-1 md:mx-2", children: _jsx(PostCard, { post: post }) }, post.id))), ((activeTab === "media" ? posts?.filter((p) => p.imageUrl) : posts)?.length === 0) && (_jsx("div", { className: "py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10", children: _jsxs("p", { className: "text-white/30", children: ["No ", activeTab, " yet."] }) }))] }))) : (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: (activeTab === "following" ? following : followers)?.map((u) => (_jsxs("div", { className: "glass-panel p-4 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-colors gap-2", children: [_jsxs(Link, { to: `/profile/${u.username}`, className: "flex items-center gap-3 min-w-0 flex-1", children: [_jsx(Avatar, { src: u.avatarUrl, label: u.fullName, className: "w-10 h-10 rounded-full border border-white/10 shrink-0", alt: u.fullName }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-white text-sm font-medium truncate", children: u.fullName }), _jsxs("p", { className: "text-white/40 text-xs truncate", children: ["@", u.username] })] })] }), isOwnProfile && activeTab === "following" && (_jsx("button", { onClick: (e) => {
                                                    e.preventDefault();
                                                    listUnfollowMutation.mutate(u.id);
                                                }, disabled: listUnfollowMutation.isPending, className: "px-3 py-1.5 bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 text-xs font-medium rounded-lg transition-colors shrink-0", children: "Unfollow" }))] }, u.id))) })) })] })] }), _jsx(EditProfileModal, { isOpen: isEditModalOpen, onClose: () => setIsEditModalOpen(false), initialData: user, onSave: (data) => updateProfileMutation.mutate(data), isSaving: updateProfileMutation.isPending }), _jsx(CreateReel, { isOpen: isCreateReelOpen, onClose: () => setIsCreateReelOpen(false) }), _jsx(AnimatePresence, { children: selectedReel && (_jsxs("div", { className: "fixed inset-0 z-[220] flex items-center justify-center bg-black/85 p-0 sm:p-4 backdrop-blur-md", children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "absolute inset-0", onClick: () => setSelectedReel(null) }), _jsxs(motion.div, { initial: { opacity: 0, y: 20, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 20, scale: 0.98 }, className: "relative h-[100dvh] w-full max-w-md overflow-hidden bg-black sm:h-[86dvh] sm:rounded-3xl sm:border sm:border-white/10", children: [_jsx("video", { src: selectedReel.imageUrl, className: "h-full w-full object-contain", controls: true, autoPlay: true, playsInline: true }), _jsxs("div", { className: "absolute left-0 right-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent p-4", children: [_jsxs("div", { className: "min-w-0", children: [_jsxs("p", { className: "truncate text-sm font-black text-white", children: ["@", selectedReel.author?.username] }), _jsx("p", { className: "truncate text-xs text-white/55", children: selectedReel.content || "Short reel" })] }), _jsx("button", { onClick: () => setSelectedReel(null), className: "ml-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white", "aria-label": "Close reel", children: _jsx(X, { size: 20 }) })] }), isOwnProfile && (_jsx("button", { onClick: () => {
                                        if (window.confirm("Delete this reel from your profile?")) {
                                            deleteReelMutation.mutate(selectedReel.id);
                                        }
                                    }, disabled: deleteReelMutation.isPending, className: "absolute bottom-6 right-4 flex h-11 w-11 items-center justify-center rounded-full border border-red-500/30 bg-red-500/20 text-red-200 backdrop-blur-md disabled:opacity-50", "aria-label": "Delete reel", children: _jsx(Trash2, { size: 18 }) }))] })] })) })] }));
};
