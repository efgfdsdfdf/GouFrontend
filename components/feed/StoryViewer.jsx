import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Eye, Share2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import { Avatar } from "../ui/Avatar";
const isVideoStory = (url) => Boolean(url && /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(url));
export const StoryViewer = ({ isOpen, onClose, stories, currentUser, }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [storyOverrides, setStoryOverrides] = useState({});
    const queryClient = useQueryClient();
    const viewMutation = useMutation({
        mutationFn: (id) => api.stories.view(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["stories-feed"] });
            const previousStories = queryClient.getQueryData(["stories-feed"]);
            queryClient.setQueryData(["stories-feed"], (old = []) => old.map((story) => String(story.id) === String(id)
                ? {
                    ...story,
                    isViewed: true,
                    viewsCount: Math.max(story.viewsCount || 0, (story.viewsCount || 0) + (story.isViewed ? 0 : 1)),
                }
                : story));
            return { previousStories };
        },
        onError: (_err, _id, context) => {
            queryClient.setQueryData(["stories-feed"], context?.previousStories);
        },
    });
    const likeMutation = useMutation({
        mutationFn: (id) => api.stories.like(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["stories-feed"] });
            const previousStories = queryClient.getQueryData(["stories-feed"]);
            queryClient.setQueryData(["stories-feed"], (old = []) => old.map((story) => story.id === id
                ? {
                    ...story,
                    isLiked: !story.isLiked,
                    likesCount: Math.max(0, (story.likesCount || 0) + (story.isLiked ? -1 : 1)),
                }
                : story));
            return { previousStories };
        },
        onError: (_err, _id, context) => {
            queryClient.setQueryData(["stories-feed"], context?.previousStories);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["stories-feed"] });
        },
    });
    useEffect(() => {
        if (!isOpen || !stories.length)
            return;
        // Record view for current story
        const currentStory = stories[currentIndex];
        if (currentStory && currentStory.id) {
            viewMutation.mutate(currentStory.id);
        }
    }, [isOpen, currentIndex, stories.length]);
    useEffect(() => {
        if (!isOpen) {
            setCurrentIndex(0);
            setProgress(0);
            return;
        }
        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100)
                    return 100;
                return prev + 1;
            });
        }, 50);
        return () => clearInterval(timer);
    }, [isOpen, currentIndex]);
    useEffect(() => {
        if (!isOpen)
            return;
        if (stories.length === 0) {
            setCurrentIndex(0);
            setProgress(0);
            return;
        }
        setCurrentIndex((current) => Math.min(current, stories.length - 1));
    }, [isOpen, stories.length]);
    useEffect(() => {
        if (progress >= 100 && isOpen) {
            if (currentIndex < stories.length - 1) {
                setCurrentIndex((prev) => prev + 1);
                setProgress(0);
            }
            else {
                onClose();
            }
        }
    }, [progress, currentIndex, stories.length, isOpen, onClose]);
    const currentStory = stories[currentIndex] || {
        content: "No content",
        user: currentUser,
    };
    const currentStoryOverride = currentStory.id ? storyOverrides[currentStory.id] : null;
    const displayStory = currentStoryOverride ? { ...currentStory, ...currentStoryOverride } : currentStory;
    const hasVideo = isVideoStory(displayStory.imageUrl);
    const handleLike = (e) => {
        e.stopPropagation();
        if (currentStory.id) {
            setStoryOverrides((prev) => {
                const story = { ...currentStory, ...prev[currentStory.id] };
                return {
                    ...prev,
                    [currentStory.id]: {
                        isLiked: !story.isLiked,
                        likesCount: Math.max(0, (story.likesCount || 0) + (story.isLiked ? -1 : 1)),
                    },
                };
            });
            likeMutation.mutate(currentStory.id);
        }
    };
    const handleShare = async (e) => {
        e.stopPropagation();
        if (!currentStory?.id)
            return;
        const url = `${window.location.origin}/post/${currentStory.id}`;
        const text = displayStory.content || `Check out this story from @${displayStory.user?.username}`;
        try {
            if (navigator.share) {
                await navigator.share({ title: "GoUnion Story", text, url });
            }
            else {
                await navigator.clipboard.writeText(`${text}\n${url}`);
                alert("Story link copied!");
            }
        }
        catch (err) { }
    };
    return (_jsx(AnimatePresence, { children: isOpen && (_jsx("div", { className: "fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center", children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 }, className: "relative w-full max-w-lg h-full md:h-[90vh] bg-zinc-900 md:rounded-[2rem] overflow-hidden flex flex-col", children: [_jsx("div", { className: "absolute top-4 left-4 right-4 flex gap-1 z-20", children: stories.map((_, i) => (_jsx("div", { className: "h-1 flex-1 bg-white/20 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-primary transition-all duration-100 ease-linear", style: {
                                    width: i < currentIndex
                                        ? "100%"
                                        : i === currentIndex
                                            ? `${progress}%`
                                            : "0%",
                                } }) }, i))) }), _jsxs("div", { className: "absolute top-8 left-6 right-6 flex items-center justify-between z-20", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Avatar, { src: displayStory.user?.avatarUrl, label: displayStory.user?.username, className: "w-10 h-10 rounded-full border-2 border-primary", alt: "Avatar" }), _jsxs("div", { children: [_jsx("p", { className: "text-white font-black text-sm uppercase tracking-widest", children: displayStory.user?.username }), _jsx("p", { className: "text-zinc-400 text-[10px] font-bold uppercase", children: displayStory.timestamp || "Just now" })] })] }), _jsx("button", { onClick: onClose, className: "p-2 text-white/70 hover:text-white transition-colors", children: _jsx(X, { size: 24 }) })] }), _jsxs("div", { className: "flex-1 relative flex items-center justify-center", children: [displayStory.imageUrl && hasVideo ? (_jsx("video", { src: displayStory.imageUrl, className: "w-full h-full object-cover", autoPlay: true, muted: true, loop: true, playsInline: true, controls: true })) : displayStory.imageUrl ? (_jsx("img", { src: displayStory.imageUrl, className: "w-full h-full object-cover", alt: "Story" })) : (_jsx("div", { className: "p-12 text-center", children: _jsx("h2", { className: "text-2xl md:text-4xl font-black text-white leading-tight tracking-tighter", children: displayStory.content }) })), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" })] }), _jsxs("div", { className: "absolute inset-0 flex z-10", children: [_jsx("div", { className: "flex-1 cursor-pointer", onClick: (e) => {
                                    e.stopPropagation();
                                    if (currentIndex > 0) {
                                        setCurrentIndex(currentIndex - 1);
                                        setProgress(0);
                                    }
                                } }), _jsx("div", { className: "flex-1 cursor-pointer", onClick: (e) => {
                                    e.stopPropagation();
                                    if (currentIndex < stories.length - 1) {
                                        setCurrentIndex(currentIndex + 1);
                                        setProgress(0);
                                    }
                                    else {
                                        onClose();
                                    }
                                } })] }), _jsxs("div", { className: "absolute bottom-10 left-6 right-6 flex items-center justify-between z-30", children: [_jsxs("div", { className: "flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Eye, { size: 16, className: "text-zinc-400" }), _jsx("span", { className: "text-white text-xs font-bold", children: displayStory.viewsCount || 0 })] }), _jsx("div", { className: "w-[1px] h-3 bg-white/20" }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Heart, { size: 16, className: "text-zinc-400" }), _jsx("span", { className: "text-white text-xs font-bold", children: displayStory.likesCount || 0 })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(motion.button, { whileTap: { scale: 0.9 }, onClick: handleShare, className: "p-3 rounded-full bg-white/10 border border-white/10 text-white hover:bg-white/20 transition-all duration-300", children: _jsx(Share2, { size: 20 }) }), _jsx(motion.button, { whileTap: { scale: 0.9 }, onClick: handleLike, className: `p-3 rounded-full border transition-all duration-300 ${displayStory.isLiked
                                            ? "bg-primary border-primary text-black shadow-[0_0_20px_rgba(196,255,14,0.4)]"
                                            : "bg-white/10 border-white/10 text-white hover:bg-white/20"}`, children: _jsx(Heart, { size: 20, fill: displayStory.isLiked ? "currentColor" : "none" }) })] })] })] }) })) }));
};
