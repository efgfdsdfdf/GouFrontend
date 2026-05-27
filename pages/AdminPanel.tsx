import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../store';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Users,
  Flag,
  ShieldCheck,
  UserX,
  UserCheck,
  CheckCircle,
  XCircle,
  Database,
  LayoutGrid,
  Activity
} from 'lucide-react';

export const AdminPanel = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'reports'>('stats');
  const queryClient = useQueryClient();

  const loginEmail = localStorage.getItem('login_email') || '';
  const isAdminUser = user?.role === 'admin' || user?.role === 'moderator' || user?.email === 'ezeilodavid292@gmail.com' || loginEmail === 'ezeilodavid292@gmail.com';
  if (!user || !isAdminUser) {
    return <Navigate to="/" replace />;
  }

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: api.admin.getStats,
    enabled: activeTab === 'stats',
  });

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      try {
        return await api.admin.getUsers();
      } catch (err) {
        console.warn("api.admin.getUsers failed, falling back to suggestions", err);
        return await api.profiles.getSuggestions();
      }
    },
    enabled: activeTab === 'users',
  });

  const { data: reports, isLoading: loadingReports } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: api.reports.getAll,
    enabled: activeTab === 'reports',
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.admin.updateRole(userId, role),
    onMutate: async ({ userId, role }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-users'] });
      const previousUsers = queryClient.getQueryData(['admin-users']);
      queryClient.setQueryData(['admin-users'], (old: any) => {
        if (!old) return old;
        return old.map((u: any) => u.id === userId ? { ...u, role } : u);
      });
      return { previousUsers };
    },
    onError: (err, variables, context) => queryClient.setQueryData(['admin-users'], context?.previousUsers),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (userId: string) => api.admin.toggleActive(userId),
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: ['admin-users'] });
      const previousUsers = queryClient.getQueryData(['admin-users']);
      queryClient.setQueryData(['admin-users'], (old: any) => {
        if (!old) return old;
        return old.map((u: any) => u.id === userId ? { ...u, isActive: !u.isActive } : u);
      });
      return { previousUsers };
    },
    onError: (err, variables, context) => queryClient.setQueryData(['admin-users'], context?.previousUsers),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const resolveReportMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.reports.resolve(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-reports'] });
      const previousReports = queryClient.getQueryData(['admin-reports']);
      queryClient.setQueryData(['admin-reports'], (old: any) => {
        if (!old) return old;
        return old.map((r: any) => r.id === id ? { ...r, status } : r);
      });
      return { previousReports };
    },
    onError: (err, variables, context) => queryClient.setQueryData(['admin-reports'], context?.previousReports),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin-reports'] }),
  });

  return (
    <div className="w-full pb-20">
      <div className="mb-8 relative p-8 rounded-[2rem] bg-[#0a0a0c] overflow-hidden border border-white/5 shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-emerald-500" />
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            <ShieldCheck size={28} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter">Admin & Moderation</h1>
            <p className="text-zinc-400 font-medium mt-1">Manage users, content, and view analytics.</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        {(['stats', 'users', 'reports'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 px-6 rounded-2xl font-bold text-sm tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === tab
                ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab === 'stats' && <BarChart3 size={18} />}
            {tab === 'users' && <Users size={18} />}
            {tab === 'reports' && <Flag size={18} />}
            <span className="hidden sm:inline">{tab}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Users', value: stats?.total_users, icon: Users, color: 'text-primary' },
                { label: 'Total Posts', value: stats?.total_posts, icon: LayoutGrid, color: 'text-accent' },
                { label: 'Total Groups', value: stats?.total_groups, icon: Database, color: 'text-blue-400' },
                { label: 'Pending Reports', value: stats?.pending_reports, icon: Flag, color: 'text-red-400' },
              ].map((stat, i) => (
                <div key={i} className="glass outline-none p-6 rounded-[2rem] flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                    <stat.icon className={stat.color} size={24} />
                  </div>
                  <div>
                    <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</h3>
                    <p className="text-2xl font-black text-white">{loadingStats ? '...' : stat.value || 0}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {stats?.top_universities && stats.top_universities.length > 0 && (
              <div className="glass-panel p-8 rounded-[2rem] mt-6">
                <h3 className="text-lg font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                  <Activity className="text-primary" size={20} /> Top Activity Centers
                </h3>
                <div className="space-y-4">
                  {stats.top_universities.map((uni: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <span className="font-bold text-white text-sm">{uni.name}</span>
                      <span className="text-xs font-black bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
                        {uni.count} members
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="glass-panel rounded-[2rem] overflow-hidden border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-black/40 backdrop-blur-xl">
                  <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-zinc-500">
                    <th className="p-6 font-black">User</th>
                    <th className="p-6 font-black">Role</th>
                    <th className="p-6 font-black">Status</th>
                    <th className="p-6 font-black text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    <tr><td colSpan={4} className="p-6 text-center text-zinc-500 text-sm font-bold uppercase tracking-widest">Loading Users...</td></tr>
                  ) : users?.map((u: any) => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 flex items-center gap-4">
                        <img src={u.avatarUrl} alt={u.username} className="w-10 h-10 rounded-xl object-cover bg-white/5 border border-white/10" />
                        <div>
                          <p className="font-bold text-white text-sm group-hover:underline">{u.fullName}</p>
                          <p className="text-xs text-zinc-500 font-medium">@{u.username}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <select 
                          className="bg-black/50 border border-white/10 text-xs font-bold text-white rounded-xl px-3 py-2 outline-none focus:border-primary disabled:opacity-50"
                          value={u.role || 'user'}
                          disabled={user.role !== 'admin' || u.id === user.id}
                          onChange={(e) => roleMutation.mutate({ userId: u.id, role: e.target.value })}
                        >
                          <option value="user">User</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${u.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                          {u.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => toggleActiveMutation.mutate(u.id)}
                          disabled={u.id === user.id}
                          className="p-2 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50 inline-flex border border-transparent shadow-sm hover:border-white/10"
                          title={u.isActive ? 'Suspend User' : 'Restore User'}
                        >
                          {u.isActive ? <UserX size={18} className="text-red-400" /> : <UserCheck size={18} className="text-emerald-400" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="glass-panel rounded-[2rem] p-6 space-y-4 border border-white/10">
            {loadingReports ? (
              <p className="text-center text-zinc-500 text-sm font-bold uppercase tracking-widest py-10">Loading Reports...</p>
            ) : reports?.length === 0 ? (
              <p className="text-center text-zinc-500 py-10 font-bold uppercase tracking-widest text-sm">No pending reports.</p>
            ) : reports?.map((r: any) => (
              <div key={r.id} className="p-5 border border-white/10 bg-black/40 rounded-2xl flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${r.status === 'pending' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : r.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                      {r.status}
                    </span>
                    <span className="text-xs text-zinc-500 font-bold">Reported By @{r.user?.username}</span>
                  </div>
                  <p className="text-sm text-white font-medium mb-2 leading-relaxed"><span className="text-zinc-500 mr-2 font-bold uppercase tracking-widest text-[10px]">Reason:</span> {r.reason}</p>
                  <div className="text-xs text-zinc-400 border-l-[3px] border-accent/50 pl-4 py-3 bg-white/5 rounded-r-lg mt-3">
                    <span className="text-[10px] font-black uppercase text-accent mb-2 block">Context Flagged:</span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Target Content ID: {r.post?.id || r.postId || r.post_id || 'Unknown'}</span> <br/>
                    <span className="text-zinc-300 block mt-1">
                      {r.post ? `"${r.post.content?.substring(0, 100)}..."` : "(Context missing or post already deleted)"}
                    </span>
                  </div>
                </div>
                
                {r.status === 'pending' && (
                  <div className="flex gap-3 self-end md:self-auto shrink-0 mt-4 md:mt-0">
                    <button 
                      onClick={() => resolveReportMutation.mutate({ id: r.id, status: 'dismissed' })}
                      className="px-4 py-2 border border-white/10 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2"
                    >
                      <XCircle size={16} /> Dismiss
                    </button>
                    <button 
                      onClick={() => resolveReportMutation.mutate({ id: r.id, status: 'resolved' })}
                      className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2"
                    >
                      <CheckCircle size={16} /> Resolve
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};
