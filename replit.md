# StackIt - Question & Answer Platform

## Overview

StackIt is a full-stack question and answer platform built with a modern tech stack. It allows users to ask questions, provide answers, vote on content, and receive notifications. The application features a clean, responsive UI with real-time interactions and authentication via Replit Auth.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: Radix UI with shadcn/ui component library
- **Styling**: Tailwind CSS with custom design tokens
- **Rich Text Editor**: Tiptap for question/answer content creation
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage

### Development Setup
- **Monorepo Structure**: Shared schema between client and server
- **Development Server**: Vite dev server with Express API proxy
- **Hot Module Replacement**: Full HMR support in development
- **Type Safety**: Strict TypeScript configuration across all packages

## Key Components

### Authentication System
- **Provider**: Replit Auth using OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions for security
- **User Management**: Automatic user creation/updates on login
- **Authorization**: Route-level protection with middleware

### Database Schema
- **Users**: Profile information (mandatory for Replit Auth)
- **Questions**: Title, description, tags, voting, view tracking
- **Answers**: Content, voting, accepted answer marking
- **Votes**: User voting system for questions and answers
- **Notifications**: Real-time user notifications
- **Sessions**: Secure session management (mandatory for Replit Auth)

### Question & Answer System
- **Rich Content**: HTML content support with Tiptap editor
- **Tagging**: Array-based tag system for categorization
- **Voting**: Upvote/downvote system for quality ranking
- **Acceptance**: Question authors can mark accepted answers
- **Search**: Full-text search across questions and content
- **Filtering**: Support for newest, unanswered, and tag-based filters

### Notification System
- **Real-time Updates**: Notifications for answers, votes, and interactions
- **Unread Tracking**: Counter for unread notifications
- **User Experience**: Dropdown interface with mark-as-read functionality

## Data Flow

1. **Authentication Flow**:
   - User clicks login → Redirected to Replit Auth
   - Successful auth → User data stored/updated in database
   - Session created and stored in PostgreSQL
   - Frontend receives user data via protected API

2. **Question Flow**:
   - User creates question → Stored with rich text content
   - Questions displayed with pagination and filtering
   - Search functionality queries database with text matching
   - View count incremented on question access

3. **Answer Flow**:
   - Users submit answers to questions
   - Answers support rich text formatting
   - Question authors can accept answers
   - Voting system tracks answer quality

4. **Notification Flow**:
   - System events trigger notification creation
   - Real-time updates via polling (can be enhanced with WebSockets)
   - Users receive notifications for relevant interactions

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Database connection with WebSocket support
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@tiptap/react**: Rich text editing capabilities
- **@radix-ui/***: Accessible UI component primitives
- **express**: Web server framework
- **passport**: Authentication middleware

### Development Dependencies
- **Vite**: Build tool and development server
- **TypeScript**: Type safety and developer experience
- **Tailwind CSS**: Utility-first styling
- **ESBuild**: Production bundling for server code

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds client code to `dist/public`
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations stored in `migrations/` directory

### Environment Configuration
- **Database**: PostgreSQL via `DATABASE_URL` environment variable
- **Authentication**: Replit Auth configuration via environment variables
- **Sessions**: Secure session secret via `SESSION_SECRET`

### Production Deployment
- **Static Assets**: Frontend built and served from `dist/public`
- **API Server**: Node.js server serving REST API
- **Database**: Neon Database serverless PostgreSQL
- **Sessions**: Production-ready session management with proper security

The application follows a clean separation of concerns with shared TypeScript types between client and server, ensuring type safety across the entire stack. The architecture supports both development and production environments with appropriate tooling and optimizations for each.