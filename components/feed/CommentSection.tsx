import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import { Skeleton } from "../ui/Skeleton";
import { Send, Heart } from "lucide-react";
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || createCommentMutation.isPending) return;
    createCommentMutation.mutate(content);
  };

  return (
    <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 bg-white/10 border border-white/10 rounded-2xl px-5 py-3 text-sm text-zinc-100 focus:outline-none focus:border-violet-500/50 transition-all placeholder:text-zinc-500"
        />
        <button
          type="submit"
          disabled={!content.trim() || createCommentMutation.isPending}
          className="w-12 h-12 flex items-center justify-center bg-violet-600 text-white rounded-2xl hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/20"
        >
          <Send size={20} />
        </button>
      </form>

      <div className="space-y-5 pb-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        ) : (
          comments?.map((comment: any) => (
            <div key={comment.id} className="flex gap-3 group">
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
                    <div className={`transition-transform duration-200 group-active/heart:scale-125 ${comment.likes?.some((l: any) => l.id === user?.id) ? "text-red-500" : "text-zinc-600 group-hover/heart:text-zinc-400"}`}>
                      <Heart size={16} fill={comment.likes?.some((l: any) => l.id === user?.id) ? "currentColor" : "none"} />
                    </div>
                    <span className="text-[10px] font-black text-zinc-500">{comment.likes_count || 0}</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        {comments?.length === 0 && (
          <p className="text-center text-xs text-zinc-600 italic py-2">
            No comments yet. Be the first to say something!
          </p>
        )}
      </div>
    </div>
  );
};
