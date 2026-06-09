import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Sparkles, Users, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';
import { FollowBackUrge } from '../feed/FollowBackUrge';
import { Avatar } from '../ui/Avatar';
export const RightSidebar = () => {
    const { data: suggestions } = useQuery({
        queryKey: ['suggestions'],
        queryFn: api.profiles.getSuggestions,
        staleTime: 1000 * 60 * 5,
    });
    const { data: groups } = useQuery({
        queryKey: ['groups'],
        queryFn: api.groups.getAll,
        staleTime: 1000 * 60 * 10,
    });
    const displaySuggestions = suggestions?.slice(0, 3) || [];
    const trendingGroups = groups?.slice(0, 3) || [];
    return (_jsxs(motion.aside, { initial: { x: 20, opacity: 0 }, animate: { x: 0, opacity: 1 }, transition: { duration: 0.5 }, className: "fixed right-0 top-0 h-screen w-80 border-l border-white/5 bg-black/40 backdrop-blur-3xl p-6 overflow-y-auto hidden lg:block z-40", children: [_jsx(FollowBackUrge, {}), _jsxs("div", { className: "mb-8", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx(Sparkles, { className: "w-4 h-4 text-amber-400" }), _jsx("h3", { className: "font-serif text-lg text-white font-medium", children: "Suggested friends" })] }), _jsx("div", { className: "space-y-4", children: displaySuggestions.length === 0 ? (_jsx("p", { className: "text-xs text-white/30", children: "No suggestions right now." })) : (displaySuggestions.map((u) => (_jsxs("div", { className: "flex items-center justify-between group", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Avatar, { src: u.avatarUrl, alt: u.fullName, label: u.fullName, className: "w-10 h-10 rounded-full border border-white/10 object-cover" }), _jsxs("div", { className: "min-w-0", children: [_jsx(Link, { to: `/profile/${u.username}`, className: "text-sm font-medium text-white hover:underline truncate block", children: u.fullName }), _jsx("p", { className: "text-xs text-white/50 truncate", children: u.university })] })] }), _jsx("button", { className: "px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors", children: "Follow" })] }, u.id)))) })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx(TrendingUp, { className: "w-4 h-4 text-blue-400" }), _jsx("h3", { className: "font-serif text-lg text-white font-medium", children: "Active groups" })] }), _jsx("div", { className: "space-y-3", children: trendingGroups.length === 0 ? (_jsx("p", { className: "text-xs text-white/30", children: "No active groups." })) : (trendingGroups.map((group) => (_jsxs(Link, { to: `/groups/${group.id}`, className: "block glass-panel rounded-xl p-4 hover:bg-white/5 transition-all cursor-pointer group", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("h4", { className: "text-sm font-medium text-white group-hover:text-blue-400 transition-colors", children: group.name }), _jsx(Users, { className: "w-3 h-3 text-white/40" })] }), _jsxs("div", { className: "flex items-center gap-3 text-xs text-white/50 font-medium", children: [_jsxs("span", { children: [group.memberCount, " members"] }), _jsx("span", { className: "w-1 h-1 rounded-full bg-white/20" }), _jsx("span", { className: "text-emerald-400", children: "Join" })] })] }, group.id)))) })] }), _jsx("div", { className: "mt-8 pt-6 border-t border-white/10", children: _jsxs("div", { className: "flex flex-wrap gap-x-3 gap-y-2 text-xs text-white/30", children: [_jsx("a", { href: "#", className: "hover:text-white transition-colors", children: "About" }), _jsx("a", { href: "#", className: "hover:text-white transition-colors", children: "Privacy" }), _jsx("a", { href: "#", className: "hover:text-white transition-colors", children: "Terms" }), _jsx("span", { children: "\u00A9 2026 GoUnion" })] }) })] }));
};
