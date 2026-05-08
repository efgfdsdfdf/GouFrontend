import { User, Post, Group, Chat, Notification } from '../types';

export const MOCK_USER: User = {
  id: '1',
  username: 'alex_rivers',
  fullName: 'Alex Rivers',
  avatarUrl: 'https://picsum.photos/seed/alex/200',
  university: 'Stanford University',
  followers: 1240,
  following: 450,
  bio: 'CS Senior 🎓 | Building the future of social tech 🚀',
  coverUrl: 'https://picsum.photos/seed/cover1/1200/400'
};

export const MOCK_POSTS: Post[] = [
  {
    id: '101',
    author: MOCK_USER,
    content: 'Just shipped the beta version of our new project! 🚀 Check it out properly when you have time. #coding #startup',
    imageUrl: 'https://picsum.photos/seed/code/800/500',
    likes: 342,
    comments: 24,
    timestamp: '2 hours ago',
    isLiked: false,
  },
  {
    id: '102',
    author: { ...MOCK_USER, id: '2', fullName: 'Sarah Chen', username: 'schen_ai', avatarUrl: 'https://picsum.photos/seed/sarah/200' },
    content: 'The library is so peaceful tonight. Final exams prep in full swing! 📚☕',
    likes: 156,
    comments: 12,
    timestamp: '4 hours ago',
    isLiked: true,
  },
  {
    id: '103',
    author: { ...MOCK_USER, id: '3', fullName: 'James Wilson', username: 'j_wilson', avatarUrl: 'https://picsum.photos/seed/james/200' },
    content: 'Does anyone have the notes for CS101 lecture today?',
    likes: 15,
    comments: 42,
    timestamp: '5 hours ago',
    isLiked: false,
  }
];

export const MOCK_GROUPS: Group[] = [
  { id: '1', name: 'Computer Science Society', description: 'Official CS community.', memberCount: 5420, imageUrl: 'https://picsum.photos/seed/tech/100', isJoined: true },
  { id: '2', name: 'University Photography', description: 'Capture the moment.', memberCount: 1200, imageUrl: 'https://picsum.photos/seed/photo/100', isJoined: false },
  { id: '3', name: 'Startups & VCs', description: 'Network with future founders.', memberCount: 3400, imageUrl: 'https://picsum.photos/seed/startup/100', isJoined: false },
  { id: '4', name: 'Hiking Club', description: 'Weekend trails and vibes.', memberCount: 890, imageUrl: 'https://picsum.photos/seed/hike/100', isJoined: true },
];

export const MOCK_CHATS: Chat[] = [
  { id: '1', partner: { ...MOCK_USER, id: '2', fullName: 'Sarah Chen' }, lastMessage: 'See you at the hackathon!', unreadCount: 2, timestamp: '10m' },
  { id: '2', partner: { ...MOCK_USER, id: '3', fullName: 'James Wilson' }, lastMessage: 'Thanks for the notes.', unreadCount: 0, timestamp: '1h' },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'like', actor: { ...MOCK_USER, id: '2', fullName: 'Sarah Chen' }, message: 'liked your post', timestamp: '2m', read: false },
  { id: '2', type: 'comment', actor: { ...MOCK_USER, id: '3', fullName: 'James Wilson' }, message: 'commented on your post', timestamp: '1h', read: false },
  { id: '3', type: 'follow', actor: { ...MOCK_USER, id: '4', fullName: 'Emily Davis' }, message: 'started following you', timestamp: '3h', read: true },
  { id: '4', type: 'like', actor: { ...MOCK_USER, id: '5', fullName: 'Michael Brown' }, message: 'liked your post', timestamp: '5h', read: false },
];
