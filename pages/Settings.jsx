import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState } from 'react';
import { useAuthStore } from '../store';
import { Shield, Bell, Lock, User, LogOut, ChevronLeft, Save, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
export const Settings = () => {
    const { user, logout, updateUser } = useAuthStore();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState(null);
    // Account Form State
    const [fullName, setFullName] = useState(user?.fullName || "");
    const [bio, setBio] = useState(user?.bio || "");
    const [university, setUniversity] = useState(user?.university || "");
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || "");
    const [saveSuccess, setSaveSuccess] = useState(false);
    const updateProfileMutation = useMutation({
        mutationFn: (data) => api.profiles.update(data),
        onSuccess: (updatedUser) => {
            updateUser(updatedUser);
            setAvatarFile(null);
            setAvatarPreview(updatedUser.avatarUrl || "");
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
            queryClient.invalidateQueries({ queryKey: ["profile", user?.username] });
        }
    });
    const handleSaveProfile = (e) => {
        e.preventDefault();
        updateProfileMutation.mutate({ fullName, bio, university, avatar: avatarFile });
    };
    const tabs = [
        { id: 'account', icon: User, label: "Account Profile", desc: "Manage your public presence" },
        { id: 'privacy', icon: Lock, label: "Privacy & Security", desc: "Control who sees your data" },
        { id: 'notifications', icon: Bell, label: "Push Notifications", desc: "Customize alert preferences" },
        { id: 'data', icon: Shield, label: "Data & Permissions", desc: "Manage integrations" },
    ];
    const renderActiveTab = () => {
        switch (activeTab) {
            case 'account':
                return (_jsxs(motion.div, { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-4 mb-8", children: [_jsx("button", { onClick: () => setActiveTab(null), className: "p-2 hover:bg-white/5 rounded-full text-zinc-400", children: _jsx(ChevronLeft, { size: 24 }) }), _jsx("h2", { className: "text-2xl font-black text-white", children: "Account Profile" })] }), _jsxs("form", { onSubmit: handleSaveProfile, className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-6 p-6 glass-panel rounded-3xl border border-white/5", children: [_jsxs("label", { className: "relative group cursor-pointer", children: [_jsx("img", { src: avatarPreview || user?.avatarUrl, alt: "Profile", className: "w-20 h-20 rounded-2xl object-cover border border-white/10" }), _jsx("div", { className: "absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer", children: _jsx(Camera, { size: 20, className: "text-white" }) }), _jsx("input", { type: "file", className: "hidden", accept: "image/*", onChange: (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file)
                                                            return;
                                                        setAvatarFile(file);
                                                        if (avatarPreview?.startsWith("blob:"))
                                                            URL.revokeObjectURL(avatarPreview);
                                                        setAvatarPreview(URL.createObjectURL(file));
                                                    } })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-bold text-white", children: "Profile Photo" }), _jsx("p", { className: "text-xs text-white/40 mt-1", children: "Recommended size: 400x400px" })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1", children: "Full Name" }), _jsx("input", { type: "text", value: fullName, onChange: (e) => setFullName(e.target.value), className: "w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-primary/30 transition-all font-medium" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1", children: "Bio" }), _jsx("textarea", { value: bio, onChange: (e) => setBio(e.target.value), rows: 3, className: "w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-primary/30 transition-all font-medium resize-none" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1", children: "University" }), _jsx("input", { type: "text", value: university, onChange: (e) => setUniversity(e.target.value), className: "w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-primary/30 transition-all font-medium" })] })] }), _jsx("button", { type: "submit", disabled: updateProfileMutation.isPending, className: "w-full h-14 bg-white text-black rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50", children: updateProfileMutation.isPending ? (_jsx("div", { className: "w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" })) : saveSuccess ? (_jsx("span", { className: "text-emerald-600", children: "Profile Updated!" })) : (_jsxs(_Fragment, { children: [_jsx(Save, { size: 18 }), _jsx("span", { children: "Save Changes" })] })) })] })] }));
            case 'privacy':
            case 'notifications':
                return (_jsxs(motion.div, { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-4 mb-8", children: [_jsx("button", { onClick: () => setActiveTab(null), className: "p-2 hover:bg-white/5 rounded-full text-zinc-400", children: _jsx(ChevronLeft, { size: 24 }) }), _jsx("h2", { className: "text-2xl font-black text-white", children: activeTab === 'privacy' ? 'Privacy & Security' : 'Push Notifications' })] }), _jsx("div", { className: "space-y-4", children: [1, 2, 3].map((item) => (_jsxs("div", { className: "p-6 glass-panel rounded-3xl border border-white/5 flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h3", { className: "font-bold text-white", children: ["Option ", item] }), _jsx("p", { className: "text-xs text-white/40 mt-1", children: "Configure your preference for this feature." })] }), _jsx("div", { className: "w-12 h-6 bg-white/10 rounded-full relative cursor-pointer group", children: _jsx("div", { className: "absolute left-1 top-1 w-4 h-4 bg-white/40 rounded-full group-hover:bg-white transition-all" }) })] }, item))) })] }));
            default:
                return (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsx("h2", { className: "text-sm font-bold text-white/50 uppercase tracking-widest pl-2", children: "Preferences" }), tabs.map((tab) => (_jsxs(motion.button, { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, onClick: () => setActiveTab(tab.id), className: "w-full text-left p-6 glass-panel rounded-3xl border border-white/5 hover:border-white/20 transition-all flex items-center gap-4 group", children: [_jsx("div", { className: "w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-colors", children: _jsx(tab.icon, { className: "text-white sm:text-white/70 group-hover:text-white", size: 24 }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-bold text-white text-lg", children: tab.label }), _jsx("p", { className: "text-xs font-medium text-white/40 mt-1", children: tab.desc })] })] }, tab.id)))] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h2", { className: "text-sm font-bold text-white/50 uppercase tracking-widest pl-2", children: "Danger Zone" }), _jsxs("div", { className: "glass-panel rounded-3xl p-6 border border-red-500/10", children: [_jsx("h3", { className: "font-bold text-white text-lg mb-2", children: "Sign Out" }), _jsx("p", { className: "text-xs font-medium text-white/40 mb-6", children: "Terminate your active session on this device." }), _jsxs("button", { onClick: logout, className: "w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-2xl flex items-center justify-center gap-2 border border-red-500/20 transition-all", children: [_jsx(LogOut, { size: 18 }), " Process Logout"] })] })] })] }));
        }
    };
    return (_jsxs("div", { className: "max-w-4xl mx-auto w-full pb-24 pt-8", children: [_jsxs("div", { className: "mb-10 relative p-8 rounded-[2rem] glass-panel overflow-hidden border border-white/5 shadow-2xl", children: [_jsx("h1", { className: "text-3xl font-black text-white tracking-tighter", children: "Settings" }), _jsx("p", { className: "text-zinc-400 font-medium mt-1", children: "Manage your platform preferences and security." })] }), _jsx(AnimatePresence, { mode: "wait", children: renderActiveTab() })] }));
};
