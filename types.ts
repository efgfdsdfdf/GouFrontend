export interface User {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  university: string;
  followers: number;
  following: number;
  bio?: string;
  coverUrl?: string;
  isFollowing?: boolean;
  role: 'user' | 'moderator' | 'admin';
  isActive?: boolean;
  totalLikes?: number;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  imageUrl?: string;
  mediaType?: 'text' | 'image' | 'video';
  isReel?: boolean;
  likes: number;
  comments: number;
  timestamp: string;
  isLiked?: boolean;
  groupId?: string;
}

export interface Comment {
  id: string;
  userId: string;
  postId: string;
  content: string;
  createdAt: string;
  user: User;
  likesCount: number;
  isLiked?: boolean;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  imageUrl: string;
  isJoined?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
}

export interface Chat {
  id: string;
  partner: User;
  lastMessage: string;
  unreadCount: number;
  timestamp: string;
}

export interface Notification {
  id: string;
  type: string;
  actor: User;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface Report {
  id: string;
  reason: string;
  userId: string;
  postId?: string;
  commentId?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  user: User;
  post?: Post;
}
