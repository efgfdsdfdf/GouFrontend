import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Volume2, VolumeX, Share2, X, Music2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CommentSection } from "../components/feed/CommentSection";
import { Avatar } from "../components/ui/Avatar";
import { api } from "../services/api";
import { useAuthStore } from "../store";
const isVideoUrl = (url) => {
    if (!url)
        return false;
    return /\.(mp4|webm|mov|m4v|avi|mkv|m3u8)(\?|$)/i.test(url);
};
export const SoundFeed = () => {
    const { soundName } = useParams();
    const decodedSoundName = decodeURIComponent(soundName || "");
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { user: currentUser } = useAuthStore();
    const [isMuted, setIsMuted] = useState(false);
    const [activeCommentPost, setActiveCommentPost] = useState(null);
    const [loadedMedia, setLoadedMedia] = useState({});
    const loadMoreRef = useRef(null);
    const videoRefs = useRef({});
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useInfiniteQuery({
        queryKey: ["sound-reels", decodedSoundName],
        queryFn: ({ pageParam }) => api.posts.getReels({ pageParam }),
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => lastPage.length > 0 ? allPages.length : undefined,
    });
    const likeMutation = useMutation({
        mutationFn: (postId) => api.posts.like(postId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sound-reels"] });
        },
    });
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
        }, { threshold: 0.1, rootMargin: "100px" });
        if (loadMoreRef.current)
            observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
    useEffect(() => {
        const elements = Object.values(videoRefs.current).filter((el) => Boolean(el));
        if (!elements.length)
            return;
        const playObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const video = entry.target;
                if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
                    void video.play().catch(() => { });
                }
                else {
                    video.pause();
                }
            });
        }, { threshold: [0.2, 0.6, 0.9] });
        elements.forEach((video) => playObserver.observe(video));
        return () => playObserver.disconnect();
    }, [data]);
    // Filter reels by sound name (either from caption 🎵 Sound: or Original sound)
    const allReels = Array.from(new Map((data?.pages.flat() || []).map((post) => [post.id, post])).values()).filter((post) => post.isReel || post.mediaType === "video" || isVideoUrl(post.imageUrl));
    const soundReels = allReels.filter((post) => {
        const content = post.content || "";
        if (content.includes(`🎵 Sound: ${decodedSoundName}`) || content.includes(`Sound: ${decodedSoundName}`))
            return true;
        if (decodedSoundName === `Original sound - @${post.author.username}`)
            return true;
        // Fallback: If it's a generic check, let's just see if the string matches
        if (content.includes(decodedSoundName))
            return true;
        return false;
    });
    const handleShare = async (reel) => {
        const url = `${window.location.origin}/post/${reel.id}`;
        try {
            if (navigator.share) {
                await navigator.share({ title: "GoUnion Sound Reel", url });
            }
            else {
                await navigator.clipboard.writeText(url);
                alert("Reel link copied!");
            }
        }
        catch (err) { }
    };
    const getCleanCaption = (content) => {
        return content.replace(/(?:🎵 )?Sound:.*$/m, '').replace(/\[Overlay Text:.*\]/m, '').replace(/\[Sticker:.*\]/m, '').replace(/\[Mix:.*\]/m, '').trim();
    };
    const getOverlayText = (content) => {
        const match = content.match(/\[Overlay Text: (.*?)\]/);
        return match ? match[1] : null;
    };
    return (_jsxs("div", { className: "fixed inset-0 md:pl-64 lg:pr-80 bg-black overflow-hidden z-[90] pt-16 md:pt-20 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0", children: [_jsxs("div", { className: "absolute top-16 md:top-20 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/10 p-4 flex items-center gap-4", children: [_jsx("button", { onClick: () => navigate(-1), className: "p-2 text-white/70 hover:text-white transition-colors bg-white/5 rounded-full hover:bg-white/10", children: _jsx(ArrowLeft, { size: 20 }) }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30", children: _jsx(Music2, { size: 24, className: "text-primary" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-lg font-black text-white", children: decodedSoundName }), _jsxs("p", { className: "text-xs text-white/50", children: [soundReels.length, " videos"] })] })] })] }), _jsxs("div", { className: "h-full overflow-y-auto pt-[80px] snap-y snap-mandatory hide-scrollbar", children: [status === "pending" ? (_jsx("div", { className: "h-full flex items-center justify-center text-white", children: "Loading..." })) : soundReels.length === 0 ? (_jsxs("div", { className: "h-[100dvh] flex flex-col items-center justify-center text-center p-8", children: [_jsx(Music2, { className: "w-12 h-12 text-white/20 mb-4" }), _jsx("h3", { className: "text-2xl font-black text-white mb-3", children: "No videos yet" }), _jsx("p", { className: "text-zinc-500 max-w-xs mb-10 text-sm", children: "Be the first to use this sound." })] })) : (soundReels.map((reel) => {
                        const cleanCaption = getCleanCaption(reel.content || "");
                        const overlayText = getOverlayText(reel.content || "");
                        return (_jsxs("section", { className: "snap-start snap-always h-[calc(100dvh-80px)] w-full bg-black flex flex-col relative overflow-hidden", children: [_jsxs("div", { className: "flex-1 relative flex items-center justify-center min-h-0 bg-black", children: [_jsx("div", { className: "absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-110 pointer-events-none", style: { backgroundImage: `url(${reel.imageUrl})` } }), !loadedMedia[reel.id] && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center pointer-events-none z-0", children: _jsx("div", { className: "w-16 h-16 rounded-2xl bg-white/5 animate-pulse border border-white/10 flex items-center justify-center font-serif text-3xl text-white/20", children: "G" }) })), _jsx("video", { ref: (el) => { videoRefs.current[reel.id] = el; }, src: reel.imageUrl, onPlaying: () => setLoadedMedia((prev) => ({ ...prev, [reel.id]: true })), className: `absolute inset-0 z-10 h-full w-full object-contain bg-transparent transition-transform duration-300 ${activeCommentPost?.id === reel.id ? "scale-[0.52] -translate-y-[10vh] md:scale-[0.68]" : ""}`, loop: true, muted: isMuted, playsInline: true, preload: "auto", onClick: (e) => {
                                                const v = e.currentTarget;
                                                if (v.paused)
                                                    void v.play();
                                                else
                                                    v.pause();
                                            } }), overlayText && (_jsx("div", { className: "absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none z-20", children: _jsx("p", { className: "text-white font-black text-2xl text-center drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] break-words w-full", style: { textShadow: '2px 2px 4px #000, -2px -2px 4px #000, 2px -2px 4px #000, -2px 2px 4px #000' }, children: overlayText }) }))] }), _jsx("div", { className: "absolute top-20 right-6 z-20 flex flex-col gap-4", children: _jsx("button", { onClick: () => setIsMuted(!isMuted), className: "w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center hover:bg-black/60 transition-all active:scale-90", children: isMuted ? _jsx(VolumeX, { size: 20 }) : _jsx(Volume2, { size: 20 }) }) }), _jsxs("div", { className: "absolute right-3 md:right-4 bottom-[180px] md:bottom-[200px] z-20 flex flex-col items-center gap-5 md:gap-6", children: [_jsx(Link, { to: `/profile/${reel.author.username}`, className: "w-11 h-11 md:w-14 md:h-14 rounded-full border-2 border-white overflow-hidden shadow-lg transition-transform hover:scale-105 active:scale-95", children: _jsx(Avatar, { src: reel.author.avatarUrl, alt: reel.author.username, label: reel.author.fullName, className: "w-full h-full object-cover" }) }), _jsxs("button", { onClick: () => likeMutation.mutate(reel.id), className: "flex flex-col items-center gap-1 group", children: [_jsx("div", { className: "w-11 h-11 md:w-14 md:h-14 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center group-hover:bg-black/60 transition-all active:scale-90", children: _jsx(Heart, { className: `w-6 h-6 md:w-7 md:h-7 transition-colors ${reel.isLiked ? "fill-red-500 text-red-500" : "text-white"}` }) }), _jsx("span", { className: "text-[10px] md:text-[11px] font-black text-white drop-shadow-md", children: reel.likes })] }), _jsxs("button", { onClick: () => setActiveCommentPost(reel), className: "flex flex-col items-center gap-1 group", children: [_jsx("div", { className: "w-11 h-11 md:w-14 md:h-14 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center group-hover:bg-black/60 transition-all active:scale-90", children: _jsx(MessageCircle, { className: "w-6 h-6 md:w-7 md:h-7 text-white" }) }), _jsx("span", { className: "text-[10px] md:text-[11px] font-black text-white drop-shadow-md", children: reel.comments })] }), _jsxs("button", { onClick: () => handleShare(reel), className: "flex flex-col items-center gap-1 group", children: [_jsx("div", { className: "w-11 h-11 md:w-14 md:h-14 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center group-hover:bg-black/60 transition-all active:scale-90", children: _jsx(Share2, { className: "w-6 h-6 md:w-7 md:h-7 text-white" }) }), _jsx("span", { className: "text-[10px] md:text-[11px] font-black text-white drop-shadow-md", children: "Share" })] })] }), _jsx("div", { className: "relative w-full shrink-0 bg-black px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 z-20 border-t border-white/10", children: _jsxs("div", { className: "w-[85%]", children: [_jsx(Link, { to: `/profile/${reel.author.username}`, className: "inline-flex items-center gap-2 mb-2 group", children: _jsxs("span", { className: "font-black text-white text-base tracking-tight hover:underline", children: ["@", reel.author.username] }) }), _jsx("p", { className: "text-white/90 text-[13px] leading-relaxed mb-3 font-medium line-clamp-2", children: cleanCaption || "Experience the energy of GoUnion campus life." }), _jsxs("div", { className: "flex items-center gap-2 text-white/50 bg-white/5 w-fit px-3 py-1.5 rounded-full border border-white/5", children: [_jsx(Music2, { size: 12, className: "text-primary" }), _jsx("span", { className: "text-[10px] font-black uppercase tracking-[0.1em] overflow-hidden whitespace-nowrap max-w-[150px] truncate", children: decodedSoundName })] })] }) })] }, reel.id));
                    })), _jsx("div", { ref: loadMoreRef, className: "h-20" })] }), _jsx(AnimatePresence, { children: activeCommentPost && (_jsxs(_Fragment, { children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, onClick: () => setActiveCommentPost(null), className: "fixed inset-x-0 bottom-0 h-[65dvh] md:left-64 lg:right-80 bg-gradient-to-t from-black/30 to-transparent z-[150]" }), _jsxs(motion.div, { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" }, transition: { type: "spring", damping: 25, stiffness: 200 }, className: "fixed bottom-0 left-0 right-0 md:left-64 lg:right-80 bg-[#0a0a0c] rounded-t-[24px] z-[160] border-t border-white/10 p-4 sm:p-6 h-[65dvh] flex flex-col shadow-[0_-30px_80px_rgba(0,0,0,0.5)]", children: [_jsx("div", { className: "mx-auto mb-3 h-1 w-12 rounded-full bg-white/15" }), _jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-black text-white uppercase tracking-widest", children: "Comments" }), _jsxs("p", { className: "text-xs text-white/35", children: ["@", activeCommentPost.author.username] })] }), _jsx("button", { onClick: () => setActiveCommentPost(null), className: "w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all", children: _jsx(X, { size: 20 }) })] }), _jsx("div", { className: "flex-1 overflow-y-auto pr-2 custom-scrollbar", children: _jsx(CommentSection, { postId: activeCommentPost.id, authorUsername: activeCommentPost.author.username }) })] })] })) })] }));
};
