## Problem Statement

**Problem 2:** Design and implement a minimal Q&A forum platform ("StackIt") that enables users to ask and answer questions, vote on answers, tag questions, and receive notifications. The platform must support user roles (Guest, User, Admin) and provide a rich text editor for formatting questions and answers.

## Team Members

| Name                | Email                         |
|---------------------|-------------------------------|
| Shashank Karan      | shashank.karan25@gmail.com    |
| Roshan Yadav        | roshanyadav@amityonline.com   |


<video controls src="domo video.mp4" title="Title"></video>

# StackIt - AI-Powered Q&A Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)](https://postgresql.org/)

A modern, full-stack Q&A platform built for developers, featuring AI-powered assistance, rich text editing, and real-time notifications. Think Stack Overflow meets modern web development with AI integration.

## 🚀 Features

### Core Features
- **Question & Answer System**: Post questions, provide answers, and vote on content
- **AI Assistant**: Integrated Gemini AI chatbot for instant help
- **Rich Text Editor**: Advanced TipTap editor with formatting, code blocks, and media support
- **Community Posts**: Share code snippets, tutorials, and thoughts with media uploads
- **Tag System**: Organize content with searchable tags
- **Voting System**: Upvote/downvote questions and answers
- **Accepted Answers**: Question authors can mark the best answers
- **Real-time Notifications**: Get notified about answers, votes, and mentions
- **User Authentication**: Secure session-based authentication
- **Search & Filtering**: Find content quickly with full-text search

### Technical Features
- **Modern UI**: Beautiful, responsive design with Tailwind CSS and shadcn/ui
- **Type Safety**: Full TypeScript coverage across frontend and backend
- **Real-time Updates**: Live notifications and content updates
- **File Uploads**: Support for images and videos in posts
- **Mobile Responsive**: Optimized for all device sizes
- **SEO Friendly**: Server-side rendering ready

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling and development
- **Wouter** for client-side routing
- **TanStack Query** for server state management
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Radix UI** for accessible primitives
- **TipTap** rich text editor
- **Framer Motion** for animations

### Backend
- **Node.js** with Express.js
- **TypeScript** with strict configuration
- **PostgreSQL** database with Neon serverless
- **Drizzle ORM** for type-safe database operations
- **Session-based authentication** with bcrypt
- **Express sessions** with PostgreSQL store
- **Multer** for file uploads
- **Google Gemini AI** integration

### Database Schema
- **Users**: Profile information and authentication
- **Questions**: Title, description, tags, voting, view tracking
- **Answers**: Content, voting, accepted answer marking
- **Votes**: User voting system for questions and answers
- **Notifications**: Real-time user notifications
- **Posts**: Community posts with media support
- **Comments**: Post comments and interactions
- **Sessions**: Secure session management

## 📁 Project Structure

```
stackit/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ai/          # AI chatbot components
│   │   │   ├── auth/        # Authentication components
│   │   │   ├── community/   # Community post components
│   │   │   ├── layout/      # Layout components
│   │   │   ├── questions/   # Q&A components
│   │   │   └── ui/          # shadcn/ui components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility functions
│   │   ├── pages/           # Page components
│   │   └── main.tsx         # App entry point
│   └── index.html           # HTML template
├── server/                   # Express backend
│   ├── auth.ts              # Authentication logic
│   ├── db.ts                # Database connection
│   ├── gemini.ts            # AI integration
│   ├── index.ts             # Server entry point
│   ├── routes.ts            # API routes
│   ├── storage.ts           # Database operations
│   └── vite.ts              # Vite integration
├── shared/                   # Shared types and schemas
│   └── schema.ts            # Database schema and types
├── uploads/                  # File upload storage
├── package.json             # Dependencies and scripts
├── drizzle.config.ts        # Database configuration
├── tailwind.config.ts       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20 or higher
- PostgreSQL database (Neon recommended)
- Gemini AI API key

### Installation

1. **Clone the repository** (fork or clone)
   ```bash
   git clone <your-repo-url>
   cd stackit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file with:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   GEMINI_API_KEY=your_gemini_api_key
   SESSION_SECRET=your_secure_session_secret
   PORT=5000
   ```

4. **Push database schema**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## 🔧 Configuration

### Database Setup (Neon)
1. Create a free account at [Neon](https://neon.tech)
2. Create a new database
3. Copy the connection string to `DATABASE_URL`

### Gemini AI Setup
1. Get an API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add it to your environment as `GEMINI_API_KEY`

### File Uploads
- Files are stored in the `uploads/` directory
- Supports images and videos up to 50MB
- Served statically at `/uploads/` endpoint

## 🎨 UI Components

The project uses a comprehensive component library built on top of Radix UI and styled with Tailwind CSS:

### Core Components
- **Button**: Various styles and sizes
- **Card**: Content containers
- **Dialog/Modal**: Overlays and popups
- **Form**: Input validation and handling
- **Table**: Data display
- **Badge**: Labels and tags
- **Avatar**: User profile images

### Specialized Components
- **TipTap Editor**: Rich text editing with formatting
- **Vote Buttons**: Upvote/downvote functionality
- **Question Card**: Question display with metadata
- **Post Card**: Community post display
- **AI Chatbot**: Floating AI assistant
- **Notification Dropdown**: Real-time notifications

## 🔐 Authentication & Security

### Session-Based Authentication
- Secure session cookies
- PostgreSQL session storage
- Bcrypt password hashing
- CSRF protection

### Security Features
- Input validation with Zod schemas
- SQL injection prevention with Drizzle ORM
- File upload validation
- Rate limiting ready
- Secure session configuration

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop**: Full feature set with sidebar layouts
- **Tablet**: Adapted layouts with touch-friendly controls
- **Mobile**: Drawer navigation and optimized forms
- **Touch Devices**: Swipe gestures and touch interactions

## 🚀 Deployment

### Build Commands
```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run check

# Database operations
npm run db:push
```

### Environment Variables for Production
```env
NODE_ENV=production
DATABASE_URL=your_production_database_url
GEMINI_API_KEY=your_gemini_api_key
SESSION_SECRET=your_secure_session_secret_for_production
PORT=5000
```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push database schema changes

*Star ⭐ this repository if you find it helpful!*
