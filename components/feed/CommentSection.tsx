import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import { Send, Heart, CornerDownRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store";

interface CommentSectionProps {
  postId: string;
  groupId?: string;
  authorUsername?: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  groupId,
  authorUsername,
}) => {
  const [content, setContent] = useState("");
  const [replyTarget, setReplyTarget] = useState<any | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: comments, isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => api.posts.getComments(postId),
  });

  const createCommentMutation = useMutation({
    mutationFn: (text: string) => api.posts.createComment(postId, text),
    onMutate: async (newCommentText) => {
      await queryClient.cancelQueries({ queryKey: ["comments", postId] });
      const previousComments = queryClient.getQueryData(["comments", postId]);

      // Optimistically add new comment
      queryClient.setQueryData(["comments", postId], (old: any[]) => {
        const optimisticComment = {
          id: Date.now(),
          content: newCommentText,
          created_at: new Date().toISOString(),
          user: {
            username: user?.username || "You",
            profile: {
              profile_picture: user?.avatarUrl,
            },
          },
        };

        return old ? [...old, optimisticComment] : [optimisticComment];
      });

      // Optimistically increment comment count on the post
      const updatePostCount = (p: any) => {
        if (p.id === postId) {
          return { ...p, comments: (p.comments || 0) + 1 };
        }
        return p;
      };

      // Update Feed
      queryClient.setQueryData(["feed"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => page.map(updatePostCount)),
        };
      });

      // Update Group Posts
      if (groupId) {
        queryClient.setQueryData(["group-posts", groupId], (old: any) => {
          if (!old) return old;
          return old.map(updatePostCount);
        });
      }

      // Update Profile Posts
      if (authorUsername) {
        queryClient.setQueryData(["profile-posts", authorUsername], (old: any) => {
          if (!old) return old;
          return old.map(updatePostCount);
        });
      }

      return { previousComments };
    },
    onError: (err, newComment, context: any) => {
      queryClient.setQueryData(["comments", postId], context?.previousComments);
    },
    onSuccess: () => {
      setContent("");
      setReplyTarget(null);
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["discover-reels"] });
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ["group-posts", groupId] });
      }
      if (authorUsername) {
        queryClient.invalidateQueries({ queryKey: ["profile-posts", authorUsername] });
      }
    },
  });

  const likeCommentMutation = useMutation({
    mutationFn: (commentId: string) => api.posts.likeComment(commentId),
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: ["comments", postId] });
      const previousComments = queryClient.getQueryData(["comments", postId]);
      queryClient.setQueryData(["comments", postId], (old: any[]) =>
        old?.map((comment) => {
          if (String(comment.id) !== String(commentId)) return comment;
          const likes = comment.likes || [];
          const isLiked = likes.some((l: any) => String(l.id) === String(user?.id));
          return {
            ...comment,
            likes: isLiked
              ? likes.filter((l: any) => String(l.id) !== String(user?.id))
              : [...likes, { id: user?.id }],
            likes_count: Math.max(0, (comment.likes_count || 0) + (isLiked ? -1 : 1)),
          };
        }),
      );
      return { previousComments };
    },
    onError: (_err, _commentId, context: any) => {
      queryClient.setQueryData(["comments", postId], context?.previousComments);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || createCommentMutation.isPending) return;
    const trimmed = content.trim();
    const replyText = replyTarget
      ? `@${replyTarget.user?.username || "user"} ${trimmed}`
      : trimmed;
    createCommentMutation.mutate(replyText);
  };

  const startReply = (comment: any) => {
    setReplyTarget(comment);
    setContent((current) => current.replace(/^@\S+\s*/, ""));
  };

  return (
    <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
      {replyTarget && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-xs text-white">
          <div className="flex min-w-0 items-center gap-2">
            <CornerDownRight size={15} className="text-primary shrink-0" />
            <span className="truncate">
              Replying to @{replyTarget.user?.username}: {replyTarget.content}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setReplyTarget(null)}
            className="h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center text-white/60 hover:text-white"
            aria-label="Cancel reply"
          >
            <X size={14} />
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          rows={2}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={replyTarget ? `Reply to @${replyTarget.user?.username}` : "Write a comment..."}
          className="w-full resize-none bg-white/10 border border-white/10 rounded-2xl px-5 py-3 text-sm text-zinc-100 focus:outline-none focus:border-violet-500/50 transition-all placeholder:text-zinc-500"
        />
        <div className="flex items-center justify-between gap-3">
          <button
            type="submit"
            disabled={!content.trim() || createCommentMutation.isPending}
            className="w-28 h-12 flex items-center justify-center bg-violet-600 text-white rounded-2xl hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/20"
          >
            <Send size={20} />
          </button>
          <span className="text-xs text-white/40">
            {comments?.length ?? 0} comment{comments?.length === 1 ? "" : "s"}
          </span>
        </div>
      </form>

      <div className="space-y-5 pb-4">
        {isLoading ? (
          <div className="h-12" />
        ) : (
          (() => {
            // Heuristic grouping: comments starting with @ are replies
            const topLevel: any[] = [];
            const replies: any[] = [];
            comments?.forEach((c: any) => {
              if (c.content.trim().startsWith('@')) replies.push(c);
              else topLevel.push({ ...c, replies: [] });
            });

            // Try to attach replies to the most recent top-level comment by that user
            replies.forEach((r) => {
              const mentionedMatch = r.content.match(/^@(\S+)/);
              if (mentionedMatch) {
                const username = mentionedMatch[1];
                // Find last top level comment by this username
                const parentIdx = topLevel.map(t => t.user.username).lastIndexOf(username);
                if (parentIdx !== -1) {
                  topLevel[parentIdx].replies.push(r);
                  return;
                }
              }
              // Fallback
              if (topLevel.length > 0) topLevel[topLevel.length - 1].replies.push(r);
              else topLevel.push({ ...r, replies: [] });
            });

            return topLevel.map((comment: any) => (
              <CommentItem key={comment.id} comment={comment} user={user} startReply={startReply} likeCommentMutation={likeCommentMutation} />
            ));
          })()
        )}
        {comments?.length === 0 && (
          <p className="text-center text-xs text-zinc-600 italic py-2">
            No comments yet. Be the first to say something!
          </p>
        )}
        {/* Padding to prevent cutting on mobile */}
        <div className="h-24 md:h-12" />
      </div>
    </div>
  );
};

