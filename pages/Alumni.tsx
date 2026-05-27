import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, MessageSquare, Check, MapPin, GraduationCap } from "lucide-react";
import { api } from "../services/api";
import { Skeleton } from "../components/ui/Skeleton";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

export const Alumni = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", query],
    queryFn: () => api.search.users(query),
    enabled: true, 
  });

  const chatMutation = useMutation({
    mutationFn: (userId: string) => api.chats.createConversation([userId]),
    onSuccess: () => {
      navigate('/messages');
    },
  });

  const followMutation = useMutation({
    mutationFn: (userId: string) => api.profiles.follow(userId),
    onSuccess: (_data, userId) => {
      queryClient.setQueryData(["users", query], (old: any[] = []) =>
        old.map((person) =>
          String(person.id) === String(userId)
            ? { ...person, isFollowing: true, followers: (person.followers || 0) + 1 }
            : person,
        ),
      );
    },
  });

  return (
    <div className="max-w-6xl mx-auto w-full pb-24 pt-8">
      <div className="mb-12 relative p-8 rounded-3xl glass-panel overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              <GraduationCap size={28} className="text-white" />
            </div>
            <div>
              <h1 className="font-serif text-3xl md:text-4xl text-white">Find students</h1>
              <p className="text-white/50 text-sm mt-1">Connect with alumni and students across all departments</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mb-12 group">
        <Search
          className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors"
          size={20}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, department, or year..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-16 pr-8 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all text-lg"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 rounded-3xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users?.map((user: any, index: number) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-panel group relative rounded-3xl p-6 border-white/5 hover:border-white/10 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="relative">
                  <img
                    src={user.profile?.profile_picture || `https://ui-avatars.com/api/?name=${user.username}`}
                    alt={user.username}
                    className="w-20 h-20 rounded-2xl object-cover border border-white/10 bg-white/5"
                  />
                </div>
                {user.is_active && (
                  <div className="px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Active</span>
                  </div>
                )}
              </div>

              <div className="space-y-1 mb-6">
                <Link to={`/profile/${user.username}`} className="font-serif text-2xl text-white hover:underline cursor-pointer">
                  {user.fullName || `@${user.username}`}
                </Link>
                <div className="flex items-center gap-2 text-white/50 text-sm">
                  <MapPin size={14} />
                  <span>{user.university || "Student"}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  to={`/profile/${user.username}`}
                  className="flex-1 py-3 bg-white/5 text-white border border-white/10 rounded-xl font-medium text-sm transition-all hover:bg-white/10 active:scale-95 text-center flex items-center justify-center"
                >
                  View Profile
                </Link>
                <button
                  onClick={() => {
                    if (user.isFollowing) chatMutation.mutate(user.id);
                    else followMutation.mutate(user.id);
                  }}
                  disabled={chatMutation.isPending || followMutation.isPending}
                  className="flex-1 py-3 bg-white text-black rounded-xl font-medium text-sm transition-all hover:bg-white/90 active:scale-95 flex items-center justify-center gap-2"
                >
                  <MessageSquare size={16} />
                  {user.isFollowing ? "Chat" : "Follow first"}
                </button>
              </div>
            </motion.div>
          ))}
          {users?.length === 0 && (
            <div className="col-span-full py-32 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
              <p className="text-white/40">No students found for this search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
