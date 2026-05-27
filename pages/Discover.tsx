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
  Music2,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CommentSection } from "../components/feed/CommentSection";
import { CreateReel } from "../components/feed/CreateReel";
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
  const [activeCommentPost, setActiveCommentPost] = useState<Post | null>(null);
  const [isCreateReelOpen, setIsCreateReelOpen] = useState(false);
  const [loadedMedia, setLoadedMedia] = useState<Record<string, boolean>>({});
  const [discoverSeed, setDiscoverSeed] = useState(() => Math.random());
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: ["discover-reels", discoverSeed],
      queryFn: ({ pageParam }) => api.posts.getReels({ pageParam, seed: discoverSeed }),
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) =>
        lastPage.length > 0 ? allPages.length : undefined,
      staleTime: 60000,
    });

  const likeMutation = useMutation({
    mutationFn: (postId: string) => api.posts.like(postId),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["discover-reels"] });
      const previousReels = queryClient.getQueryData(["discover-reels"]);

      queryClient.setQueryData(["discover-reels", discoverSeed], (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any[]) => page.map((p: Post) => {
            if (p.id === postId) {
              return {
                ...p,
                isLiked: true,
                likes: p.isLiked ? p.likes : p.likes + 1
              };
            }
            return p;
          }))
        };
      });
      return { previousReels };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(["discover-reels"], context?.previousReels);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["discover-reels"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (postId: string) => api.posts.delete(postId),
    onSuccess: (_, postId) => {
      queryClient.setQueryData(["discover-reels", discoverSeed], (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any[]) => page.filter((p: Post) => p.id !== postId))
        };
      });
      queryClient.invalidateQueries({ queryKey: ["discover-reels"] });
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
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        alert("Reel content copied to clipboard!");
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
      <div className="fixed inset-0 md:pl-64 lg:pr-80 bg-black overflow-hidden z-0 pt-16 md:pt-20">
        <div className="h-full flex items-center justify-center">
          <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center font-serif font-black text-5xl text-white/20 animate-pulse shadow-[0_0_50px_rgba(255,255,255,0.05)] border border-white/10">
            G
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 md:pl-64 lg:pr-80 bg-black overflow-hidden z-0 pt-16 md:pt-20 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      <div className="h-full overflow-y-auto snap-y snap-mandatory hide-scrollbar">
        {reels.length === 0 ? (
          <div className="h-[100dvh] flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-8 border border-white/10">
              <Camera className="w-12 h-12 text-white/20" />
            </div>
            <h3 className="text-2xl font-black text-white mb-3">No reels yet</h3>
            <p className="text-zinc-500 max-w-xs mb-10 text-sm leading-relaxed">
              Be the first to share a moment with the campus community!
            </p>
            <Link
              to="/profile"
              className="px-10 py-4 bg-primary text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
            >
              Go to Profile to Create Reels
            </Link>
          </div>
        ) : (
          reels.map((reel) => (
            <section
              key={reel.id}
              className="snap-start snap-always h-full w-full relative bg-black flex items-center justify-center overflow-hidden"
            >
              {/* Background Blur for non-16:9 videos */}
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-110 pointer-events-none"
                style={{ backgroundImage: `url(${reel.imageUrl})` }}
              />

              {!loadedMedia[reel.id] && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center font-serif font-black text-3xl text-white/20 animate-pulse border border-white/10">
                    G
                  </div>
                </div>
              )}

              <video
                ref={(el) => {
                  videoRefs.current[reel.id] = el;
                }}
                src={reel.imageUrl}
                onPlaying={() => setLoadedMedia((prev) => ({ ...prev, [reel.id]: true }))}
                className={`relative z-10 h-full w-full max-h-full max-w-full object-contain bg-transparent shadow-2xl transition-transform duration-300 ${
                  activeCommentPost?.id === reel.id
                    ? "scale-[0.52] -translate-y-[23vh] md:scale-[0.68] md:-translate-y-[17vh]"
                    : ""
                }`}
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

              <div className="absolute top-20 right-6 z-20 flex flex-col gap-4">
                <button
                  onClick={() => setIsMuted((prev) => !prev)}
                  className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center hover:bg-black/60 transition-all active:scale-90"
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
              </div>

              {/* TikTok-style Right Sidebar - All screen sizes */}
              <div className="absolute right-3 md:right-4 bottom-24 md:bottom-28 z-20 flex flex-col items-center gap-5 md:gap-6">
                {/* Profile Avatar */}
                <div className="flex flex-col items-center gap-1">
                  <Link 
                    to={`/profile/${reel.author.username}`}
                    className="w-11 h-11 md:w-14 md:h-14 rounded-full border-2 border-white overflow-hidden shadow-lg transition-transform hover:scale-105 active:scale-95 mb-1"
                  >
                    <img 
                      src={reel.author.avatarUrl || `https://ui-avatars.com/api/?name=${reel.author.fullName}`} 
                      alt={reel.author.username}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center -mt-4 z-30 border-2 border-black">
                    <Plus size={12} className="text-black" />
                  </div>
                </div>

                {/* Like */}
                <button
                  onClick={() => likeMutation.mutate(reel.id)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-11 h-11 md:w-14 md:h-14 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center group-hover:bg-black/60 transition-all active:scale-90">
                    <Heart
                      className={`w-6 h-6 md:w-7 md:h-7 transition-colors ${reel.isLiked ? "fill-red-500 text-red-500" : "text-white"}`}
                    />
                  </div>
                  <span className="text-[10px] md:text-[11px] font-black text-white drop-shadow-md">{reel.likes}</span>
                </button>
                
                {/* Comment */}
                <button 
                  onClick={() => setActiveCommentPost(reel)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-11 h-11 md:w-14 md:h-14 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center group-hover:bg-black/60 transition-all active:scale-90">
                    <MessageCircle className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  </div>
                  <span className="text-[10px] md:text-[11px] font-black text-white drop-shadow-md">{reel.comments}</span>
                </button>

                {/* Share */}
                <button 
                  onClick={() => handleShare(reel)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-11 h-11 md:w-14 md:h-14 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center group-hover:bg-black/60 transition-all active:scale-90">
                    <Share2 className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  </div>
                  <span className="text-[10px] md:text-[11px] font-black text-white drop-shadow-md">Share</span>
                </button>

                {/* Delete (if owner) */}
                {(String(currentUser?.id) === String(reel.author?.id) || currentUser?.username === reel.author.username) && (
                  <button 
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this reel?")) {
                        deleteMutation.mutate(reel.id);
                      }
                    }}
                    className="flex flex-col items-center gap-1 group mt-2"
                  >
                    <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center group-hover:bg-red-500/40 transition-all active:scale-90">
                      <Trash2 className="w-4 h-4 md:w-5 md:h-5 text-red-400" />
                    </div>
                  </button>
                )}
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
                    {!reel.author.isFollowing && String(currentUser?.id) !== String(reel.author.id) && (
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          api.profiles.follow(reel.author.id);
                          queryClient.setQueryData(["discover-reels", discoverSeed], (old: any) => {
                            if (!old?.pages) return old;
                            return {
                              ...old,
                              pages: old.pages.map((page: any[]) => page.map((p: Post) => {
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
                        }}
                        className="px-2 py-0.5 rounded-md bg-primary text-[9px] font-black text-black uppercase tracking-widest border border-primary/20 shadow-lg shadow-primary/10"
                      >
                        Follow
                      </button>
                    )}
                  </Link>
                  
                  <p className="text-white/90 text-[13px] leading-relaxed mb-4 font-medium line-clamp-2">
                    {reel.content || "Experience the energy of GoUnion campus life."}
                  </p>

                  <div className="flex items-center gap-2 text-white/50 bg-white/5 w-fit px-3 py-1.5 rounded-full border border-white/5">
                    <Music2 size={12} className="text-primary" />
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


      {/* Comment Drawer */}
      <AnimatePresence>
        {activeCommentPost && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveCommentPost(null)}
              className="fixed inset-x-0 bottom-0 h-[65dvh] md:left-64 lg:right-80 bg-gradient-to-t from-black/30 to-transparent z-[150]"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 md:left-64 lg:right-80 bg-[#0a0a0c] rounded-t-[24px] z-[160] border-t border-white/10 p-4 sm:p-6 h-[65dvh] flex flex-col shadow-[0_-30px_80px_rgba(0,0,0,0.5)]"
            >
              <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-white/15" />
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-widest">Comments</h3>
                  <p className="text-xs text-white/35">@{activeCommentPost.author.username}</p>
                </div>
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

      <div className="fixed bottom-24 right-4 z-[100] md:right-8">
        <button onClick={() => setIsCreateReelOpen(true)} className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105">
          <Camera className="h-6 w-6" />
        </button>
      </div>

      <CreateReel isOpen={isCreateReelOpen} onClose={() => setIsCreateReelOpen(false)} />

      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}} />
    </div>
  );
};