const CommentItem = ({ comment, user, startReply, likeCommentMutation }: any) => {
  const [showReplies, setShowReplies] = useState(false);
  
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3 group">
        <Link to={`/profile/${comment.user.username}`} className="flex-shrink-0 pt-1">
          <img
            src={
              comment.user.profile?.profile_picture ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user.username}`
            }
            alt={comment.user.username}
            className="w-9 h-9 rounded-full object-cover border border-white/10"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 bg-white/5 rounded-2xl rounded-tl-sm p-3.5 hover:bg-white/10 transition-colors">
              <div className="flex justify-between items-center mb-1">
                <Link to={`/profile/${comment.user.username}`} className="text-xs font-black text-zinc-100 hover:text-white transition-colors">
                  @{comment.user.username}
                </Link>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {comment.content}
              </p>
            </div>
            
            <button 
              onClick={() => likeCommentMutation.mutate(comment.id.toString())}
              className="flex flex-col items-center gap-0.5 pt-2 group/heart"
            >
              <div className={`transition-transform duration-200 group-active/heart:scale-125 ${comment.likes?.some((l: any) => String(l.id) === String(user?.id)) ? "text-red-500" : "text-zinc-600 group-hover/heart:text-zinc-400"}`}>
                <Heart size={16} fill={comment.likes?.some((l: any) => String(l.id) === String(user?.id)) ? "currentColor" : "none"} />
              </div>
              <span className="text-[10px] font-black text-zinc-500">{comment.likes_count || 0}</span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => startReply(comment)}
            className="ml-2 mt-1 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-zinc-500 hover:text-primary transition-colors"
          >
            <CornerDownRight size={12} />
            Reply
          </button>
        </div>
      </div>
      
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-12 mt-1">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="text-[11px] font-bold text-white/40 hover:text-white mb-3 flex items-center gap-2"
          >
            <div className="w-6 h-[1px] bg-white/20" />
            {showReplies ? "Hide replies" : `View ${comment.replies.length} replies`}
          </button>
          
          {showReplies && (
            <div className="space-y-4">
              {comment.replies.map((reply: any) => (
                <div key={reply.id} className="flex gap-3 group">
                  <Link to={`/profile/${reply.user.username}`} className="flex-shrink-0 pt-1">
                    <img
                      src={
                        reply.user.profile?.profile_picture ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.user.username}`
                      }
                      alt={reply.user.username}
                      className="w-7 h-7 rounded-full object-cover border border-white/10"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 bg-white/5 rounded-2xl rounded-tl-sm p-3 hover:bg-white/10 transition-colors">
                        <div className="flex justify-between items-center mb-1">
                          <Link to={`/profile/${reply.user.username}`} className="text-[11px] font-black text-zinc-100 hover:text-white transition-colors">
                            @{reply.user.username}
                          </Link>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          {reply.content}
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => likeCommentMutation.mutate(reply.id.toString())}
                        className="flex flex-col items-center gap-0.5 pt-1 group/heart"
                      >
                        <div className={`transition-transform duration-200 group-active/heart:scale-125 ${reply.likes?.some((l: any) => String(l.id) === String(user?.id)) ? "text-red-500" : "text-zinc-600 group-hover/heart:text-zinc-400"}`}>
                          <Heart size={14} fill={reply.likes?.some((l: any) => String(l.id) === String(user?.id)) ? "currentColor" : "none"} />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
