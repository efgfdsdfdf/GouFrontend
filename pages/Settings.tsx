import React, { useState } from 'react';
import { useAuthStore } from '../store';
import { Shield, Bell, Lock, User, LogOut, ChevronLeft, Save, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const Settings = () => {
  const { user, logout, login } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  
  // Account Form State
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [university, setUniversity] = useState(user?.university || "");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => api.profiles.update(data),
    onSuccess: (updatedUser) => {
      // Re-initialize local user state
      const token = localStorage.getItem('access_token');
      if (token) login(updatedUser, token);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      queryClient.invalidateQueries({ queryKey: ["profile", user?.username] });
    }
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ fullName, bio, university });
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
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setActiveTab(null)} className="p-2 hover:bg-white/5 rounded-full text-zinc-400">
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-2xl font-black text-white">Account Profile</h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="flex items-center gap-6 p-6 glass-panel rounded-3xl border border-white/5">
                <div className="relative group">
                  <img 
                    src={user?.avatarUrl} 
                    alt="Profile" 
                    className="w-20 h-20 rounded-2xl object-cover border border-white/10"
                  />
                  <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Camera size={20} className="text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-white">Profile Photo</h3>
                  <p className="text-xs text-white/40 mt-1">Recommended size: 400x400px</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Full Name</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-primary/30 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Bio</label>
                  <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-primary/30 transition-all font-medium resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">University</label>
                  <input 
                    type="text" 
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-primary/30 transition-all font-medium"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="w-full h-14 bg-white text-black rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {updateProfileMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : saveSuccess ? (
                  <span className="text-emerald-600">Profile Updated!</span>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        );
      case 'privacy':
      case 'notifications':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setActiveTab(null)} className="p-2 hover:bg-white/5 rounded-full text-zinc-400">
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-2xl font-black text-white">
                {activeTab === 'privacy' ? 'Privacy & Security' : 'Push Notifications'}
              </h2>
            </div>
            
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="p-6 glass-panel rounded-3xl border border-white/5 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white">Option {item}</h3>
                    <p className="text-xs text-white/40 mt-1">Configure your preference for this feature.</p>
                  </div>
                  <div className="w-12 h-6 bg-white/10 rounded-full relative cursor-pointer group">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white/40 rounded-full group-hover:bg-white transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest pl-2">Preferences</h2>
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id)}
                  className="w-full text-left p-6 glass-panel rounded-3xl border border-white/5 hover:border-white/20 transition-all flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-colors">
                    <tab.icon className="text-white sm:text-white/70 group-hover:text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{tab.label}</h3>
                    <p className="text-xs font-medium text-white/40 mt-1">{tab.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest pl-2">Danger Zone</h2>
              <div className="glass-panel rounded-3xl p-6 border border-red-500/10">
                <h3 className="font-bold text-white text-lg mb-2">Sign Out</h3>
                <p className="text-xs font-medium text-white/40 mb-6">Terminate your active session on this device.</p>
                <button
                  onClick={logout}
                  className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-2xl flex items-center justify-center gap-2 border border-red-500/20 transition-all"
                >
                  <LogOut size={18} /> Process Logout
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full pb-24 pt-8">
      <div className="mb-10 relative p-8 rounded-[2rem] glass-panel overflow-hidden border border-white/5 shadow-2xl">
        <h1 className="text-3xl font-black text-white tracking-tighter">Settings</h1>
        <p className="text-zinc-400 font-medium mt-1">Manage your platform preferences and security.</p>
      </div>

      <AnimatePresence mode="wait">
        {renderActiveTab()}
      </AnimatePresence>
    </div>
  );
};
