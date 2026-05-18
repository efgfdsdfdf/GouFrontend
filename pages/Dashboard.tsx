import React, { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { PostCard } from "../components/feed/PostCard";
import { StatusCircles } from "../components/feed/StatusCircles";
import { Skeleton } from "../components/ui/Skeleton";
import { api } from "../services/api";
import { Post } from "../types";

export const Dashboard = () => {
  const [feedSeed, setFeedSeed] = useState(() => Math.random());
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: ["feed", feedSeed],
      queryFn: ({ pageParam }) => api.posts.getFeed({ pageParam, seed: feedSeed }),
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        return lastPage.length > 0 ? allPages.length : undefined;
      },
    });

  const { data: suggestions } = useQuery({
    queryKey: ["suggestions"],
    queryFn: api.profiles.getSuggestions,
    staleTime: 1000 * 60 * 5,
  });

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: "100px" },
    );

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

  const uniquePosts = Array.from(
    new Map((data?.pages.flat() || []).map((post: Post) => [post.id, post])).values(),
  );
  const posts = uniquePosts;

  return (
    <div className="max-w-2xl mx-auto w-full pb-24 pt-8">
      {/* Stories Section */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-serif text-3xl text-white">Campus stories</h2>
          <button
            type="button"
            onClick={() => setFeedSeed(Math.random())}
            className="h-10 w-10 rounded-full bg-white/5 border border-white/10 text-white/70 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all active:scale-95"
            aria-label="Refresh feed"
            title="Refresh feed"
          >
            <RefreshCw size={17} />
          </button>
        </div>
        <StatusCircles users={suggestions || []} />
      </div>

      <div className="space-y-6">
        {status === "pending" ? (
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : status === "error" ? (
          <div className="glass-panel p-12 text-center rounded-2xl">
            <p className="text-white/60">Unable to load posts. Please try again later.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post: Post) => (
              <PostCard key={post.id} post={post} />
            ))}

            {/* Infinite Scroll Sentinel */}
            <div
              ref={loadMoreRef}
              className="py-12 flex flex-col items-center justify-center"
            >
              {isFetchingNextPage ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white/20 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-white/20 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-white/20 rounded-full animate-bounce"></div>
                </div>
              ) : hasNextPage ? (
                <div className="h-4 w-full" />
              ) : (
                <p className="text-white/30 text-sm font-medium">You've reached the end of the feed!</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
