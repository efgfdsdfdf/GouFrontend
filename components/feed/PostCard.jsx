import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from "react";
import { Heart, MessageCircle, Share2, Bookmark, Flag, Trash2, MoreHorizontal, X, Music, Download, } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../services/api";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CommentSection } from "./CommentSection";
import { useAuthStore } from "../../store";
import { MediaPlayer } from "../ui/MediaPlayer";
import { useToast } from "../ui/Toast";
export const PostCard = ({ post }) => {
    const { toast } = useToast();
    const [showComments, setShowComments] = React.useState(false);
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuthStore();
    const [showMenu, setShowMenu] = React.useState(false);
    const [isReporting, setIsReporting] = React.useState(false);
    const [reportReason, setReportReason] = React.useState("");
    const [isLoaded, setIsLoaded] = React.useState(false);
    const updatePostAcrossLists = React.useCallback((updater) => {
        queryClient.setQueriesData({ queryKey: ["feed"] }, (old) => {
            if (!old?.pages)
                return old;
            return {
                ...old,
                pages: old.pages.map((page) => page.map(updater)),
            };
        });
        queryClient.setQueriesData({ queryKey: ["discover-reels"] }, (old) => {
            if (!old?.pages)
                return old;
            return {
                ...old,
                pages: old.pages.map((page) => page.map(updater)),
            };
        });
        queryClient.setQueryData(["profile-posts", post.author.username], (old) => Array.isArray(old) ? old.map(updater) : old);
        if (post.groupId) {
            queryClient.setQueryData(["group-posts", post.groupId], (old) => Array.isArray(old) ? old.map(updater) : old);
        }
    }, [post.author.username, post.groupId, queryClient]);
    const likeMutation = useMutation({
        mutationFn: () => api.posts.like(post.id),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["feed"] });
            await queryClient.cancelQueries({ queryKey: ["discover-reels"] });
            const updatePost = (p) => {
                if (p.id === post.id) {
                    return {
                        ...p,
                        likes: p.isLiked ? p.likes - 1 : p.likes + 1,
                        isLiked: !p.isLiked,
                    };
                }
                return p;
            };
            updatePostAcrossLists(updatePost);
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: ["feed"] });
            queryClient.invalidateQueries({ queryKey: ["discover-reels"] });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["feed"] });
            queryClient.invalidateQueries({ queryKey: ["discover-reels"] });
            queryClient.invalidateQueries({ queryKey: ["post", post.id] });
            queryClient.invalidateQueries({ queryKey: ["profile-posts", post.author.username] });
            if (post.groupId) {
                queryClient.invalidateQueries({ queryKey: ["group-posts", post.groupId] });
            }
        },
    });
    const reportMutation = useMutation({
        mutationFn: (reason) => api.reports.create({ reason, postId: post.id }),
        onSuccess: () => {
            toast("Report submitted for review", "success");
            setShowMenu(false);
        },
    });
    const deleteMutation = useMutation({
        mutationFn: () => api.posts.delete(post.id),
        onMutate: async () => {
            setShowMenu(false);
            await queryClient.cancelQueries({ queryKey: ["feed"] });
            await queryClient.cancelQueries({ queryKey: ["discover-reels"] });
            await queryClient.cancelQueries({ queryKey: ["profile-posts", post.author.username] });
            if (post.groupId) {
                await queryClient.cancelQueries({ queryKey: ["group-posts", post.groupId] });
            }
            const previousFeed = queryClient.getQueriesData({ queryKey: ["feed"] });
            const previousDiscover = queryClient.getQueriesData({ queryKey: ["discover-reels"] });
            const previousProfile = queryClient.getQueryData(["profile-posts", post.author.username]);
            const previousGroup = post.groupId ? queryClient.getQueryData(["group-posts", post.groupId]) : undefined;
            queryClient.setQueriesData({ queryKey: ["feed"] }, (old) => {
                if (!old?.pages)
                    return old;
                return { ...old, pages: old.pages.map((page) => page.filter((item) => item.id !== post.id)) };
            });
            queryClient.setQueriesData({ queryKey: ["discover-reels"] }, (old) => {
                if (!old?.pages)
                    return old;
                return { ...old, pages: old.pages.map((page) => page.filter((item) => item.id !== post.id)) };
            });
            queryClient.setQueryData(["profile-posts", post.author.username], (old) => Array.isArray(old) ? old.filter((item) => item.id !== post.id) : old);
            if (post.groupId) {
                queryClient.setQueryData(["group-posts", post.groupId], (old) => Array.isArray(old) ? old.filter((item) => item.id !== post.id) : old);
            }
            return { previousFeed, previousDiscover, previousProfile, previousGroup };
        },
        onSuccess: () => {
            toast("Post deleted successfully", "success");
        },
        onError: (_err, _vars, context) => {
            context?.previousFeed?.forEach(([key, value]) => queryClient.setQueryData(key, value));
            context?.previousDiscover?.forEach(([key, value]) => queryClient.setQueryData(key, value));
            queryClient.setQueryData(["profile-posts", post.author.username], context?.previousProfile);
            if (post.groupId) {
                queryClient.setQueryData(["group-posts", post.groupId], context?.previousGroup);
            }
            toast("Unable to delete post", "error");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["feed"] });
            queryClient.invalidateQueries({ queryKey: ["discover-reels"] });
            queryClient.invalidateQueries({ queryKey: ["post", post.id] });
            queryClient.invalidateQueries({ queryKey: ["profile-posts", post.author.username] });
            if (post.groupId) {
                queryClient.invalidateQueries({ queryKey: ["group-posts", post.groupId] });
            }
        },
    });
    const isModerator = currentUser?.role === "admin" || currentUser?.role === "moderator";
    const isOwner = String(currentUser?.id) === String(post.author.id) || currentUser?.username === post.author.username;
    const handleShare = async () => {
        const shareUrl = `${window.location.origin}/post/${post.id}`;
        const text = post.content
            ? `${post.content}\n\nShared from GoUnion by @${post.author.username}`
            : `Check out this post from @${post.author.username} on GoUnion.`;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: "GoUnion post",
                    text,
                    url: shareUrl,
                });
            }
            else {
                await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
                toast("Post content copied", "success");
            }
        }
        catch (err) {
            if (err.name !== "AbortError") {
                toast("Unable to share post", "error");
            }
        }
    };
    const handleDownload = async () => {
        if (!post.imageUrl)
            return;
        try {
            toast("Downloading...", "success");
            const response = await fetch(post.imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gounion_post_${post.id}.${blob.type.split('/')[1] || 'mp4'}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        }
        catch (error) {
            toast("Download failed", "error");
        }
    };
    const getCleanCaption = (content) => {
        return content.replace(/(?:🎵 )?Sound:.*$/m, '').replace(/\[Overlay Text:.*\]/m, '').replace(/\[Sticker:.*\]/m, '').replace(/\[Mix:.*\]/m, '').trim();
    };
    const getOverlayText = (content) => {
        const match = content.match(/\[Overlay Text: (.*?)\]/);
        return match ? match[1] : null;
    };
    const getSoundName = () => {
        const content = post.content || "";
        const soundMatch = content.match(/(?:🎵 )?Sound: (.*)$/m);
        if (soundMatch)
            return soundMatch[1].trim();
        if (post.isReel || post.mediaType === "video" || post.imageUrl?.match(/\.(mp4|webm|mov|m4v|avi|mkv|m3u8)(\?|$)/i)) {
            return `Original sound - @${post.author.username}`;
        }
        return null;
    };
    const cleanCaption = getCleanCaption(post.content || "");
    const overlayText = getOverlayText(post.content || "");
    const soundName = getSoundName();
    return (_jsxs(motion.article, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 }, className: "glass-panel rounded-none sm:rounded-2xl overflow-hidden group", children: [_jsxs("div", { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Link, { to: `/profile/${post.author.username}`, children: _jsx("img", { src: post.author.avatarUrl || `https://ui-avatars.com/api/?name=${post.author.fullName}&background=random`, alt: post.author.fullName, className: "w-10 h-10 rounded-full object-cover border border-white/10", referrerPolicy: "no-referrer" }) }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Link, { to: `/profile/${post.author.username}`, className: "font-medium text-white hover:underline", children: post.author.fullName }), _jsx("div", { className: "bg-primary-foreground/10 text-primary-foreground p-0.5 rounded-full", children: _jsx("svg", { className: "w-3 h-3 text-blue-400", viewBox: "0 0 24 24", fill: "currentColor", children: _jsx("path", { d: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" }) }) })] }), _jsx("p", { className: "text-xs text-white/50", children: post.timestamp })] })] }), _jsxs("div", { className: "relative", children: [_jsx("button", { onClick: () => setShowMenu(!showMenu), className: "p-2 text-white/40 hover:text-white transition-colors rounded-full hover:bg-white/5", children: _jsx(MoreHorizontal, { className: "w-5 h-5" }) }), _jsx(AnimatePresence, { children: showMenu && (_jsxs(_Fragment, { children: [_jsx("div", { className: "fixed inset-0 z-[100]", onClick: () => setShowMenu(false) }), _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95, y: 10 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.95, y: 10 }, className: "absolute right-0 mt-2 w-48 bg-[#1a1a1e] border border-white/10 rounded-2xl shadow-2xl z-[110] overflow-hidden", children: [!isOwner && (_jsxs("button", { onClick: () => {
                                                                setIsReporting(true);
                                                                setShowMenu(false);
                                                            }, className: "w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all", children: [_jsx(Flag, { size: 16 }), "Report"] })), (isOwner || isModerator) && (_jsxs("button", { onClick: (e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setShowMenu(false);
                                                                deleteMutation.mutate();
                                                            }, className: "w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all", children: [_jsx(Trash2, { size: 16 }), "Delete"] }))] })] })) })] })] }), cleanCaption && (_jsx("p", { className: "text-white/90 text-[15px] leading-relaxed mb-4 whitespace-pre-wrap", children: cleanCaption })), soundName && (_jsxs(Link, { to: `/sound/${encodeURIComponent(soundName)}`, className: "inline-flex items-center gap-2 mb-4 text-white/50 bg-white/5 hover:bg-white/10 transition-colors px-3 py-1.5 rounded-full border border-white/5", children: [_jsx(Music, { size: 12, className: "text-primary" }), _jsx("span", { className: "text-[10px] font-black uppercase tracking-[0.1em] overflow-hidden whitespace-nowrap max-w-[200px] truncate", children: soundName })] }))] }), post.imageUrl && (_jsxs("div", { className: "relative w-full bg-black/20 border-y border-white/5 min-h-[300px] flex items-center justify-center", children: [!isLoaded && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center pointer-events-none z-0", children: _jsx("div", { className: "w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center font-serif font-black text-3xl text-white/20 animate-pulse border border-white/10", children: "G" }) })), _jsxs("div", { className: `relative z-10 w-full ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`, children: [_jsx(MediaPlayer, { url: post.imageUrl, alt: "Post media", autoPlayOnVisible: true, maxHeight: "520px", onLoadedData: () => setIsLoaded(true), onLoad: () => setIsLoaded(true) }), overlayText && (_jsx("div", { className: "absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none z-20", children: _jsx("p", { className: "text-white font-black text-2xl text-center drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] break-words w-full", style: { textShadow: '2px 2px 4px #000, -2px -2px 4px #000, 2px -2px 4px #000, -2px 2px 4px #000' }, children: overlayText }) }))] })] })), _jsxs("div", { className: "p-4 border-t border-white/5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-6", children: [_jsxs("button", { onClick: () => likeMutation.mutate(), className: `flex items-center gap-2 transition-all duration-300 ${post.isLiked ? "text-pink-500" : "text-white/60 hover:text-pink-500"}`, children: [_jsx(Heart, { size: 20, className: post.isLiked ? "fill-current" : "" }), _jsx("span", { className: "text-sm font-medium", children: post.likes })] }), _jsxs("button", { onClick: () => setShowComments(!showComments), className: `flex items-center gap-2 transition-all duration-300 ${showComments ? "text-blue-400" : "text-white/60 hover:text-blue-400"}`, children: [_jsx(MessageCircle, { size: 20 }), _jsx("span", { className: "text-sm font-medium", children: post.comments })] }), _jsx("button", { onClick: handleShare, className: "flex items-center gap-2 text-white/60 hover:text-emerald-400 transition-colors", children: _jsx(Share2, { size: 20 }) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [post.imageUrl && (_jsx("button", { onClick: handleDownload, className: "text-white/60 hover:text-white transition-colors p-2", title: "Download Media", children: _jsx(Download, { size: 20 }) })), _jsx("button", { className: "text-white/60 hover:text-white transition-colors p-2", children: _jsx(Bookmark, { size: 20 }) })] })] }), _jsx(AnimatePresence, { children: showComments && (_jsxs("div", { className: "fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4", children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "absolute inset-0 bg-black/60 backdrop-blur-sm", onClick: () => setShowComments(false) }), _jsxs(motion.div, { initial: { opacity: 0, y: "100%" }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: "100%" }, transition: { type: "spring", damping: 25, stiffness: 200 }, className: "relative w-full max-w-md bg-[#111113] rounded-t-[2.5rem] sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden h-[75vh] sm:h-[600px] flex flex-col", children: [_jsxs("div", { className: "p-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#111113] z-10", children: [_jsx("h3", { className: "font-serif text-lg text-white", children: "Comments" }), _jsx("button", { onClick: () => setShowComments(false), className: "p-2 bg-white/5 rounded-full text-white/50 hover:text-white transition-colors", children: _jsx(X, { size: 18 }) })] }), _jsx("div", { className: "flex-1 overflow-y-auto custom-scrollbar p-4", children: _jsx(CommentSection, { postId: post.id, groupId: post.groupId, authorUsername: post.author.username }) })] })] })) })] }), _jsx(AnimatePresence, { children: isReporting && (_jsx("div", { className: "fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4", children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 }, className: "glass-panel p-6 rounded-2xl w-full max-w-sm", children: [_jsx("h3", { className: "text-xl font-serif text-white mb-4", children: "Report Post" }), _jsx("div", { className: "grid grid-cols-2 gap-2 mb-4", children: ["Spam", "Hate Speech", "Harassment", "False Info"].map((preset) => (_jsx("button", { onClick: () => setReportReason(preset), className: `px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${reportReason === preset ? 'bg-primary/20 text-primary border-primary/30' : 'bg-white/5 text-zinc-400 border-white/5 border-transparent hover:bg-white/10'}`, children: preset }, preset))) }), _jsx("textarea", { value: reportReason, onChange: (e) => setReportReason(e.target.value), placeholder: "Or provide a specific reason...", className: "w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/40 focus:outline-none focus:border-white/20 mb-4 min-h-[80px] resize-none" }), _jsxs("div", { className: "flex gap-3 justify-end", children: [_jsx("button", { onClick: () => setIsReporting(false), className: "px-4 py-2 text-white/60 hover:text-white transition-colors text-sm font-medium", children: "Cancel" }), _jsx("button", { onClick: () => {
                                            reportMutation.mutate(reportReason);
                                            setIsReporting(false);
                                            setReportReason("");
                                        }, disabled: !reportReason.trim() || reportMutation.isPending, className: "px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium rounded-xl disabled:opacity-50", children: reportMutation.isPending ? "Submitting..." : "Submit Report" })] })] }) })) })] }));
};
