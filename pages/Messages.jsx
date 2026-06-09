import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Camera, Check, CheckCheck, Image as ImageIcon, FileText, MessageSquarePlus, MoreVertical, Paperclip, Plus, Search, Send, UserPlus, X, Mic, Smile, } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api, getApiErrorMessage } from "../services/api";
import { authStorage } from "../utils/persistentStorage";
import { Avatar } from "../components/ui/Avatar";
import { useToast } from "../components/ui/Toast";
import { VoiceRecorder } from "../components/chat/VoiceRecorder";
import { StickerPicker } from "../components/chat/StickerPicker";
export const Messages = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const navigate = useNavigate();
    const currentUserId = authStorage.getItem("user_id");
    const [searchParams, setSearchParams] = useSearchParams();
    const userIdFromQuery = searchParams.get("userId");
    const queryUsername = searchParams.get("username") || "";
    const queryName = searchParams.get("name") || queryUsername || "New chat";
    const queryAvatar = searchParams.get("avatar") || "";
    const bottomRef = useRef(null);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [messageText, setMessageText] = useState("");
    const [searchText, setSearchText] = useState("");
    const [attachment, setAttachment] = useState(null);
    const [attachmentPreview, setAttachmentPreview] = useState(null);
    const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
    const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
    const [pendingChat, setPendingChat] = useState(null);
    const [chatPrepareError, setChatPrepareError] = useState(null);
    const [contactEmails, setContactEmails] = useState(new Set());
    const [contactNames, setContactNames] = useState(new Set());
    const [isDesktop, setIsDesktop] = useState(() => window.matchMedia("(min-width: 768px)").matches);
    const [isVoiceRecording, setIsVoiceRecording] = useState(false);
    const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false);
    const { data: chats = [], isLoading: chatsLoading, isError: chatsError, error: chatsLoadError } = useQuery({
        queryKey: ["chats"],
        queryFn: api.chats.getAll,
        staleTime: 30000,
    });
    const { data: suggestedUsers = [], isLoading: suggestionsLoading } = useQuery({
        queryKey: ["message-suggestions"],
        queryFn: api.profiles.getSuggestions,
        staleTime: 1000 * 60 * 5,
    });
    const filteredSuggestedUsers = suggestedUsers.filter((person) => !chats.some((chat) => String(chat.partner.id) === String(person.id)));
    const createChatMutation = useMutation({
        mutationFn: (participantId) => api.chats.createConversation([participantId]),
        onMutate: () => {
            setChatPrepareError(null);
        },
        onSuccess: (newChat) => {
            const normalizedChat = {
                id: newChat.id.toString(),
                partner: newChat.partner?.id ? newChat.partner : {
                    id: userIdFromQuery,
                    username: queryUsername,
                    fullName: queryName,
                    avatarUrl: queryAvatar || null,
                },
                lastMessage: "No messages yet",
                timestamp: "",
                unreadCount: 0,
            };
            setPendingChat(null);
            queryClient.setQueryData(["chats"], (old = []) => {
                const withoutTemp = old.filter((chat) => !chat.id.toString().startsWith("temp-"));
                return [normalizedChat, ...withoutTemp.filter((chat) => chat.id !== normalizedChat.id)];
            });
            setSelectedChatId(normalizedChat.id);
            setSearchParams({}, { replace: true });
        },
        onError: (error) => {
            setChatPrepareError(getApiErrorMessage(error, "Unable to prepare this chat. Check the backend conversations endpoint."));
            setPendingChat((current) => current
                ? {
                    ...current,
                    lastMessage: "Unable to prepare chat",
                }
                : current);
        },
    });
    const followSuggestionMutation = useMutation({
        mutationFn: (userId) => api.profiles.follow(userId),
        onSuccess: (_data, userId) => {
            queryClient.setQueryData(["message-suggestions"], (old = []) => old.map((person) => String(person.id) === String(userId)
                ? { ...person, isFollowing: true, followers: (person.followers || 0) + 1 }
                : person));
            queryClient.invalidateQueries({ queryKey: ["message-suggestions"] });
        },
    });
    useEffect(() => {
        if (!isDesktop || selectedChatId || !chats.length || userIdFromQuery)
            return;
        setSelectedChatId(chats[0].id);
    }, [chats, isDesktop, selectedChatId, userIdFromQuery]);
    useEffect(() => {
        const media = window.matchMedia("(min-width: 768px)");
        const handleChange = () => setIsDesktop(media.matches);
        handleChange();
        media.addEventListener("change", handleChange);
        return () => media.removeEventListener("change", handleChange);
    }, []);
    useEffect(() => {
        if (!userIdFromQuery || !chats)
            return;
        const existingChat = chats.find((chat) => String(chat.partner.id) === String(userIdFromQuery));
        if (existingChat) {
            setSelectedChatId(existingChat.id);
            setSearchParams({}, { replace: true });
            return;
        }
        if (!createChatMutation.isPending) {
            const tempChatId = `temp-${userIdFromQuery}`;
            const tempChat = {
                id: tempChatId,
                partner: {
                    id: userIdFromQuery,
                    username: queryUsername,
                    fullName: queryName,
                    avatarUrl: queryAvatar || null,
                },
                lastMessage: "Starting conversation...",
                timestamp: "",
                unreadCount: 0,
            };
            setPendingChat(tempChat);
            queryClient.setQueryData(["chats"], (old = []) => {
                if (old.some((chat) => chat.id === tempChatId || String(chat.partner.id) === String(userIdFromQuery)))
                    return old;
                return [tempChat, ...old];
            });
            setSelectedChatId(tempChatId);
            createChatMutation.mutate(userIdFromQuery);
        }
    }, [
        userIdFromQuery,
        queryUsername,
        queryName,
        queryAvatar,
        chats,
        createChatMutation.isPending,
        createChatMutation,
        queryClient,
        setSearchParams,
    ]);
    const { data: messages = [], isLoading: messagesLoading, isError: messagesError, error: messagesLoadError } = useQuery({
        queryKey: ["messages", selectedChatId],
        queryFn: () => api.chats.getMessages(selectedChatId),
        enabled: !!selectedChatId && !selectedChatId.startsWith("temp-"),
        staleTime: 30000,
    });
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, selectedChatId]);
    const selectedChat = chats.find((chat) => chat.id === selectedChatId);
    const activeChat = selectedChat || (pendingChat?.id === selectedChatId ? pendingChat : null);
    const isTempChat = Boolean(selectedChatId?.startsWith("temp-"));
    const isChatPreparing = isTempChat && createChatMutation.isPending && !chatPrepareError;
    const filteredChats = useMemo(() => {
        const q = searchText.trim().toLowerCase();
        if (!q)
            return chats;
        return chats.filter((chat) => {
            const name = `${chat.partner.fullName} ${chat.partner.username}`.toLowerCase();
            return name.includes(q);
        });
    }, [chats, searchText]);
    const normalizeContactToken = (value) => value?.trim().toLowerCase() || "";
    const isFromContacts = (person) => {
        const email = normalizeContactToken(person.email);
        const username = normalizeContactToken(person.username);
        const fullName = normalizeContactToken(person.fullName);
        return Boolean((email && contactEmails.has(email)) ||
            (username && contactNames.has(username)) ||
            (fullName && contactNames.has(fullName)));
    };
    const clearAttachment = () => {
        if (attachmentPreview?.startsWith("blob:"))
            URL.revokeObjectURL(attachmentPreview);
        setAttachment(null);
        setAttachmentPreview(null);
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
        setAttachment(file);
        setAttachmentPreview(URL.createObjectURL(file));
        setIsAttachMenuOpen(false);
    };
    const importContacts = async () => {
        try {
            const nav = navigator;
            if (nav.contacts?.select) {
                const contacts = await nav.contacts.select(["name", "email"], { multiple: true });
                setContactEmails(new Set(contacts.flatMap((contact) => contact.email || []).map(normalizeContactToken).filter(Boolean)));
                setContactNames(new Set(contacts.flatMap((contact) => contact.name || []).map(normalizeContactToken).filter(Boolean)));
            }
            else if (navigator.share) {
                await navigator.share({
                    title: "Join GoUnion",
                    text: "Join me on GoUnion. Download/open the app and let's connect.",
                    url: window.location.origin,
                });
            }
            else if (navigator.clipboard) {
                await navigator.clipboard.writeText(`Join me on GoUnion.\n${window.location.origin}`);
                alert("Invite link copied.");
            }
        }
        catch (err) {
            if (err.name !== "AbortError") {
                console.error("Contacts failed", err);
            }
        }
    };
    const startChatWithUser = (person) => {
        if (!person.isFollowing) {
            followSuggestionMutation.mutate(person.id);
            return;
        }
        const existingChat = chats.find((chat) => String(chat.partner.id) === String(person.id));
        setIsSuggestionsOpen(false);
        setSearchParams({}, { replace: true });
        if (existingChat) {
            setSelectedChatId(existingChat.id);
            return;
        }
        const tempChatId = `temp-${person.id}`;
        const tempChat = {
            id: tempChatId,
            partner: person,
            lastMessage: "Starting conversation...",
            timestamp: "",
            unreadCount: 0,
        };
        setPendingChat(tempChat);
        setSelectedChatId(tempChatId);
        queryClient.setQueryData(["chats"], (old = []) => [
            tempChat,
            ...old.filter((chat) => String(chat.partner.id) !== String(person.id)),
        ]);
        createChatMutation.mutate(person.id);
    };
    const sendMessageMutation = useMutation({
        mutationFn: ({ chatId, content, file, audioBlob, sticker }) => api.chats.sendMessage(chatId, content, file, audioBlob, sticker),
        onMutate: async ({ content, file, sticker }) => {
            const activeChatId = selectedChatId;
            setMessageText("");
            clearAttachment();
            await queryClient.cancelQueries({ queryKey: ["messages", activeChatId] });
            await queryClient.cancelQueries({ queryKey: ["chats"] });
            const previousMessages = queryClient.getQueryData(["messages", activeChatId]);
            const previousChats = queryClient.getQueryData(["chats"]);
            const previewUrl = file ? URL.createObjectURL(file) : null;
            const optimisticMessage = {
                id: `temp-${Date.now()}`,
                content,
                imageUrl: file && file.type.startsWith("image/") ? previewUrl : null,
                videoUrl: file && file.type.startsWith("video/") ? previewUrl : null,
                stickerUrl: sticker?.url || null,
                stickerId: sticker?.id || null,
                fileUrl: file && !file.type.startsWith("image/") && !file.type.startsWith("video/") ? previewUrl : null,
                fileName: file && !file.type.startsWith("image/") && !file.type.startsWith("video/") ? file.name : null,
                senderId: currentUserId,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                dateLabel: new Date().toLocaleDateString([], { month: "short", day: "numeric" }),
                fullTimestamp: new Date().toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
                isRead: false,
            };
            queryClient.setQueryData(["messages", activeChatId], (old) => old ? [...old, optimisticMessage] : [optimisticMessage]);
            queryClient.setQueryData(["chats"], (old) => {
                if (!old)
                    return old;
                const chatIndex = old.findIndex((chat) => chat.id === activeChatId);
                if (chatIndex === -1)
                    return old;
                const updatedChat = {
                    ...old[chatIndex],
                    lastMessage: content || (sticker ? "Sticker" : file ? (file.type.startsWith("video/") ? "Video" : "Photo") : ""),
                    timestamp: optimisticMessage.timestamp,
                };
                const nextChats = [...old];
                nextChats.splice(chatIndex, 1);
                return [updatedChat, ...nextChats];
            });
            return { previousMessages, previousChats, activeChatId };
        },
        onSuccess: (newServerMsg, _vars, context) => {
            queryClient.setQueryData(["messages", context?.activeChatId], (old) => {
                const sansTemp = old?.filter((m) => !m.id.toString().startsWith("temp-")) || [];
                return [...sansTemp, newServerMsg];
            });
        },
        onError: (err, _variables, context) => {
            queryClient.setQueryData(["messages", context?.activeChatId], context?.previousMessages);
            queryClient.setQueryData(["chats"], context?.previousChats);
            toast(getApiErrorMessage(err, "Unable to send message"), "error");
        },
    });
    const handleSend = () => {
        if (!selectedChatId)
            return;
        if (!messageText.trim() && !attachment)
            return;
        sendMessageMutation.mutate({
            chatId: selectedChatId,
            content: messageText.trim() || undefined,
            file: attachment,
        });
    };
    const handleSendVoiceNote = (audioBlob) => {
        if (!selectedChatId)
            return;
        sendMessageMutation.mutate({
            chatId: selectedChatId,
            audioBlob,
        });
    };
    const handleSendSticker = async (stickerUrl) => {
        if (!selectedChatId)
            return;
        setIsStickerPickerOpen(false);
        sendMessageMutation.mutate({
            chatId: selectedChatId,
            sticker: { url: stickerUrl, id: stickerUrl.split("seed=").pop() || "sticker" },
        });
    };
    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    return (_jsxs("div", { className: "h-[100dvh] w-full bg-[#030303] text-white overflow-hidden", children: [_jsxs("div", { className: "h-full flex", children: [_jsxs("aside", { className: `w-full md:w-[390px] md:min-w-[390px] bg-[#050505]/95 border-r border-white/10 flex-col ${selectedChatId ? "hidden md:flex" : "flex"}`, children: [_jsxs("div", { className: "h-16 px-4 bg-[#0a0a0c]/95 border-b border-white/5 flex items-center justify-between", children: [_jsx("button", { onClick: () => navigate("/"), className: "h-10 w-10 rounded-xl text-white/55 hover:text-white hover:bg-white/5 flex items-center justify-center shrink-0", "aria-label": "Back to feed", title: "Back", children: _jsx(ArrowLeft, { size: 21 }) }), _jsxs(Link, { to: "/", className: "flex items-center gap-3 min-w-0", children: [_jsx("div", { className: "h-10 w-10 rounded-xl bg-primary text-black flex items-center justify-center font-black shadow-lg shadow-primary/20", children: "G" }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "font-semibold leading-none", children: "GoUnion Chats" }), _jsx("p", { className: "text-xs text-white/40 mt-1", children: "Messages stay in sync live" })] })] }), _jsx("button", { onClick: () => setIsSuggestionsOpen(true), className: "h-10 w-10 rounded-xl text-white/50 hover:text-white hover:bg-white/5 flex items-center justify-center", "aria-label": "Suggested contacts", title: "Suggested contacts", children: _jsx(MoreVertical, { size: 20 }) })] }), _jsx("div", { className: "p-3 bg-[#050505]", children: _jsxs("div", { className: "h-10 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 px-4", children: [_jsx(Search, { size: 18, className: "text-white/40" }), _jsx("input", { value: searchText, onChange: (e) => setSearchText(e.target.value), placeholder: "Search or start new chat", className: "flex-1 bg-transparent text-sm text-white placeholder:text-white/35 outline-none" })] }) }), _jsx("div", { className: "flex-1 overflow-y-auto relative", children: chatsLoading ? (_jsx("div", { className: "flex-1 flex items-center justify-center py-20", children: _jsx("div", { className: "w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center font-serif font-black text-3xl text-white/20 animate-pulse border border-white/10", children: "G" }) })) : chatsError ? (_jsx("div", { className: "px-8 py-20 text-center text-sm text-red-300", children: getApiErrorMessage(chatsLoadError, "Chats could not load. Check the backend conversations endpoint.") })) : filteredChats.length === 0 ? (_jsx("div", { className: "px-8 py-20 text-center text-white/40 text-sm", children: "No chats yet. Open a profile and tap the message button to start one." })) : (_jsxs(_Fragment, { children: [filteredChats.filter((c) => (c.unreadCount || 0) > 0).length > 0 && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "sticky top-0 z-10 bg-primary/20 backdrop-blur-md px-4 py-2 border-b border-primary/30 flex items-center justify-between", children: [_jsx("span", { className: "text-primary text-xs font-bold uppercase tracking-wider", children: "New Messages!" }), _jsx("span", { className: "h-5 min-w-5 rounded-full bg-primary px-1.5 text-[10px] text-black font-bold flex items-center justify-center", children: filteredChats.filter((c) => (c.unreadCount || 0) > 0).length })] }), filteredChats.filter((c) => (c.unreadCount || 0) > 0).map((chat) => (_jsxs("button", { onClick: () => setSelectedChatId(chat.id), className: `w-full h-[72px] px-4 flex items-center gap-3 text-left border-b border-white/5 transition-colors ${selectedChatId === chat.id ? "bg-white/10" : "hover:bg-white/5"}`, children: [_jsx(Avatar, { src: chat.partner.avatarUrl, alt: chat.partner.fullName, label: chat.partner.fullName, className: "h-12 w-12 rounded-full object-cover bg-white/10 border border-white/10 relative" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("p", { className: "text-[15px] text-white font-bold truncate", children: chat.partner.fullName }), _jsx("span", { className: "text-[11px] text-primary font-bold shrink-0", children: chat.timestamp })] }), _jsxs("div", { className: "mt-1 flex items-center justify-between gap-3", children: [_jsx("p", { className: "text-sm text-white truncate font-medium", children: chat.lastMessage }), _jsx("span", { className: "h-5 min-w-5 rounded-full bg-primary px-1.5 text-[10px] text-black font-bold flex items-center justify-center", children: chat.unreadCount > 99 ? "99+" : chat.unreadCount })] })] })] }, chat.id))), _jsx("div", { className: "h-3 w-full bg-transparent" }), _jsx("div", { className: "sticky top-0 z-10 bg-[#050505]/95 backdrop-blur-md px-4 py-2 flex items-center gap-2 border-b border-white/5", children: _jsx("span", { className: "text-white/40 text-[10px] font-black uppercase tracking-widest", children: "Older Chats" }) })] })), filteredChats.filter((c) => !(c.unreadCount || 0)).map((chat) => (_jsxs("button", { onClick: () => setSelectedChatId(chat.id), className: `w-full h-[72px] px-4 flex items-center gap-3 text-left border-b border-white/5 transition-colors ${selectedChatId === chat.id ? "bg-white/10" : "hover:bg-white/5"}`, children: [_jsx(Avatar, { src: chat.partner.avatarUrl, alt: chat.partner.fullName, label: chat.partner.fullName, className: "h-12 w-12 rounded-full object-cover bg-white/10 border border-white/10" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("p", { className: "text-[15px] text-white/90 truncate", children: chat.partner.fullName }), _jsx("span", { className: "text-[11px] text-white/35 shrink-0", children: chat.timestamp })] }), _jsx("div", { className: "mt-1 flex items-center justify-between gap-3", children: _jsx("p", { className: "text-sm text-white/45 truncate", children: chat.lastMessage }) })] })] }, chat.id)))] })) })] }), _jsx("section", { className: `flex-1 bg-[#030303] flex-col ${selectedChatId ? "flex" : "hidden md:flex"}`, children: activeChat ? (_jsxs(_Fragment, { children: [_jsxs("header", { className: "h-16 px-3 md:px-5 bg-[#0a0a0c]/95 flex items-center gap-3 border-b border-white/5", children: [_jsx("button", { onClick: (e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setSelectedChatId(null);
                                                setSearchParams({}, { replace: true });
                                            }, className: "md:hidden h-10 w-10 shrink-0 rounded-xl text-white/60 hover:text-white hover:bg-white/5 flex items-center justify-center z-50 relative", "aria-label": "Back to chats", children: _jsx(ArrowLeft, { size: 21 }) }), _jsx(Avatar, { src: activeChat.partner.avatarUrl, alt: activeChat.partner.fullName, label: activeChat.partner.fullName, className: "h-10 w-10 rounded-full object-cover bg-white/10 border border-white/10" }), _jsxs(Link, { to: `/profile/${activeChat.partner.username}`, className: "min-w-0 flex-1", children: [_jsx("p", { className: "text-[15px] font-medium text-white truncate", children: activeChat.partner.fullName }), _jsx("p", { className: "text-xs truncate transition-colors", children: activeChat.partner.isOnline ? (_jsxs("span", { className: "text-green-500 font-medium flex items-center gap-1", children: [_jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" }), " Online"] })) : activeChat.partner.lastSeen ? (_jsxs("span", { className: "text-white/40", children: ["Last seen ", activeChat.partner.lastSeen] })) : (_jsx("span", { className: "text-white/40", children: "Offline \u2022 Tap for profile" })) })] }), _jsx("button", { onClick: () => setIsSuggestionsOpen(true), className: "h-10 w-10 rounded-xl text-white/50 hover:text-white hover:bg-white/5 flex items-center justify-center", "aria-label": "Suggested contacts", title: "Suggested contacts", children: _jsx(MoreVertical, { size: 20 }) })] }), _jsxs("div", { className: "relative flex-1 overflow-y-auto px-3 md:px-10 py-6", children: [_jsx("div", { className: "absolute inset-0 opacity-60 pointer-events-none bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.05),transparent_25%),radial-gradient(circle_at_85%_30%,rgba(196,255,14,0.04),transparent_22%)]" }), _jsxs("div", { className: "relative space-y-5 pb-4", children: [(messagesLoading || isChatPreparing) ? (_jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "h-2 w-2 rounded-full bg-white/30 animate-bounce [animation-delay:-0.2s]" }), _jsx("span", { className: "h-2 w-2 rounded-full bg-white/30 animate-bounce [animation-delay:-0.1s]" }), _jsx("span", { className: "h-2 w-2 rounded-full bg-white/30 animate-bounce" })] }) })) : messagesError ? (_jsx("div", { className: "flex min-h-[50vh] items-center justify-center px-4 text-center", children: _jsx("div", { className: "max-w-sm rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-200", children: getApiErrorMessage(messagesLoadError, "Messages could not load. Check the backend messages endpoint.") }) })) : chatPrepareError ? (_jsx("div", { className: "flex min-h-[50vh] items-center justify-center px-4 text-center", children: _jsxs("div", { className: "max-w-sm rounded-3xl border border-white/10 bg-white/[0.04] p-6", children: [_jsx("div", { className: "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-black font-black", children: "G" }), _jsx("p", { className: "text-sm font-semibold text-white", children: chatPrepareError }), _jsx("button", { type: "button", onClick: () => {
                                                                    if (activeChat?.partner?.id)
                                                                        createChatMutation.mutate(activeChat.partner.id);
                                                                }, className: "mt-5 rounded-xl bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-black w-full", children: "Try again" }), _jsx("button", { type: "button", onClick: () => {
                                                                    setChatPrepareError(null);
                                                                    setSelectedChatId(null);
                                                                    setPendingChat(null);
                                                                    setSearchParams({}, { replace: true });
                                                                }, className: "mt-3 rounded-xl bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-white/20 transition-colors w-full", children: "Cancel" })] }) })) : (_jsx(AnimatePresence, { mode: "popLayout", children: messages.map((msg, index) => {
                                                        const mine = String(msg.senderId) === String(currentUserId);
                                                        const showDate = index === 0 || msg.dateLabel !== messages[index - 1]?.dateLabel;
                                                        return (_jsxs(React.Fragment, { children: [showDate && (_jsx("div", { className: "sticky top-2 z-10 my-3 flex justify-center", children: _jsx("span", { className: "rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white/45 backdrop-blur", children: msg.dateLabel }) })), _jsx(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, className: `flex ${mine ? "justify-end" : "justify-start"}`, children: _jsxs("div", { className: `flex max-w-[82%] flex-col gap-1 sm:max-w-[70%] ${mine ? "items-end" : "items-start"}`, children: [_jsxs("div", { className: `rounded-2xl px-3 py-2 shadow-md border ${mine ? "bg-primary text-black border-primary/50" : "bg-white/[0.08] text-white border-white/10"}`, children: [msg.imageUrl && (_jsx("img", { src: msg.imageUrl, className: "max-h-80 rounded-md mb-1 object-cover", alt: "" })), msg.videoUrl && (_jsx("video", { src: msg.videoUrl, controls: true, className: "max-h-80 rounded-md mb-1" })), msg.fileUrl && (_jsxs("a", { href: msg.fileUrl, target: "_blank", rel: "noreferrer", className: `mb-1 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${mine ? "border-black/20 bg-black/10 text-black" : "border-white/10 bg-white/5 text-white"}`, children: [_jsx(FileText, { size: 18 }), _jsx("span", { className: "truncate", children: msg.fileName || "Open attachment" })] })), msg.audioUrl && (_jsx("audio", { src: msg.audioUrl, controls: true, className: "max-w-[200px] mb-1" })), msg.stickerUrl && (_jsx("img", { src: msg.stickerUrl, className: "h-24 w-24 object-contain", alt: "Sticker" })), msg.content && _jsx("p", { className: "px-1 pt-1 text-[14px] leading-relaxed whitespace-pre-wrap", children: msg.content })] }), _jsxs("div", { className: `flex items-center gap-1 px-2 text-[10px] ${mine ? "text-white/35" : "text-white/40"}`, children: [_jsx("span", { children: msg.fullTimestamp || msg.timestamp }), mine && (msg.isRead ? (_jsx(CheckCheck, { size: 14, className: "text-blue-500" })) : activeChat?.partner?.isOnline ? (_jsx(CheckCheck, { size: 14, className: "text-white/35" })) : (_jsx(Check, { size: 14, className: "text-white/35" })))] })] }) })] }, msg.id));
                                                    }) })), _jsx("div", { ref: bottomRef })] })] }), _jsxs("footer", { className: "bg-[#0a0a0c]/95 border-t border-white/5 px-3 py-2", children: [attachmentPreview && (_jsxs("div", { className: "mx-2 mb-2 w-fit relative", children: [attachment?.type.startsWith("video/") ? (_jsx("video", { src: attachmentPreview, className: "h-28 rounded-lg border border-white/10" })) : attachment?.type.startsWith("image/") ? (_jsx("img", { src: attachmentPreview, className: "h-28 rounded-lg border border-white/10 object-cover", alt: "" })) : (_jsxs("div", { className: "h-20 max-w-[220px] rounded-lg border border-white/10 bg-white/5 px-4 flex items-center gap-3 text-white/80", children: [_jsx(FileText, { size: 22 }), _jsx("span", { className: "text-sm truncate", children: attachment?.name })] })), _jsx("button", { onClick: clearAttachment, className: "absolute -top-2 -right-2 h-7 w-7 bg-red-500 text-white rounded-full flex items-center justify-center", children: _jsx(X, { size: 14 }) })] })), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("div", { className: "relative shrink-0", children: [_jsx("button", { onClick: () => setIsAttachMenuOpen((prev) => !prev), className: "h-11 w-11 rounded-xl text-white/55 hover:text-white hover:bg-white/5 flex items-center justify-center", "aria-label": "Open attachments", children: _jsx(Plus, { size: 22, className: `transition-transform ${isAttachMenuOpen ? "rotate-45" : ""}` }) }), _jsx(AnimatePresence, { children: isAttachMenuOpen && (_jsxs(motion.div, { initial: { opacity: 0, y: 10, scale: 0.96 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 10, scale: 0.96 }, className: "absolute bottom-14 left-0 rounded-2xl border border-white/10 bg-[#111114] p-2 shadow-2xl flex gap-2", children: [_jsx("button", { onClick: () => fileInputRef.current?.click(), className: "h-11 w-11 rounded-xl text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center", "aria-label": "Attach file", children: _jsx(Paperclip, { size: 21 }) }), _jsx("button", { onClick: () => fileInputRef.current?.click(), className: "h-11 w-11 rounded-xl text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center", "aria-label": "Attach image", children: _jsx(ImageIcon, { size: 20 }) }), _jsx("button", { onClick: () => cameraInputRef.current?.click(), className: "h-11 w-11 rounded-xl text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center", "aria-label": "Attach using camera", children: _jsx(Camera, { size: 20 }) })] })) })] }), _jsx("input", { ref: fileInputRef, type: "file", className: "hidden", onChange: handleFileSelect, accept: "image/*,video/*,application/pdf,.doc,.docx,.txt,.zip" }), _jsx("input", { ref: cameraInputRef, type: "file", className: "hidden", onChange: handleFileSelect, accept: "image/*,video/*", capture: "environment" }), isVoiceRecording ? (_jsx(VoiceRecorder, { onSend: (audioBlob) => {
                                                        setIsVoiceRecording(false);
                                                        handleSendVoiceNote(audioBlob);
                                                    }, onCancel: () => setIsVoiceRecording(false) })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "relative", children: [_jsx("button", { onClick: () => setIsStickerPickerOpen(!isStickerPickerOpen), className: "h-11 w-11 rounded-xl text-white/55 hover:text-white hover:bg-white/5 flex items-center justify-center transition-colors", "aria-label": "Send sticker", children: _jsx(Smile, { size: 22, className: isStickerPickerOpen ? "text-primary" : "" }) }), isStickerPickerOpen && (_jsx(StickerPicker, { onSelect: handleSendSticker, onClose: () => setIsStickerPickerOpen(false) }))] }), _jsx("input", { type: "text", value: messageText, onChange: (e) => setMessageText(e.target.value), onKeyDown: handleKeyPress, placeholder: isChatPreparing ? "Preparing chat..." : "Type a message", disabled: isTempChat, className: "h-11 min-w-0 flex-1 rounded-xl bg-white/5 border border-white/10 px-4 text-[15px] text-white placeholder:text-white/35 outline-none focus:border-primary/40" }), (!messageText.trim() && !attachment) ? (_jsx("button", { onClick: () => setIsVoiceRecording(true), disabled: isTempChat || sendMessageMutation.isPending, className: "h-11 w-11 rounded-xl text-white hover:bg-white/10 flex items-center justify-center transition-colors shrink-0", "aria-label": "Record voice note", children: _jsx(Mic, { size: 20 }) })) : (_jsx("button", { onClick: handleSend, disabled: isTempChat || sendMessageMutation.isPending, className: "h-11 w-11 rounded-xl bg-primary text-black flex items-center justify-center disabled:opacity-40 shrink-0", "aria-label": "Send message", children: _jsx(Send, { size: 19 }) }))] }))] })] })] })) : (_jsx("div", { className: "flex-1 flex items-center justify-center text-center px-8", children: _jsxs("div", { className: "max-w-md", children: [_jsx("div", { className: "mx-auto h-24 w-24 rounded-3xl border border-white/10 bg-white/5 flex items-center justify-center text-white/40 mb-6", children: _jsx(MessageSquarePlus, { size: 34 }) }), _jsx("h1", { className: "text-3xl font-serif text-white", children: "GoUnion Messages" }), _jsx("p", { className: "mt-3 text-sm leading-6 text-white/40", children: "Select a chat to send and receive messages without leaving this screen." })] }) })) })] }), _jsx(AnimatePresence, { children: isSuggestionsOpen && (_jsxs("div", { className: "fixed inset-0 z-[220] flex items-end justify-center p-0 sm:items-center sm:p-4", children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "absolute inset-0 bg-black/70 backdrop-blur-sm", onClick: () => setIsSuggestionsOpen(false) }), _jsxs(motion.div, { initial: { opacity: 0, y: 24, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 24, scale: 0.98 }, className: "relative flex max-h-[82dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[2rem] border border-white/10 bg-[#0b0b0e] shadow-2xl sm:rounded-[2rem]", children: [_jsxs("div", { className: "flex items-center justify-between border-b border-white/5 p-5", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-black text-white", children: "Suggested contacts" }), _jsx("p", { className: "mt-1 text-xs text-white/40", children: "People with GoUnion accounts you can message." })] }), _jsx("button", { onClick: () => setIsSuggestionsOpen(false), className: "h-10 w-10 rounded-xl text-white/50 hover:bg-white/5 hover:text-white", "aria-label": "Close suggestions", children: _jsx(X, { size: 20 }) })] }), _jsx("div", { className: "border-b border-white/5 p-4", children: _jsxs("button", { type: "button", onClick: importContacts, className: "flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-widest text-white/70 hover:bg-white/10 hover:text-white", children: [_jsx(UserPlus, { size: 16 }), "Check phone contacts"] }) }), _jsx("div", { className: "flex-1 overflow-y-auto p-3", children: suggestionsLoading ? (_jsx("div", { className: "py-12 text-center text-sm text-white/40", children: "Loading contacts..." })) : filteredSuggestedUsers.length === 0 ? (_jsx("div", { className: "py-12 text-center text-sm text-white/40", children: "No account suggestions right now." })) : (filteredSuggestedUsers.map((person) => {
                                        const fromContacts = isFromContacts(person);
                                        return (_jsxs("button", { type: "button", onClick: () => startChatWithUser(person), className: "flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-white/5", children: [_jsx(Avatar, { src: person.avatarUrl, alt: person.fullName, label: person.fullName, className: "h-12 w-12 rounded-full border border-white/10 object-cover" }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "truncate text-sm font-semibold text-white", children: person.fullName }), _jsxs("p", { className: "truncate text-xs text-white/40", children: ["@", person.username] }), fromContacts && (_jsx("p", { className: "mt-1 text-[10px] font-black uppercase tracking-widest text-primary", children: "From your contacts" }))] }), _jsx("span", { className: "rounded-xl bg-primary px-3 py-2 text-[10px] font-black uppercase tracking-widest text-black", children: person.isFollowing ? "Message" : "Follow" })] }, person.id));
                                    })) })] })] })) })] }));
};


