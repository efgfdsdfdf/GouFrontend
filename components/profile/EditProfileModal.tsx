import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Save, User, FileText, School, Plus } from "lucide-react";
import { useAuthStore } from "../../store";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData: any;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || "",
    bio: initialData?.bio || "",
    university: initialData?.university || "",
    avatarUrl: initialData?.avatarUrl || "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    formData.avatarUrl,
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, avatar: avatarFile });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0a0a0c]/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-[#141417] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8 pb-4 flex items-center justify-between">
              <h3 className="text-xl font-black text-white tracking-tighter">
                Edit Profile
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full text-zinc-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-8 pt-4 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex flex-col items-center mb-8">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-2 border-primary/20 bg-white/5 relative">
                    <img
                      src={
                        avatarPreview ||
                        `https://ui-avatars.com/api/?name=${formData.fullName}&background=random`
                      }
                      className="w-full h-full object-cover"
                      alt="Avatar Preview"
                    />
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <Camera className="text-white" size={24} />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarChange}
                      />
                    </label>
                  </div>
                  <div className="absolute -bottom-2 -right-2 p-1.5 bg-primary text-black rounded-xl shadow-lg">
                    <Plus size={16} />
                  </div>
                </div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-4">
                  Change Profile Picture
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <User size={12} className="text-primary" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 px-6 text-white placeholder:text-zinc-700 focus:outline-none focus:border-primary/30 focus:bg-white/[0.05] transition-all font-bold text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <FileText size={12} className="text-primary" />
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us a bit about yourself"
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 px-6 text-white placeholder:text-zinc-700 focus:outline-none focus:border-primary/30 focus:bg-white/[0.05] transition-all font-bold text-sm h-32 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <School size={12} className="text-primary" />
                  University
                </label>
                <input
                  type="text"
                  name="university"
                  value={formData.university}
                  onChange={handleChange}
                  placeholder="Enter your university"
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 px-6 text-white placeholder:text-zinc-700 focus:outline-none focus:border-primary/30 focus:bg-white/[0.05] transition-all font-bold text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full h-14 bg-primary text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl shadow-primary/20 mt-4"
              >
                <Save size={18} />
                <span>Save Changes</span>
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
