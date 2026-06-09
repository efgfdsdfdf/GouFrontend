import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Users, Image as ImageIcon, Send, Shield, Globe, Lock, Clock, Check, CheckCheck, X, Sparkles, Trash2, Plus, Camera, Mic, Smile, } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../services/api";
import { Skeleton } from "../components/ui/Skeleton";
import { Avatar } from "../components/ui/Avatar";
import { authStorage } from "../utils/persistentStorage";
import { VoiceRecorder } from "../components/chat/VoiceRecorder";
import { StickerPicker } from "../components/chat/StickerPicker";
export const GroupDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [messageText, setMessageText] = useState("");
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [activeTab, setActiveTab] = useState("chat");
    const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
    const [joinRequested, setJoinRequested] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [joinDepartment, setJoinDepartment] = useState("");
    const [joinLevel, setJoinLevel] = useState("");
    const [isVoiceRecording, setIsVoiceRecording] = useState(false);
    const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false);
    const bottomRef = useRef(null);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const currentUserId = authStorage.getItem("user_id");
    const { data: group, isLoading: isGroupLoading } = useQuery({
        queryKey: ["group", id],
        queryFn: () => api.groups.getById(id),
        enabled: !!id,
    });
    const { data: members, isLoading: isMembersLoading } = useQuery({
        queryKey: ["group-members", id],
        queryFn: () => api.groups.getMembers(id),
        enabled: !!id,
    });
    const { data: requests, isLoading: isRequestsLoading } = useQuery({
        queryKey: ["group-requests", id],
        queryFn: () => api.groups.getRequests(id),
        enabled: !!id && group?.creatorId === currentUserId,
    });
    const isMember = Boolean(group?.isJoined) || members?.some((m) => String(m.user_id) === String(currentUserId));
    const isAdmin = String(group?.creatorId) === String(currentUserId);
    const canViewMessages = Boolean(group) && (group.privacy !== "private" || isMember || isAdmin);
    const { data: posts, isLoading: isPostsLoading } = useQuery({
        queryKey: ["group-posts", id],
        queryFn: () => api.groups.getPosts(id),
        enabled: !!id && canViewMessages,
        refetchInterval: canViewMessages ? 3000 : false,
    });
    const onlineMembers = (members || []).filter((m) => m.user?.is_online || m.user?.isOnline);
    const typingMembers = (members || []).filter((m) => String(m.user_id) !== String(currentUserId) && (m.user?.is_typing || m.user?.isTyping));
    const isPending = requests?.some((r) => r.user_id === currentUserId && r.status === "pending");
    // Sort posts by creation time for chat ordering
    const sortedMessages = React.useMemo(() => {
        if (!posts)
            return [];
        return [...posts].sort((a, b) => {
            const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
            const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
            return dateA - dateB;
        });
    }, [posts]);
    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (activeTab === "chat") {
            bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }
    }, [sortedMessages, activeTab]);
    const createPostMutation = useMutation({
        mutationFn: (data) => api.groups.createPost(id, data),
        onMutate: async ({ caption }) => {
            setMessageText("");
            clearAttachment();
            await queryClient.cancelQueries({ queryKey: ["group-posts", id] });
            const previousPosts = queryClient.getQueryData(["group-posts", id]);
            const optimisticMessage = {
                id: `temp-${Date.now()}`,
                content: caption,
                author: {
                    id: currentUserId,
                    username: "you",
                    fullName: "You",
                },
                createdAt: new Date().toISOString(),
                likes: 0,
                comments: 0,
                isLiked: false,
            };
            queryClient.setQueryData(["group-posts", id], (old) => old ? [...old, optimisticMessage] : [optimisticMessage]);
            return { previousPosts };
        },
        onError: (_err, _vars, context) => {
            queryClient.setQueryData(["group-posts", id], context?.previousPosts);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["group-posts", id] });
        },
    });
    const joinMutation = useMutation({
        mutationFn: (data) => api.groups.join(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["group", id] });
            queryClient.invalidateQueries({ queryKey: ["group-members", id] });
            queryClient.invalidateQueries({ queryKey: ["group-requests", id] });
        },
    });
    const approveMutation = useMutation({
        mutationFn: ({ requestId, status, }) => api.groups.approveRequest(requestId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["group-requests", id] });
            queryClient.invalidateQueries({ queryKey: ["group-members", id] });
        },
    });
    const updateGroupMutation = useMutation({
        mutationFn: (file) => api.groups.updateGroup(id, file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["group", id] });
        },
    });
    const updateRoleMutation = useMutation({
        mutationFn: ({ userId, role }) => api.groups.updateMemberRole(id, userId, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["group-members", id] });
        },
    });
    const kickMemberMutation = useMutation({
        mutationFn: (userId) => api.groups.kickMember(id, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["group-members", id] });
            queryClient.invalidateQueries({ queryKey: ["group", id] });
        },
    });
    const clearAttachment = () => {
        if (imagePreview?.startsWith("blob:"))
            URL.revokeObjectURL(imagePreview);
        setImage(null);
        setImagePreview(null);
        if (fileInputRef.current)
            fileInputRef.current.value = "";
        if (cameraInputRef.current)
            cameraInputRef.current.value = "";
    };
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        clearAttachment();
        setImage(file);
        setImagePreview(URL.createObjectURL(file));
        setIsAttachMenuOpen(false);
    };
    const handleSend = () => {
        if (!messageText.trim() && !image)
            return;
        createPostMutation.mutate({ caption: messageText.trim(), image });
    };
    const handleSendVoiceNote = async (audioBlob) => {
        const audioFile = new File([audioBlob], 'voice_note.webm', { type: 'audio/webm' });
        createPostMutation.mutate({ caption: '🎤 Voice Note', image: audioFile });
    };
    const handleSendSticker = async (stickerUrl) => {
        setIsStickerPickerOpen(false);
        try {
            const response = await fetch(stickerUrl);
            const blob = await response.blob();
            const file = new File([blob], 'sticker.svg', { type: 'image/svg+xml' });
            createPostMutation.mutate({ caption: '', image: file });
        }
        catch (err) {
            console.error('Failed to send sticker', err);
        }
    };
    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    const getDateLabel = (dateStr) => {
        if (!dateStr)
            return "";
        const date = new Date(dateStr);
        if (isNaN(date.getTime()))
            return "";
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0)
            return "Today";
        if (days === 1)
            return "Yesterday";
        return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
    };
    const getTimeLabel = (dateStr) => {
        if (!dateStr)
            return "";
        const date = new Date(dateStr);
        if (isNaN(date.getTime()))
            return "";
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };
    if (isGroupLoading)
        return (_jsxs("div", { className: "py-20 text-center space-y-8", children: [_jsx(Skeleton, { className: "h-72 rounded-[3rem]" }), _jsx(Skeleton, { className: "h-20 rounded-2xl w-2/3 mx-auto" })] }));
    if (!group)
        return (_jsxs("div", { className: "flex flex-col items-center justify-center py-32", children: [_jsx("h2", { className: "font-serif text-3xl text-white mb-6", children: "Group not found" }), _jsx("button", { onClick: () => navigate("/groups"), className: "px-8 py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5", children: "Return to groups" })] }));
    return (_jsxs("div", { className: "max-w-5xl mx-auto w-full pb-20 selection:bg-primary/30", children: [_jsxs("button", { onClick: () => navigate("/groups"), className: "flex items-center gap-3 text-zinc-500 hover:text-white transition-all mb-8 group", children: [_jsx("div", { className: "p-2.5 rounded-xl bg-white/5 group-hover:bg-white group-hover:text-black transition-all border border-white/5 shadow-lg", children: _jsx(ArrowLeft, { size: 16, className: "group-hover:-translate-x-1 transition-transform" }) }), _jsx("span", { className: "text-[10px] font-black uppercase tracking-[0.2em]", children: "All Groups" })] }), _jsxs("div", { className: "relative rounded-[3rem] overflow-hidden mb-12 border border-white/5 shadow-2xl group min-h-[350px] flex items-end", children: [_jsx("img", { src: group.imageUrl, alt: group.name, className: "absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" }), _jsxs("div", { className: "relative w-full p-10 md:p-14 flex flex-col md:flex-row md:items-end justify-between gap-8", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsxs("div", { className: "px-4 py-1.5 bg-white/10 backdrop-blur-2xl border border-white/10 rounded-full flex items-center gap-2", children: [group.privacy === "public" ? _jsx(Globe, { size: 13, className: "text-primary" }) : _jsx(Lock, { size: 13, className: "text-accent" }), _jsxs("span", { className: "text-[10px] font-black text-white uppercase tracking-widest", children: [group.privacy, " Group"] })] }), isAdmin && (_jsxs("div", { className: "px-4 py-1.5 bg-primary/20 backdrop-blur-2xl border border-primary/20 rounded-full flex items-center gap-2", children: [_jsx(Shield, { size: 13, className: "text-primary" }), _jsx("span", { className: "text-[10px] font-black text-primary uppercase tracking-widest", children: "Admin" })] }))] }), _jsx("h1", { className: "font-serif text-5xl md:text-6xl font-bold text-white tracking-tight mb-4 leading-[1.1]", children: group.name }), _jsx("div", { className: "flex items-center gap-4 text-zinc-400 font-bold uppercase tracking-widest text-[10px]", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Users, { size: 14, className: "text-zinc-600" }), _jsxs("span", { children: [members?.length || 0, " Members"] })] }) })] }), _jsx("div", { className: "flex shrink-0", children: isMember ? (_jsxs("div", { className: "flex items-center gap-3", children: [isAdmin && (_jsx("button", { onClick: () => setActiveTab("admin"), className: `p-5 rounded-2xl transition-all border ${activeTab === "admin" ? "bg-accent border-accent text-black" : "bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10"}`, children: _jsx(Shield, { size: 22 }) })), _jsx("div", { className: "px-10 py-5 bg-white/5 text-zinc-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-white/10", children: "Member" })] })) : isPending ? (_jsxs("div", { className: "px-10 py-5 bg-white/5 text-accent rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 border border-accent/20", children: [_jsx(Clock, { size: 18 }), "Pending Verification"] })) : (_jsx("button", { onClick: () => {
                                        if (group.privacy === "private") {
                                            setIsJoinModalOpen(true);
                                        }
                                        else {
                                            joinMutation.mutate(undefined);
                                        }
                                    }, className: "px-12 py-5 bg-white text-black rounded-2xl font-bold text-[11px] uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all shadow-2xl active:scale-[0.98]", children: group.privacy === "private" ? "Request to Join" : "Join Group" })) })] })] }), _jsx(AnimatePresence, { children: isJoinModalOpen && (_jsxs("div", { className: "fixed inset-0 z-[200] flex items-center justify-center p-4", children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, onClick: () => setIsJoinModalOpen(false), className: "absolute inset-0 bg-black/80 backdrop-blur-sm" }), _jsxs(motion.div, { initial: { y: "100%", opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: "100%", opacity: 0 }, transition: { type: "spring", damping: 25, stiffness: 300 }, className: "relative w-full max-w-md bg-[#111114] border border-white/10 rounded-[2.5rem] p-6 shadow-2xl", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "font-serif text-2xl text-white", children: "Join Private Group" }), _jsx("button", { onClick: () => setIsJoinModalOpen(false), className: "p-2 bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors", children: _jsx(X, { size: 20 }) })] }), _jsxs("div", { className: "space-y-4 mb-8", children: [_jsx("p", { className: "text-sm text-zinc-400", children: "Please provide your department and level to request access to this private group." }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2", children: "Department" }), _jsx("input", { type: "text", value: joinDepartment, onChange: (e) => setJoinDepartment(e.target.value), placeholder: "e.g. Computer Science", className: "w-full bg-[#141417] border border-white/5 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 transition-all" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2", children: "Level" }), _jsx("input", { type: "text", value: joinLevel, onChange: (e) => setJoinLevel(e.target.value), placeholder: "e.g. 100L or Postgrad", className: "w-full bg-[#141417] border border-white/5 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 transition-all" })] })] }), _jsx("button", { onClick: () => {
                                        joinMutation.mutate({ department: joinDepartment, level: joinLevel });
                                        setIsJoinModalOpen(false);
                                    }, disabled: !joinDepartment.trim() || !joinLevel.trim() || joinMutation.isPending, className: "w-full h-14 bg-white text-black rounded-xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all disabled:opacity-50 shadow-xl", children: "Submit Request" })] })] })) }), _jsx("div", { className: "flex gap-4 mb-8 overflow-x-auto pb-4 scrollbar-none border-b border-white/5", children: ["chat", "members", "about"].map((tab) => (_jsxs("button", { onClick: () => setActiveTab(tab), className: `px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap relative ${activeTab === tab
                        ? "text-white"
                        : "text-zinc-600 hover:text-zinc-400"}`, children: [tab, activeTab === tab && (_jsx(motion.div, { layoutId: "activeTabGroup", className: "absolute inset-0 bg-white/5 rounded-2xl -z-10 border border-white/10" }))] }, tab))) }), _jsxs(AnimatePresence, { mode: "wait", children: [activeTab === "chat" && (_jsx(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 }, className: "flex flex-col", children: _jsxs("div", { className: "relative rounded-[2rem] border border-white/10 overflow-hidden flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-14rem)]", style: {
                                background: "linear-gradient(180deg, #0a0a0c 0%, #080810 100%)",
                            }, children: [_jsxs("div", { className: "h-14 px-5 bg-[#0c0c10]/95 backdrop-blur-xl border-b border-white/5 flex items-center gap-3 shrink-0", children: [_jsx("div", { className: "w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center", children: _jsx(Users, { size: 16, className: "text-primary" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-bold text-white truncate", children: group.name }), _jsx("p", { className: "text-[10px] text-white/40 truncate", children: typingMembers.length
                                                        ? `${typingMembers.map((m) => m.user?.profile?.full_name || m.user?.username || "Someone").slice(0, 2).join(", ")} typing...`
                                                        : `${members?.length || 0} members${onlineMembers.length ? `, ${onlineMembers.length} online` : ""}` })] })] }), _jsx("div", { className: "absolute inset-0 top-14 opacity-30 pointer-events-none bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.03),transparent_25%),radial-gradient(circle_at_85%_30%,rgba(196,255,14,0.02),transparent_22%)]" }), _jsx("div", { className: "flex-1 overflow-y-auto px-3 md:px-6 py-4 relative", children: _jsxs("div", { className: "relative space-y-3 pb-4", children: [isPostsLoading ? (_jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "h-2 w-2 rounded-full bg-white/30 animate-bounce [animation-delay:-0.2s]" }), _jsx("span", { className: "h-2 w-2 rounded-full bg-white/30 animate-bounce [animation-delay:-0.1s]" }), _jsx("span", { className: "h-2 w-2 rounded-full bg-white/30 animate-bounce" })] }) })) : sortedMessages.length === 0 ? (_jsx("div", { className: "flex items-center justify-center py-20", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "mx-auto h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4", children: _jsx(Sparkles, { size: 24, className: "text-zinc-700" }) }), _jsx("p", { className: "text-zinc-600 font-bold uppercase tracking-widest text-[10px]", children: "No messages yet. Say something!" })] }) })) : (_jsx(AnimatePresence, { mode: "popLayout", children: sortedMessages.map((msg, index) => {
                                                    const mine = String(msg.author?.id) === String(currentUserId);
                                                    const msgDate = msg.createdAt || msg.created_at || "";
                                                    const prevDate = index > 0 ? (sortedMessages[index - 1].createdAt || sortedMessages[index - 1].created_at || "") : "";
                                                    const showDate = index === 0 || getDateLabel(msgDate) !== getDateLabel(prevDate);
                                                    return (_jsxs(React.Fragment, { children: [showDate && (_jsx("div", { className: "sticky top-2 z-10 my-3 flex justify-center", children: _jsx("span", { className: "rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white/45 backdrop-blur", children: getDateLabel(msgDate) }) })), _jsx(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, className: `flex ${mine ? "justify-end" : "justify-start"}`, children: _jsxs("div", { className: `flex max-w-[82%] gap-2 sm:max-w-[70%] ${mine ? "flex-row-reverse" : "flex-row"}`, children: [!mine && (_jsx("div", { className: "shrink-0 mt-auto mb-1", children: _jsx(Avatar, { src: msg.author?.avatarUrl, alt: msg.author?.fullName || msg.author?.username, label: msg.author?.fullName || msg.author?.username, className: "h-7 w-7 rounded-full object-cover bg-white/10 border border-white/10" }) })), _jsxs("div", { className: `flex flex-col gap-0.5 ${mine ? "items-end" : "items-start"}`, children: [!mine && (_jsx("span", { className: "text-[10px] font-bold text-primary/70 px-2", children: msg.author?.fullName || msg.author?.username || "Member" })), _jsxs("div", { className: `rounded-2xl px-3 py-2 shadow-md border ${mine
                                                                                        ? "bg-primary text-black border-primary/50 rounded-br-md"
                                                                                        : "bg-white/[0.08] text-white border-white/10 rounded-bl-md"}`, children: [(msg.imageUrl || msg.mediaUrl) && (_jsx("img", { src: msg.imageUrl || msg.mediaUrl, className: "max-h-64 rounded-xl mb-1 object-cover", alt: "" })), (msg.content || msg.caption) && (_jsx("p", { className: "px-1 pt-1 text-[14px] leading-relaxed whitespace-pre-wrap", children: msg.content || msg.caption }))] }), _jsxs("div", { className: `flex items-center gap-1 px-2 text-[10px] ${mine ? "text-white/35" : "text-white/40"}`, children: [_jsx("span", { children: msgDate ? getTimeLabel(msgDate) : "" }), mine && (msg.isRead || msg.seen || msg.seenBy?.length ? (_jsx(CheckCheck, { size: 14, className: "text-blue-500" })) : (_jsx(Check, { size: 14, className: "text-white/35" })))] })] })] }) })] }, msg.id));
                                                }) })), _jsx("div", { ref: bottomRef })] }) }), isMember && (_jsxs("div", { className: "bg-[#0a0a0c]/95 border-t border-white/5 px-3 py-2 shrink-0", children: [imagePreview && (_jsxs("div", { className: "mx-2 mb-2 w-fit relative", children: [_jsx("img", { src: imagePreview, className: "h-28 rounded-lg border border-white/10 object-cover", alt: "" }), _jsx("button", { onClick: clearAttachment, className: "absolute -top-2 -right-2 h-7 w-7 bg-red-500 text-white rounded-full flex items-center justify-center", children: _jsx(X, { size: 14 }) })] })), messageText.trim() && (_jsx("div", { className: "px-4 pb-2 text-[10px] font-semibold text-primary/70", children: "You are typing..." })), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("div", { className: "relative shrink-0", children: [_jsx("button", { onClick: () => setIsAttachMenuOpen((prev) => !prev), className: "h-11 w-11 rounded-xl text-white/55 hover:text-white hover:bg-white/5 flex items-center justify-center", "aria-label": "Attachments", children: _jsx(Plus, { size: 22, className: `transition-transform ${isAttachMenuOpen ? "rotate-45" : ""}` }) }), _jsx(AnimatePresence, { children: isAttachMenuOpen && (_jsxs(motion.div, { initial: { opacity: 0, y: 10, scale: 0.96 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 10, scale: 0.96 }, className: "absolute bottom-14 left-0 rounded-2xl border border-white/10 bg-[#111114] p-2 shadow-2xl flex gap-2 z-10", children: [_jsx("button", { onClick: () => fileInputRef.current?.click(), className: "h-11 w-11 rounded-xl text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center", "aria-label": "Attach image", children: _jsx(ImageIcon, { size: 20 }) }), _jsx("button", { onClick: () => cameraInputRef.current?.click(), className: "h-11 w-11 rounded-xl text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center", "aria-label": "Take photo", children: _jsx(Camera, { size: 20 }) })] })) })] }), _jsx("input", { ref: fileInputRef, type: "file", className: "hidden", onChange: handleFileSelect, accept: "image/*,video/*" }), _jsx("input", { ref: cameraInputRef, type: "file", className: "hidden", onChange: handleFileSelect, accept: "image/*", capture: "environment" }), isVoiceRecording ? (_jsx(VoiceRecorder, { onSend: (audioBlob) => {
                                                        setIsVoiceRecording(false);
                                                        handleSendVoiceNote(audioBlob);
                                                    }, onCancel: () => setIsVoiceRecording(false) })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "relative", children: [_jsx("button", { onClick: () => setIsStickerPickerOpen(!isStickerPickerOpen), className: "h-11 w-11 rounded-xl text-white/55 hover:text-white hover:bg-white/5 flex items-center justify-center transition-colors", "aria-label": "Send sticker", children: _jsx(Smile, { size: 22, className: isStickerPickerOpen ? "text-primary" : "" }) }), isStickerPickerOpen && (_jsx(StickerPicker, { onSelect: handleSendSticker, onClose: () => setIsStickerPickerOpen(false) }))] }), _jsx("input", { type: "text", value: messageText, onChange: (e) => setMessageText(e.target.value), onKeyDown: handleKeyPress, placeholder: "Type a message...", className: "h-11 min-w-0 flex-1 rounded-xl bg-white/5 border border-white/10 px-4 text-[15px] text-white placeholder:text-white/35 outline-none focus:border-primary/40" }), (!messageText.trim() && !image) ? (_jsx("button", { onClick: () => setIsVoiceRecording(true), disabled: createPostMutation.isPending, className: "h-11 w-11 rounded-xl text-white hover:bg-white/10 flex items-center justify-center transition-colors shrink-0", "aria-label": "Record voice note", children: _jsx(Mic, { size: 20 }) })) : (_jsx("button", { onClick: handleSend, disabled: createPostMutation.isPending, className: "h-11 w-11 rounded-xl bg-primary text-black flex items-center justify-center disabled:opacity-40 shrink-0", "aria-label": "Send message", children: _jsx(Send, { size: 19 }) }))] }))] })] })), !isMember && !isPending && (_jsxs("div", { className: "bg-[#0a0a0c]/95 border-t border-white/5 px-4 py-4 text-center", children: [_jsx("p", { className: "text-zinc-500 text-xs font-bold uppercase tracking-widest mb-3", children: "Join this group to participate" }), _jsx("button", { onClick: () => {
                                                if (group.privacy === "private") {
                                                    setIsJoinModalOpen(true);
                                                }
                                                else {
                                                    joinMutation.mutate(undefined);
                                                }
                                            }, className: "px-8 py-3 bg-white text-black rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-zinc-200 transition-all", children: group.privacy === "private" ? "Request to Join" : "Join Group" })] }))] }) }, "chat")), activeTab === "members" && (_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "font-serif text-3xl text-white", children: "Members" }), _jsxs("div", { className: "text-[10px] font-black uppercase tracking-widest text-zinc-500", children: [members?.length || 0, " Total"] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: members?.map((m) => (_jsxs("div", { className: "glass-panel !p-4 border-white/5 flex items-center gap-4 rounded-2xl", children: [_jsx("div", { className: "w-12 h-12 rounded-xl overflow-hidden bg-white/5 border border-white/10", children: _jsx("img", { src: m.user?.profile?.profile_picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user?.username}`, className: "w-full h-full object-cover" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-white font-bold truncate leading-none mb-1", children: m.user?.profile?.full_name || m.user?.username }), _jsx("p", { className: "text-[9px] font-black text-zinc-600 uppercase tracking-widest", children: m.role })] })] }, m.id))) })] }, "members")), activeTab === "about" && (_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "glass-panel !p-10 !rounded-[2.5rem] border-white/10 space-y-10", children: [_jsxs("div", { children: [_jsx("h4", { className: "text-white font-serif text-3xl mb-4", children: "About" }), _jsx("p", { className: "text-zinc-400 text-lg leading-relaxed font-medium", children: group.description || "A group for campus communication and specialized discussion." })] }), _jsxs("div", { className: "grid grid-cols-2 gap-6", children: [_jsxs("div", { className: "p-6 bg-white/[0.03] rounded-3xl border border-white/5 space-y-2", children: [_jsx("p", { className: "text-[10px] font-black text-zinc-600 uppercase tracking-widest", children: "Created" }), _jsx("p", { className: "text-white font-bold", children: new Date(group.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) })] }), _jsxs("div", { className: "p-6 bg-white/[0.03] rounded-3xl border border-white/5 space-y-2", children: [_jsx("p", { className: "text-[10px] font-black text-zinc-600 uppercase tracking-widest", children: "Privacy" }), _jsx("p", { className: "text-primary font-bold uppercase text-sm tracking-widest", children: group.privacy })] })] })] }, "about")), activeTab === "admin" && isAdmin && (_jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 }, className: "space-y-12", children: [_jsxs("section", { children: [_jsx("h3", { className: "font-serif text-3xl text-white mb-6", children: "Cover Photo" }), _jsxs("div", { className: "glass-panel p-8 rounded-[2.5rem] border-white/10 flex flex-col md:flex-row items-center gap-8", children: [_jsx("img", { src: group.imageUrl, className: "w-48 h-32 object-cover rounded-2xl border border-white/10 shadow-xl" }), _jsxs("div", { className: "flex-1 text-center md:text-left", children: [_jsx("h4", { className: "text-white font-bold text-lg mb-2", children: "Update Cover Photo" }), _jsx("p", { className: "text-zinc-500 text-xs mb-6 font-medium", children: "Min 1200x400 for best quality." }), _jsxs("label", { className: "inline-block px-10 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-zinc-200 transition-all", children: ["Select File", _jsx("input", { type: "file", className: "hidden", onChange: (e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file)
                                                                        updateGroupMutation.mutate(file);
                                                                } })] })] })] })] }), _jsxs("section", { children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h3", { className: "font-serif text-3xl text-white", children: "Pending Requests" }), _jsxs("div", { className: "px-4 py-1 bg-accent/20 rounded-full text-accent text-[10px] font-black uppercase tracking-widest border border-accent/20", children: [requests?.length || 0, " Requests"] })] }), requests?.length === 0 ? (_jsx("div", { className: "p-14 text-center glass-panel rounded-[2.5rem] border-dashed border-white/5 opacity-50", children: _jsx("p", { className: "text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]", children: "No requests pending" }) })) : (_jsx("div", { className: "space-y-4", children: requests?.map((req) => (_jsxs("div", { className: "glass-panel !p-6 border-white/10 flex items-center justify-between rounded-[2rem]", children: [_jsxs("div", { className: "flex items-center gap-5", children: [_jsx("div", { className: "w-16 h-16 rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0c]", children: _jsx("img", { src: req.user.profile?.profile_picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.user.username}`, className: "w-full h-full object-cover" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-white font-serif text-xl mb-1", children: req.user.username }), _jsx("p", { className: "text-zinc-600 text-[10px] font-bold uppercase tracking-widest", children: "Join request" })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { onClick: () => approveMutation.mutate({ requestId: req.id, status: "accepted" }), className: "p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl hover:bg-emerald-500 hover:text-black transition-all border border-emerald-500/20", children: _jsx(Check, { size: 20 }) }), _jsx("button", { onClick: () => approveMutation.mutate({ requestId: req.id, status: "rejected" }), className: "p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20", children: _jsx(X, { size: 20 }) })] })] }, req.id))) }))] }), _jsxs("section", { children: [_jsx("h3", { className: "font-serif text-3xl text-white mb-6", children: "Manage Members" }), _jsx("div", { className: "space-y-4", children: members?.map((m) => (_jsxs("div", { className: "glass-panel !p-4 border-white/10 flex items-center gap-4 rounded-2xl", children: [_jsx("img", { src: m.user?.profile?.profile_picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user?.username}`, className: "w-12 h-12 rounded-xl object-cover" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-white font-bold", children: m.user?.profile?.full_name || m.user?.username }), _jsx("p", { className: "text-[9px] font-black text-zinc-600 uppercase tracking-widest", children: m.role })] }), m.user_id !== currentUserId && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("select", { className: "bg-black/40 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest p-2 text-white outline-none focus:border-primary transition-all", value: m.role, onChange: (e) => updateRoleMutation.mutate({ userId: m.user_id, role: e.target.value }), children: [_jsx("option", { value: "member", children: "Member" }), _jsx("option", { value: "moderator", children: "Moderator" }), _jsx("option", { value: "admin", children: "Admin" })] }), _jsx("button", { onClick: () => kickMemberMutation.mutate(m.user_id), className: "p-3 bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/10", children: _jsx(Trash2, { size: 16 }) })] }))] }, m.id))) })] })] }, "admin"))] })] }));
};
