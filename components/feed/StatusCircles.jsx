import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from "react";
import { Plus } from "lucide-react";
import { useAuthStore } from "../../store";
import { CreateStatusModal } from "./CreateStatusModal";
import { StoryViewer } from "./StoryViewer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import { Avatar } from "../ui/Avatar";
export const StatusCircles = () => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [selectedUserStories, setSelectedUserStories] = useState([]);
    const [viewerUser, setViewerUser] = useState(null);
    const { data: storiesFeed = [] } = useQuery({
        queryKey: ["stories-feed"],
        queryFn: api.stories.getFeed,
    });
    const { data: myFollowers = [] } = useQuery({
        queryKey: ["my-followers", user?.id],
        queryFn: () => user?.id ? api.profiles.getFollowers(user.id) : Promise.resolve([]),
        enabled: !!user?.id,
    });
    const groupedStories = storiesFeed.reduce((acc, story) => {
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
    const myStories = user?.id ? groupedStories[String(user.id)]?.stories || [] : [];
    const otherStories = Object.values(groupedStories).filter((group) => {
        // Only show people who have stories.
        // Fade them if every story has been viewed; otherwise show normally.
        if (String(group.user.id) === String(user?.id))
            return false;
        if (!group.user.isFollowing)
            return false;
        // Must be a mutual follower (they follow me, and I follow them)
        const isMutual = myFollowers.some((f) => String(f.id) === String(group.user.id));
        if (!isMutual)
            return false;
        return true;
    });
    const openViewer = (group) => {
        setSelectedUserStories(group.stories);
        setViewerUser(group.user);
        setIsViewerOpen(true);
    };
    const getStoryRingClass = (stories, isOwn = false) => !isOwn && stories.length > 0 && stories.every((story) => story.isViewed)
        ? "bg-white/15 opacity-60 grayscale"
        : "story-ring shadow-[0_0_20px_rgba(196,255,14,0.15)]";
    return (_jsxs("div", { className: "flex gap-4 overflow-x-auto hide-scrollbar px-4 mb-4", children: [_jsxs("div", { className: "flex flex-col items-center gap-2 group cursor-pointer shrink-0", children: [_jsxs("div", { onClick: () => myStories.length > 0 ? openViewer({ stories: myStories, user }) : setIsModalOpen(true), className: `relative w-16 h-16 rounded-full p-[2px] transition-all duration-300 group-hover:scale-105 ${myStories.length > 0 ? getStoryRingClass(myStories, true) : 'bg-white/10'}`, children: [_jsxs("div", { className: "w-full h-full rounded-full border-2 border-[#030303] overflow-hidden flex items-center justify-center bg-white/5", children: [user?.avatarUrl ? (_jsx(Avatar, { src: user.avatarUrl, alt: "You", label: user.fullName, className: `w-full h-full object-cover transition-opacity ${myStories.length > 0 ? "opacity-100" : "opacity-40"}` })) : (_jsx("div", { className: "w-full h-full bg-white/5" })), myStories.length === 0 && (_jsx(Plus, { className: "absolute w-6 h-6 text-white/40 group-hover:text-white transition-colors" }))] }), myStories.length > 0 && (_jsx("button", { type: "button", onClick: (e) => {
                                    e.stopPropagation();
                                    setIsModalOpen(true);
                                }, className: "absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-black border-2 border-[#030303] flex items-center justify-center shadow-lg", "aria-label": "Add another story", children: _jsx(Plus, { size: 14, strokeWidth: 3 }) }))] }), _jsx("span", { className: "text-xs text-white/50", children: myStories.length > 0 ? "Your story" : "Add story" })] }), otherStories.map((group) => (_jsxs("div", { onClick: () => openViewer(group), className: "flex flex-col items-center gap-2 shrink-0 group cursor-pointer", children: [_jsx("div", { className: `w-16 h-16 rounded-full p-[2px] transition-all duration-300 group-hover:scale-105 ${getStoryRingClass(group.stories, false)}`, children: _jsx("div", { className: "w-full h-full rounded-full border-2 border-[#030303] overflow-hidden", children: _jsx(Avatar, { src: group.user.avatarUrl, alt: group.user.username, label: group.user.username, className: `w-full h-full object-cover transition-opacity ${group.stories.every((story) => story.isViewed) ? "opacity-55" : "opacity-100"}` }) }) }), _jsx("span", { className: "text-xs text-white/50 truncate w-16 text-center", children: group.user.username })] }, group.user.id))), _jsx(StoryViewer, { isOpen: isViewerOpen, onClose: () => setIsViewerOpen(false), stories: selectedUserStories, currentUser: viewerUser }), _jsx(CreateStatusModal, { isOpen: isModalOpen, onClose: () => setIsModalOpen(false), onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ["stories-feed"] });
                } })] }));
};
