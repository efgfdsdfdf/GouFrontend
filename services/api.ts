/// <reference types="vite/client" />
import axios from 'axios';
import { Notification } from '../types';
import { useAuthStore } from '../store';
import { authStorage } from '../utils/persistentStorage';

const DEFAULT_PROD_API_URL = 'https://gounion-backend.onrender.com';
export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://127.0.0.1:8001' : DEFAULT_PROD_API_URL);

// Create Axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Add interceptor to attach access token
apiClient.interceptors.request.use(
  (config) => {
    const token = authStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add interceptor to handle unauthorized/suspended responses
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isSuspended =
      error.response?.status === 403 &&
      error.response?.data?.detail === "Your account has been suspended.";
    const isUnauthorized = error.response?.status === 401;

    if (isUnauthorized && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = authStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const res = await api.auth.refresh(refreshToken);
          const newAccessToken = res.access_token;
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          console.error("Session refresh failed", refreshError);
        }
      }
    }

    if (isSuspended) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Helper to build full URLs for media
const getFullUrl = (url: string | null) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('blob:')) return url;
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${API_URL}${cleanUrl}`;
};

const isVideoMedia = (url?: string | null) => {
  if (!url) return false;
  return /\.(mp4|webm|mov|m4v|avi|mkv|m3u8)(\?|$)/i.test(url);
};

const seededShuffle = <T extends { id?: string }>(items: T[], seed = Math.random()) => {
  const hash = (value: string) => {
    let h = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      h ^= value.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  return [...items].sort((a, b) => {
    const aScore = hash(`${seed}:${a.id || ''}`);
    const bScore = hash(`${seed}:${b.id || ''}`);
    return aScore - bScore;
  });
};

// Helper to transform user data
export const transformUser = (user: any) => {
  const profile = user.profile || user;
  const username = user.username || profile.username || 'gounion-user';
  return {
    id: user.id,
    username,
    fullName: profile.full_name || user.full_name || user.name || username,
    avatarUrl:
      getFullUrl(profile.profile_picture || user.profile_picture || user.avatarUrl) ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
    university: profile.university || user.university || 'University Student',
    followers: user.followers_count ?? user.followers ?? 0,
    following: user.following_count ?? user.following ?? 0,
    bio: profile.bio || user.bio || '',
    coverUrl: getFullUrl(profile.cover_photo || user.cover_photo || user.coverUrl) || '',
    isFollowing: user.is_following ?? user.isFollowing ?? false,
    role: user.role || 'user',
    isActive: user.is_active ?? true,
    totalLikes: user.total_likes ?? 0,
  };
};

const transformPost = (post: any) => {
  const userStr = authStorage.getItem('user_data');
  const user = userStr ? JSON.parse(userStr) : null;
  const currentUserId = user ? user.id : null;

  const rawMedia = post.video || post.image;
  const isReel = Boolean(post.video);

  return {
    id: post.id.toString(),
    author: transformUser(post.user),
    content: post.caption || '',
    imageUrl: getFullUrl(rawMedia),
    mediaType: isReel ? 'video' : post.image ? 'image' : 'text',
    isReel,
    likes: post.likes_count || 0,
    comments: post.comments?.length || 0,
    timestamp: new Date(post.created_at).toLocaleDateString(),
    isLiked: post.likes?.some((l: any) => l.id === currentUserId) || false,
    groupId: post.group_id?.toString(),
  };
};

const transformProfile = (data: any, usernameFallback = '') => {
  const userData = data.user || data;
  const profile = data.profile || userData.profile || data;
  const username = userData.username || data.username || usernameFallback;

  return {
    id: userData.id || data.user_id || data.id,
    username,
    fullName: profile.full_name || userData.full_name || username,
    avatarUrl:
      getFullUrl(profile.profile_picture) ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
    university: profile.university || 'University Student',
    followers: data.followers_count ?? userData.followers_count ?? 0,
    following: data.following_count ?? userData.following_count ?? 0,
    bio: profile.bio || '',
    coverUrl: getFullUrl(profile.cover_photo) || '',
    isFollowing: data.is_following ?? userData.is_following ?? false,
    role: userData.role || 'user',
    isActive: userData.is_active ?? true,
    totalLikes: data.total_likes ?? userData.total_likes ?? 0,
    course: profile.course || '',
    hometown: profile.hometown || '',
  };
};

const notificationMessage = (notification: any) => {
  if (notification.message) return notification.message;
  switch (notification.type) {
    case 'like':
      return 'liked your post.';
    case 'comment':
      return 'commented on your post.';
    case 'follow':
      return 'started following you.';
    case 'group_invite':
      return 'invited you to a group.';
    case 'group_request':
      return 'requested to join your group.';
    case 'new_message':
      return 'sent you a message.';
    default:
      return 'interacted with you.';
  }
};

export const transformNotification = (notification: any): Notification => {
  const actor = notification.actor || notification.sender || notification.user || {};
  const createdAt = notification.created_at || notification.timestamp;

  return {
    id: notification.id?.toString() || `${notification.type}-${createdAt || Date.now()}`,
    type: notification.type || 'activity',
    actor: transformUser(actor),
    message: notificationMessage(notification),
    timestamp: createdAt
      ? new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : notification.timestamp || 'Now',
    read: notification.read ?? notification.is_read ?? false,
  };
};

export const api = {
  health: {
    check: async () => {
      const res = await apiClient.get('/health');
      return res.data;
    },
  },
  auth: {
    login: async (credentials: any) => {
      const formData = new FormData();
      formData.append('username', credentials.email);
      formData.append('password', credentials.password);

      const res = await apiClient.post('/token', formData);
      const accessToken = res.data.access_token;
      const refreshToken = res.data.refresh_token;
      authStorage.setItem('access_token', accessToken);
      if (refreshToken) {
        authStorage.setItem('refresh_token', refreshToken);
      }

      const userRes = await apiClient.get('/users/me/');
      const transformedUser = transformUser(userRes.data);
      authStorage.setItem('user_data', JSON.stringify(transformedUser));
      authStorage.setItem('user_id', transformedUser.id);

      return { user: transformedUser, access_token: accessToken };
    },
    signup: async (data: any) => {
      await apiClient.post('/users/', {
        username: data.username,
        email: data.email,
        password: data.password,
      });
      return api.auth.login({ email: data.email, password: data.password });
    },
    me: async () => {
      const res = await apiClient.get('/users/me/');
      return transformUser(res.data);
    },
    forgotPassword: async (email: string) => {
      const res = await apiClient.post('/auth/forgot-password', { email });
      return res.data;
    },
    resetPassword: async (token: string, new_password: string) => {
      const res = await apiClient.post('/auth/reset-password', { token, new_password });
      return res.data;
    },
    refresh: async (refreshToken: string) => {
      const res = await apiClient.post('/auth/refresh', { refresh_token: refreshToken });
      const { access_token, refresh_token } = res.data;
      authStorage.setItem('access_token', access_token);
      if (refresh_token) {
        authStorage.setItem('refresh_token', refresh_token);
      }
      return res.data;
    },
  },
  posts: {
    getFeed: async ({ pageParam = 0, seed }: { pageParam?: number; seed?: number } = {}) => {
      const query = new URLSearchParams({
        skip: String(pageParam * 10),
        limit: '10',
      });
      if (typeof seed === 'number') {
        query.set('seed', seed.toFixed(8));
      }
      const res = await apiClient.get(`/posts/feed?${query.toString()}`);
      const posts = res.data
        .map(transformPost)
        .filter((post: any) => !post.isReel && !isVideoMedia(post.imageUrl));
      return seededShuffle(posts, seed);
    },
    getReels: async ({ pageParam = 0, seed }: { pageParam?: number; seed?: number } = {}) => {
      const query = new URLSearchParams({
        skip: String(pageParam * 10),
        limit: '20',
        reels: 'true',
      });
      if (typeof seed === 'number') {
        query.set('seed', seed.toFixed(8));
      }
      const res = await apiClient.get(`/posts/feed?${query.toString()}`);
      const reels = res.data
        .map(transformPost)
        .filter((post: any) => post.isReel || isVideoMedia(post.imageUrl));
      return seededShuffle(reels, seed);
    },
    create: async (data: any) => {
      let mediaUrl = null;
      if (data.image) {
        const formData = new FormData();
        formData.append('file', data.image);
        const uploadRes = await apiClient.post('/upload/', formData);
        mediaUrl = uploadRes.data.url;
      }

      const isVideo = data.image?.type?.startsWith('video/');
      const res = await apiClient.post('/posts/', {
        caption: data.caption,
        image: isVideo ? null : mediaUrl,
        video: isVideo ? mediaUrl : null,
      });
      return transformPost(res.data);
    },
    createFeedPost: async (data: any) => {
      if (data.image?.type?.startsWith('video/')) {
        throw new Error('Feed posts only accept text and photos. Use Discover for reels.');
      }

      let mediaUrl = null;
      if (data.image) {
        const formData = new FormData();
        formData.append('file', data.image);
        const uploadRes = await apiClient.post('/upload/', formData);
        mediaUrl = uploadRes.data.url;
      }

      const res = await apiClient.post('/posts/', {
        caption: data.caption,
        image: mediaUrl,
        video: null,
      });
      return transformPost(res.data);
    },
    createReel: async (data: any) => {
      if (!data.image?.type?.startsWith('video/')) {
        throw new Error('Discover posts must be videos.');
      }

      const formData = new FormData();
      formData.append('file', data.image);
      const uploadRes = await apiClient.post('/upload/', formData);
      const mediaUrl = uploadRes.data.url;

      const res = await apiClient.post('/posts/', {
        caption: data.caption,
        image: null,
        video: mediaUrl,
      });
      return transformPost(res.data);
    },
    like: async (id: string) => {
      const res = await apiClient.post(`/posts/${id}/like`);
      return { success: true, likes_count: res.data.likes_count };
    },
    delete: async (id: string) => {
      const res = await apiClient.delete(`/posts/${id}`);
      return res.data;
    },
    getComments: async (id: string) => {
      const res = await apiClient.get(`/posts/${id}/comments`);
      return res.data;
    },
    createComment: async (id: string, content: string) => {
      const res = await apiClient.post(`/posts/${id}/comments/`, { content });
      return res.data;
    },
    likeComment: async (commentId: string) => {
      const res = await apiClient.post(`/comments/${commentId}/like`);
      return { success: true, likes_count: res.data.likes_count };
    },
  },
  profiles: {
    get: async (username: string) => {
      const cachedUser = authStorage.getItem('user_data');
      const currentUser = cachedUser ? JSON.parse(cachedUser) : null;
      if (currentUser?.username === username) {
        try {
          const res = await apiClient.get('/users/me/');
          return transformProfile(res.data, username);
        } catch {
          return currentUser;
        }
      }

      try {
        const res = await apiClient.get(`/profiles/${username}`);
        return transformProfile(res.data, username);
      } catch (profileError) {
        try {
          const res = await apiClient.get(`/search/users?q=${encodeURIComponent(username)}`);
          const match = res.data.find((u: any) => u.username?.toLowerCase() === username.toLowerCase());
          if (!match) throw profileError;
          return transformProfile(match, username);
        } catch {
          const suggestions = await api.profiles.getSuggestions();
          const match = suggestions.find((u: any) => u.username?.toLowerCase() === username.toLowerCase());
          if (!match) throw profileError;
          return transformProfile(match, username);
        }
      }
    },
    getPosts: async (username: string) => {
      const profile = await api.profiles.get(username);
      const userId = profile.id;
      const res = await apiClient.get(`/users/${userId}/posts?limit=50`);
      return res.data.map(transformPost).filter((post: any) => !post.isReel && !isVideoMedia(post.imageUrl));
    },
    getReels: async (username: string) => {
      const profile = await api.profiles.get(username);
      const userId = profile.id;
      const res = await apiClient.get(`/users/${userId}/posts?limit=50`);
      return res.data.map(transformPost).filter((post: any) => post.isReel || isVideoMedia(post.imageUrl));
    },
    update: async (data: any) => {
      let profile_picture = data.profile_picture;
      let cover_photo = data.cover_photo;

      if (data.avatar) {
        const formData = new FormData();
        formData.append('file', data.avatar);
        const uploadRes = await apiClient.post('/upload/', formData);
        profile_picture = uploadRes.data.url;
      }

      if (data.coverImage) {
        const formData = new FormData();
        formData.append('file', data.coverImage);
        const uploadRes = await apiClient.post('/upload/', formData);
        cover_photo = uploadRes.data.url;
      }

      await apiClient.put('/users/me/profile', {
        full_name: data.fullName,
        bio: data.bio,
        university: data.university,
        profile_picture,
        cover_photo,
      });

      const userRes = await apiClient.get('/users/me/');
      return transformUser(userRes.data);
    },
    follow: async (userId: string) => {
      const res = await apiClient.post(`/users/${userId}/follow`);
      return res.data;
    },
    unfollow: async (userId: string) => {
      const res = await apiClient.post(`/users/${userId}/unfollow`);
      return res.data;
    },
    getFollowing: async (userId: string) => {
      const res = await apiClient.get(`/users/${userId}/following`);
      return res.data.map(transformUser);
    },
    getFollowers: async (userId: string) => {
      const res = await apiClient.get(`/users/${userId}/followers`);
      return res.data.map(transformUser);
    },
    getSuggestions: async () => {
      try {
        const res = await apiClient.get('/users/suggestions');
        return res.data.map(transformUser);
      } catch {
        const res = await apiClient.get('/search/users?q=');
        return res.data
          .map(transformUser)
          .filter((u: any) => String(u.id) !== String(authStorage.getItem('user_id')));
      }
    },
  },
  groups: {
    getAll: async () => {
      const res = await apiClient.get('/groups/');
      return res.data.map((g: any) => ({
        id: g.id.toString(),
        name: g.name,
        description: g.description,
        memberCount: g.member_count || 0,
        imageUrl:
          getFullUrl(g.cover_image) ||
          `https://api.dicebear.com/7.x/identicon/svg?seed=${g.name}`,
        isJoined: false,
        privacy: g.privacy,
      }));
    },
    getById: async (id: string) => {
      const res = await apiClient.get(`/groups/${id}`);
      const g = res.data;
      return {
        id: g.id.toString(),
        name: g.name,
        description: g.description,
        memberCount: g.member_count || 0,
        imageUrl:
          getFullUrl(g.cover_image) ||
          `https://api.dicebear.com/7.x/identicon/svg?seed=${g.name}`,
        isJoined: false,
        privacy: g.privacy,
        creatorId: g.creator_id,
      };
    },
    getMembers: async (id: string) => {
      const res = await apiClient.get(`/groups/${id}/members/`);
      return res.data;
    },
    join: async (id: string) => {
      const res = await apiClient.post(`/groups/${id}/join`);
      return res.data;
    },
    getRequests: async (id: string) => {
      const res = await apiClient.get(`/groups/${id}/requests/`);
      return res.data;
    },
    approveRequest: async (requestId: number, status: 'accepted' | 'rejected') => {
      const res = await apiClient.post(`/groups/requests/${requestId}/approve?status=${status}`);
      return res.data;
    },
    create: async (data: any) => {
      let cover_image = null;
      if (data.image) {
        const formData = new FormData();
        formData.append('file', data.image);
        const uploadRes = await apiClient.post('/upload/', formData);
        cover_image = uploadRes.data.url;
      }
      const res = await apiClient.post('/groups/', {
        name: data.name,
        description: data.description,
        privacy: data.privacy,
        cover_image,
      });
      return res.data;
    },
    getPosts: async (id: string) => {
      const res = await apiClient.get(`/groups/${id}/posts/`);
      return res.data.map(transformPost);
    },
    createPost: async (id: string, data: any) => {
      let imageUrl = null;
      if (data.image) {
        const formData = new FormData();
        formData.append('file', data.image);
        const uploadRes = await apiClient.post('/upload/', formData);
        imageUrl = uploadRes.data.url;
      }
      const res = await apiClient.post(`/groups/${id}/posts/`, {
        caption: data.caption,
        image: imageUrl,
      });
      return transformPost(res.data);
    },
    updateGroup: async (id: string, file?: File | null) => {
      let cover_url = undefined;
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await apiClient.post('/upload/', formData);
        cover_url = uploadRes.data.url;
      }
      const res = await apiClient.put(
        `/groups/${id}${cover_url ? `?cover_image=${encodeURIComponent(cover_url)}` : ''}`,
      );
      return res.data;
    },
    updateMemberRole: async (groupId: string, userId: string, role: string) => {
      const res = await apiClient.put(`/groups/${groupId}/members/${userId}/role?role=${role}`);
      return res.data;
    },
    kickMember: async (groupId: string, userId: string) => {
      const res = await apiClient.delete(`/groups/${groupId}/members/${userId}`);
      return res.data;
    },
  },
  search: {
    users: async (query: string) => {
      const res = await apiClient.get(`/search/users?q=${encodeURIComponent(query)}`);
      return res.data.map(transformUser);
    },
    posts: async (query: string) => {
      const res = await apiClient.get(`/search/posts?q=${encodeURIComponent(query)}`);
      return res.data.map(transformPost);
    },
    groups: async (query: string) => {
      const res = await apiClient.get(`/search/groups?q=${encodeURIComponent(query)}`);
      return res.data.map((g: any) => ({
        id: g.id.toString(),
        name: g.name,
        description: g.description,
        memberCount: g.member_count || 0,
        imageUrl:
          getFullUrl(g.cover_image) ||
          `https://api.dicebear.com/7.x/identicon/svg?seed=${g.name}`,
        isJoined: false,
        privacy: g.privacy,
      }));
    },
  },
  friends: {
    getAll: async () => {
      const res = await apiClient.get('/friends/');
      return res.data.map(transformUser);
    },
    sendRequest: async (userId: string) => {
      const res = await apiClient.post(`/friend-request/${userId}`);
      return res.data;
    },
  },
  chats: {
    getAll: async () => {
      const res = await apiClient.get('/conversations/');
      const currentUserId = authStorage.getItem('user_id');
      return res.data.map((c: any) => ({
        id: c.id.toString(),
        partner: transformUser(
          c.participants.find((p: any) => String(p.id) !== String(currentUserId)) ||
            c.participants[0],
        ),
        lastMessage: c.messages?.[c.messages.length - 1]?.content || 'No messages yet',
        timestamp: c.messages?.[c.messages.length - 1]
          ? new Date(c.messages[c.messages.length - 1].created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '',
        unreadCount: 0,
      }));
    },
    getMessages: async (conversationId: string) => {
      const res = await apiClient.get(`/conversations/${conversationId}/messages/`);
      return res.data.map((m: any) => ({
        id: m.id.toString(),
        content: m.content,
        imageUrl: getFullUrl(m.image_url),
        videoUrl: getFullUrl(m.video_url),
        senderId: m.sender_id,
        timestamp: new Date(m.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isRead: m.is_read,
      }));
    },
    sendMessage: async (conversationId: string, content?: string, file?: File | null) => {
      let imageUrl = null;
      let videoUrl = null;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await apiClient.post('/upload/', formData);
        const url = uploadRes.data.url;
        if (file.type.startsWith('video/')) videoUrl = url;
        else imageUrl = url;
      }

      const res = await apiClient.post(`/conversations/${conversationId}/messages/`, {
        conversation_id: Number(conversationId),
        content,
        image_url: imageUrl,
        video_url: videoUrl,
      });
      const m = res.data;
      return {
        id: m.id.toString(),
        content: m.content,
        imageUrl: getFullUrl(m.image_url),
        videoUrl: getFullUrl(m.video_url),
        senderId: m.sender_id,
        timestamp: new Date(m.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isRead: m.is_read,
      };
    },
    createConversation: async (participantIds: string[], name?: string) => {
      const currentUserId = authStorage.getItem('user_id');
      const participant_ids = Array.from(
        new Set([...(currentUserId ? [currentUserId] : []), ...participantIds].map(String)),
      );
      const res = await apiClient.post('/conversations/', { participant_ids, name });
      return res.data;
    },
  },
  notifications: {
    getAll: async () => {
      const res = await apiClient.get('/notifications/');
      return res.data.map(transformNotification);
    },
    getUnreadCount: async () => {
      const res = await apiClient.get('/notifications/unread-count');
      return res.data;
    },
    markRead: async () => {
      const res = await apiClient.post('/notifications/read');
      return res.data;
    },
  },
  reports: {
    create: async (data: { reason: string; postId?: number; commentId?: number }) => {
      const res = await apiClient.post('/reports/', data);
      return res.data;
    },
    getAll: async () => {
      const res = await apiClient.get('/reports/');
      return res.data;
    },
    resolve: async (id: number, status: string) => {
      const res = await apiClient.post(`/reports/${id}/resolve?status=${status}`);
      return res.data;
    },
  },
  admin: {
    getStats: async () => {
      const res = await apiClient.get('/admin/stats');
      return res.data;
    },
    getUsers: async () => {
      const res = await apiClient.get('/admin/users');
      return res.data.map(transformUser);
    },
    updateRole: async (userId: string, role: string) => {
      const res = await apiClient.put(`/admin/users/${userId}/role?role=${role}`);
      return res.data;
    },
    toggleActive: async (userId: string) => {
      const res = await apiClient.post(`/admin/users/${userId}/toggle-active`);
      return res.data;
    },
  },
  stories: {
    getFeed: async () => {
      const res = await apiClient.get('/stories/feed');
      return res.data.map((s: any) => ({
        id: s.id.toString(),
        user: transformUser(s.user),
        content: s.content,
        imageUrl: getFullUrl(s.image_url),
        timestamp: new Date(s.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        likesCount: s.likes?.length || 0,
        viewsCount: s.views?.length || 0,
        isLiked: s.likes?.some((l: any) => String(l.user_id) === String(authStorage.getItem('user_id'))),
      }));
    },
    create: async (data: any) => {
      let imageUrl = null;
      if (data.image) {
        const formData = new FormData();
        formData.append('file', data.image);
        const uploadRes = await apiClient.post('/upload/', formData);
        imageUrl = uploadRes.data.url;
      }
      const res = await apiClient.post('/stories/', {
        content: data.content,
        image_url: imageUrl,
      });
      return res.data;
    },
    view: async (id: string) => {
      await apiClient.post(`/stories/${id}/view`);
    },
    like: async (id: string) => {
      const res = await apiClient.post(`/stories/${id}/like`);
      return res.data;
    },
  },
};
