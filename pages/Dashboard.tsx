import React, { useEffect, useRef, useState, TouchEvent } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { PostCard } from "../components/feed/PostCard";
import { StatusCircles } from "../components/feed/StatusCircles";
import { Skeleton } from "../components/ui/Skeleton";
import { api } from "../services/api";
import { Post } from "../types";

export const Dashboard = () => {
  const queryClient = useQueryClient();
  const [feedSeed, setFeedSeed] = useState(() => Math.random());
  
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (window.scrollY === 0 && touchStartY.current > 0) {
      const y = e.touches[0].clientY - touchStartY.current;
      if (y > 0) {
        setPullY(y);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullY > 140) {
      setIsRefreshing(true);
      setFeedSeed(Math.random());
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
      setTimeout(() => {
        setIsRefreshing(false);
        setPullY(0);
      }, 1000);
    } else {
      setPullY(0);
    }
    touchStartY.current = 0;
  };

  const refreshFeed = async () => {
    setIsRefreshing(true);
    setFeedSeed(Math.random());
    await queryClient.invalidateQueries({ queryKey: ["feed"] });
    setTimeout(() => setIsRefreshing(false), 600);
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
  const posts = uniquePosts.filter((post) => !post.isReel);

  return (
    <div 
      className="max-w-2xl mx-auto w-full pb-24 pt-0 md:pt-4"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="flex items-center justify-center overflow-hidden transition-all duration-300"
        style={{ height: pullY > 0 || isRefreshing ? `${Math.min(pullY, 80)}px` : '0px' }}
      >
        <RefreshCw 
          className={`text-primary ${isRefreshing ? 'animate-spin' : ''}`} 
          size={24} 
          style={!isRefreshing ? { transform: `rotate(${pullY * 3}deg)` } : {}}
        />
      </div>
      {/* Stories Section */}
      <div className="mb-2">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-serif text-3xl text-white">Campus stories</h2>
          <button
            type="button"
            onClick={refreshFeed}
            className="hidden md:flex h-10 w-10 rounded-full bg-white/5 border border-white/10 text-white/70 items-center justify-center hover:bg-white/10 hover:text-white transition-all active:scale-95"
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
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center font-serif font-black text-4xl text-white/20 animate-pulse shadow-[0_0_40px_rgba(255,255,255,0.05)] border border-white/10">
              G
            </div>
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
