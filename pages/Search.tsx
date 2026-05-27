import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, User, MessageCircle, Users, ChevronRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../services/api";
import { Link } from "react-router-dom";

export const SearchPage = () => {
    const [query, setQuery] = useState("");
    const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'groups'>('users');

    const { data: userResults, isFetching: isFetchingUsers } = useQuery({
        queryKey: ["search-users", query],
        queryFn: () => api.search.users(query),
        enabled: query.length > 2 && activeTab === 'users',
    });

    const { data: postResults, isFetching: isFetchingPosts } = useQuery({
        queryKey: ["search-posts", query],
        queryFn: () => api.search.posts(query),
        enabled: query.length > 2 && activeTab === 'posts',
    });

    const { data: groupResults, isFetching: isFetchingGroups } = useQuery({
        queryKey: ["search-groups", query],
        queryFn: () => api.search.groups(query),
        enabled: query.length > 2 && activeTab === 'groups',
    });

    return (
        <div className="max-w-4xl mx-auto w-full pb-24 pt-8">
            <div className="mb-10 p-8 rounded-[2rem] glass-panel border border-white/5 shadow-2x-l">
                <h1 className="text-3xl font-black text-white tracking-tighter mb-6">Global Search</h1>
                <div className="relative group">
                    <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20 group-focus-within:text-white transition-colors" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for people, alumni, or topics..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-lg text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all font-medium"
                        autoFocus
                    />
                </div>
            </div>

            <div className="flex gap-4 mb-8 overflow-x-auto pb-2 hide-scrollbar">
                {[
                    { id: 'users', label: 'People', icon: User },
                    { id: 'posts', label: 'Feed Content', icon: MessageCircle },
                    { id: 'groups', label: 'Communities', icon: Users },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all border whitespace-nowrap
                            ${activeTab === tab.id 
                                ? 'bg-white text-black border-white' 
                                : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'}`}
                    >
                        <tab.icon size={16} />
                        {tab.label.toUpperCase()}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {isFetchingUsers && (
                    <div className="flex items-center justify-center p-20">
                        <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
                    </div>
                )}

                <AnimatePresence mode="popLayout">
                    {activeTab === 'users' && userResults?.map((u: any) => (
                        <motion.div
                            key={u.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <Link 
                                to={`/profile/${u.username}`}
                                className="glass-panel p-4 rounded-3xl border border-white/5 hover:border-white/20 transition-all flex items-center gap-4 group"
                            >
                                <img 
                                    src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.fullName}`}
                                    className="w-14 h-14 rounded-full object-cover border border-white/10"
                                    alt=""
                                />
                                <div className="flex-1">
                                    <h3 className="font-bold text-white group-hover:text-amber-200 transition-colors uppercase tracking-tight">{u.fullName}</h3>
                                    <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-0.5">@{u.username}</p>
                                </div>
                                <ChevronRight className="text-white/20 group-hover:text-white transition-colors" />
                            </Link>
                        </motion.div>
                    ))}

                    {activeTab === 'posts' && postResults?.map((p: any) => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <Link 
                                to="/" 
                                className="glass-panel p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all block group"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <img src={p.author.avatarUrl} className="w-8 h-8 rounded-full border border-white/10" alt="" />
                                    <span className="text-sm font-bold text-white/60">{p.author.fullName}</span>
                                </div>
                                <p className="text-white font-medium line-clamp-2">{p.content}</p>
                            </Link>
                        </motion.div>
                    ))}

                    {activeTab === 'groups' && groupResults?.map((g: any) => (
                        <motion.div
                            key={g.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <Link 
                                to={`/groups/${g.id}`}
                                className="glass-panel p-5 rounded-3xl border border-white/5 hover:border-white/20 transition-all flex items-center gap-5 group"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-white/5 overflow-hidden border border-white/10">
                                    <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${g.name}`} className="w-full h-full object-cover" alt="" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-white group-hover:text-violet-400 transition-colors">{g.name}</h3>
                                    <p className="text-xs text-white/40 mt-1 line-clamp-1">{g.description}</p>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xs font-black text-white px-3 py-1 bg-white/5 rounded-full uppercase tracking-tighter">Join</span>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {query.length > 2 && !isFetchingUsers && userResults?.length === 0 && (
                    <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                        <p className="text-white/30 font-bold uppercase tracking-[0.2em]">No results found for "{query}"</p>
                    </div>
                )}

                {query.length <= 2 && (
                    <div className="text-center py-20">
                        <p className="text-white/20 font-bold uppercase tracking-widest text-xs">Start typing to search the campus...</p>
                    </div>
                )}
            </div>
        </div>
    );
};
