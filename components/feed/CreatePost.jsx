import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useRef } from "react";
import { Camera, Image as ImageIcon, X } from "lucide-react";
import { useAuthStore } from "../../store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import { Avatar } from "../ui/Avatar";
import { useToast } from "../ui/Toast";
export const CreatePost = ({ profileUsername }) => {
    const { user } = useAuthStore();
    const [content, setContent] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const mutation = useMutation({
        mutationFn: (data) => api.posts.createFeedPost(data),
        onSuccess: () => {
            const ownerUsername = profileUsername || user?.username;
            if (ownerUsername) {
                queryClient.invalidateQueries({ queryKey: ["profile-posts", ownerUsername] });
            }
            queryClient.invalidateQueries({ queryKey: ["feed"] });
            handleRemoveFile();
            setContent("");
        },
        onError: (error) => {
            toast(error?.message || error?.response?.data?.detail || "Unable to create post", "error");
        },
    });
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type.startsWith("video/")) {
                const url = URL.createObjectURL(file);
                const videoElement = document.createElement("video");
                videoElement.preload = "metadata";
                videoElement.onloadedmetadata = () => {
                    window.URL.revokeObjectURL(url);
                    if (videoElement.duration > 1800) {
                        alert("Feed videos must be 30 minutes or less");
                        if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        return;
                    }
                    setSelectedFile(file);
                    setPreviewUrl(URL.createObjectURL(file));
                };
                videoElement.src = url;
            }
            else {
                setSelectedFile(file);
                const url = URL.createObjectURL(file);
                setPreviewUrl(url);
            }
        }
    };
    const handleRemoveFile = () => {
        if (previewUrl)
            URL.revokeObjectURL(previewUrl);
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current)
            fileInputRef.current.value = "";
        if (cameraInputRef.current)
            cameraInputRef.current.value = "";
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!content.trim() && !selectedFile)
            return;
        mutation.mutate({ caption: content, image: selectedFile });
    };
    return (_jsx("div", { className: "glass-panel rounded-none sm:rounded-2xl p-4 mb-6", children: _jsxs("form", { onSubmit: handleSubmit, className: "flex gap-4", children: [_jsx(Avatar, { src: user?.avatarUrl, alt: "Profile", label: user?.fullName, className: "w-10 h-10 rounded-full object-cover border border-white/10" }), _jsxs("div", { className: "flex-1", children: [_jsx("textarea", { value: content, onChange: (e) => setContent(e.target.value), placeholder: "Share something from your profile...", className: "w-full bg-transparent border-none text-white placeholder:text-white/40 focus:outline-none focus:ring-0 text-lg mt-1 resize-none h-12" }), previewUrl && (_jsxs("div", { className: "relative mt-4 rounded-xl overflow-hidden border border-white/10 group", children: [selectedFile?.type.startsWith("image/") ? (_jsx("img", { src: previewUrl, alt: "Preview", className: "w-full h-auto max-h-96 object-cover" })) : (_jsx("video", { src: previewUrl, className: "w-full h-auto max-h-96 object-cover", controls: true })), _jsx("button", { type: "button", onClick: handleRemoveFile, className: "absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors backdrop-blur-md", children: _jsx(X, { size: 16 }) })] })), _jsxs("div", { className: "flex items-center justify-between mt-4 pt-4 border-t border-white/10", children: [_jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "file", ref: fileInputRef, onChange: handleFileChange, className: "hidden", accept: "image/*,video/*" }), _jsx("input", { type: "file", ref: cameraInputRef, onChange: handleFileChange, className: "hidden", accept: "image/*,video/*", capture: "environment" }), _jsx("button", { type: "button", onClick: () => cameraInputRef.current?.click(), className: "p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors", title: "Camera", children: _jsx(Camera, { className: "w-5 h-5" }) }), _jsx("button", { type: "button", onClick: () => fileInputRef.current?.click(), className: "p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors", title: "Photo/Video", children: _jsx(ImageIcon, { className: "w-5 h-5" }) })] }), _jsx("button", { type: "submit", disabled: (!content.trim() && !selectedFile) || mutation.isPending, className: "px-6 py-2 bg-white text-black rounded-full font-medium hover:bg-white/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed", children: mutation.isPending ? "Posting..." : "Post" })] })] })] }) }));
};
