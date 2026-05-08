import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Phone, Video, MoreVertical, Search, ChevronLeft, User, Paperclip, Image as ImageIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../services/api";
import { authStorage } from "../utils/persistentStorage";

export const Messages = () => {
  const queryClient = useQueryClient();
  const currentUserId = authStorage.getItem("user_id");
  const [searchParams, setSearchParams] = useSearchParams();
  const userIdFromQuery = searchParams.get("userId");

  const { data: chats } = useQuery({
    queryKey: ["chats"],
    queryFn: api.chats.getAll,
  });

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file);
      const reader = new FileReader();
      reader.onloadend = () => setAttachmentPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
  };

  const createChatMutation = useMutation({
    mutationFn: (participantId: string) => api.chats.createConversation([participantId]),
    onSuccess: (newChat) => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      setSelectedChatId(newChat.id.toString());
      setSearchParams({}, { replace: true });
    },
  });

  useEffect(() => {
    if (userIdFromQuery && chats) {
      const existingChat = chats.find(c => c.partner.id === userIdFromQuery);
      if (existingChat) {
        setSelectedChatId(existingChat.id);
        setSearchParams({}, { replace: true });
      } else if (!createChatMutation.isPending && !createChatMutation.isSuccess) {
        createChatMutation.mutate(userIdFromQuery);
      }
    }
  }, [userIdFromQuery, chats, createChatMutation.isPending, createChatMutation.isSuccess]);

  const { data: messages } = useQuery({
    queryKey: ["messages", selectedChatId],
    queryFn: () => api.chats.getMessages(selectedChatId!),
    enabled: !!selectedChatId,
    refetchInterval: 5000, 
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ chatId, content, file }: { chatId: string; content?: string; file?: File | null }) =>
      api.chats.sendMessage(chatId, content, file),
    onMutate: async ({ content, file }) => {
      setMessageText("");
      clearAttachment();
      await queryClient.cancelQueries({ queryKey: ["messages", selectedChatId] });
      await queryClient.cancelQueries({ queryKey: ["chats"] });

      const previousMessages = queryClient.getQueryData(["messages", selectedChatId]);
      const previousChats = queryClient.getQueryData(["chats"]);

      const newMessage = {
        id: `temp-${Date.now()}`,
        content,
        imageUrl: file && !file.type.startsWith('video/') ? URL.createObjectURL(file) : null,
        videoUrl: file && file.type.startsWith('video/') ? URL.createObjectURL(file) : null,
        senderId: currentUserId,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: false
      };

      queryClient.setQueryData(["messages", selectedChatId], (old: any) => {
        return old ? [...old, newMessage] : [newMessage];
      });

      queryClient.setQueryData(["chats"], (old: any) => {
        if (!old) return old;
        const chatIndex = old.findIndex((c: any) => c.id === selectedChatId);
        if (chatIndex === -1) return old;

        const updatedChat = {
          ...old[chatIndex],
          lastMessage: content || (file ? (file.type.startsWith('video/') ? '🎥 Video' : '📷 Image') : ''),
          timestamp: newMessage.timestamp
        };

        const newChats = [...old];
        newChats.splice(chatIndex, 1);
        return [updatedChat, ...newChats];
      });

      return { previousMessages, previousChats };
    },
    onSuccess: (newServerMsg) => {
      queryClient.setQueryData(["messages", selectedChatId], (old: any) => {
        const sansTemp = old?.filter((m: any) => !m.id.toString().startsWith('temp-')) || [];
        return [...sansTemp, newServerMsg];
      });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
    onError: (err, variables, context: any) => {
      queryClient.setQueryData(["messages", selectedChatId], context?.previousMessages);
      queryClient.setQueryData(["chats"], context?.previousChats);
    },
  });

  const selectedChat = chats?.find((c) => c.id === selectedChatId);

  const handleSend = () => {
    if ((!messageText.trim() && !attachment) || !selectedChatId) return;
    sendMessageMutation.mutate({
      chatId: selectedChatId,
      content: messageText,
      file: attachment
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex glass-panel rounded-3xl overflow-hidden mt-8">
      {/* Conversation List */}
      <div
        className={`w-full md:w-[350px] border-r border-white/10 flex flex-col ${selectedChatId ? "hidden md:flex" : "flex"}`}
      >
        <div className="p-6 border-b border-white/10">
          <h2 className="font-serif text-3xl text-white mb-4">Messages</h2>
          <div className="relative group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto hide-scrollbar p-2 space-y-1">
          {chats?.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-white/30 text-sm">No messages yet.</p>
            </div>
          )}
          {chats?.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChatId(chat.id)}
              className={`p-4 rounded-2xl flex gap-4 cursor-pointer transition-all relative ${
                selectedChatId === chat.id 
                ? "bg-white/10 shadow-lg" 
                : "hover:bg-white/5"
              }`}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={chat.partner.avatarUrl || `https://ui-avatars.com/api/?name=${chat.partner.fullName}`}
                  alt={chat.partner.username}
                  className="w-12 h-12 rounded-full object-cover border border-white/10"
                />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h4 className="font-medium text-white truncate text-sm">
                    {chat.partner.fullName}
                  </h4>
                  <span className="text-[10px] text-white/30 whitespace-nowrap">
                    {chat.timestamp}
                  </span>
                </div>
                <p className={`text-xs truncate ${chat.unreadCount > 0 ? "text-white font-medium" : "text-white/40"}`}>
                  {chat.lastMessage}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div
        className={`flex-1 flex flex-col bg-white/[0.02] ${!selectedChatId ? "hidden md:flex" : "flex"}`}
      >
        {selectedChat ? (
          <>
            <div className="h-20 px-6 border-b border-white/10 flex items-center justify-between backdrop-blur-md">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedChatId(null)}
                  className="md:hidden p-2 text-white/40"
                >
                  <ChevronLeft size={20} />
                </button>
                <img
                  src={selectedChat.partner.avatarUrl || `https://ui-avatars.com/api/?name=${selectedChat.partner.fullName}`}
                  alt="User"
                  className="w-10 h-10 rounded-full object-cover border border-white/10"
                />
                <div>
                  <h3 className="font-medium text-white text-sm">
                    {selectedChat.partner.fullName}
                  </h3>
                  <p className="text-[10px] text-emerald-400">online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2.5 text-white/40 hover:text-white transition-colors">
                  <Phone size={18} />
                </button>
                <button className="p-2.5 text-white/40 hover:text-white transition-colors">
                  <Video size={18} />
                </button>
                <button className="p-2.5 text-white/40 hover:text-white transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4 hide-scrollbar">
              <AnimatePresence mode="popLayout">
                {messages?.map((msg: any) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.senderId === currentUserId ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[75%] px-1 py-1 rounded-2xl text-sm ${
                      msg.senderId === currentUserId
                        ? "bg-white text-black"
                        : "bg-white/10 text-white"
                    }`}>
                      {msg.imageUrl && (
                        <img src={msg.imageUrl} className="max-w-full rounded-xl mb-1 object-cover" alt="" />
                      )}
                      {msg.videoUrl && (
                        <video src={msg.videoUrl} controls className="max-w-full rounded-xl mb-1" />
                      )}
                      {msg.content && (
                        <div className="px-3 py-1.5">
                          <p className="leading-relaxed">{msg.content}</p>
                        </div>
                      )}
                      <span className={`text-[9px] px-3 pb-1 block opacity-40 ${msg.senderId === currentUserId ? "text-right" : "text-left"}`}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="p-6 pt-0">
              {attachmentPreview && (
                <div className="mb-4 relative inline-block">
                  {attachment?.type.startsWith('video/') ? (
                    <video src={attachmentPreview} className="max-h-32 rounded-xl border border-white/10" />
                  ) : (
                    <img src={attachmentPreview} className="max-h-32 rounded-xl border border-white/10" />
                  )}
                  <button 
                    onClick={clearAttachment}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 focus-within:ring-1 focus-within:ring-white/20 transition-all">
                <label className="p-2 text-white/40 hover:text-white transition-all cursor-pointer">
                  <ImageIcon size={18} />
                  <input type="file" className="hidden" onChange={handleFileSelect} accept="image/*,video/*" />
                </label>
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Send a message..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-white text-sm placeholder:text-white/20"
                />
                <button
                  onClick={handleSend}
                  disabled={sendMessageMutation.isPending || (!messageText.trim() && !attachment)}
                  className="p-2 text-white hover:text-white/80 transition-all disabled:opacity-20"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center opacity-40">
            <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center mb-6">
              <Send size={32} />
            </div>
            <h2 className="font-serif text-2xl text-white mb-2">Direct Messages</h2>
            <p className="text-sm max-w-xs">
              Select a friend from the list to start a conversation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
