import React, { useState } from "react";
import { Plus } from "lucide-react";
import { useAuthStore } from "../../store";
import { CreateStatusModal } from "./CreateStatusModal";
import { StoryViewer } from "./StoryViewer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import { motion } from "framer-motion";

export const StatusCircles = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedUserStories, setSelectedUserStories] = useState<any[]>([]);
  const [viewerUser, setViewerUser] = useState<any>(null);

  const { data: storiesFeed = [] } = useQuery({
    queryKey: ["stories-feed"],
    queryFn: api.stories.getFeed,
    refetchInterval: 60000,
  });

  const groupedStories = storiesFeed.reduce((acc: any, story: any) => {
    const userId = story.user.id;
    if (!acc[userId]) {
      acc[userId] = {
        user: story.user,
        stories: [],
      };
    }
    acc[userId].stories.push(story);
    return acc;
  }, {});

  const myStories = groupedStories[user?.id]?.stories || [];
  const otherStories = Object.values(groupedStories).filter(
    (group: any) => group.user.id !== user?.id,
  );

  const openViewer = (group: any) => {
    setSelectedUserStories(group.stories);
    setViewerUser(group.user);
    setIsViewerOpen(true);
  };

  const getStoryRingClass = (stories: any[]) =>
    stories.length > 0 && stories.every((story) => story.isViewed)
      ? "bg-white/15 opacity-60 grayscale"
      : "story-ring shadow-[0_0_20px_rgba(196,255,14,0.15)]";

  return (
    <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-4 px-4 mb-4">
      {/* Your Story */}
      <div className="flex flex-col items-center gap-2 group cursor-pointer shrink-0">
        <div
          onClick={() => myStories.length > 0 ? openViewer({ stories: myStories, user }) : setIsModalOpen(true)}
          className={`relative w-16 h-16 rounded-full p-[2px] transition-all duration-300 group-hover:scale-105 ${myStories.length > 0 ? getStoryRingClass(myStories) : 'bg-white/10'}`}
        >
          <div className="w-full h-full rounded-full border-2 border-[#030303] overflow-hidden flex items-center justify-center bg-white/5">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="You"
                className={`w-full h-full object-cover transition-opacity ${myStories.length > 0 ? "opacity-100" : "opacity-40"}`}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-white/5" />
            )}
            {myStories.length === 0 && (
              <Plus className="absolute w-6 h-6 text-white/40 group-hover:text-white transition-colors" />
            )}
          </div>
          {myStories.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-black border-2 border-[#030303] flex items-center justify-center shadow-lg"
              aria-label="Add another story"
            >
              <Plus size={14} strokeWidth={3} />
            </button>
          )}
        </div>
        <span className="text-xs text-white/50">{myStories.length > 0 ? "Your story" : "Add story"}</span>
      </div>

      {/* Others */}
      {otherStories.map((group: any) => (
        <div
          key={group.user.id}
          onClick={() => openViewer(group)}
          className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer"
        >
          <div className={`w-16 h-16 rounded-full p-[2px] transition-all duration-300 group-hover:scale-105 ${getStoryRingClass(group.stories)}`}>
            <div className="w-full h-full rounded-full border-2 border-[#030303] overflow-hidden">
              <img
                src={group.user.avatarUrl || `https://ui-avatars.com/api/?name=${group.user.fullName}`}
                alt={group.user.username}
                className={`w-full h-full object-cover transition-opacity ${group.stories.every((story: any) => story.isViewed) ? "opacity-55" : "opacity-100"}`}
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <span className="text-xs text-white/50 truncate w-16 text-center">
            {group.user.username}
          </span>
        </div>
      ))}

      <StoryViewer
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        stories={selectedUserStories}
        currentUser={viewerUser}
      />

      <CreateStatusModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["stories-feed"] });
        }}
      />
    </div>
  );
};
