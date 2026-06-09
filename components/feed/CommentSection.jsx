import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import { Send, Heart, CornerDownRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store";
import { Avatar } from "../ui/Avatar";
import { useToast } from "../ui/Toast";
import { getApiErrorMessage } from "../../services/api";
export const CommentSection = ({ postId, groupId, authorUsername, }) => {
    const [content, setContent] = useState("");
    const [replyTarget, setReplyTarget] = useState(null);
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const { toast } = useToast();
    const { data: comments, isLoading, isError } = useQuery({
        queryKey: ["comments", postId],
        queryFn: () => api.posts.getComments(postId),
    });
    const createCommentMutation = useMutation({
        mutationFn: (text) => api.posts.createComment(postId, text),
        onMutate: async (newCommentText) => {
            await queryClient.cancelQueries({ queryKey: ["comments", postId] });
            const previousComments = queryClient.getQueryData(["comments", postId]);
            // Optimistically add new comment
            queryClient.setQueryData(["comments", postId], (old) => {
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
            const updatePostCount = (p) => {
                if (p.id === postId) {
                    return { ...p, comments: (p.comments || 0) + 1 };
                }
                return p;
            };
            // Update Feed
            queryClient.setQueryData(["feed"], (old) => {
                if (!old)
                    return old;
                return {
                    ...old,
                    pages: old.pages.map((page) => page.map(updatePostCount)),
                };
            });
            // Update Group Posts
            if (groupId) {
                queryClient.setQueryData(["group-posts", groupId], (old) => {
                    if (!old)
                        return old;
                    return old.map(updatePostCount);
                });
            }
            // Update Profile Posts
            if (authorUsername) {
                queryClient.setQueryData(["profile-posts", authorUsername], (old) => {
                    if (!old)
                        return old;
                    return old.map(updatePostCount);
                });
            }
            return { previousComments };
        },
        onError: (err, newComment, context) => {
            queryClient.setQueryData(["comments", postId], context?.previousComments);
            toast(getApiErrorMessage(err, "Unable to post comment"), "error");
        },
        onSuccess: (newComment) => {
            setContent("");
            setReplyTarget(null);
            // Update cache with the actual comment from backend
            queryClient.setQueryData(["comments", postId], (old) => {
                if (!old)
                    return [newComment];
                // Remove the optimistic comment (which has a timestamp ID) and add the real one
                return [...old.filter(c => String(c.content) !== String(newComment.content)), newComment];
            });
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
        mutationFn: (commentId) => api.posts.likeComment(commentId),
        onMutate: async (commentId) => {
            await queryClient.cancelQueries({ queryKey: ["comments", postId] });
            const previousComments = queryClient.getQueryData(["comments", postId]);
            queryClient.setQueryData(["comments", postId], (old) => old?.map((comment) => {
                if (String(comment.id) !== String(commentId))
                    return comment;
                const likes = comment.likes || [];
                const isLiked = likes.some((l) => String(l.id) === String(user?.id));
                return {
                    ...comment,
                    likes: isLiked
                        ? likes.filter((l) => String(l.id) !== String(user?.id))
                        : [...likes, { id: user?.id }],
                    likes_count: Math.max(0, (comment.likes_count || 0) + (isLiked ? -1 : 1)),
                };
            }));
            return { previousComments };
        },
        onError: (_err, _commentId, context) => {
            queryClient.setQueryData(["comments", postId], context?.previousComments);
            toast("Unable to like comment", "error");
        },
        onSuccess: (response, commentId) => {
            if (typeof response?.likes_count !== "number")
                return;
            queryClient.setQueryData(["comments", postId], (old) => old?.map((comment) => String(comment.id) === String(commentId)
                ? { ...comment, likes_count: response.likes_count }
                : comment));
        },
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!content.trim() || createCommentMutation.isPending)
            return;
        const trimmed = content.trim();
        const replyText = replyTarget
            ? `@${replyTarget.user?.username || "user"} ${trimmed}`
            : trimmed;
        createCommentMutation.mutate(replyText);
    };
    const startReply = (comment) => {
        setReplyTarget(comment);
        setContent((current) => current.replace(/^@\S+\s*/, ""));
    };
    return (_jsxs("div", { className: "mt-4 flex h-full min-h-0 flex-col border-t border-white/5 pb-24 pt-4 md:pb-4", children: [_jsxs("div", { className: "flex-1 min-h-0 space-y-5 overflow-y-auto pb-4 pr-1", children: [isLoading ? (_jsx("div", { className: "flex min-h-32 items-center justify-center", children: _jsx("div", { className: "flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 font-serif text-3xl font-black text-white/25 animate-pulse", children: "G" }) })) : isError ? (_jsx("div", { className: "flex min-h-32 items-center justify-center px-4 text-center", children: _jsx("p", { className: "text-sm text-red-300", children: "Comments could not load. Check the backend comments endpoint." }) })) : ((() => {
                        // Heuristic grouping: comments starting with @ are replies
                        const topLevel = [];
                        const replies = [];
                        comments?.forEach((c) => {
                            if (c.content.trim().startsWith('@'))
                                replies.push(c);
                            else
                                topLevel.push({ ...c, replies: [] });
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
                            if (topLevel.length > 0)
                                topLevel[topLevel.length - 1].replies.push(r);
                            else
                                topLevel.push({ ...r, replies: [] });
                        });
                        return topLevel.map((comment) => (_jsx(CommentItem, { comment: comment, user: user, startReply: startReply, likeCommentMutation: likeCommentMutation }, comment.id)));
                    })()), comments?.length === 0 && (_jsx("p", { className: "text-center text-xs text-zinc-600 italic py-2", children: "No comments yet. Be the first to say something!" })), _jsx("div", { className: "h-4" })] }), _jsxs("div", { className: "sticky bottom-20 mt-3 space-y-2 border-t border-white/5 bg-[#111113] pt-3 md:bottom-0", children: [replyTarget && (_jsxs("div", { className: "flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-xs text-white", children: [_jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [_jsx(CornerDownRight, { size: 14, className: "text-primary shrink-0" }), _jsxs("span", { className: "truncate", children: ["Replying to @", replyTarget.user?.username, ": ", replyTarget.content] })] }), _jsx("button", { type: "button", onClick: () => setReplyTarget(null), className: "h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center text-white/60 hover:text-white", "aria-label": "Cancel reply", children: _jsx(X, { size: 14 }) })] })), _jsxs("form", { onSubmit: handleSubmit, className: "flex items-end gap-2", children: [_jsx("textarea", { rows: 1, value: content, onChange: (e) => setContent(e.target.value), placeholder: replyTarget ? `Reply to @${replyTarget.user?.username}` : "Write a comment...", className: "min-h-11 max-h-28 flex-1 resize-none bg-white/10 border border-white/10 rounded-2xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-violet-500/50 transition-all placeholder:text-zinc-500" }), _jsx("button", { type: "submit", disabled: !content.trim() || createCommentMutation.isPending, className: "h-11 w-11 shrink-0 flex items-center justify-center bg-violet-600 text-white rounded-2xl hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/20", "aria-label": "Send comment", children: _jsx(Send, { size: 17 }) })] })] })] }));
};
const CommentItem = ({ comment, user, startReply, likeCommentMutation }) => {
    const [showReplies, setShowReplies] = useState(false);
    return (_jsxs("div", { className: "flex flex-col gap-2", children: [_jsxs("div", { className: "flex gap-3 group", children: [_jsx(Link, { to: `/profile/${comment.user.username}`, className: "flex-shrink-0 pt-1", children: _jsx(Avatar, { src: comment.user.avatarUrl, alt: comment.user.username, label: comment.user.username, className: "w-9 h-9 rounded-full object-cover border border-white/10" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex justify-between items-start gap-4", children: [_jsxs("div", { className: "flex-1 bg-white/5 rounded-2xl rounded-tl-sm p-3.5 hover:bg-white/10 transition-colors", children: [_jsxs("div", { className: "flex justify-between items-center mb-1", children: [_jsxs(Link, { to: `/profile/${comment.user.username}`, className: "text-xs font-black text-zinc-100 hover:text-white transition-colors", children: ["@", comment.user.username] }), _jsx("span", { className: "text-[10px] text-zinc-500 font-bold uppercase tracking-wider", children: new Date(comment.created_at).toLocaleDateString() })] }), _jsx("p", { className: "text-sm text-zinc-300 leading-relaxed", children: comment.content })] }), _jsxs("button", { onClick: () => likeCommentMutation.mutate(comment.id.toString()), className: "flex flex-col items-center gap-0.5 pt-2 group/heart", children: [_jsx("div", { className: `transition-transform duration-200 group-active/heart:scale-125 ${comment.likes?.some((l) => String(l.id) === String(user?.id)) ? "text-red-500" : "text-zinc-600 group-hover/heart:text-zinc-400"}`, children: _jsx(Heart, { size: 16, fill: comment.likes?.some((l) => String(l.id) === String(user?.id)) ? "currentColor" : "none" }) }), _jsx("span", { className: "text-[10px] font-black text-zinc-500", children: comment.likes_count || 0 })] })] }), _jsxs("button", { type: "button", onClick: () => startReply(comment), className: "ml-2 mt-1 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-zinc-500 hover:text-primary transition-colors", children: [_jsx(CornerDownRight, { size: 12 }), "Reply"] })] })] }), comment.replies && comment.replies.length > 0 && (_jsxs("div", { className: "ml-12 mt-1", children: [_jsxs("button", { onClick: () => setShowReplies(!showReplies), className: "text-[11px] font-bold text-white/40 hover:text-white mb-3 flex items-center gap-2", children: [_jsx("div", { className: "w-6 h-[1px] bg-white/20" }), showReplies ? "Hide replies" : `View ${comment.replies.length} replies`] }), showReplies && (_jsx("div", { className: "space-y-4", children: comment.replies.map((reply) => (_jsxs("div", { className: "flex gap-3 group", children: [_jsx(Link, { to: `/profile/${reply.user.username}`, className: "flex-shrink-0 pt-1", children: _jsx(Avatar, { src: reply.user.avatarUrl, alt: reply.user.username, label: reply.user.username, className: "w-7 h-7 rounded-full object-cover border border-white/10" }) }), _jsx("div", { className: "flex-1 min-w-0", children: _jsxs("div", { className: "flex justify-between items-start gap-3", children: [_jsxs("div", { className: "flex-1 bg-white/5 rounded-2xl rounded-tl-sm p-3 hover:bg-white/10 transition-colors", children: [_jsx("div", { className: "flex justify-between items-center mb-1", children: _jsxs(Link, { to: `/profile/${reply.user.username}`, className: "text-[11px] font-black text-zinc-100 hover:text-white transition-colors", children: ["@", reply.user.username] }) }), _jsx("p", { className: "text-xs text-zinc-300 leading-relaxed", children: reply.content })] }), _jsx("button", { onClick: () => likeCommentMutation.mutate(reply.id.toString()), className: "flex flex-col items-center gap-0.5 pt-1 group/heart", children: _jsx("div", { className: `transition-transform duration-200 group-active/heart:scale-125 ${reply.likes?.some((l) => String(l.id) === String(user?.id)) ? "text-red-500" : "text-zinc-600 group-hover/heart:text-zinc-400"}`, children: _jsx(Heart, { size: 14, fill: reply.likes?.some((l) => String(l.id) === String(user?.id)) ? "currentColor" : "none" }) }) })] }) })] }, reply.id))) }))] }))] }));
};
