import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useRef } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { PostCard } from "../components/feed/PostCard";
import { StatusCircles } from "../components/feed/StatusCircles";
import { api } from "../services/api";
import { FollowBackUrge } from "../components/feed/FollowBackUrge";
export const Dashboard = () => {
    const queryClient = useQueryClient();
    const refreshFeed = async () => {
        await queryClient.invalidateQueries({ queryKey: ["feed"] });
    };
    useEffect(() => {
        const handleExternalRefresh = () => {
            void refreshFeed();
        };
        window.addEventListener("gounion-refresh-feed", handleExternalRefresh);
        return () => window.removeEventListener("gounion-refresh-feed", handleExternalRefresh);
    }, []);
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useInfiniteQuery({
        queryKey: ["feed"],
        queryFn: ({ pageParam }) => api.posts.getFeed({ pageParam }),
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length > 0 ? allPages.length : undefined;
        },
    });
    const loadMoreRef = useRef(null);
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
        }, { threshold: 0.1, rootMargin: "100px" });
        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }
        return () => {
            if (loadMoreRef.current) {
                observer.unobserve(loadMoreRef.current);
            }
            observer.disconnect();
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
    const uniquePosts = Array.from(new Map((data?.pages.flat() || []).map((post) => [post.id, post])).values());
    const posts = uniquePosts;
    return (_jsxs("div", { className: "w-full pb-24 pt-0 md:pt-4 px-0 overflow-x-hidden", children: [_jsx(FollowBackUrge, { className: "block lg:hidden mt-4" }), _jsxs("div", { className: "mb-2", children: [_jsx("div", { className: "mb-4", children: _jsx("h2", { className: "font-serif text-3xl text-white", children: "Campus stories" }) }), _jsx(StatusCircles, {})] }), _jsx("div", { className: "space-y-6 w-full", children: status === "pending" ? (_jsx("div", { className: "space-y-6", children: [1, 2, 3, 4, 5].map((key) => (_jsxs("div", { className: "glass-panel rounded-2xl p-4 md:p-5 border border-white/5 shadow-xl animate-pulse", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/10" }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "h-4 w-32 bg-white/10 rounded-md mb-2" }), _jsx("div", { className: "h-3 w-20 bg-white/5 rounded-md" })] })] }), _jsxs("div", { className: "space-y-3 mb-4", children: [_jsx("div", { className: "h-3 w-full bg-white/10 rounded-md" }), _jsx("div", { className: "h-3 w-5/6 bg-white/10 rounded-md" }), _jsx("div", { className: "h-3 w-4/6 bg-white/10 rounded-md" })] }), _jsx("div", { className: "h-64 w-full bg-white/5 rounded-xl border border-white/5 mb-4" }), _jsxs("div", { className: "flex items-center gap-4 border-t border-white/5 pt-4", children: [_jsx("div", { className: "h-8 w-16 bg-white/10 rounded-lg" }), _jsx("div", { className: "h-8 w-16 bg-white/10 rounded-lg" })] })] }, key))) })) : status === "error" ? (_jsx("div", { className: "glass-panel p-12 text-center rounded-2xl", children: _jsx("p", { className: "text-white/60", children: "Unable to load posts. Please try again later." }) })) : (_jsxs("div", { className: "space-y-6", children: [posts.map((post) => (_jsx(PostCard, { post: post }, post.id))), _jsx("div", { ref: loadMoreRef, className: "py-12 flex flex-col items-center justify-center", children: isFetchingNextPage ? (_jsx("div", { className: "h-4 w-full" })) : hasNextPage ? (_jsx("div", { className: "h-4 w-full" })) : (_jsx("p", { className: "text-white/30 text-sm font-medium", children: "You've reached the end of the feed!" })) })] })) })] }));
};
