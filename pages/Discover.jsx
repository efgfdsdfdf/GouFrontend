import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useInfiniteQuery, useMutation, useQueryClient, } from "@tanstack/react-query";
import { Heart, MessageCircle, Volume2, VolumeX, Plus, Share2, X, Music2, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CommentSection } from "../components/feed/CommentSection";
import { CreateReel } from "../components/feed/CreateReel";
import { api } from "../services/api";
import { useAuthStore } from "../store";
const isVideoUrl = (url) => {
    if (!url)
        return false;
    return /\.(mp4|webm|mov|m4v|avi|mkv|m3u8)(\?|$)/i.test(url);
};
const getCleanCaption = (content) => {
    return content.replace(/(?:🎵 )?Sound:.*$/m, '').replace(/\[Overlay Text:.*\]/m, '').replace(/\[Sticker:.*\]/m, '').replace(/\[Mix:.*\]/m, '').trim();
};
const getOverlayText = (content) => {
    const match = content.match(/\[Overlay Text: (.*?)\]/);
    return match ? match[1] : null;
};
const getSoundName = (post) => {
    const content = post.content || "";
    const soundMatch = content.match(/(?:🎵 )?Sound: (.*)$/m);
    if (soundMatch)
        return soundMatch[1].trim();
    if (post.isReel || post.mediaType === "video" || isVideoUrl(post.imageUrl)) {
        return `Original sound - @${post.author.username}`;
    }
    return null;
};
export const Discover = () => {
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuthStore();
    const [isMuted, setIsMuted] = useState(false);
    const [activeCommentPost, setActiveCommentPost] = useState(null);
    const [isCreateReelOpen, setIsCreateReelOpen] = useState(false);
    const [loadedMedia, setLoadedMedia] = useState({});
    const [pausedVideos, setPausedVideos] = useState({});
    const [videoProgress, setVideoProgress] = useState({});
    const [discoverSeed, setDiscoverSeed] = useState(() => Math.random());
    const loadMoreRef = useRef(null);
    const videoRefs = useRef({});
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useInfiniteQuery({
        queryKey: ["discover-reels", discoverSeed],
        queryFn: ({ pageParam }) => api.posts.getReels({ pageParam, seed: discoverSeed }),
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => lastPage.length > 0 ? allPages.length : undefined,
        staleTime: 60000,
    });
    const likeMutation = useMutation({
        mutationFn: (postId) => api.posts.like(postId),
        onMutate: async (postId) => {
            await queryClient.cancelQueries({ queryKey: ["discover-reels"] });
            const previousReels = queryClient.getQueriesData({ queryKey: ["discover-reels"] });
            queryClient.setQueryData(["discover-reels", discoverSeed], (old) => {
                if (!old?.pages)
                    return old;
                return {
                    ...old,
                    pages: old.pages.map((page) => page.map((p) => {
                        if (p.id === postId) {
                            return {
                                ...p,
                                isLiked: !p.isLiked,
                                likes: Math.max(0, p.likes + (p.isLiked ? -1 : 1))
                            };
                        }
                        return p;
                    }))
                };
            });
            return { previousReels };
        },
        onError: (err, variables, context) => {
            context?.previousReels?.forEach(([key, value]) => {
                queryClient.setQueryData(key, value);
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["discover-reels"] });
        },
    });
    const deleteMutation = useMutation({
        mutationFn: (postId) => api.posts.delete(postId),
        onSuccess: (_, postId) => {
            queryClient.setQueriesData({ queryKey: ["discover-reels"] }, (old) => {
                if (!old?.pages)
                    return old;
                return {
                    ...old,
                    pages: old.pages.map((page) => page.filter((p) => p.id !== postId))
                };
            });
            queryClient.invalidateQueries({ queryKey: ["discover-reels"] });
            queryClient.invalidateQueries({ queryKey: ["feed"] });
            queryClient.invalidateQueries({ queryKey: ["post", postId] });
        },
    });
    useEffect(() => {
        const handleExternalRefresh = () => {
            setDiscoverSeed(Math.random());
            queryClient.removeQueries({ queryKey: ["discover-reels"] });
            window.scrollTo({ top: 0, behavior: "smooth" });
        };
        window.addEventListener("gounion-refresh-discover", handleExternalRefresh);
        return () => window.removeEventListener("gounion-refresh-discover", handleExternalRefresh);
    }, [queryClient]);
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
                    video.currentTime = 0;
                }
            });
        }, { threshold: [0.2, 0.6, 0.9] });
        elements.forEach((video) => playObserver.observe(video));
        return () => playObserver.disconnect();
    }, [data]);
    const handleShare = async (reel) => {
        const text = reel.content
            ? `${reel.content}\n\nWatch this reel on GoUnion from @${reel.author.username}`
            : `Check out this reel from @${reel.author.username} on GoUnion.`;
        const url = `${window.location.origin}/post/${reel.id}`;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: "GoUnion Reel",
                    text,
                    url,
                });
            }
            else {
                await navigator.clipboard.writeText(`${text}\n${url}`);
                alert("Reel content copied to clipboard!");
            }
        }
        catch (err) {
            console.error("Error sharing:", err);
        }
    };
    const reels = Array.from(new Map((data?.pages.flat() || []).map((post) => [post.id, post])).values()).filter((post) => post.isReel || post.mediaType === "video" || isVideoUrl(post.imageUrl));
    if (status === "pending") {
        return (_jsx("div", { className: "fixed inset-0 md:pl-64 lg:pr-80 bg-black overflow-hidden z-0 pt-16 md:pt-20", children: _jsx("div", { className: "h-full flex items-center justify-center", children: _jsx("div", { className: "w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center font-serif font-black text-5xl text-white/20 animate-pulse shadow-[0_0_50px_rgba(255,255,255,0.05)] border border-white/10", children: "G" }) }) }));
    }
    return (_jsxs("div", { className: "fixed inset-0 md:pl-64 lg:pr-80 bg-black overflow-hidden z-0 pt-16 md:pt-20 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0", children: [_jsxs("div", { className: "h-full overflow-y-auto snap-y snap-mandatory hide-scrollbar", children: [reels.length === 0 ? (_jsxs("div", { className: "h-[100dvh] flex flex-col items-center justify-center text-center p-8", children: [_jsx("h3", { className: "text-2xl font-black text-white mb-3", children: "No reels yet" }), _jsx("p", { className: "text-zinc-500 max-w-xs mb-10 text-sm leading-relaxed", children: "Be the first to share a moment with the campus community!" }), _jsx("button", { type: "button", onClick: () => setIsCreateReelOpen(true), className: "px-10 py-4 bg-primary text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20", children: "Create Reel" })] })) : (reels.map((reel) => {
                        const cleanCaption = getCleanCaption(reel.content || "");
                        const overlayText = getOverlayText(reel.content || "");
                        const soundName = getSoundName(reel);
                        return (_jsxs("section", { className: "snap-start snap-always h-full w-full relative bg-black flex flex-col overflow-hidden", children: [_jsxs("div", { className: "flex-1 relative flex items-center justify-center min-h-0 bg-black", children: [!loadedMedia[reel.id] && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center pointer-events-none z-0", children: _jsx("div", { className: "w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center font-serif font-black text-3xl text-white/20 animate-pulse border border-white/10", children: "G" }) })), _jsx("video", { ref: (el) => {
                                                videoRefs.current[reel.id] = el;
                                            }, src: reel.imageUrl, onPlaying: () => {
                                                setLoadedMedia((prev) => ({ ...prev, [reel.id]: true }));
                                                setPausedVideos((prev) => ({ ...prev, [reel.id]: false }));
                                            }, onPause: () => setPausedVideos((prev) => ({ ...prev, [reel.id]: true })), onTimeUpdate: (e) => {
                                                const v = e.currentTarget;
                                                setVideoProgress((prev) => ({ ...prev, [reel.id]: { current: v.currentTime, duration: v.duration || 0 } }));
                                            }, className: `relative z-10 h-full w-full object-cover bg-transparent shadow-2xl transition-transform duration-300 ${activeCommentPost?.id === reel.id
                                                ? "scale-[0.52] -translate-y-[10vh] md:scale-[0.68]"
                                                : ""}`, loop: true, muted: isMuted, playsInline: true, preload: "auto", onClick: (e) => {
                                                const video = e.currentTarget;
                                                if (video.paused)
                                                    void video.play();
                                                else
                                                    video.pause();
                                            } }), pausedVideos[reel.id] && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center z-20 cursor-pointer", onClick: () => {
                                                const v = videoRefs.current[reel.id];
                                                if (v)
                                                    void v.play();
                                            }, children: _jsx("div", { className: "w-20 h-20 rounded-full flex items-center justify-center", style: {
                                                    background: "rgba(0,0,0,0.5)",
                                                    backdropFilter: "blur(12px)",
                                                    border: "2px solid rgba(255,255,255,0.2)",
                                                }, children: _jsx(Play, { size: 36, className: "text-white fill-white ml-1" }) }) })), _jsx("div", { className: "absolute bottom-0 left-0 right-0 z-20 px-2 pt-6 pb-2 cursor-pointer", style: { touchAction: "none" }, onClick: (e) => e.stopPropagation(), onPointerDown: (e) => {
                                                e.currentTarget.setPointerCapture(e.pointerId);
                                                const v = videoRefs.current[reel.id];
                                                if (!v)
                                                    return;
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
                                                v.currentTime = ratio * v.duration;
                                                setVideoProgress((prev) => ({ ...prev, [reel.id]: { current: ratio * v.duration, duration: v.duration } }));
                                            }, onPointerMove: (e) => {
                                                if (!e.currentTarget.hasPointerCapture(e.pointerId))
                                                    return;
                                                const v = videoRefs.current[reel.id];
                                                if (!v)
                                                    return;
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
                                                v.currentTime = ratio * v.duration;
                                                setVideoProgress((prev) => ({ ...prev, [reel.id]: { current: ratio * v.duration, duration: v.duration } }));
                                            }, onPointerUp: (e) => {
                                                e.currentTarget.releasePointerCapture(e.pointerId);
                                            }, children: _jsx("div", { className: "relative h-[4px] rounded-full pointer-events-none", style: { background: "rgba(255,255,255,0.2)" }, children: _jsx("div", { className: "absolute inset-y-0 left-0 rounded-full", style: {
                                                        width: `${videoProgress[reel.id] ? (videoProgress[reel.id].current / videoProgress[reel.id].duration) * 100 : 0}%`,
                                                        background: "linear-gradient(90deg, #fff, #ddd)"
                                                    } }) }) }), overlayText && (_jsx("div", { className: "absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none z-20", children: _jsx("p", { className: "text-white font-black text-2xl text-center drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] break-words w-full", style: { textShadow: '2px 2px 4px #000, -2px -2px 4px #000, 2px -2px 4px #000, -2px 2px 4px #000' }, children: overlayText }) })), _jsx("div", { className: "absolute top-4 right-4 z-20 flex flex-col gap-4", children: _jsx("button", { onClick: () => setIsMuted((prev) => !prev), className: "w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center hover:bg-black/60 transition-all active:scale-90", children: isMuted ? _jsx(VolumeX, { size: 18 }) : _jsx(Volume2, { size: 18 }) }) })] }), _jsxs("div", { className: "absolute right-3 md:right-4 bottom-[120px] z-30 flex flex-col items-center gap-5 md:gap-6", children: [_jsxs("div", { className: "flex flex-col items-center gap-1", children: [_jsx(Link, { to: `/profile/${reel.author.username}`, className: "w-11 h-11 md:w-14 md:h-14 rounded-full border-2 border-white overflow-hidden shadow-lg transition-transform hover:scale-105 active:scale-95 mb-1", children: _jsx("img", { src: reel.author.avatarUrl || `https://ui-avatars.com/api/?name=${reel.author.fullName}`, alt: reel.author.username, className: "w-full h-full object-cover" }) }), _jsx("div", { className: "w-5 h-5 rounded-full bg-primary flex items-center justify-center -mt-4 z-30 border-2 border-black", children: _jsx(Plus, { size: 12, className: "text-black" }) })] }), _jsxs("button", { onClick: () => likeMutation.mutate(reel.id), className: "flex flex-col items-center gap-1 group", children: [_jsx("div", { className: "w-11 h-11 md:w-14 md:h-14 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center group-hover:bg-black/60 transition-all active:scale-90", children: _jsx(Heart, { className: `w-6 h-6 md:w-7 md:h-7 transition-colors ${reel.isLiked ? "fill-red-500 text-red-500" : "text-white"}` }) }), _jsx("span", { className: "text-[10px] md:text-[11px] font-black text-white drop-shadow-md", children: reel.likes })] }), _jsxs("button", { onClick: () => setActiveCommentPost(reel), className: "flex flex-col items-center gap-1 group", children: [_jsx("div", { className: "w-11 h-11 md:w-14 md:h-14 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center group-hover:bg-black/60 transition-all active:scale-90", children: _jsx(MessageCircle, { className: "w-6 h-6 md:w-7 md:h-7 text-white" }) }), _jsx("span", { className: "text-[10px] md:text-[11px] font-black text-white drop-shadow-md", children: reel.comments })] }), _jsxs("button", { onClick: () => handleShare(reel), className: "flex flex-col items-center gap-1 group", children: [_jsx("div", { className: "w-11 h-11 md:w-14 md:h-14 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center group-hover:bg-black/60 transition-all active:scale-90", children: _jsx(Share2, { className: "w-6 h-6 md:w-7 md:h-7 text-white" }) }), _jsx("span", { className: "text-[10px] md:text-[11px] font-black text-white drop-shadow-md", children: "Share" })] })] }), _jsx("div", { className: "absolute bottom-0 left-0 right-0 w-full bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-32 px-4 pb-6 z-20 pointer-events-none", children: _jsxs("div", { className: "max-w-[85%] pointer-events-auto", children: [_jsxs(Link, { to: `/profile/${reel.author.username}`, className: "inline-flex items-center gap-2 mb-2.5 group", children: [_jsxs("span", { className: "font-black text-white text-base tracking-tight hover:underline", children: ["@", reel.author.username] }), !reel.author.isFollowing && String(currentUser?.id) !== String(reel.author.id) && (_jsx("button", { onClick: (e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            api.profiles.follow(reel.author.id);
                                                            queryClient.setQueryData(["discover-reels", discoverSeed], (old) => {
                                                                if (!old?.pages)
                                                                    return old;
                                                                return {
                                                                    ...old,
                                                                    pages: old.pages.map((page) => page.map((p) => {
                                                                        if (p.author.id === reel.author.id) {
                                                                            return {
                                                                                ...p,
                                                                                author: {
                                                                                    ...p.author,
                                                                                    isFollowing: true
                                                                                }
                                                                            };
                                                                        }
                                                                        return p;
                                                                    }))
                                                                };
                                                            });
                                                        }, className: "px-2 py-0.5 rounded-md bg-primary text-[9px] font-black text-black uppercase tracking-widest border border-primary/20 shadow-lg shadow-primary/10", children: "Follow" }))] }), cleanCaption && (_jsx("p", { className: "text-white/90 text-[13px] leading-relaxed mb-3 font-medium line-clamp-2 whitespace-pre-wrap", children: cleanCaption })), soundName && (_jsxs(Link, { to: `/sound/${encodeURIComponent(soundName)}`, className: "inline-flex items-center gap-2 text-white/50 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 hover:bg-white/10 transition-colors", children: [_jsx(Music2, { size: 12, className: "text-primary" }), _jsx("span", { className: "text-[10px] font-black uppercase tracking-[0.1em] overflow-hidden whitespace-nowrap max-w-[200px] truncate", children: soundName })] }))] }) })] }, reel.id));
                    })), _jsx("div", { ref: loadMoreRef, className: "h-20" })] }), _jsx(AnimatePresence, { children: activeCommentPost && (_jsxs(_Fragment, { children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, onClick: () => setActiveCommentPost(null), className: "fixed inset-x-0 bottom-0 h-[65dvh] md:left-64 lg:right-80 bg-gradient-to-t from-black/30 to-transparent z-[150]" }), _jsxs(motion.div, { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" }, transition: { type: "spring", damping: 25, stiffness: 200 }, className: "fixed bottom-0 left-0 right-0 md:left-64 lg:right-80 bg-[#0a0a0c] rounded-t-[24px] z-[160] border-t border-white/10 p-4 sm:p-6 h-[65dvh] flex flex-col shadow-[0_-30px_80px_rgba(0,0,0,0.5)]", children: [_jsx("div", { className: "mx-auto mb-3 h-1 w-12 rounded-full bg-white/15" }), _jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-black text-white uppercase tracking-widest", children: "Comments" }), _jsxs("p", { className: "text-xs text-white/35", children: ["@", activeCommentPost.author.username] })] }), _jsx("button", { onClick: () => setActiveCommentPost(null), className: "w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all", children: _jsx(X, { size: 20 }) })] }), _jsx("div", { className: "flex-1 overflow-y-auto pr-2 custom-scrollbar", children: _jsx(CommentSection, { postId: activeCommentPost.id, authorUsername: activeCommentPost.author.username }) })] })] })) }), _jsx(CreateReel, { isOpen: isCreateReelOpen, onClose: () => setIsCreateReelOpen(false) }), _jsx("style", { dangerouslySetInnerHTML: { __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      ` } })] }));
};
