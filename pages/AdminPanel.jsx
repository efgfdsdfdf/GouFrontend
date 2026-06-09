import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../store';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Users, Flag, ShieldCheck, UserX, UserCheck, CheckCircle, XCircle, Database, LayoutGrid, Activity } from 'lucide-react';
export const AdminPanel = () => {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('stats');
    const queryClient = useQueryClient();
    const loginEmail = localStorage.getItem('login_email') || '';
    const isAdminUser = user?.role === 'admin' || user?.role === 'moderator' || user?.email === 'ezeilodavid292@gmail.com' || loginEmail === 'ezeilodavid292@gmail.com';
    const canManageRoles = isAdminUser;
    if (!user || !isAdminUser) {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    const { data: stats, isLoading: loadingStats } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: api.admin.getStats,
        enabled: activeTab === 'stats',
    });
    const { data: users = [], isLoading: loadingUsers, isError: usersError } = useQuery({
        queryKey: ['admin-users'],
        queryFn: async () => {
            try {
                return await api.admin.getUsers();
            }
            catch (err) {
                console.warn("api.admin.getUsers failed, falling back to suggestions", err);
                return await api.profiles.getSuggestions();
            }
        },
        enabled: activeTab === 'users',
    });
    const { data: reports = [], isLoading: loadingReports, isError: reportsError } = useQuery({
        queryKey: ['admin-reports'],
        queryFn: api.reports.getAll,
        enabled: activeTab === 'reports',
    });
    const roleMutation = useMutation({
        mutationFn: ({ userId, role }) => api.admin.updateRole(userId, role),
        onMutate: async ({ userId, role }) => {
            await queryClient.cancelQueries({ queryKey: ['admin-users'] });
            const previousUsers = queryClient.getQueryData(['admin-users']);
            queryClient.setQueryData(['admin-users'], (old) => {
                if (!old)
                    return old;
                return old.map((u) => u.id === userId ? { ...u, role } : u);
            });
            return { previousUsers };
        },
        onError: (err, variables, context) => queryClient.setQueryData(['admin-users'], context?.previousUsers),
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
    });
    const toggleActiveMutation = useMutation({
        mutationFn: (userId) => api.admin.toggleActive(userId),
        onMutate: async (userId) => {
            await queryClient.cancelQueries({ queryKey: ['admin-users'] });
            const previousUsers = queryClient.getQueryData(['admin-users']);
            queryClient.setQueryData(['admin-users'], (old) => {
                if (!old)
                    return old;
                return old.map((u) => u.id === userId ? { ...u, isActive: !u.isActive } : u);
            });
            return { previousUsers };
        },
        onError: (err, variables, context) => queryClient.setQueryData(['admin-users'], context?.previousUsers),
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
    });
    const resolveReportMutation = useMutation({
        mutationFn: ({ id, status }) => api.reports.resolve(id, status),
        onMutate: async ({ id, status }) => {
            await queryClient.cancelQueries({ queryKey: ['admin-reports'] });
            const previousReports = queryClient.getQueryData(['admin-reports']);
            queryClient.setQueryData(['admin-reports'], (old) => {
                if (!old)
                    return old;
                return old.map((r) => r.id === id ? { ...r, status } : r);
            });
            return { previousReports };
        },
        onError: (err, variables, context) => queryClient.setQueryData(['admin-reports'], context?.previousReports),
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin-reports'] }),
    });
    const AdminLoading = ({ label }) => (_jsxs("div", { className: "flex flex-col items-center justify-center gap-4 py-16 text-zinc-500", children: [_jsx("div", { className: "flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 font-serif text-3xl font-black text-white/25 animate-pulse", children: "G" }), _jsx("p", { className: "text-xs font-black uppercase tracking-widest", children: label })] }));
    return (_jsxs("div", { className: "w-full pb-20", children: [_jsxs("div", { className: "mb-8 relative p-8 rounded-[2rem] bg-[#0a0a0c] overflow-hidden border border-white/5 shadow-2xl", children: [_jsx("div", { className: "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-emerald-500" }), _jsx("div", { className: "absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" }), _jsxs("div", { className: "flex items-center gap-4 relative z-10", children: [_jsx("div", { className: "w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]", children: _jsx(ShieldCheck, { size: 28, className: "text-primary" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl md:text-3xl font-black text-white tracking-tighter", children: "Admin & Moderation" }), _jsx("p", { className: "text-zinc-400 font-medium mt-1", children: "Manage users, content, and view analytics." })] })] })] }), _jsx("div", { className: "flex gap-4 mb-8", children: ['stats', 'users', 'reports'].map((tab) => (_jsxs("button", { onClick: () => setActiveTab(tab), className: `flex-1 py-4 px-6 rounded-2xl font-bold text-sm tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === tab
                        ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                        : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'}`, children: [tab === 'stats' && _jsx(BarChart3, { size: 18 }), tab === 'users' && _jsx(Users, { size: 18 }), tab === 'reports' && _jsx(Flag, { size: 18 }), _jsx("span", { className: "hidden sm:inline", children: tab })] }, tab))) }), _jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 }, children: [activeTab === 'stats' && (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [
                                    { label: 'Total Users', value: stats?.total_users, icon: Users, color: 'text-primary' },
                                    { label: 'Total Posts', value: stats?.total_posts, icon: LayoutGrid, color: 'text-accent' },
                                    { label: 'Total Groups', value: stats?.total_groups, icon: Database, color: 'text-blue-400' },
                                    { label: 'Pending Reports', value: stats?.pending_reports, icon: Flag, color: 'text-red-400' },
                                ].map((stat, i) => (_jsxs("div", { className: "glass outline-none p-6 rounded-[2rem] flex items-center gap-4", children: [_jsx("div", { className: "w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5", children: _jsx(stat.icon, { className: stat.color, size: 24 }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1", children: stat.label }), _jsx("p", { className: "text-2xl font-black text-white", children: loadingStats ? '...' : stat.value || 0 })] })] }, i))) }), stats?.top_universities && stats.top_universities.length > 0 && (_jsxs("div", { className: "glass-panel p-8 rounded-[2rem] mt-6", children: [_jsxs("h3", { className: "text-lg font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2", children: [_jsx(Activity, { className: "text-primary", size: 20 }), " Top Activity Centers"] }), _jsx("div", { className: "space-y-4", children: stats.top_universities.map((uni, idx) => (_jsxs("div", { className: "flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5", children: [_jsx("span", { className: "font-bold text-white text-sm", children: uni.name }), _jsxs("span", { className: "text-xs font-black bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20", children: [uni.count, " members"] })] }, idx))) })] }))] })), activeTab === 'users' && (_jsx("div", { className: "glass-panel rounded-[2rem] overflow-hidden border border-white/10", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left border-collapse", children: [_jsx("thead", { className: "bg-black/40 backdrop-blur-xl", children: _jsxs("tr", { className: "border-b border-white/10 text-[10px] uppercase tracking-widest text-zinc-500", children: [_jsx("th", { className: "p-6 font-black", children: "User" }), _jsx("th", { className: "p-6 font-black", children: "Role" }), _jsx("th", { className: "p-6 font-black", children: "Status" }), _jsx("th", { className: "p-6 font-black text-right", children: "Actions" })] }) }), _jsx("tbody", { children: loadingUsers ? (_jsx("tr", { children: _jsx("td", { colSpan: 4, children: _jsx(AdminLoading, { label: "Loading users" }) }) })) : usersError ? (_jsx("tr", { children: _jsx("td", { colSpan: 4, className: "p-10 text-center text-red-400 text-sm font-bold uppercase tracking-widest", children: "Unable to load users." }) })) : users.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 4, className: "p-10 text-center text-zinc-500 text-sm font-bold uppercase tracking-widest", children: "No users found." }) })) : users.map((u) => (_jsxs("tr", { className: "border-b border-white/5 hover:bg-white/[0.02] transition-colors", children: [_jsxs("td", { className: "p-4 flex items-center gap-4", children: [_jsx("img", { src: u.avatarUrl, alt: u.username, className: "w-10 h-10 rounded-xl object-cover bg-white/5 border border-white/10" }), _jsxs("div", { children: [_jsx("p", { className: "font-bold text-white text-sm group-hover:underline", children: u.fullName }), _jsxs("p", { className: "text-xs text-zinc-500 font-medium", children: ["@", u.username] })] })] }), _jsx("td", { className: "p-4", children: _jsxs("select", { className: "bg-black/50 border border-white/10 text-xs font-bold text-white rounded-xl px-3 py-2 outline-none focus:border-primary disabled:opacity-50", value: u.role || 'user', disabled: !canManageRoles || u.id === user.id, onChange: (e) => roleMutation.mutate({ userId: u.id, role: e.target.value }), children: [_jsx("option", { value: "user", children: "User" }), _jsx("option", { value: "moderator", children: "Moderator" }), _jsx("option", { value: "admin", children: "Admin" })] }) }), _jsx("td", { className: "p-4", children: _jsx("span", { className: `text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${u.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`, children: u.isActive ? 'Active' : 'Suspended' }) }), _jsx("td", { className: "p-4 text-right", children: _jsx("button", { onClick: () => toggleActiveMutation.mutate(u.id), disabled: u.id === user.id, className: "p-2 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50 inline-flex border border-transparent shadow-sm hover:border-white/10", title: u.isActive ? 'Suspend User' : 'Restore User', children: u.isActive ? _jsx(UserX, { size: 18, className: "text-red-400" }) : _jsx(UserCheck, { size: 18, className: "text-emerald-400" }) }) })] }, u.id))) })] }) }) })), activeTab === 'reports' && (_jsx("div", { className: "glass-panel rounded-[2rem] p-6 space-y-4 border border-white/10", children: loadingReports ? (_jsx(AdminLoading, { label: "Loading reports" })) : reportsError ? (_jsx("p", { className: "text-center text-red-400 py-10 font-bold uppercase tracking-widest text-sm", children: "Unable to load reports." })) : reports.length === 0 ? (_jsx("p", { className: "text-center text-zinc-500 py-10 font-bold uppercase tracking-widest text-sm", children: "No pending reports." })) : reports.map((r) => (_jsxs("div", { className: "p-5 border border-white/10 bg-black/40 rounded-2xl flex flex-col md:flex-row gap-6 justify-between items-start md:items-center", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("span", { className: `text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${r.status === 'pending' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : r.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`, children: r.status }), _jsxs("span", { className: "text-xs text-zinc-500 font-bold", children: ["Reported By @", r.user?.username] })] }), _jsxs("p", { className: "text-sm text-white font-medium mb-2 leading-relaxed", children: [_jsx("span", { className: "text-zinc-500 mr-2 font-bold uppercase tracking-widest text-[10px]", children: "Reason:" }), " ", r.reason] }), _jsxs("div", { className: "text-xs text-zinc-400 border-l-[3px] border-accent/50 pl-4 py-3 bg-white/5 rounded-r-lg mt-3", children: [_jsx("span", { className: "text-[10px] font-black uppercase text-accent mb-2 block", children: "Context Flagged:" }), _jsxs("span", { className: "text-[10px] text-zinc-500 uppercase tracking-widest", children: ["Target Content ID: ", r.post?.id || r.postId || r.post_id || 'Unknown'] }), " ", _jsx("br", {}), _jsx("span", { className: "text-zinc-300 block mt-1", children: r.post ? `"${r.post.content?.substring(0, 100)}..."` : "(Context missing or post already deleted)" })] })] }), r.status === 'pending' && (_jsxs("div", { className: "flex gap-3 self-end md:self-auto shrink-0 mt-4 md:mt-0", children: [_jsxs("button", { onClick: () => resolveReportMutation.mutate({ id: r.id, status: 'dismissed' }), className: "px-4 py-2 border border-white/10 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2", children: [_jsx(XCircle, { size: 16 }), " Dismiss"] }), _jsxs("button", { onClick: () => resolveReportMutation.mutate({ id: r.id, status: 'resolved' }), className: "px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2", children: [_jsx(CheckCircle, { size: 16 }), " Resolve"] })] }))] }, r.id))) }))] }, activeTab)] }));
};
