import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Heart, Eye } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";

interface StoryViewerProps {
  isOpen: boolean;
  onClose: () => void;
  stories: any[];
  currentUser: any;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
  isOpen,
  onClose,
  stories,
  currentUser,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const queryClient = useQueryClient();

  const viewMutation = useMutation({
    mutationFn: (id: string) => api.stories.view(id),
    onSuccess: () => {
      // Potentially refresh feed to update view count, but maybe too much
    },
  });

  const likeMutation = useMutation({
    mutationFn: (id: string) => api.stories.like(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories-feed"] });
    },
  });

  useEffect(() => {
    if (!isOpen || !stories.length) return;

    // Record view for current story
    const currentStory = stories[currentIndex];
    if (currentStory && currentStory.id) {
      viewMutation.mutate(currentStory.id);
    }
  }, [isOpen, currentIndex, stories.length]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentIndex(0);
      setProgress(0);
      return;
    }

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [isOpen, currentIndex]);

  useEffect(() => {
    if (progress >= 100 && isOpen) {
      if (currentIndex < stories.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setProgress(0);
      } else {
        onClose();
      }
    }
  }, [progress, currentIndex, stories.length, isOpen, onClose]);

  const currentStory = stories[currentIndex] || {
    content: "No content",
    user: currentUser,
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentStory.id) {
      likeMutation.mutate(currentStory.id);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-full max-w-lg h-full md:h-[90vh] bg-zinc-900 md:rounded-[2rem] overflow-hidden flex flex-col"
          >
            {/* Progress Bars */}
            <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
              {stories.map((_, i) => (
                <div
                  key={i}
                  className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full bg-primary transition-all duration-100 ease-linear"
                    style={{
                      width:
                        i < currentIndex
                          ? "100%"
                          : i === currentIndex
                            ? `${progress}%`
                            : "0%",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="absolute top-8 left-6 right-6 flex items-center justify-between z-20">
              <div className="flex items-center gap-3">
                <img
                  src={currentStory.user?.avatarUrl}
                  className="w-10 h-10 rounded-full border-2 border-primary"
                  alt="Avatar"
                />
                <div>
                  <p className="text-white font-black text-sm uppercase tracking-widest">
                    {currentStory.user?.username}
                  </p>
                  <p className="text-zinc-400 text-[10px] font-bold uppercase">
                    {currentStory.timestamp || "Just now"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/70 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content Container */}
            <div className="flex-1 relative flex items-center justify-center">
              {currentStory.imageUrl ? (
                <img
                  src={currentStory.imageUrl}
                  className="w-full h-full object-cover"
                  alt="Story"
                />
              ) : (
                <div className="p-12 text-center">
                  <h2 className="text-2xl md:text-4xl font-black text-white leading-tight tracking-tighter">
                    {currentStory.content}
                  </h2>
                </div>
              )}

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />
            </div>

            {/* Navigation Overlay */}
            <div className="absolute inset-0 flex z-10">
              <div
                className="flex-1 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentIndex > 0) {
                    setCurrentIndex(currentIndex - 1);
                    setProgress(0);
                  }
                }}
              />
              <div
                className="flex-1 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentIndex < stories.length - 1) {
                    setCurrentIndex(currentIndex + 1);
                    setProgress(0);
                  } else {
                    onClose();
                  }
                }}
              />
            </div>

            {/* Footer Features */}
            <div className="absolute bottom-10 left-6 right-6 flex items-center justify-between z-30">
              <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <div className="flex items-center gap-1.5">
                  <Eye size={16} className="text-zinc-400" />
                  <span className="text-white text-xs font-bold">
                    {currentStory.viewsCount || 0}
                  </span>
                </div>
                <div className="w-[1px] h-3 bg-white/20" />
                <div className="flex items-center gap-1.5">
                  <Heart size={16} className="text-zinc-400" />
                  <span className="text-white text-xs font-bold">
                    {currentStory.likesCount || 0}
                  </span>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleLike}
                className={`p-3 rounded-full border transition-all duration-300 ${
                  currentStory.isLiked
                    ? "bg-primary border-primary text-black shadow-[0_0_20px_rgba(196,255,14,0.4)]"
                    : "bg-white/10 border-white/10 text-white hover:bg-white/20"
                }`}
              >
                <Heart
                  size={20}
                  fill={currentStory.isLiked ? "currentColor" : "none"}
                />
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
