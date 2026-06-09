import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Send } from "lucide-react";
import { useAuthStore } from "../../store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import { useToast } from "../ui/Toast";
export const CreateStatusModal = ({ isOpen, onClose, onSuccess, }) => {
    const { user } = useAuthStore();
    const [content, setContent] = useState("");
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const createMutation = useMutation({
        mutationFn: api.stories.create,
        onSuccess: (status) => {
            onSuccess(status);
            queryClient.invalidateQueries({ queryKey: ["stories-feed"] });
            queryClient.invalidateQueries({ queryKey: ["feed"] });
            setContent("");
            setImage(null);
            setPreview(null);
            onClose();
            toast("Story posted successfully!", "success");
        },
        onError: (err) => {
            console.error("Error creating story:", err);
            const msg = err?.response?.data?.detail || err?.response?.data?.message || err.message || "Failed to create story";
            toast(msg, "error");
        }
    });
    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            if (preview?.startsWith("blob:"))
                URL.revokeObjectURL(preview);
            setPreview(URL.createObjectURL(file));
        }
    };
    const handleSubmit = () => {
        createMutation.mutate({
            content,
            image,
        });
    };
    return (_jsx(AnimatePresence, { children: isOpen && (_jsxs("div", { className: "fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 overflow-y-auto", children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, onClick: onClose, className: "absolute inset-0 bg-[#0a0a0c]/80 backdrop-blur-sm" }), _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95, y: 20 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.95, y: 20 }, className: "relative w-full max-w-lg bg-[#141417] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-y-auto custom-scrollbar max-h-[90vh]", children: [_jsxs("div", { className: "p-8 pb-4 flex items-center justify-between", children: [_jsx("h3", { className: "text-xl font-black text-white tracking-tighter", children: "Add to Story" }), _jsx("button", { onClick: onClose, className: "p-2 hover:bg-white/5 rounded-full text-zinc-500 transition-colors", children: _jsx(X, { size: 20 }) })] }), _jsxs("div", { className: "p-8 pt-4", children: [_jsxs("div", { className: "mb-8 p-6 bg-white/[0.02] border border-white/5 rounded-3xl group relative overflow-hidden", children: [_jsx("div", { className: "absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -ml-16 -mt-16 group-hover:bg-primary/10 transition-all" }), _jsx("textarea", { value: content, onChange: (e) => setContent(e.target.value), placeholder: "Share an update", className: "w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-zinc-700 resize-none h-32 font-medium relative z-10" }), _jsxs("div", { className: "flex items-center justify-between mt-4 relative z-10 pt-4 border-t border-white/5", children: [_jsxs("div", { className: "flex items-center gap-4 text-zinc-500", children: [_jsxs("label", { className: "flex items-center gap-2 hover:text-primary transition-colors cursor-pointer", children: [_jsx(Camera, { size: 20 }), _jsx("span", { className: "text-[10px] font-black uppercase tracking-widest hidden sm:inline", children: "Camera" }), _jsx("input", { type: "file", className: "hidden", accept: "image/*,video/*", capture: "environment", onChange: handleImageChange })] }), _jsxs("label", { className: "flex items-center gap-2 hover:text-primary transition-colors cursor-pointer", children: [_jsxs("svg", { className: "w-5 h-5", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }), _jsx("circle", { cx: "8.5", cy: "8.5", r: "1.5" }), _jsx("polyline", { points: "21 15 16 10 5 21" })] }), _jsx("span", { className: "text-[10px] font-black uppercase tracking-widest hidden sm:inline", children: "Gallery" }), _jsx("input", { type: "file", className: "hidden", accept: "image/*,video/*", onChange: handleImageChange })] })] }), _jsxs("span", { className: `text-[10px] font-black uppercase tracking-widest ${content.length > 100 ? "text-primary" : "text-zinc-600"}`, children: [content.length, "/150"] })] })] }), preview && (_jsxs("div", { className: "mb-8 relative aspect-square max-h-48 rounded-2xl overflow-hidden border border-white/10", children: [image?.type.startsWith("video/") ? (_jsx("video", { src: preview, className: "w-full h-full object-cover", controls: true, playsInline: true })) : (_jsx("img", { src: preview, className: "w-full h-full object-cover", alt: "Preview" })), _jsx("button", { onClick: () => {
                                                if (preview.startsWith("blob:"))
                                                    URL.revokeObjectURL(preview);
                                                setImage(null);
                                                setPreview(null);
                                            }, className: "absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur-md rounded-lg text-white hover:bg-red-500 transition-all", children: _jsx(X, { size: 14 }) })] })), _jsxs("button", { onClick: handleSubmit, disabled: (!content.trim() && !image) || createMutation.isPending, className: "w-full h-14 bg-primary text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:opacity-90 disabled:opacity-50 transition-all shadow-xl shadow-primary/20", children: [createMutation.isPending ? (_jsx("div", { className: "w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" })) : (_jsx(Send, { size: 18 })), _jsx("span", { children: createMutation.isPending ? "Posting..." : "Post Story" })] })] })] })] })) }));
};
