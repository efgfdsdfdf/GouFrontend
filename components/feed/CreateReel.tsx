import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Video, Send, Music, Sparkles } from "lucide-react";
import { useAuthStore } from "../../store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import { useToast } from "../ui/Toast";

interface CreateReelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateReel: React.FC<CreateReelProps> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const [caption, setCaption] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sound, setSound] = useState<File | null>(null);
  const [soundName, setSoundName] = useState<string>("");
  const [filter, setFilter] = useState<string>("none");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const soundInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (data: { caption: string; image?: File | null }) => api.posts.createReel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discover-reels"] });
      handleRemoveFile();
      setCaption("");
      onClose();
      toast("Reel shared successfully!", "success");
    },
    onError: (err: any) => {
      console.error("Error creating reel:", err);
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err.message || "Failed to create reel";
      toast(msg, "error");
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert("Video size must be less than 50MB");
        return;
      }
      if (!file.type.startsWith("video/")) {
        alert("Discover only accepts video reels.");
        return;
      }
      setVideo(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  const handleSoundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("audio/")) {
        alert("Please choose an audio file.");
        return;
      }
      setSound(file);
      setSoundName(file.name);
    }
  };

  const handleRemoveFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setVideo(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = () => {
    if (!video) return;
    const captionWithSound = soundName ? `${caption}\n🎵 Sound: ${soundName}` : caption;
    mutation.mutate({ caption: captionWithSound, image: video });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md max-h-[90dvh] flex flex-col bg-[#0a0a0c] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden"
          >
            <div className="p-6 flex items-center justify-between border-b border-white/5 shrink-0">
              <h3 className="text-xl font-black text-white tracking-tighter">Create Reel</h3>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-zinc-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto hide-scrollbar flex-1">
              {!preview ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-[9/16] w-full max-w-[240px] mx-auto bg-white/5 border-2 border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/10 hover:border-primary/50 transition-all group"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Video className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center px-4">
                    <p className="text-sm font-bold text-white">Select Video</p>
                    <p className="text-[10px] text-white/40 mt-1 uppercase tracking-widest font-black">Up to 60s • MP4/MOV</p>
                  </div>
                </div>
              ) : (
                <div className="relative aspect-[9/16] w-full max-w-[240px] mx-auto rounded-[2rem] overflow-hidden border border-white/10 bg-black shadow-2xl">
                  <video 
                    src={preview} 
                    className={`w-full h-full object-cover ${
                      filter === 'grayscale'
                        ? 'filter grayscale'
                        : filter === 'sepia'
                        ? 'filter sepia'
                        : filter === 'contrast'
                        ? 'filter contrast-125'
                        : ''
                    }`}
                    autoPlay
                    loop
                    playsInline
                  />
                  <button
                    onClick={handleRemoveFile}
                    className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-xl rounded-full text-white hover:bg-red-500 transition-all"
                  >
                    <X size={16} />
                  </button>
                  <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                    <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 5, repeat: Infinity }}
                        className="h-full bg-primary"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write a caption..."
                    className="w-full bg-transparent border-none focus:ring-0 text-white text-sm placeholder:text-white/20 resize-none h-20 font-medium"
                  />
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => soundInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-2xl text-[10px] font-black text-white/70 hover:bg-white/10 transition-all uppercase tracking-widest"
                    >
                      <Music size={14} />
                      {soundName ? "Change sound" : "Add sound"}
                    </button>
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                      {['none', 'grayscale', 'sepia', 'contrast'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setFilter(option)}
                          className={`flex-1 min-w-[90px] rounded-2xl border px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${filter === option ? 'bg-primary text-black border-primary' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'}`}
                        >
                          {option === 'none' ? 'Normal' : option.charAt(0).toUpperCase() + option.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  {soundName && (
                    <div className="mt-3 rounded-2xl bg-black/30 border border-white/10 p-3 text-xs text-white/70">
                      Added track: <span className="font-semibold text-white">{soundName}</span>
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="video/*"
                />
                <input
                  type="file"
                  ref={soundInputRef}
                  onChange={handleSoundChange}
                  className="hidden"
                  accept="audio/*"
                />

                <button
                  onClick={handleSubmit}
                  disabled={!video || mutation.isPending}
                  className="w-full h-14 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:brightness-90 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {mutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Share Reel</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
