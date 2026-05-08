import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Search,
  Users as UsersIcon,
  Plus,
  Globe,
  Lock,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../services/api";
import { Skeleton } from "../components/ui/Skeleton";

export const Groups = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    privacy: "public",
    image: null as File | null,
  });

  const { data: groups, isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: api.groups.getAll,
  });

  const createGroupMutation = useMutation({
    mutationFn: api.groups.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      setIsModalOpen(false);
      setNewGroup({
        name: "",
        description: "",
        privacy: "public",
        image: null,
      });
    },
  });

  const filteredGroups = groups?.filter(
    (g: any) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="max-w-6xl mx-auto w-full pb-24 pt-8">
      <div className="mb-12 relative p-8 rounded-3xl glass-panel overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              <UsersIcon size={28} className="text-white" />
            </div>
            <div>
              <h1 className="font-serif text-3xl md:text-4xl text-white">Groups</h1>
              <p className="text-white/50 text-sm mt-1">Discover and join campus communities</p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-medium transition-all hover:bg-white/90 active:scale-95"
          >
            <Plus size={18} />
            Create group
          </button>
        </div>
      </div>

      <div className="relative mb-12 group">
        <Search
          className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors"
          size={20}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search groups..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-16 pr-8 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all text-lg"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-96 rounded-3xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups?.map((group: any, index: number) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-panel group relative rounded-3xl overflow-hidden border-white/5 hover:border-white/10 transition-all duration-300 flex flex-col"
            >
              <Link to={`/groups/${group.id}`} className="block relative h-48">
                <img
                  src={group.imageUrl || `https://picsum.photos/seed/${group.id}/800/400`}
                  alt={group.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute top-4 left-4">
                  <div className="px-3 py-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2">
                    {group.privacy === "public" ? (
                      <Globe size={12} className="text-white/70" />
                    ) : (
                      <Lock size={12} className="text-white/70" />
                    )}
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                      {group.privacy}
                    </span>
                  </div>
                </div>
              </Link>

              <div className="p-6 flex-1 flex flex-col">
                <Link to={`/groups/${group.id}`} className="block mb-2">
                  <h3 className="font-serif text-2xl text-white group-hover:underline">
                    {group.name}
                  </h3>
                </Link>
                <div className="flex items-center gap-2 text-white/40 text-xs mb-4">
                  <UsersIcon size={14} />
                  <span>{group.memberCount?.toLocaleString() || 0} members</span>
                </div>
                <p className="text-white/50 text-sm line-clamp-2 mb-6 flex-1">
                  {group.description || "Campus group for university students."}
                </p>

                <Link
                  to={`/groups/${group.id}`}
                  className="w-full py-3 bg-white/5 border border-white/10 text-white rounded-xl text-sm font-medium text-center transition-all hover:bg-white hover:text-black"
                >
                  View group
                </Link>
              </div>
            </motion.div>
          ))}
          {filteredGroups?.length === 0 && (
            <div className="col-span-full py-32 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
              <p className="text-white/40">No groups found matching your search.</p>
            </div>
          )}
        </div>
      )}

      {/* Create Group Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative w-full max-w-xl glass-panel rounded-3xl overflow-hidden border-white/10"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-2xl text-white">Create a group</h2>
                  <p className="text-white/40 text-xs mt-1">Start a new campus community</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-white/40 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/50 uppercase tracking-wider ml-1">Group name</label>
                  <input
                    type="text"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    placeholder="e.g. Psychology Students Association"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/50 uppercase tracking-wider ml-1">Privacy</label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: "public", label: "Public", icon: Globe, desc: "Anyone can join" },
                      { id: "private", label: "Private", icon: Lock, desc: "Invite only" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setNewGroup({ ...newGroup, privacy: p.id })}
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                          newGroup.privacy === p.id
                            ? "bg-white/10 border-white/20 text-white"
                            : "bg-white/5 border-white/5 text-white/40 hover:bg-white/[0.07]"
                        }`}
                      >
                        <p.icon size={20} />
                        <div className="text-left">
                          <p className="text-sm font-medium">{p.label}</p>
                          <p className="text-[10px] opacity-60">{p.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/50 uppercase tracking-wider ml-1">Description</label>
                  <textarea
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                    placeholder="What is this group about?"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-white h-32 resize-none focus:outline-none focus:ring-1 focus:ring-white/20 transition-all text-sm leading-relaxed"
                  />
                </div>

                <div
                  onClick={() => {}}
                  className="flex items-center gap-4 w-full bg-white/5 border-2 border-dashed border-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/[0.07] transition-all"
                >
                  <div className="p-3 bg-white/5 rounded-lg text-white/40">
                    <ImageIcon size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Cover image</p>
                    <p className="text-xs text-white/40">
                      {newGroup.image ? newGroup.image.name : "Recommended: 1200x600px"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white/5 border-t border-white/5">
                <button
                  onClick={() => createGroupMutation.mutate(newGroup)}
                  disabled={!newGroup.name || createGroupMutation.isPending}
                  className="w-full py-4 bg-white text-black rounded-xl font-medium transition-all hover:bg-white/90 active:scale-95 disabled:opacity-50"
                >
                  {createGroupMutation.isPending ? "Creating..." : "Create group"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
