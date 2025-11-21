# Admin Dashboard Overview

## Introduction

The Waffles Admin Dashboard is a comprehensive administrative interface for managing games, users, content, and analytics for the Waffles gaming platform. Built with Next.js 14+, it provides a modern, real-time management experience with robust security and audit logging.

## Purpose

The admin dashboard serves as the central control panel for:

- **Game Lifecycle Management**: Create, configure, start, and end games
- **Content Management**: Upload media, create questions, manage game assets
- **User Administration**: Monitor users, manage permissions, handle bans
- **Analytics & Monitoring**: Track performance, revenue, and user engagement
- **System Health**: Monitor active games, database status, and errors

## Key Features

### 🎮 Game Management

- Full CRUD operations for games
- Media uploads (cover images)
- Question management with audio/image support
- Game lifecycle controls (Start/End)
- Real-time status tracking

### 👥 User Management

- Advanced search and filtering
- User profile management
- Ban/unban capabilities
- Invite quota management
- Activity tracking

### 📊 Analytics Dashboard

- Overview statistics
- User growth charts
- Revenue analytics
- Game performance metrics
- Referral tracking

### 🔒 Security

- Session-based authentication
- Admin role verification
- Audit logging for all actions
- CSRF protection
- XSS prevention

### 🎨 UI/UX Excellence

- Toast notifications for feedback
- Skeleton loading states
- Responsive design
- Unified action menus
- Real-time updates

## Technology Stack

### Frontend

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **Charts**: Recharts
- **Notifications**: Sonner

### Backend

- **Runtime**: Node.js
- **Database**: PostgreSQL (via Prisma)
- **ORM**: Prisma 7
- **Authentication**: Session-based (cookies)
- **File Storage**: Vercel Blob

### Infrastructure

- **Deployment**: Vercel
- **Database**: PostgreSQL (self-hosted or managed)
- **CDN**: Vercel CDN for media assets

## Architecture Highlights

- **Server Components**: Leverages RSC for optimal performance
- **Server Actions**: Type-safe mutations with automatic revalidation
- **Middleware**: Route protection at edge runtime
- **Audit System**: Comprehensive logging for compliance
- **Media Pipeline**: Direct client → Blob uploads with authentication

## Access Control

The dashboard implements role-based access control:

1. **Admin Users**: Full access to all features
2. **Session Management**: Secure cookie-based sessions
3. **Route Protection**: Middleware + layout-level checks
4. **Action Authorization**: Every server action validates admin status

## Performance

- **Initial Load**: < 2s with skeleton states
- **Client Transitions**: Instant (RSC streaming)
- **Database Queries**: Optimized with proper indexing
- **Media Uploads**: Direct to CDN, no server round-trip

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Mobile Compatibility

The dashboard is optimized for:

- Desktop: 1920x1080 and above
- Tablet: 768px - 1024px
- Mobile: Limited support (view-only recommended)

## Getting Started

See the [User Guide](./04-user-guide.md) for detailed setup instructions.

## Next Steps

- [Architecture Details](./02-architecture.md)
- [Feature Documentation](./03-features.md)
- [User Guide](./04-user-guide.md)
