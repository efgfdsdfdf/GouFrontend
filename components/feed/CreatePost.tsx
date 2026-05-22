import React, { useState, useRef } from "react";
import { Image as ImageIcon, Send, Paperclip, X } from "lucide-react";
import { useAuthStore } from "../../store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";

type CreatePostProps = {
  profileUsername?: string;
};

export const CreatePost = ({ profileUsername }: CreatePostProps) => {
  const { user } = useAuthStore();
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: { caption: string; image?: File | null }) =>
      api.posts.createFeedPost(data),
    onSuccess: () => {
      const ownerUsername = profileUsername || user?.username;
      if (ownerUsername) {
        queryClient.invalidateQueries({ queryKey: ["profile-posts", ownerUsername] });
      }
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      handleRemoveFile();
      setContent("");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("video/")) {
        alert("Videos belong in Discover reels. Feed posts accept text and photos only.");
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedFile) return;
    mutation.mutate({ caption: content, image: selectedFile });
  };

  return (
    <div className="glass-panel rounded-2xl p-4 mb-6">
      <form onSubmit={handleSubmit} className="flex gap-4">
        <img
          src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.fullName}&background=random`}
          alt="Profile"
          className="w-10 h-10 rounded-full object-cover border border-white/10"
          referrerPolicy="no-referrer"
        />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share something from your profile..."
            className="w-full bg-transparent border-none text-white placeholder:text-white/40 focus:outline-none focus:ring-0 text-lg mt-1 resize-none h-12"
          />

          {previewUrl && (
            <div className="relative mt-4 rounded-xl overflow-hidden border border-white/10 group">
              {selectedFile?.type.startsWith("image/") ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-auto max-h-96 object-cover"
                />
              ) : (
                <video
                  src={previewUrl}
                  className="w-full h-auto max-h-96 object-cover"
                  controls
                />
              )}
              <button
                type="button"
                onClick={handleRemoveFile}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors backdrop-blur-md"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                title="Photo"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              {/* Video upload removed from Feed to keep Discover and Feed separate */}
              <button
                type="button"
                className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                title="Attachment"
              >
                <Paperclip className="w-5 h-5" />
              </button>
            </div>
            <button
              type="submit"
              disabled={(!content.trim() && !selectedFile) || mutation.isPending}
              className="px-6 py-2 bg-white text-black rounded-full font-medium hover:bg-white/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
