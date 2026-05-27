import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Camera,
  CheckCheck,
  Image as ImageIcon,
  MessageSquarePlus,
  MoreVertical,
  Paperclip,
  Plus,
  Search,
  Send,
  Share2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../services/api";
import { authStorage } from "../utils/persistentStorage";

export const Messages = () => {
  const queryClient = useQueryClient();
  const currentUserId = authStorage.getItem("user_id");
  const [searchParams, setSearchParams] = useSearchParams();
  const userIdFromQuery = searchParams.get("userId");
  const queryUsername = searchParams.get("username") || "";
  const queryName = searchParams.get("name") || queryUsername || "New chat";
  const queryAvatar = searchParams.get("avatar") || "";
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchText, setSearchText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia("(min-width: 768px)").matches);

  const { data: chats = [], isLoading: chatsLoading } = useQuery({
    queryKey: ["chats"],
    queryFn: api.chats.getAll,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    staleTime: 30000,
  });

  const createChatMutation = useMutation({
    mutationFn: (participantId: string) => api.chats.createConversation([participantId]),
    onSuccess: (newChat) => {
      const normalizedChat = {
        id: newChat.id.toString(),
        partner: newChat.partner || {
          id: userIdFromQuery,
          username: queryUsername,
          fullName: queryName,
          avatarUrl: queryAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${queryUsername || userIdFromQuery}`,
        },
        lastMessage: "No messages yet",
        timestamp: "",
        unreadCount: 0,
      };
      queryClient.setQueryData(["chats"], (old: any[] = []) => {
        const withoutTemp = old.filter((chat) => !chat.id.toString().startsWith("temp-"));
        return [normalizedChat, ...withoutTemp.filter((chat) => chat.id !== normalizedChat.id)];
      });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      setSelectedChatId(normalizedChat.id);
      setSearchParams({}, { replace: true });
    },
  });

  useEffect(() => {
    if (!isDesktop || selectedChatId || !chats.length || userIdFromQuery) return;
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
    if (!userIdFromQuery || !chats) return;
    const existingChat = chats.find((chat: any) => String(chat.partner.id) === String(userIdFromQuery));
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
          avatarUrl: queryAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${queryUsername || userIdFromQuery}`,
        },
        lastMessage: "Starting conversation...",
        timestamp: "",
        unreadCount: 0,
      };
      queryClient.setQueryData(["chats"], (old: any[] = []) => {
        if (old.some((chat) => chat.id === tempChatId || String(chat.partner.id) === String(userIdFromQuery))) return old;
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

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", selectedChatId],
    queryFn: () => api.chats.getMessages(selectedChatId!),
    enabled: !!selectedChatId && !selectedChatId.startsWith("temp-"),
    refetchInterval: 2500,
    refetchOnWindowFocus: true,
    staleTime: 30000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, selectedChatId]);

  const selectedChat = chats.find((chat: any) => chat.id === selectedChatId);
  const isChatPreparing = Boolean(selectedChatId?.startsWith("temp-"));
  const filteredChats = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((chat: any) => {
      const name = `${chat.partner.fullName} ${chat.partner.username}`.toLowerCase();
      return name.includes(q);
    });
  }, [chats, searchText]);

  const clearAttachment = () => {
    if (attachmentPreview?.startsWith("blob:")) URL.revokeObjectURL(attachmentPreview);
    setAttachment(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    clearAttachment();
    setAttachment(file);
    setAttachmentPreview(URL.createObjectURL(file));
    setIsAttachMenuOpen(false);
  };

  const inviteContacts = async () => {
    const inviteText = "Join me on GoUnion. Download/open the app and let's connect.";
    const inviteUrl = window.location.origin;
    try {
      const nav = navigator as Navigator & {
        contacts?: {
          select: (properties: string[], options?: { multiple?: boolean }) => Promise<Array<{ name?: string[]; tel?: string[]; email?: string[] }>>;
        };
      };

      if (nav.contacts?.select) {
        await nav.contacts.select(["name", "tel", "email"], { multiple: true });
      }

      if (navigator.share) {
        await navigator.share({ title: "Join GoUnion", text: inviteText, url: inviteUrl });
      } else {
        await navigator.clipboard.writeText(`${inviteText}\n${inviteUrl}`);
        alert("Invite link copied.");
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Invite failed", err);
      }
    }
  };

  const sendMessageMutation = useMutation({
    mutationFn: ({ chatId, content, file }: { chatId: string; content?: string; file?: File | null }) =>
      api.chats.sendMessage(chatId, content, file),
    onMutate: async ({ content, file }) => {
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
        imageUrl: file && !file.type.startsWith("video/") ? previewUrl : null,
        videoUrl: file && file.type.startsWith("video/") ? previewUrl : null,
        senderId: currentUserId,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isRead: false,
      };

      queryClient.setQueryData(["messages", activeChatId], (old: any) =>
        old ? [...old, optimisticMessage] : [optimisticMessage],
      );

      queryClient.setQueryData(["chats"], (old: any) => {
        if (!old) return old;
        const chatIndex = old.findIndex((chat: any) => chat.id === activeChatId);
        if (chatIndex === -1) return old;
        const updatedChat = {
          ...old[chatIndex],
          lastMessage: content || (file ? (file.type.startsWith("video/") ? "Video" : "Photo") : ""),
          timestamp: optimisticMessage.timestamp,
        };
        const nextChats = [...old];
        nextChats.splice(chatIndex, 1);
        return [updatedChat, ...nextChats];
      });

      return { previousMessages, previousChats, activeChatId };
    },
    onSuccess: (newServerMsg, _vars, context) => {
      queryClient.setQueryData(["messages", context?.activeChatId], (old: any) => {
        const sansTemp = old?.filter((m: any) => !m.id.toString().startsWith("temp-")) || [];
        return [...sansTemp, newServerMsg];
      });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
    onError: (_err, _variables, context: any) => {
      queryClient.setQueryData(["messages", context?.activeChatId], context?.previousMessages);
      queryClient.setQueryData(["chats"], context?.previousChats);
    },
  });

  const handleSend = () => {
    if ((!messageText.trim() && !attachment) || !selectedChatId || isChatPreparing) return;
    sendMessageMutation.mutate({
      chatId: selectedChatId,
      content: messageText.trim(),
      file: attachment,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-[#030303] text-white overflow-hidden">
      <div className="h-full flex">
        <aside
          className={`w-full md:w-[390px] md:min-w-[390px] bg-[#050505]/95 border-r border-white/10 flex-col ${
            selectedChatId ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="h-16 px-4 bg-[#0a0a0c]/95 border-b border-white/5 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-primary text-black flex items-center justify-center font-black shadow-lg shadow-primary/20">
                G
              </div>
              <div className="min-w-0">
                <p className="font-semibold leading-none">GoUnion Chats</p>
                <p className="text-xs text-white/40 mt-1">Messages stay in sync live</p>
              </div>
            </Link>
            <button
              onClick={inviteContacts}
              className="h-10 w-10 rounded-xl text-white/50 hover:text-white hover:bg-white/5 flex items-center justify-center"
              aria-label="Invite contacts"
              title="Invite contacts"
            >
              <MoreVertical size={20} />
            </button>
          </div>

          <div className="p-3 bg-[#050505]">
            <div className="h-10 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 px-4">
              <Search size={18} className="text-white/40" />
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search or start new chat"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/35 outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {chatsLoading ? (
              <div className="flex-1 flex items-center justify-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center font-serif font-black text-3xl text-white/20 animate-pulse border border-white/10">
                  G
                </div>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="px-8 py-20 text-center text-white/40 text-sm">
                No chats yet. Open a profile and tap the message button to start one.
              </div>
            ) : (
              filteredChats.map((chat: any) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChatId(chat.id)}
                  className={`w-full h-[72px] px-4 flex items-center gap-3 text-left border-b border-white/5 transition-colors ${
                    selectedChatId === chat.id ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <img
                    src={chat.partner.avatarUrl || `https://ui-avatars.com/api/?name=${chat.partner.fullName}`}
                    alt={chat.partner.fullName}
                    className="h-12 w-12 rounded-full object-cover bg-white/10 border border-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[15px] text-white truncate">{chat.partner.fullName}</p>
                      <span className="text-[11px] text-white/35 shrink-0">{chat.timestamp}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <p className="text-sm text-white/45 truncate">{chat.lastMessage}</p>
                      {chat.unreadCount > 0 && (
                        <span className="h-5 min-w-5 rounded-full bg-primary px-1.5 text-[10px] text-black font-bold flex items-center justify-center">
                          {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className={`flex-1 bg-[#030303] flex-col ${selectedChatId ? "flex" : "hidden md:flex"}`}>
          {selectedChat ? (
            <>
              <header className="h-16 px-3 md:px-5 bg-[#0a0a0c]/95 flex items-center gap-3 border-b border-white/5">
                <button
                  onClick={() => setSelectedChatId(null)}
                  className="md:hidden h-10 w-10 rounded-xl text-white/60 hover:text-white hover:bg-white/5 flex items-center justify-center"
                  aria-label="Back to chats"
                >
                  <ArrowLeft size={21} />
                </button>
                <img
                  src={selectedChat.partner.avatarUrl}
                  alt={selectedChat.partner.fullName}
                  className="h-10 w-10 rounded-full object-cover bg-white/10 border border-white/10"
                />
                <Link to={`/profile/${selectedChat.partner.username}`} className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium text-white truncate">{selectedChat.partner.fullName}</p>
                  <p className="text-xs truncate transition-colors">
                    {selectedChat.partner.isOnline ? (
                      <span className="text-green-500 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Online
                      </span>
                    ) : selectedChat.partner.lastSeen ? (
                      <span className="text-white/40">Last seen {selectedChat.partner.lastSeen}</span>
                    ) : (
                      <span className="text-white/40">Offline • Tap for profile</span>
                    )}
                  </p>
                </Link>
                <button
                  onClick={inviteContacts}
                  className="h-10 w-10 rounded-xl text-white/50 hover:text-white hover:bg-white/5 flex items-center justify-center"
                  aria-label="Invite contacts"
                  title="Invite contacts"
                >
                  <Share2 size={20} />
                </button>
                <button className="h-10 w-10 rounded-xl text-white/50 hover:text-white hover:bg-white/5 flex items-center justify-center">
                  <MoreVertical size={20} />
                </button>
              </header>

              <div className="relative flex-1 overflow-y-auto px-3 md:px-10 py-6">
                <div className="absolute inset-0 opacity-60 pointer-events-none bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.05),transparent_25%),radial-gradient(circle_at_85%_30%,rgba(196,255,14,0.04),transparent_22%)]" />
                <div className="relative space-y-2">
                  {(messagesLoading || isChatPreparing) ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-white/30 animate-bounce [animation-delay:-0.2s]" />
                        <span className="h-2 w-2 rounded-full bg-white/30 animate-bounce [animation-delay:-0.1s]" />
                        <span className="h-2 w-2 rounded-full bg-white/30 animate-bounce" />
                      </div>
                    </div>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {messages.map((msg: any) => {
                        const mine = String(msg.senderId) === String(currentUserId);
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${mine ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[82%] sm:max-w-[70%] rounded-2xl px-3 py-2 shadow-md border ${
                                mine ? "bg-primary text-black border-primary/50" : "bg-white/[0.08] text-white border-white/10"
                              }`}
                            >
                              {msg.imageUrl && (
                                <img src={msg.imageUrl} className="max-h-80 rounded-md mb-1 object-cover" alt="" />
                              )}
                              {msg.videoUrl && (
                                <video src={msg.videoUrl} controls className="max-h-80 rounded-md mb-1" />
                              )}
                              {msg.content && <p className="px-1 pt-1 text-[14px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                              <div className="flex items-center justify-end gap-1 pl-10 mt-0.5">
                                <span className={`text-[10px] ${mine ? "text-black/55" : "text-white/45"}`}>{msg.timestamp}</span>
                                {mine && <CheckCheck size={14} className={msg.isRead ? "text-black" : "text-black/55"} />}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                  <div ref={bottomRef} />
                </div>
              </div>

              <footer className="bg-[#0a0a0c]/95 border-t border-white/5 px-3 py-2">
                {attachmentPreview && (
                  <div className="mx-2 mb-2 w-fit relative">
                    {attachment?.type.startsWith("video/") ? (
                      <video src={attachmentPreview} className="h-28 rounded-lg border border-white/10" />
                    ) : (
                      <img src={attachmentPreview} className="h-28 rounded-lg border border-white/10 object-cover" alt="" />
                    )}
                    <button
                      onClick={clearAttachment}
                      className="absolute -top-2 -right-2 h-7 w-7 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setIsAttachMenuOpen((prev) => !prev)}
                      className="h-11 w-11 rounded-xl text-white/55 hover:text-white hover:bg-white/5 flex items-center justify-center"
                      aria-label="Open attachments"
                    >
                      <Plus size={22} className={`transition-transform ${isAttachMenuOpen ? "rotate-45" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {isAttachMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.96 }}
                          className="absolute bottom-14 left-0 rounded-2xl border border-white/10 bg-[#111114] p-2 shadow-2xl flex gap-2"
                        >
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="h-11 w-11 rounded-xl text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center"
                            aria-label="Attach file"
                          >
                            <Paperclip size={21} />
                          </button>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="h-11 w-11 rounded-xl text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center"
                            aria-label="Attach image"
                          >
                            <ImageIcon size={20} />
                          </button>
                          <button
                            onClick={() => cameraInputRef.current?.click()}
                            className="h-11 w-11 rounded-xl text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center"
                            aria-label="Attach using camera"
                          >
                            <Camera size={20} />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="image/*,video/*,application/pdf"
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="image/*,video/*"
                    capture="environment"
                  />
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={isChatPreparing ? "Preparing chat..." : "Type a message"}
                    disabled={isChatPreparing}
                    className="h-11 min-w-0 flex-1 rounded-xl bg-white/5 border border-white/10 px-4 text-[15px] text-white placeholder:text-white/35 outline-none focus:border-primary/40"
                  />
                  <button
                    onClick={handleSend}
                    disabled={isChatPreparing || sendMessageMutation.isPending || (!messageText.trim() && !attachment)}
                    className="h-11 w-11 rounded-xl bg-primary text-black flex items-center justify-center disabled:opacity-40 shrink-0"
                  >
                    <Send size={19} />
                  </button>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center px-8">
              <div className="max-w-md">
                <div className="mx-auto h-24 w-24 rounded-3xl border border-white/10 bg-white/5 flex items-center justify-center text-white/40 mb-6">
                  <MessageSquarePlus size={34} />
                </div>
                <h1 className="text-3xl font-serif text-white">GoUnion Messages</h1>
                <p className="mt-3 text-sm leading-6 text-white/40">
                  Select a chat to send and receive messages without leaving this screen.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
