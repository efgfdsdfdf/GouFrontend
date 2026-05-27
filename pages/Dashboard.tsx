import React, { useEffect, useRef } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { PostCard } from "../components/feed/PostCard";
import { StatusCircles } from "../components/feed/StatusCircles";
import { api } from "../services/api";
import { Post } from "../types";

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

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: ["feed"],
      queryFn: ({ pageParam }) => api.posts.getFeed({ pageParam }),
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        return lastPage.length > 0 ? allPages.length : undefined;
      },
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
    <div className="max-w-2xl mx-auto w-full pb-24 pt-0 md:pt-4">
      {/* Stories Section */}
      <div className="mb-2">
        <div className="mb-4">
          <h2 className="font-serif text-3xl text-white">Campus stories</h2>
        </div>
        <StatusCircles />
      </div>

      <div className="space-y-6">
        {status === "pending" ? (
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((key) => (
              <div key={key} className="glass-panel rounded-2xl p-4 md:p-5 border border-white/5 shadow-xl animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/10" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-white/10 rounded-md mb-2" />
                    <div className="h-3 w-20 bg-white/5 rounded-md" />
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="h-3 w-full bg-white/10 rounded-md" />
                  <div className="h-3 w-5/6 bg-white/10 rounded-md" />
                  <div className="h-3 w-4/6 bg-white/10 rounded-md" />
                </div>
                <div className="h-64 w-full bg-white/5 rounded-xl border border-white/5 mb-4" />
                <div className="flex items-center gap-4 border-t border-white/5 pt-4">
                  <div className="h-8 w-16 bg-white/10 rounded-lg" />
                  <div className="h-8 w-16 bg-white/10 rounded-lg" />
                </div>
              </div>
            ))}
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
                <div className="h-4 w-full" />
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
