# GoUnion 🎓

GoUnion is a premium, high-performance social networking platform designed specifically for the university ecosystem. It connects students through real-time communication, campus-wide feeds, dedicated interest groups, and interactive stories.

## ✨ Core Features

### 📱 User Experience
- **Dynamic Feed**: A curated stream of platform-wide and university-specific content.
- **Premium Media Player**: Custom-built video and image player with glassmorphism aesthetics and smooth animations.
- **Interactive Stories**: 24-hour ephemeral content sharing with view and like tracking.
- **Real-time Messaging**: Robust conversation system for 1-on-1 and group chats.
- **University Profiles**: Detailed student profiles including graduation year, course, university, and hometown.

### 👥 Communities
- **Interest Groups**: Create and join public or private groups with dedicated feeds and membership management.
- **Friends & Follows**: Flexible social graph supporting both mutual friendships and one-way following.
- **Mutual Discovery**: Smart suggestions based on university and interests.

### 🛡️ Administration & Moderation
- **Admin Dashboard**: Real-time platform analytics including user growth and activity metrics.
- **Moderation Queue**: Efficient systems for handling user-reported content.
- **User Management**: Granular control over user roles, permissions, and account status.

## 🛠️ Technology Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiptap.dev/) (Python 3.12+)
- **Database**: PostgreSQL (hosted on Supabase)
- **ORM**: SQLAlchemy
- **Authentication**: Supabase Auth (JWT)
- **File Storage**: Supabase Storage

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS & Vanilla CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **State Management**: TanStack Query (React Query) & Zustand

## 🚀 Getting Started

### Prerequisites
- Python 3.12+
- Node.js 18+
- Supabase Account

### Backend Setup
1. Navigate to `fastapi_server/`.
2. Install dependencies: `pip install -r requirements.txt`.
3. Configure `.env` with your Supabase credentials and Database URL.
4. Run server: `python main.py` or `uvicorn main:app --reload`.

### Frontend Setup
1. Navigate to `gounion-remake/`.
2. Install dependencies: `npm install`.
3. Configure `.env` with your API URL.
4. Run development server: `npm run dev`.

## 📜 Development Notes
The project follows a decoupled architecture where the backend acts as a pure REST API and the frontend handles all UI/UX logic. Deployment is optimized for the Render platform.
