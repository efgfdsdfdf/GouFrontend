import React from 'react';
import { Sparkles, Users, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';
import { FollowBackUrge } from '../feed/FollowBackUrge';

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

  return (
    <motion.aside
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed right-0 top-0 h-screen w-80 border-l border-white/5 bg-black/40 backdrop-blur-3xl p-6 overflow-y-auto hidden lg:block z-40"
    >
      <FollowBackUrge />
      
      {/* Suggestions */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="font-serif text-lg text-white font-medium">Suggested friends</h3>
        </div>

        <div className="space-y-4">
          {displaySuggestions.length === 0 ? (
            <p className="text-xs text-white/30">No suggestions right now.</p>
          ) : (
            displaySuggestions.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <img
                    src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.fullName}&background=random`}
                    alt={u.fullName}
                    className="w-10 h-10 rounded-full border border-white/10 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <Link
                      to={`/profile/${u.username}`}
                      className="text-sm font-medium text-white hover:underline truncate block"
                    >
                      {u.fullName}
                    </Link>
                    <p className="text-xs text-white/50 truncate">
                      {u.university}
                    </p>
                  </div>
                </div>
                <button className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors">
                  Follow
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recommended Groups */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <h3 className="font-serif text-lg text-white font-medium">Active groups</h3>
        </div>

        <div className="space-y-3">
          {trendingGroups.length === 0 ? (
            <p className="text-xs text-white/30">No active groups.</p>
          ) : (
            trendingGroups.map((group: any) => (
              <Link
                to={`/groups/${group.id}`}
                key={group.id}
                className="block glass-panel rounded-xl p-4 hover:bg-white/5 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                    {group.name}
                  </h4>
                  <Users className="w-3 h-3 text-white/40" />
                </div>
                <div className="flex items-center gap-3 text-xs text-white/50 font-medium">
                  <span>{group.memberCount} members</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="text-emerald-400">Join</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/10">
        <div className="flex flex-wrap gap-x-3 gap-y-2 text-xs text-white/30">
          <a href="#" className="hover:text-white transition-colors">About</a>
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <span>© 2026 GoUnion</span>
        </div>
      </div>
    </motion.aside>
  );
};
