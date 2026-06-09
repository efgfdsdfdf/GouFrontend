import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useRef } from "react";
import { Search, Bell } from "lucide-react";
import { useAuthStore, useUIStore } from "../../store";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import { NotificationDropdown } from "./NotificationDropdown";
import { Avatar } from "../ui/Avatar";
import { motion, AnimatePresence } from "framer-motion";
export const TopNav = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { toggleSidebar } = useUIStore();
    const [showNotifications, setShowNotifications] = useState(false);
    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearchResults, setShowSearchResults] = useState(false);
    const searchRef = useRef(null);
    const { data: notifications } = useQuery({
        queryKey: ["notifications"],
        queryFn: api.notifications.getAll,
    });
    const { data: searchResults, isLoading: isSearching } = useQuery({
        queryKey: ["search", searchQuery],
        queryFn: () => api.search.global(searchQuery),
        enabled: searchQuery.length > 0,
    });
    const queryClient = useQueryClient();
    const unreadCount = notifications?.filter((n) => !n.read).length || 0;
    const location = useLocation();
    const isDiscover = location.pathname === "/discover";
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearchResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    return (_jsx("header", { className: "flex sticky top-0 w-full h-16 md:h-20 bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-white/5 z-[100]", children: _jsxs("div", { className: "max-w-[1600px] mx-auto h-full w-full flex items-center justify-between px-4 md:px-8 relative", children: [_jsx("div", { className: "flex items-center gap-4", children: _jsxs(Link, { to: "/", onClick: () => {
                            if (location.pathname === "/") {
                                window.dispatchEvent(new Event("gounion-refresh-feed"));
                            }
                        }, className: "flex items-center gap-3 group", children: [_jsx("div", { className: "w-10 h-10 md:w-11 md:h-11 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105", children: _jsx("span", { className: "font-black text-black text-xl md:text-2xl", children: "G" }) }), _jsx("span", { className: "font-black text-2xl tracking-tighter text-white hidden sm:block", children: "GoUnion" })] }) }), _jsx("div", { className: "flex-1 max-w-lg mx-2 md:mx-12", ref: searchRef, children: _jsxs("div", { className: "relative group", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors", size: 18 }), _jsx("input", { type: "text", placeholder: "Search groups and people...", value: searchQuery, onChange: (e) => {
                                    setSearchQuery(e.target.value);
                                    setShowSearchResults(true);
                                }, onFocus: () => {
                                    if (searchQuery.length > 1)
                                        setShowSearchResults(true);
                                }, className: "w-full bg-[#141417] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 transition-all text-sm font-medium" }), _jsx(AnimatePresence, { children: showSearchResults && searchQuery.length > 0 && (_jsx(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 10 }, className: "absolute top-full left-0 right-0 mt-2 bg-[#141417] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto", children: isSearching ? (_jsx("div", { className: "p-4 text-center text-zinc-500 text-xs font-bold uppercase tracking-widest", children: "Searching..." })) : searchResults ? (_jsxs("div", { className: "space-y-2", children: [searchResults.users.length > 0 && (_jsxs("div", { children: [_jsx("div", { className: "px-4 py-3 text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 border-b border-white/10", children: "People" }), searchResults.users.map((user) => (_jsxs(Link, { to: `/profile/${user.username}`, onClick: () => setShowSearchResults(false), className: "flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0", children: [_jsx("img", { src: user.avatarUrl, alt: user.username, className: "w-10 h-10 rounded-full object-cover border border-white/10" }), _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "text-white text-sm font-bold", children: user.fullName }), _jsxs("span", { className: "text-zinc-500 text-xs font-medium", children: ["@", user.username] })] })] }, `user-${user.id}`)))] })), searchResults.groups.length > 0 && (_jsxs("div", { children: [_jsx("div", { className: "px-4 py-3 text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 border-b border-white/10", children: "Groups" }), searchResults.groups.map((group) => (_jsxs(Link, { to: `/groups/${group.id}`, onClick: () => setShowSearchResults(false), className: "flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0", children: [_jsx("img", { src: group.imageUrl, alt: group.name, className: "w-10 h-10 rounded-full object-cover border border-white/10" }), _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "text-white text-sm font-bold", children: group.name }), _jsx("span", { className: "text-zinc-500 text-xs font-medium", children: group.description })] })] }, `group-${group.id}`)))] })), searchResults.posts.length > 0 && (_jsxs("div", { children: [_jsx("div", { className: "px-4 py-3 text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 border-b border-white/10", children: "Posts" }), searchResults.posts.map((post) => (_jsxs("button", { onClick: () => setShowSearchResults(false), className: "w-full text-left p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0", children: [_jsx("p", { className: "text-white text-sm font-bold truncate", children: post.content || 'Shared post' }), _jsxs("span", { className: "text-zinc-500 text-xs", children: ["@", post.author.username] })] }, `post-${post.id}`)))] })), searchResults.users.length === 0 && searchResults.groups.length === 0 && searchResults.posts.length === 0 && (_jsx("div", { className: "p-4 text-center text-zinc-500 text-xs font-bold uppercase tracking-widest", children: "No results found" }))] })) : (_jsx("div", { className: "p-4 text-center text-zinc-500 text-xs font-bold uppercase tracking-widest", children: "Start typing to search" })) })) })] }) }), _jsxs("div", { className: "flex items-center gap-2 md:gap-5", children: [_jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: () => setShowNotifications(!showNotifications), className: `relative p-2.5 transition-all rounded-xl ${showNotifications ? "bg-primary text-black shadow-[0_0_20px_rgba(196,255,14,0.3)]" : "text-zinc-400 hover:text-white hover:bg-white/5"}`, children: [_jsx(Bell, { size: 22 }), unreadCount > 0 && (_jsx("span", { className: `absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center text-[10px] font-black rounded-lg border-2 border-[#0a0a0c] ${showNotifications ? "bg-white text-black" : "bg-red-500 text-white"}`, children: unreadCount > 9 ? "9+" : unreadCount }))] }), _jsx(AnimatePresence, { children: showNotifications && (_jsx(NotificationDropdown, { notifications: notifications || [], onClose: () => setShowNotifications(false), onMarkRead: async () => {
                                            await api.notifications.markRead();
                                            queryClient.invalidateQueries({ queryKey: ["notifications"] });
                                            setShowNotifications(false);
                                        }, onItemClick: (n) => {
                                            setShowNotifications(false);
                                            if (n.type === "follow") {
                                                navigate(`/profile/${n.actor.username}`);
                                            }
                                            else if (n.message.includes("post") ||
                                                n.message.includes("comment")) {
                                                navigate(`/profile/${n.actor.username}`);
                                            }
                                            else {
                                                navigate("/");
                                            }
                                        } })) })] }), _jsx("div", { className: "w-px h-8 bg-white/10 hidden md:block mx-1" }), _jsx(Link, { to: `/profile/${user?.username}`, className: "ml-1 md:ml-0", children: _jsx("div", { className: "p-1 rounded-full border-2 border-transparent hover:border-primary/50 transition-colors", children: _jsx("div", { className: "w-8 h-8 md:w-10 md:h-10 rounded-full border border-white/10 overflow-hidden bg-white/5", children: _jsx(Avatar, { src: user?.avatarUrl, label: "G", alt: "Profile", className: "w-full h-full object-cover" }) }) }) })] })] }) }));
};
