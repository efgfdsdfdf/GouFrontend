import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Users,
  Image as ImageIcon,
  Send,
  Shield,
  Globe,
  Lock,
  Clock,
  Check,
  X,
  Sparkles,
  Info,
  User,
  MoreVertical,
  UserCheck,
  UserPlus as UserPlusIcon,
  UserX,
  Trash2,
  Edit2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../services/api";
import { PostCard } from "../components/feed/PostCard";
import { Skeleton } from "../components/ui/Skeleton";
import { authStorage } from "../utils/persistentStorage";

export const GroupDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<"feed" | "members" | "admin">(
    "feed",
  );

  const currentUserId = authStorage.getItem("user_id");

  const { data: group, isLoading: isGroupLoading } = useQuery({
    queryKey: ["group", id],
    queryFn: () => api.groups.getById(id!),
    enabled: !!id,
  });

  const { data: members, isLoading: isMembersLoading } = useQuery({
    queryKey: ["group-members", id],
    queryFn: () => api.groups.getMembers(id!),
    enabled: !!id,
  });

  const { data: requests, isLoading: isRequestsLoading } = useQuery({
    queryKey: ["group-requests", id],
    queryFn: () => api.groups.getRequests(id!),
    enabled: !!id && group?.creatorId === currentUserId,
  });

  const { data: posts, isLoading: isPostsLoading } = useQuery({
    queryKey: ["group-posts", id],
    queryFn: () => api.groups.getPosts(id!),
    enabled: !!id,
    refetchInterval: 5000, 
  });

  const isMember = members?.some((m: any) => m.user_id === currentUserId);
  const isAdmin = group?.creatorId === currentUserId;
  const isPending = requests?.some(
    (r: any) => r.user_id === currentUserId && r.status === "pending",
  );

  const createPostMutation = useMutation({
    mutationFn: (data: { caption: string; image: File | null }) =>
      api.groups.createPost(id!, data),
    onSuccess: () => {
      setCaption("");
      setImage(null);
      queryClient.invalidateQueries({ queryKey: ["group-posts", id] });
    },
  });

  const joinMutation = useMutation({
    mutationFn: () => api.groups.join(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", id] });
      queryClient.invalidateQueries({ queryKey: ["group-members", id] });
      queryClient.invalidateQueries({ queryKey: ["group-requests", id] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({
      requestId,
      status,
    }: {
      requestId: number;
      status: "accepted" | "rejected";
    }) => api.groups.approveRequest(requestId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-requests", id] });
      queryClient.invalidateQueries({ queryKey: ["group-members", id] });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: (file: File) => api.groups.updateGroup(id!, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", id] });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.groups.updateMemberRole(id!, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-members", id] });
    },
  });

  const kickMemberMutation = useMutation({
    mutationFn: (userId: string) => api.groups.kickMember(id!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-members", id] });
      queryClient.invalidateQueries({ queryKey: ["group", id] });
    },
  });

  if (isGroupLoading)
    return (
      <div className="py-20 text-center space-y-8">
        <Skeleton className="h-72 rounded-[3rem]" />
        <Skeleton className="h-20 rounded-2xl w-2/3 mx-auto" />
      </div>
    );

  if (!group)
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <h2 className="font-serif text-3xl text-white mb-6">Group not found</h2>
        <button
          onClick={() => navigate("/groups")}
          className="px-8 py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
        >
          Return to groups
        </button>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto w-full pb-20 selection:bg-primary/30">
      <button
        onClick={() => navigate("/groups")}
        className="flex items-center gap-3 text-zinc-500 hover:text-white transition-all mb-8 group"
      >
        <div className="p-2.5 rounded-xl bg-white/5 group-hover:bg-white group-hover:text-black transition-all border border-white/5 shadow-lg">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">All Groups</span>
      </button>

      <div className="relative rounded-[3rem] overflow-hidden mb-12 border border-white/5 shadow-2xl group min-h-[350px] flex items-end">
        <img
          src={group.imageUrl}
          alt={group.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        <div className="relative w-full p-10 md:p-14 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="px-4 py-1.5 bg-white/10 backdrop-blur-2xl border border-white/10 rounded-full flex items-center gap-2">
                {group.privacy === "public" ? <Globe size={13} className="text-primary" /> : <Lock size={13} className="text-accent" />}
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{group.privacy} Group</span>
              </div>
              {isAdmin && (
                <div className="px-4 py-1.5 bg-primary/20 backdrop-blur-2xl border border-primary/20 rounded-full flex items-center gap-2">
                  <Shield size={13} className="text-primary" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">Admin</span>
                </div>
              )}
            </div>
            <h1 className="font-serif text-5xl md:text-6xl font-bold text-white tracking-tight mb-4 leading-[1.1]">
              {group.name}
            </h1>
            <div className="flex items-center gap-4 text-zinc-400 font-bold uppercase tracking-widest text-[10px]">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-zinc-600" />
                <span>{members?.length || 0} Registered Members</span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0">
            {isMember ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab("admin")}
                  className={`p-5 rounded-2xl transition-all border ${activeTab === "admin" ? "bg-accent border-accent text-black" : "bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10"}`}
                >
                  <Shield size={22} />
                </button>
                <div className="px-10 py-5 bg-white/5 text-zinc-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-white/10">
                  Member
                </div>
              </div>
            ) : isPending ? (
              <div className="px-10 py-5 bg-white/5 text-accent rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 border border-accent/20">
                <Clock size={18} />
                Pending Verification
              </div>
            ) : (
              <button
                onClick={() => joinMutation.mutate()}
                className="px-12 py-5 bg-white text-black rounded-2xl font-bold text-[11px] uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all shadow-2xl active:scale-[0.98]"
              >
                Join Group
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-12 overflow-x-auto pb-4 scrollbar-none border-b border-white/5">
        {["feed", "members", "about"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap relative ${
              activeTab === tab
                ? "text-white"
                : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div
                layoutId="activeTabGroup"
                className="absolute inset-0 bg-white/5 rounded-2xl -z-10 border border-white/10"
              />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {activeTab === "feed" && (
              <motion.div
                key="feed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-10"
              >
                {isMember && (
                  <div className="glass-panel !p-6 !rounded-[2.5rem] border-white/10 shadow-xl">
                    <div className="flex flex-col gap-6">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex-shrink-0 flex items-center justify-center">
                          <User size={24} className="text-zinc-600" />
                        </div>
                        <textarea
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                          placeholder={`Write something to ${group.name}...`}
                          className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-zinc-800 resize-none pt-2 h-24 text-lg font-medium"
                        />
                      </div>
                      
                      {image && (
                        <div className="relative inline-block ml-16">
                          <img src={URL.createObjectURL(image)} className="max-h-48 rounded-2xl border border-white/10" />
                          <button onClick={() => setImage(null)} className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg">
                            <X size={14} />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-6 border-t border-white/5 ml-16">
                        <label className="flex items-center gap-3 text-zinc-600 hover:text-white transition-all cursor-pointer group">
                          <div className="p-2.5 rounded-xl bg-white/5 group-hover:bg-white group-hover:text-black transition-all">
                            <ImageIcon size={18} />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest">Add Photo</span>
                          <input type="file" className="hidden" onChange={(e) => setImage(e.target.files?.[0] || null)} />
                        </label>
                        <button
                          onClick={() => createPostMutation.mutate({ caption, image })}
                          disabled={!caption.trim() || createPostMutation.isPending}
                          className="bg-white text-black disabled:opacity-30 px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl active:scale-[0.98]"
                        >
                          <Send size={16} className="mb-0.5" />
                          {createPostMutation.isPending ? "Posting..." : "Post"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-8">
                  {isPostsLoading ? (
                    [1, 2].map((i) => <Skeleton key={i} className="h-64 rounded-[2.5rem]" />)
                  ) : posts?.length === 0 ? (
                    <div className="py-32 text-center bg-white/[0.02] rounded-[3rem] border border-dashed border-white/5">
                      <Sparkles size={32} className="mx-auto text-zinc-800 mb-4 opacity-30" />
                      <p className="text-zinc-600 font-bold uppercase tracking-widest text-[10px]">
                        No posts yet
                      </p>
                    </div>
                  ) : (
                    posts?.map((post: any) => <PostCard key={post.id} post={post} />)
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "members" && (
              <motion.div
                key="members"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-3xl text-white">Registry</h3>
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    {members?.length || 0} Total Members
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {members?.map((m: any) => (
                    <div key={m.id} className="glass-panel !p-4 border-white/5 flex items-center gap-4 rounded-2xl">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 border border-white/10">
                        <img 
                          src={m.user?.profile?.profile_picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user?.username}`} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold truncate leading-none mb-1">{m.user?.profile?.full_name || m.user?.username}</p>
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{m.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "admin" && isAdmin && (
              <motion.div
                key="admin"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-12"
              >
                {/* Image Management */}
                <section>
                  <h3 className="font-serif text-3xl text-white mb-6">Visual Identity</h3>
                  <div className="glass-panel p-8 rounded-[2.5rem] border-white/10 flex flex-col md:flex-row items-center gap-8">
                    <img src={group.imageUrl} className="w-48 h-32 object-cover rounded-2xl border border-white/10 shadow-xl" />
                    <div className="flex-1 text-center md:text-left">
                      <h4 className="text-white font-bold text-lg mb-2">Update Cover Photo</h4>
                      <p className="text-zinc-500 text-xs mb-6 font-medium">Resolution should be min 1200x400 for best quality.</p>
                      <label className="inline-block px-10 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-zinc-200 transition-all">
                        Select File
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) updateGroupMutation.mutate(file);
                          }} 
                        />
                      </label>
                    </div>
                  </div>
                </section>

                {/* Join Requests */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-serif text-3xl text-white">Pending Membership</h3>
                    <div className="px-4 py-1 bg-accent/20 rounded-full text-accent text-[10px] font-black uppercase tracking-widest border border-accent/20">
                      {requests?.length || 0} Requests
                    </div>
                  </div>
                  {requests?.length === 0 ? (
                    <div className="p-14 text-center glass-panel rounded-[2.5rem] border-dashed border-white/5 opacity-50">
                      <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">No requests pending</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {requests?.map((req: any) => (
                        <div key={req.id} className="glass-panel !p-6 border-white/10 flex items-center justify-between rounded-[2rem]">
                          <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0c]">
                              <img
                                src={req.user.profile?.profile_picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.user.username}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="text-white font-serif text-xl mb-1">{req.user.username}</p>
                              <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Verification request</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => approveMutation.mutate({ requestId: req.id, status: "accepted" })}
                              className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl hover:bg-emerald-500 hover:text-black transition-all border border-emerald-500/20"
                            >
                              <Check size={20} />
                            </button>
                            <button
                              onClick={() => approveMutation.mutate({ requestId: req.id, status: "rejected" })}
                              className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Member Management */}
                <section>
                  <h3 className="font-serif text-3xl text-white mb-6">Staff Control</h3>
                  <div className="space-y-4">
                    {members?.map((m: any) => (
                      <div key={m.id} className="glass-panel !p-4 border-white/10 flex items-center gap-4 rounded-2xl">
                        <img 
                          src={m.user?.profile?.profile_picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user?.username}`} 
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-white font-bold">{m.user?.profile?.full_name || m.user?.username}</p>
                          <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{m.role}</p>
                        </div>
                        {m.user_id !== currentUserId && (
                          <div className="flex items-center gap-2">
                            <select 
                              className="bg-black/40 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest p-2 text-white outline-none focus:border-primary transition-all"
                              value={m.role}
                              onChange={(e) => updateRoleMutation.mutate({ userId: m.user_id, role: e.target.value })}
                            >
                              <option value="member">Member</option>
                              <option value="moderator">Moderator</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button 
                              onClick={() => kickMemberMutation.mutate(m.user_id)}
                              className="p-3 bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/10"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === "about" && (
              <motion.div
                key="about"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-panel !p-10 !rounded-[2.5rem] border-white/10 space-y-10"
              >
                <div>
                  <h4 className="text-white font-serif text-3xl mb-4">Charter</h4>
                  <p className="text-zinc-400 text-lg leading-relaxed font-medium">
                    {group.description || "The mission of this collective is to provide a unified board for campus communication and specialized discussion."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-white/[0.03] rounded-3xl border border-white/5 space-y-2">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Established</p>
                    <p className="text-white font-bold">{new Date(group.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
                  </div>
                  <div className="p-6 bg-white/[0.03] rounded-3xl border border-white/5 space-y-2">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Status</p>
                    <p className="text-primary font-bold uppercase text-sm tracking-widest">Verified Group</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel !p-8 !rounded-[2.5rem] border-white/10">
            <h4 className="flex items-center gap-3 text-white font-serif text-xl mb-6">
              <Info size={18} className="text-primary" />
              Information
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Governance</span>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{group.privacy}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Encrypted</span>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest text-right">Enabled</span>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-white/5">
              <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em] mb-4">Moderators</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xs">A</div>
                <div className="flex-1">
                  <p className="text-white text-xs font-bold leading-none">System Moderator</p>
                  <p className="text-zinc-600 text-[9px] uppercase font-black mt-1">Verified Admin</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div> 
  );
};
