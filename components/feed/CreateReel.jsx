import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Music, Send, SlidersHorizontal, SmilePlus, Type, Video, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import { useToast } from "../ui/Toast";
export const CreateReel = ({ isOpen, onClose }) => {
    const [caption, setCaption] = useState("");
    const [videoText, setVideoText] = useState("");
    const [textPosition, setTextPosition] = useState({ x: 50, y: 45 });
    const [video, setVideo] = useState(null);
    const [preview, setPreview] = useState(null);
    const [soundName, setSoundName] = useState("");
    const [originalVolume, setOriginalVolume] = useState(100);
    const [addedVolume, setAddedVolume] = useState(80);
    const [sticker, setSticker] = useState("");
    const [filter, setFilter] = useState("none");
    const [step, setStep] = useState("select");
    const cameraInputRef = useRef(null);
    const galleryInputRef = useRef(null);
    const soundInputRef = useRef(null);
    const overlayDragRef = useRef(false);
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { data: appSounds = [] } = useQuery({
        queryKey: ["reel-sound-library"],
        queryFn: () => api.posts.getReels({ pageParam: 0 }),
        enabled: isOpen,
        staleTime: 1000 * 60,
    });
    const soundLibrary = useMemo(() => {
        const names = new Map();
        appSounds.forEach((post) => {
            const explicit = (post.content || "").match(/Sound: (.*)$/m)?.[1]?.trim();
            const name = explicit || `Original sound - @${post.author.username}`;
            names.set(name, post.author.username);
        });
        return Array.from(names.entries()).slice(0, 20).map(([name, username]) => ({ name, username }));
    }, [appSounds]);
    const mutation = useMutation({
        mutationFn: (data) => api.posts.createReel(data),
        onSuccess: (createdReel) => {
            queryClient.setQueriesData({ queryKey: ["discover-reels"] }, (old) => {
                if (!old?.pages)
                    return old;
                return {
                    ...old,
                    pages: [[createdReel], ...old.pages.map((page) => page.filter((post) => post.id !== createdReel.id))],
                };
            });
            queryClient.invalidateQueries({ queryKey: ["discover-reels"] });
            queryClient.invalidateQueries({ queryKey: ["profile-reels"] });
            handleRemoveFile();
            setCaption("");
            setVideoText("");
            setSticker("");
            onClose();
            toast("Reel shared successfully!", "success");
        },
        onError: (err) => {
            const msg = err?.response?.data?.detail || err?.response?.data?.message || err.message || "Failed to create reel";
            toast(msg, "error");
        },
    });
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        if (file.size > 50 * 1024 * 1024) {
            toast("Video size must be less than 50MB", "error");
            return;
        }
        if (!file.type.startsWith("video/")) {
            toast("Reels must be videos.", "error");
            return;
        }
        if (preview)
            URL.revokeObjectURL(preview);
        setVideo(file);
        setPreview(URL.createObjectURL(file));
        setStep("edit");
    };
    const handleSoundChange = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        if (!file.type.startsWith("audio/")) {
            toast("Please choose an audio track.", "error");
            return;
        }
        setSoundName(file.name);
    };
    const handleRemoveFile = () => {
        if (preview)
            URL.revokeObjectURL(preview);
        setVideo(null);
        setPreview(null);
        setStep("select");
        if (cameraInputRef.current)
            cameraInputRef.current.value = "";
        if (galleryInputRef.current)
            galleryInputRef.current.value = "";
        if (soundInputRef.current)
            soundInputRef.current.value = "";
    };
    const handleSubmit = () => {
        if (!video)
            return;
        let finalCaption = caption;
        if (soundName)
            finalCaption += `\nSound: ${soundName}`;
        if (videoText)
            finalCaption += `\n[Overlay Text: ${videoText}]`;
        if (sticker)
            finalCaption += `\n[Sticker: ${sticker}]`;
        finalCaption += `\n[Mix: original ${originalVolume}%, added ${addedVolume}%]`;
        mutation.mutate({ caption: finalCaption, image: video });
    };
    const moveOverlay = (e) => {
        if (!overlayDragRef.current)
            return;
        const rect = e.currentTarget.getBoundingClientRect();
        setTextPosition({
            x: Math.min(90, Math.max(10, ((e.clientX - rect.left) / rect.width) * 100)),
            y: Math.min(88, Math.max(12, ((e.clientY - rect.top) / rect.height) * 100)),
        });
    };
    return (_jsx(AnimatePresence, { children: isOpen && (_jsxs("div", { className: "fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-6", children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, onClick: onClose, className: "absolute inset-0 bg-black/90 backdrop-blur-md" }), _jsxs(motion.div, { initial: { opacity: 0, scale: 0.96, y: 20 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.96, y: 20 }, className: "relative flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-[#0a0a0c] shadow-2xl sm:h-auto sm:max-h-[92dvh] sm:rounded-[2rem] sm:border sm:border-white/10", children: [_jsxs("div", { className: "flex shrink-0 items-center justify-between border-b border-white/5 p-5", children: [_jsx("h3", { className: "text-xl font-black tracking-tighter text-white", children: step === "select" ? "Add Reel" : "Edit Reel" }), _jsx("button", { onClick: onClose, className: "rounded-full p-2 text-zinc-500 transition-colors hover:bg-white/5", children: _jsx(X, { size: 20 }) })] }), _jsxs("div", { className: "flex-1 space-y-5 overflow-y-auto p-5 hide-scrollbar", children: [step === "select" ? (_jsxs("div", { className: "mx-auto flex w-full max-w-sm flex-col gap-4", children: [_jsx("div", { className: "rounded-3xl border border-white/10 bg-white/[0.03] p-4", children: _jsx("div", { className: "grid grid-cols-3 gap-2", children: [1, 2, 3, 4, 5, 6].map((item) => (_jsx("button", { type: "button", onClick: () => galleryInputRef.current?.click(), className: "flex aspect-[9/16] items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-white/25", "aria-label": "Choose video", children: _jsx(Video, { size: 20 }) }, item))) }) }), _jsx("button", { type: "button", onClick: () => galleryInputRef.current?.click(), className: "rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-white/10", children: "Allow videos" }), _jsxs("button", { type: "button", onClick: () => cameraInputRef.current?.click(), className: "flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left transition-all hover:border-primary/50 hover:bg-white/10", children: [_jsx("span", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10", children: _jsx(Camera, { className: "h-5 w-5 text-primary" }) }), _jsxs("span", { children: [_jsx("span", { className: "block text-sm font-bold text-white", children: "Open Camera" }), _jsx("span", { className: "mt-1 block text-[10px] font-black uppercase tracking-widest text-white/40", children: "Record a new video" })] })] })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "relative mx-auto aspect-[9/16] w-full max-w-[240px] touch-none overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-2xl", onPointerMove: moveOverlay, onPointerUp: () => {
                                                overlayDragRef.current = false;
                                            }, onPointerLeave: () => {
                                                overlayDragRef.current = false;
                                            }, children: [_jsx("video", { src: preview || undefined, className: `h-full w-full object-cover ${filter === "grayscale" ? "filter grayscale" : filter === "sepia" ? "filter sepia" : filter === "contrast" ? "filter contrast-125" : ""}`, autoPlay: true, loop: true, playsInline: true, muted: originalVolume === 0 }), videoText && (_jsx("div", { className: "absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-grab px-3 py-1", style: { left: `${textPosition.x}%`, top: `${textPosition.y}%` }, onPointerDown: (e) => {
                                                        overlayDragRef.current = true;
                                                        e.currentTarget.setPointerCapture(e.pointerId);
                                                    }, children: _jsx("p", { className: "max-w-[190px] break-words text-center text-2xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]", children: videoText }) })), sticker && _jsx("div", { className: "absolute bottom-[22%] right-[18%] z-20 text-4xl drop-shadow-lg", children: sticker }), _jsx("button", { onClick: handleRemoveFile, className: "absolute right-4 top-4 z-30 rounded-full bg-black/60 p-2 text-white backdrop-blur-xl transition-all hover:bg-red-500", children: _jsx(X, { size: 16 }) })] }), _jsxs("div", { className: "space-y-3 rounded-2xl border border-white/5 bg-white/5 p-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40", children: [_jsx(SlidersHorizontal, { size: 14 }), "Settings"] }), _jsx("input", { type: "text", value: videoText, onChange: (e) => setVideoText(e.target.value), placeholder: "Add text overlay...", className: "w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-medium text-white placeholder:text-white/30 focus:border-primary/50 focus:outline-none" }), _jsx("textarea", { value: caption, onChange: (e) => setCaption(e.target.value), placeholder: "Write a caption...", className: "h-20 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-medium text-white placeholder:text-white/30 focus:border-primary/50 focus:outline-none" }), _jsxs("div", { className: "grid gap-2 sm:grid-cols-2", children: [_jsxs("button", { type: "button", onClick: () => soundInputRef.current?.click(), className: "flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all hover:bg-white/10", children: [_jsx(Music, { size: 14 }), "Import music"] }), _jsxs("button", { type: "button", className: "flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all hover:bg-white/10", children: [_jsx(Type, { size: 14 }), "Voice over"] })] }), _jsxs("div", { className: "grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-3", children: [_jsxs("label", { className: "text-[10px] font-black uppercase tracking-widest text-white/45", children: ["Original volume ", originalVolume, "%", _jsx("input", { className: "mt-2 w-full", type: "range", min: 0, max: 100, value: originalVolume, onChange: (e) => setOriginalVolume(Number(e.target.value)) })] }), _jsxs("label", { className: "text-[10px] font-black uppercase tracking-widest text-white/45", children: ["Added sound ", addedVolume, "%", _jsx("input", { className: "mt-2 w-full", type: "range", min: 0, max: 100, value: addedVolume, onChange: (e) => setAddedVolume(Number(e.target.value)) })] })] }), _jsxs("div", { className: "space-y-2 rounded-2xl border border-white/10 bg-black/20 p-3", children: [_jsxs("div", { className: "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/45", children: [_jsx(Music, { size: 14 }), "App sounds"] }), _jsx("div", { className: "max-h-28 space-y-1 overflow-y-auto", children: soundLibrary.length ? (soundLibrary.map((item) => (_jsxs("button", { type: "button", onClick: () => setSoundName(item.name), className: `w-full rounded-xl px-3 py-2 text-left text-xs transition-colors ${soundName === item.name ? "bg-primary text-black" : "bg-white/5 text-white/70 hover:bg-white/10"}`, children: [_jsx("span", { className: "block truncate font-bold", children: item.name }), _jsxs("span", { className: "block truncate text-[10px] opacity-70", children: ["@", item.username] })] }, item.name)))) : (_jsx("p", { className: "py-2 text-xs text-white/35", children: "No app sounds yet." })) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(SmilePlus, { size: 14, className: "text-white/40" }), ["*", "!", "<3", "G"].map((item) => (_jsx("button", { type: "button", onClick: () => setSticker(item), className: `h-9 w-9 rounded-xl border text-sm font-black ${sticker === item ? "border-primary bg-primary/20 text-white" : "border-white/10 bg-white/5 text-white/70"}`, children: item }, item)))] }), _jsx("div", { className: "flex items-center gap-2 overflow-x-auto py-1", children: ["none", "grayscale", "sepia", "contrast"].map((option) => (_jsx("button", { type: "button", onClick: () => setFilter(option), className: `min-w-[90px] flex-1 rounded-2xl border px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${filter === option ? "border-primary bg-primary text-black" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"}`, children: option === "none" ? "Normal" : option.charAt(0).toUpperCase() + option.slice(1) }, option))) }), soundName && (_jsxs("div", { className: "rounded-2xl border border-white/10 bg-black/30 p-3 text-xs text-white/70", children: ["Added track: ", _jsx("span", { className: "font-semibold text-white", children: soundName })] }))] })] })), _jsx("input", { ref: cameraInputRef, type: "file", onChange: handleFileChange, className: "hidden", accept: "video/*", capture: "environment" }), _jsx("input", { ref: galleryInputRef, type: "file", onChange: handleFileChange, className: "hidden", accept: "video/*" }), _jsx("input", { ref: soundInputRef, type: "file", onChange: handleSoundChange, className: "hidden", accept: "audio/*" })] }), _jsx("div", { className: "shrink-0 border-t border-white/5 p-5", children: _jsx("button", { onClick: step === "select" ? () => galleryInputRef.current?.click() : handleSubmit, disabled: (step === "edit" && !video) || mutation.isPending, className: "flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white text-xs font-black uppercase tracking-widest text-black transition-all hover:brightness-90 active:scale-[0.98] disabled:opacity-50", children: mutation.isPending ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" }), _jsx("span", { children: "Uploading..." })] })) : step === "select" ? (_jsxs(_Fragment, { children: [_jsx(Video, { size: 18 }), _jsx("span", { children: "Choose video" })] })) : (_jsxs(_Fragment, { children: [_jsx(Send, { size: 18 }), _jsx("span", { children: "Share Reel" })] })) }) })] })] })) }));
};
