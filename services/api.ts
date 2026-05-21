/// <reference types="vite/client" />
import axios from 'axios';
import { useAuthStore } from '../store';
import { authStorage } from '../utils/persistentStorage';

const DEFAULT_PROD_API_URL = 'https://gounion-backend.onrender.com';
export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://127.0.0.1:8001' : DEFAULT_PROD_API_URL);

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = authStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add interceptor to handle unauthorized/suspended responses
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isSuspended = error.response?.status === 403 && error.response?.data?.detail === "Your account has been suspended.";
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
          // Keep the saved session until the user explicitly logs out.
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

// Helper to transform user data
export const transformUser = (user: any) => {
  return {
    id: user.id,
    username: user.username,
    fullName: user.profile?.full_name || user.username,
    avatarUrl: getFullUrl(user.profile?.profile_picture) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
    university: user.profile?.university || 'University Student',
    followers: 0,
    following: 0,
    bio: user.profile?.bio || '',
    coverUrl: getFullUrl(user.profile?.cover_photo) || '',
    isFollowing: false,
    role: user.role || 'user',
    isActive: user.is_active ?? true,
    totalLikes: user.total_likes ?? 0,
  };
};

const transformPost = (post: any) => {
  const userStr = authStorage.getItem('user_data');
  const user = userStr ? JSON.parse(userStr) : null;
  const currentUserId = user ? user.id : null;

  // Support both 'image' and 'video' fields from the backend
  const rawMedia = post.video || post.image;

  return {
    id: post.id.toString(),
    author: transformUser(post.user),
    content: post.caption || '',
    imageUrl: getFullUrl(rawMedia),   // kept as imageUrl for compatibility; MediaPlayer auto-detects type
    likes: post.likes_count || 0,
    comments: post.comments?.length || 0,
    timestamp: new Date(post.created_at).toLocaleDateString(),
    isLiked: post.likes?.some((l: any) => l.id === currentUserId) || false,
    groupId: post.group_id?.toString(),
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
      formData.append('username', credentials.email); // OAuth2 expects username
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
      const res = await apiClient.post('/users/', {
        username: data.username,
        email: data.email,
        password: data.password
      });
      
      // Auto-login after signup
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
    getFeed: async ({ pageParam = 0 }: { pageParam?: number } = {}) => {
      const query = new URLSearchParams({
        skip: String(pageParam * 10),
        limit: "10",
      });
      const res = await apiClient.get(`/posts/feed?${query.toString()}`);
      return res.data.map(transformPost);
    },
    getReels: async ({ pageParam = 0 }: { pageParam?: number } = {}) => {
      const query = new URLSearchParams({
        skip: String(pageParam * 10),
        limit: "20",
        reels: "true",
      });
      const res = await apiClient.get(`/posts/feed?${query.toString()}`);
      return res.data.map(transformPost);
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
    like: async (id: string) => {
      const res = await apiClient.post(`/posts/${id}/like`);
      return { success: true, likes_count: res.data.likes_count };
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
    }
  },
  profiles: {
    get: async (username: string) => {
      const res = await apiClient.get(`/profiles/${username}`);
      const d = res.data;
      return {
        id: d.user_id,
        username: d.username || username,
        fullName: d.full_name || d.username || username,
        avatarUrl: getFullUrl(d.profile_picture) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        university: d.university || 'University Student',
        followers: d.followers_count ?? 0,
        following: d.following_count ?? 0,
        bio: d.bio || '',
        coverUrl: getFullUrl(d.cover_photo) || '',
        isFollowing: d.is_following ?? false,
        course: d.course || '',
        hometown: d.hometown || '',
        totalLikes: d.total_likes ?? 0,
      };
    },
    getPosts: async (username: string) => {
      // First get the user's ID from their profile
      const profileRes = await apiClient.get(`/profiles/${username}`);
      const userId = profileRes.data.user_id;
      // Use dedicated server-side endpoint for efficiency
      const res = await apiClient.get(`/users/${userId}/posts?limit=50`);
      return res.data.map(transformPost);
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

      const res = await apiClient.put('/profiles/me', {
        full_name: data.fullName,
        bio: data.bio,
        university: data.university,
        profile_picture: profile_picture,
        cover_photo: cover_photo
      });
      
      // Profiles/me returns the profile object, but we need the user object for transformUser
      // Let's refetch me or just handle it. 
      // Actually, transformUser expects user structure. 
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
      const res = await apiClient.get('/search/users?q=');
      return res.data.map(transformUser).filter((u: any) => u.id !== authStorage.getItem('user_id'));
    }
  },
  groups: {
    getAll: async () => {
      const res = await apiClient.get('/groups/');
      return res.data.map((g: any) => ({
        id: g.id.toString(),
        name: g.name,
        description: g.description,
        memberCount: g.member_count || 0,
        imageUrl: getFullUrl(g.cover_image) || `https://api.dicebear.com/7.x/identicon/svg?seed=${g.name}`,
        isJoined: false,
        privacy: g.privacy
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
        imageUrl: getFullUrl(g.cover_image) || `https://api.dicebear.com/7.x/identicon/svg?seed=${g.name}`,
        isJoined: false,
        privacy: g.privacy,
        creatorId: g.creator_id
      };
    },
    getMembers: async (id: string) => {
      const res = await apiClient.get(`/groups/${id}/members/`);
      return res.data;
    },
    join: async (id: string) => {
      const res = await apiClient.post(`/groups/${id}/join`);
      return res.data; // { status: 'joined' | 'pending', message: string }
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
        cover_image: cover_image
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
        image: imageUrl
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
      const res = await apiClient.put(`/groups/${id}${cover_url ? `?cover_image=${encodeURIComponent(cover_url)}` : ''}`);
      return res.data;
    },
    updateMemberRole: async (groupId: string, userId: string, role: string) => {
      const res = await apiClient.put(`/groups/${groupId}/members/${userId}/role?role=${role}`);
      return res.data;
    },
    kickMember: async (groupId: string, userId: string) => {
      const res = await apiClient.delete(`/groups/${groupId}/members/${userId}`);
      return res.data;
    }
  },
  search: {
    users: async (query: string) => {
      const res = await apiClient.get(`/search/users?q=${encodeURIComponent(query)}`);
      return res.data.map(transformUser);
    }
  },
  friends: {
    getAll: async () => {
      const res = await apiClient.get('/friends/');
      return res.data.map(transformUser);
    },
    sendRequest: async (userId: string) => {
      const res = await apiClient.post(`/friend-request/${userId}`);
      return res.data;
    }
  },
  chats: {
    getAll: async () => {
      const res = await apiClient.get('/conversations/');
      const currentUserId = authStorage.getItem('user_id');
      return res.data.map((c: any) => ({
        id: c.id.toString(),
        partner: transformUser(c.participants.find((p: any) => p.id !== currentUserId) || c.participants[0]),
        lastMessage: c.messages?.[c.messages.length - 1]?.content || 'No messages yet',
        timestamp: c.messages?.[c.messages.length - 1] ? new Date(c.messages[c.messages.length - 1].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
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
        timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: m.is_read
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
        content,
        image_url: imageUrl,
        video_url: videoUrl 
      });
      return res.data;
    },
    createConversation: async (participantIds: string[], name?: string) => {
      const res = await apiClient.post('/conversations/', { participant_ids: participantIds, name });
      return res.data;
    }
  },
  notifications: {
    getAll: async () => {
      const res = await apiClient.get('/notifications/');
      return res.data;
    },
    getUnreadCount: async () => {
      const res = await apiClient.get('/notifications/unread-count');
      return res.data;
    },
    markRead: async () => {
      const res = await apiClient.post('/notifications/read');
      return res.data;
    }
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
    }
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
    }
  },
  stories: {
    getFeed: async () => {
      const res = await apiClient.get('/stories/feed');
      return res.data.map((s: any) => ({
        id: s.id.toString(),
        user: transformUser(s.user),
        content: s.content,
        imageUrl: getFullUrl(s.image_url),
        timestamp: new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        likesCount: s.likes?.length || 0,
        viewsCount: s.views?.length || 0,
        isLiked: s.likes?.some((l: any) => l.user_id === authStorage.getItem('user_id')),
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
        image_url: imageUrl
      });
      return res.data;
    },
    view: async (id: string) => {
      await apiClient.post(`/stories/${id}/view`);
    },
    like: async (id: string) => {
      const res = await apiClient.post(`/stories/${id}/like`);
      return res.data;
    }
  },
};
