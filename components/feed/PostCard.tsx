import React from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Flag,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { Post } from "../../types";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../services/api";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CommentSection } from "./CommentSection";
import { useAuthStore } from "../../store";
import { MediaPlayer } from "../ui/MediaPlayer";
import { useToast } from "../ui/Toast";

interface PostCardProps {
  post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { toast } = useToast();
  const [showComments, setShowComments] = React.useState(false);
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [showMenu, setShowMenu] = React.useState(false);
  const [isReporting, setIsReporting] = React.useState(false);
  const [reportReason, setReportReason] = React.useState("");
  const [isLoaded, setIsLoaded] = React.useState(false);

  const updatePostAcrossLists = React.useCallback(
    (updater: (p: Post) => Post) => {
      queryClient.setQueriesData({ queryKey: ["feed"] }, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any[]) => page.map(updater)),
        };
      });
      queryClient.setQueriesData({ queryKey: ["discover-reels"] }, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any[]) => page.map(updater)),
        };
      });
      queryClient.setQueryData(["profile-posts", post.author.username], (old: any) =>
        Array.isArray(old) ? old.map(updater) : old,
      );
      if (post.groupId) {
        queryClient.setQueryData(["group-posts", post.groupId], (old: any) =>
          Array.isArray(old) ? old.map(updater) : old,
        );
      }
    },
    [post.author.username, post.groupId, queryClient],
  );

  const likeMutation = useMutation({
    mutationFn: () => api.posts.like(post.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["feed"] });
      await queryClient.cancelQueries({ queryKey: ["discover-reels"] });

      const updatePost = (p: Post) => {
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
      queryClient.invalidateQueries({ queryKey: ["profile-posts", post.author.username] });
      if (post.groupId) {
        queryClient.invalidateQueries({ queryKey: ["group-posts", post.groupId] });
      }
    },
  });

  const reportMutation = useMutation({
    mutationFn: (reason: string) =>
      api.reports.create({ reason, postId: parseInt(post.id) }),
    onSuccess: () => {
      toast("Report submitted for review", "success");
      setShowMenu(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.posts.delete(post.id),
    onSuccess: () => {
      toast("Post deleted successfully", "success");
      queryClient.setQueriesData({ queryKey: ["feed"] }, (old: any) => {
        if (!old?.pages) return old;
        return { ...old, pages: old.pages.map((page: any[]) => page.filter((item) => item.id !== post.id)) };
      });
      queryClient.setQueriesData({ queryKey: ["discover-reels"] }, (old: any) => {
        if (!old?.pages) return old;
        return { ...old, pages: old.pages.map((page: any[]) => page.filter((item) => item.id !== post.id)) };
      });
      queryClient.setQueryData(["profile-posts", post.author.username], (old: any) =>
        Array.isArray(old) ? old.filter((item) => item.id !== post.id) : old,
      );
      if (post.groupId) {
        queryClient.setQueryData(["group-posts", post.groupId], (old: any) =>
          Array.isArray(old) ? old.filter((item) => item.id !== post.id) : old,
        );
      }
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["discover-reels"] });
      queryClient.invalidateQueries({ queryKey: ["profile-posts", post.author.username] });
      if (post.groupId) {
        queryClient.invalidateQueries({ queryKey: ["group-posts", post.groupId] });
      }
    },
  });

  const isModerator =
    currentUser?.role === "admin" || currentUser?.role === "moderator";
  const isOwner = String(currentUser?.id) === String(post.author.id);
  const handleShare = async () => {
    const shareUrl = post.imageUrl || `${window.location.origin}/profile/${post.author.username}`;
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
      } else {
        await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
        toast("Post content copied", "success");
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        toast("Unable to share post", "error");
      }
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-panel rounded-2xl overflow-hidden group"
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${post.author.username}`}>
              <img
                src={post.author.avatarUrl || `https://ui-avatars.com/api/?name=${post.author.fullName}&background=random`}
                alt={post.author.fullName}
                className="w-10 h-10 rounded-full object-cover border border-white/10"
                referrerPolicy="no-referrer"
              />
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <Link to={`/profile/${post.author.username}`} className="font-medium text-white hover:underline">
                  {post.author.fullName}
                </Link>
                <div className="bg-primary-foreground/10 text-primary-foreground p-0.5 rounded-full">
                   <svg className="w-3 h-3 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                     <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                   </svg>
                </div>
              </div>
              <p className="text-xs text-white/50">{post.timestamp}</p>
            </div>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-white/40 hover:text-white transition-colors rounded-full hover:bg-white/5"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setShowMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-[#1a1a1e] border border-white/10 rounded-2xl shadow-2xl z-[110] overflow-hidden"
                  >
                    {!isOwner && (
                      <button
                        onClick={() => {
                          setIsReporting(true);
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all"
                      >
                        <Flag size={16} />
                        Report
                      </button>
                    )}
                    {(isOwner || isModerator) && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowMenu(false);
                          deleteMutation.mutate();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Content */}
        <p className="text-white/90 text-[15px] leading-relaxed mb-4">
          {post.content}
        </p>
      </div>

      {/* Media */}
      {post.imageUrl && (
        <div className="relative w-full bg-black/20 border-y border-white/5 min-h-[300px] flex items-center justify-center">
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center font-serif font-black text-3xl text-white/20 animate-pulse border border-white/10">
                G
              </div>
            </div>
          )}
          <div className={`relative z-10 w-full h-full ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
            <MediaPlayer url={post.imageUrl} alt="Post media" onLoadedData={() => setIsLoaded(true)} onLoad={() => setIsLoaded(true)} />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => likeMutation.mutate()}
              className={`flex items-center gap-2 transition-all duration-300 ${post.isLiked ? "text-pink-500" : "text-white/60 hover:text-pink-500"}`}
            >
              <Heart size={20} className={post.isLiked ? "fill-current" : ""} />
              <span className="text-sm font-medium">{post.likes}</span>
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-2 transition-all duration-300 ${showComments ? "text-blue-400" : "text-white/60 hover:text-blue-400"}`}
            >
              <MessageCircle size={20} />
              <span className="text-sm font-medium">{post.comments}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-white/60 hover:text-emerald-400 transition-colors"
            >
              <Share2 size={20} />
            </button>
          </div>
          <button className="text-white/60 hover:text-white transition-colors">
            <Bookmark size={20} />
          </button>
        </div>

        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-white/5"
            >
              <CommentSection
                postId={post.id}
                groupId={post.groupId}
                authorUsername={post.author.username}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isReporting && (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel p-6 rounded-2xl w-full max-w-sm"
            >
              <h3 className="text-xl font-serif text-white mb-4">Report Post</h3>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {["Spam", "Hate Speech", "Harassment", "False Info"].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setReportReason(preset)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      reportReason === preset ? 'bg-primary/20 text-primary border-primary/30' : 'bg-white/5 text-zinc-400 border-white/5 border-transparent hover:bg-white/10'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Or provide a specific reason..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/40 focus:outline-none focus:border-white/20 mb-4 min-h-[80px] resize-none"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setIsReporting(false)}
                  className="px-4 py-2 text-white/60 hover:text-white transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    reportMutation.mutate(reportReason);
                    setIsReporting(false);
                    setReportReason("");
                  }}
                  disabled={!reportReason.trim() || reportMutation.isPending}
                  className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium rounded-xl disabled:opacity-50"
                >
                  {reportMutation.isPending ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.article>
  );
};
