import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { 
  Heart, 
  MessageCircle, 
  Volume2, 
  VolumeX, 
  Plus, 
  Camera, 
  Share2, 
  X,
  Music2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CreateReel } from "../components/feed/CreateReel";
import { CommentSection } from "../components/feed/CommentSection";
import { api } from "../services/api";
import { Post } from "../types";
import { useAuthStore } from "../store";

const isVideoUrl = (url?: string) => {
  if (!url) return false;
  return /\.(mp4|webm|mov|m4v|avi|mkv|m3u8)(\?|$)/i.test(url);
};

export const Discover = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [isMuted, setIsMuted] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeCommentPost, setActiveCommentPost] = useState<Post | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: ["discover-reels"],
      queryFn: api.posts.getReels,
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) =>
        lastPage.length > 0 ? allPages.length : undefined,
    });

  const likeMutation = useMutation({
    mutationFn: (postId: string) => api.posts.like(postId),
    onSuccess: (data, postId) => {
      // Optimistic update could be better, but invalidation works for now
      queryClient.invalidateQueries({ queryKey: ["discover-reels"] });
    },
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: "100px" },
    );

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const elements = Object.values(videoRefs.current).filter(
      (el): el is HTMLVideoElement => Boolean(el),
    );
    if (!elements.length) return;

    const playObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            void video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: [0.2, 0.6, 0.9] },
    );

    elements.forEach((video) => playObserver.observe(video));
    return () => playObserver.disconnect();
  }, [data]);

  const handleShare = async (reel: Post) => {
    const shareData = {
      title: "GoUnion Reel",
      text: reel.content || `Check out this reel from @${reel.author.username}`,
      url: window.location.origin + `/profile/${reel.author.username}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const reels = Array.from(
    new Map((data?.pages.flat() || []).map((post: Post) => [post.id, post])).values(),
  ).filter((post: Post) => isVideoUrl(post.imageUrl));

  if (status === "pending") {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-zinc-400 font-medium">Loading Reels...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 md:pl-64 lg:pr-80 bg-black overflow-hidden z-0">
      <div className="h-full overflow-y-auto snap-y snap-mandatory hide-scrollbar">
        {reels.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-8 border border-white/10">
              <Camera className="w-12 h-12 text-white/20" />
            </div>
            <h3 className="text-2xl font-black text-white mb-3">No reels yet</h3>
            <p className="text-zinc-500 max-w-xs mb-10 text-sm leading-relaxed">
              Be the first to share a moment with the campus community!
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-10 py-4 bg-primary text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
            >
              Create First Reel
            </button>
          </div>
        ) : (
          reels.map((reel) => (
            <section
              key={reel.id}
              className="snap-start h-full relative bg-black flex items-center justify-center overflow-hidden"
            >
              {/* Background Blur for non-16:9 videos */}
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-110 pointer-events-none"
                style={{ backgroundImage: `url(${reel.imageUrl})` }}
              />

              <video
                ref={(el) => {
                  videoRefs.current[reel.id] = el;
                }}
                src={reel.imageUrl}
                className="relative z-10 w-full h-full object-cover md:object-contain bg-black shadow-2xl"
                loop
                muted={isMuted}
                playsInline
                preload="auto"
                onClick={(e) => {
                  const video = e.currentTarget;
                  if (video.paused) void video.play();
                  else video.pause();
                }}
              />

              {/* Top Controls */}
              <div className="absolute top-20 right-6 z-20 flex flex-col gap-4">
                <button
                  onClick={() => setIsMuted((prev) => !prev)}
                  className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center hover:bg-black/60 transition-all active:scale-90"
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="w-12 h-12 rounded-full bg-primary text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-primary/20"
                >
                  <Plus size={24} />
                </button>
              </div>

              {/* Interaction Sidebar (Right) */}
              <div className="absolute right-4 bottom-28 z-20 flex flex-col items-center gap-6">
                <div className="flex flex-col items-center gap-1">
                  <Link 
                    to={`/profile/${reel.author.username}`}
                    className="w-14 h-14 rounded-full border-2 border-white overflow-hidden shadow-lg transition-transform hover:scale-105 active:scale-95 mb-2"
                  >
                    <img 
                      src={reel.author.avatarUrl} 
                      alt={reel.author.username}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center -mt-5 z-30 border-2 border-black">
                    <Plus size={12} className="text-black" />
                  </div>
                </div>

                <button
                  onClick={() => likeMutation.mutate(reel.id)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center group-hover:bg-black/60 transition-all active:scale-90">
                    <Heart
                      className={`w-7 h-7 transition-colors ${reel.isLiked ? "fill-red-500 text-red-500" : "text-white"}`}
                    />
                  </div>
                  <span className="text-[11px] font-black text-white drop-shadow-md">{reel.likes}</span>
                </button>
                
                <button 
                  onClick={() => setActiveCommentPost(reel)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center group-hover:bg-black/60 transition-all active:scale-90">
                    <MessageCircle className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-[11px] font-black text-white drop-shadow-md">{reel.comments}</span>
                </button>

                <button 
                  onClick={() => handleShare(reel)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center group-hover:bg-black/60 transition-all active:scale-90">
                    <Share2 className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-[11px] font-black text-white drop-shadow-md">Share</span>
                </button>
              </div>

              {/* Content Overlay (Bottom) */}
              <div className="absolute inset-x-0 bottom-0 pb-8 pt-32 px-5 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none z-10">
                <div className="max-w-[85%] pointer-events-auto">
                  <Link
                    to={`/profile/${reel.author.username}`}
                    className="inline-flex items-center gap-2 mb-2.5 group"
                  >
                    <span className="font-black text-white text-base tracking-tight hover:underline">
                      @{reel.author.username}
                    </span>
                    <button className="px-2 py-0.5 rounded-md bg-primary text-[9px] font-black text-black uppercase tracking-widest border border-primary/20 shadow-lg shadow-primary/10">
                      Follow
                    </button>
                  </Link>
                  
                  <p className="text-white/90 text-[13px] leading-relaxed mb-4 font-medium line-clamp-2">
                    {reel.content || "Experience the energy of GoUnion campus life! 🎓✨"}
                  </p>

                  <div className="flex items-center gap-2 text-white/50 bg-white/5 w-fit px-3 py-1.5 rounded-full border border-white/5">
                    <Music2 size={12} className="animate-spin-slow text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.1em] overflow-hidden whitespace-nowrap max-w-[150px] truncate">
                      Original sound - @{reel.author.username}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          ))
        )}
        <div ref={loadMoreRef} className="h-20" />
      </div>

      {/* Modals & Overlays */}
      <CreateReel 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />

      {/* Comment Drawer */}
      <AnimatePresence>
        {activeCommentPost && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveCommentPost(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 md:left-64 lg:right-80 bg-[#0a0a0c] rounded-t-[32px] z-[160] border-t border-white/10 p-6 max-h-[75vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-white uppercase tracking-widest">Comments</h3>
                <button 
                  onClick={() => setActiveCommentPost(null)}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <CommentSection 
                  postId={activeCommentPost.id}
                  authorUsername={activeCommentPost.author.username}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}} />
    </div>
  );
};
