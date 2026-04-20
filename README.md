# FlowSpace - Real-time Collaboration Platform

A modern, production-grade real-time collaboration platform built with Next.js, Node.js, and PostgreSQL. Inspired by Slack's functionality with a clean, modern design.

## 🚀 Features

### Phase 1 - Authentication & Setup ✅
- User registration and login
- JWT-based authentication with refresh tokens
- Secure password hashing with bcrypt
- HTTP-only cookies for refresh tokens
- Protected routes and middleware

### Phase 2 - Workspace & Channel Management ✅
- Multi-workspace support with role-based permissions
- Public and private channels
- Workspace invite system with unique codes
- Channel member management
- Workspace and channel creation/management

### Phase 3 - Real-time Messaging ✅
- Real-time chat with Socket.IO
- Message editing and deletion
- Typing indicators
- Online/offline status
- Direct messaging system
- Message history and pagination

### Phase 4 - UI Polish & Responsiveness ✅
- Framer Motion animations
- Toast notifications system
- Mobile-responsive design
- Connection status indicators
- Loading states and error handling
- Modern, clean UI with Tailwind CSS

### Phase 5 - Advanced Features & Optimization ✅ (COMPLETE)
- ✅ **File Upload System**
  - Backend file upload with Multer
  - File type validation and size limits
  - File preview components
  - Secure file serving
- ✅ **Emoji Reaction System**
  - Emoji picker component
  - Message reactions with real-time updates
  - Reaction grouping and user tracking
- ✅ **Message Search**
  - Full-text search across channel messages
  - Real-time search with debouncing
  - Search results with highlighting
  - Modal-based search interface
- ✅ **Performance Optimizations**
  - Infinite scroll for message loading
  - Optimized database queries with proper indexing
  - Client-side caching and state management
  - Image optimization and lazy loading
- ✅ **Production Deployment**
  - Multi-stage Docker builds
  - Nginx reverse proxy with SSL
  - Redis caching layer
  - Health checks and monitoring
  - Automated deployment scripts
- ✅ **Advanced UI Components**
  - User presence indicators
  - Notification system with bell icon
  - Workspace switcher with quick access
  - Keyboard shortcuts (Ctrl+K, Ctrl+/)
  - Quick switcher for channels and users
  - System status dashboard
  - Error boundary with graceful fallbacks
  - Performance monitoring hooks

### Phase 6 - Enterprise Features ✅ (NEW)
- ✅ **Comprehensive Testing Suite**
  - Unit tests for all services and controllers
  - Integration tests for API endpoints
  - End-to-end testing for critical workflows
  - Test coverage reporting and CI/CD integration
- ✅ **API Documentation**
  - Complete Swagger/OpenAPI documentation
  - Interactive API explorer at `/api-docs`
  - Comprehensive endpoint documentation with examples
  - Authentication and error handling documentation
- ✅ **Audit Logging System**
  - Complete audit trail for all user actions
  - Database-backed audit log storage
  - Admin panel for audit log viewing and filtering
  - Compliance-ready audit reporting
- ✅ **Advanced Analytics**
  - Workspace analytics with member and message metrics
  - User engagement tracking and reporting
  - System-wide analytics for administrators
  - Real-time performance monitoring
  - Message trends and channel statistics
- ✅ **Redis Caching & Performance**
  - Redis-based caching for improved performance
  - Distributed rate limiting with Redis
  - Session management and data caching
  - Cache invalidation strategies
- ✅ **Enterprise Logging**
  - Structured logging with Winston
  - Multiple log levels and transports
  - HTTP request logging with correlation IDs
  - Security event logging
  - Performance monitoring and alerting
- ✅ **Backup & Recovery System**
  - Automated database backups with compression
  - File system backup capabilities
  - Backup scheduling and retention policies
  - Restore functionality for disaster recovery
  - Backup management admin interface
- ✅ **Admin Dashboard**
  - Comprehensive admin panel with multiple views
  - System health monitoring and alerts
  - Analytics dashboard with charts and metrics
  - Backup management interface
  - Audit log viewer with filtering
- ✅ **Security Hardening**
  - Enhanced rate limiting with Redis backend
  - Security headers and CORS configuration
  - Input validation and sanitization
  - SQL injection protection with Prisma
  - XSS and CSRF protection

## 🛠️ Tech Stack

### Frontend
- **Next.js 14+** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion** (animations)
- **Zustand** (state management)
- **Axios** (API client)
- **React Hook Form** (form handling)

### Backend
- **Node.js**
- **Express.js**
- **TypeScript**
- **PostgreSQL**
- **Prisma ORM**
- **JWT** (authentication)
- **Bcrypt** (password hashing)
- **Helmet** (security headers)
- **CORS** (cross-origin requests)
- **Redis** (caching & rate limiting)
- **Winston** (logging)
- **Socket.IO** (real-time communication)

### Enterprise & DevOps
- **Docker** & **Docker Compose**
- **Redis** (caching & sessions)
- **Swagger/OpenAPI** (API documentation)
- **Jest** (testing framework)
- **ESLint** & **Prettier**
- **Nginx** (reverse proxy)
- **PostgreSQL** (backup & recovery)
- Environment variables
- Rate limiting
- Centralized logging

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (if running locally)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd flowspace
```

### 2. Environment Setup

#### Backend Environment
Create `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/flowspace"
JWT_ACCESS_SECRET="your-super-secret-access-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
PORT=5000
NODE_ENV=development
CORS_ORIGIN="http://localhost:3000"
```

#### Frontend Environment
Create `frontend/flowspace/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Docker Setup (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Local Development Setup

#### Backend
```bash
cd backend
npm install
npm run db:generate
npm run db:push
npm run db:seed  # Optional: seed with demo data
npm run dev
```

#### Enterprise Commands
```bash
# Create manual backup
npm run backup:create

# List all backups
npm run backup:list

# Check enterprise service health
npm run enterprise:health

# Generate system report
npm run enterprise:report

# Run system maintenance
npm run enterprise:maintenance

# Run enterprise tests
npm run test:enterprise
```

#### Frontend
```bash
cd frontend/flowspace
npm install
npm run dev
```

## 📁 Project Structure

```
flowspace/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Route controllers
│   │   │   ├── analytics.controller.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── backup.controller.ts
│   │   │   ├── channel.controller.ts
│   │   │   ├── file.controller.ts
│   │   │   ├── message.controller.ts
│   │   │   ├── reaction.controller.ts
│   │   │   └── workspace.controller.ts
│   │   ├── db/             # Database connection & seed
│   │   ├── middleware/     # Express middleware
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── upload.middleware.ts
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   │   ├── analytics.service.ts
│   │   │   ├── audit.service.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── backup.service.ts
│   │   │   ├── cache.service.ts
│   │   │   ├── channel.service.ts
│   │   │   ├── enterprise.service.ts
│   │   │   ├── file.service.ts
│   │   │   ├── message.service.ts
│   │   │   ├── reaction.service.ts
│   │   │   └── workspace.service.ts
│   │   ├── socket/         # Socket.IO handlers
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── uploads/            # File upload directory
│   └── Dockerfile
├── frontend/flowspace/
│   ├── app/                # Next.js app directory
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── admin/      # Admin panel components
│   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   ├── AnalyticsDashboard.tsx
│   │   │   │   ├── AuditLogViewer.tsx
│   │   │   │   ├── BackupManagement.tsx
│   │   │   │   └── SystemStatus.tsx
│   │   │   ├── auth/       # Authentication components
│   │   │   ├── messages/   # Message-related components
│   │   │   │   ├── EmojiPicker.tsx
│   │   │   │   ├── FilePreview.tsx
│   │   │   │   ├── FileUpload.tsx
│   │   │   │   ├── MessageInput.tsx
│   │   │   │   ├── MessageItem.tsx
│   │   │   │   ├── MessageList.tsx
│   │   │   │   ├── MessageReactions.tsx
│   │   │   │   ├── MessageSearch.tsx
│   │   │   │   └── TypingIndicator.tsx
│   │   │   ├── ui/         # UI components
│   │   │   └── workspace/  # Workspace components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/           # Utilities & API client
│   │   ├── store/         # Zustand stores
│   │   └── types/         # TypeScript types
│   └── Dockerfile
└── docker-compose.yml
```

## 🔐 Authentication Flow

1. **Registration**: User creates account with email, username, display name, and password
2. **Login**: User authenticates with email/username and password
3. **Token Management**: 
   - Access token (15min) stored in localStorage
   - Refresh token (7 days) stored in HTTP-only cookie
4. **Auto-refresh**: Expired access tokens automatically refreshed
5. **Logout**: Tokens cleared from client and server

## 🗄️ Database Schema

### Core Tables
- **Users**: Authentication and profile information
- **Workspaces**: Team organization units with owner-based access
- **Channels**: Communication channels (public/private) within workspaces
- **Messages**: Real-time messaging with edit/delete functionality
- **Direct Messages**: 1-on-1 conversations with read receipts

### Advanced Features
- **Files**: File attachments with metadata and access control
- **Message Reactions**: Emoji reactions on messages with user tracking
- **Workspace/Channel Members**: Role-based access control
- **Notifications**: System notifications and mentions
- **Audit Logs**: Complete audit trail for compliance and security
- **Analytics**: Comprehensive analytics and reporting
- **Backups**: Automated backup and recovery system

## 🚦 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Workspaces
- `GET /api/workspaces` - List user workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/:id` - Get workspace details
- `PUT /api/workspaces/:id` - Update workspace
- `DELETE /api/workspaces/:id` - Delete workspace
- `POST /api/workspaces/join/:inviteCode` - Join workspace

### Channels
- `GET /api/channels/workspace/:workspaceId` - List workspace channels
- `POST /api/channels` - Create channel
- `GET /api/channels/:id` - Get channel details
- `PUT /api/channels/:id` - Update channel
- `DELETE /api/channels/:id` - Delete channel
- `POST /api/channels/:id/members` - Add channel member
- `DELETE /api/channels/:id/members/:userId` - Remove channel member

### Messages
- `GET /api/messages/channel/:channelId` - Get channel messages
- `POST /api/messages/channel/:channelId` - Send message
- `PUT /api/messages/:id` - Edit message
- `DELETE /api/messages/:id` - Delete message
- `GET /api/messages/direct/:userId` - Get direct messages
- `POST /api/messages/direct/:userId` - Send direct message

### Files
- `POST /api/files/upload` - Upload file
- `GET /api/files/:fileId` - Get file metadata
- `GET /api/files/:fileId/download` - Download file
- `DELETE /api/files/:fileId` - Delete file
- `GET /api/files/channel/:channelId` - Get channel files

### Reactions
- `POST /api/messages/:messageId/reactions` - Add reaction
- `DELETE /api/messages/:messageId/reactions/:emoji` - Remove reaction
- `GET /api/messages/:messageId/reactions` - Get message reactions

### Analytics (Enterprise)
- `GET /api/analytics/workspace/:workspaceId` - Get workspace analytics
- `GET /api/analytics/workspace/:workspaceId/trends` - Get message trends
- `GET /api/analytics/channel/:channelId` - Get channel analytics
- `GET /api/analytics/user/engagement` - Get user engagement metrics
- `GET /api/analytics/system` - Get system-wide analytics
- `GET /api/analytics/audit-logs` - Get audit logs

### Backup (Enterprise)
- `GET /api/backup` - List all backups
- `POST /api/backup/database` - Create database backup
- `POST /api/backup/files` - Create file backup
- `POST /api/backup/full` - Create full backup
- `POST /api/backup/restore/database` - Restore database
- `POST /api/backup/restore/files` - Restore files
- `GET /api/backup/status` - Get backup status
- `POST /api/backup/schedule` - Schedule automatic backups
- `DELETE /api/backup/:filename` - Delete backup

### Health & Monitoring
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system health
- `GET /health/enterprise` - Enterprise services health
- `GET /health/report` - Generate system report
- `GET /health/ready` - Kubernetes readiness probe
- `GET /health/live` - Kubernetes liveness probe

## 🧪 Development

### Backend Development
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with demo data
```

### Frontend Development
```bash
cd frontend/flowspace
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
```

## 🔒 Security Features

- **JWT Authentication** with access and refresh tokens
- **Password Hashing** with bcrypt (10 rounds)
- **HTTP-only Cookies** for refresh tokens
- **CORS Configuration** for cross-origin requests
- **Rate Limiting** (100 requests per 15 minutes)
- **Security Headers** with Helmet.js
- **Input Validation** on all endpoints
- **SQL Injection Protection** with Prisma ORM

## 📊 Performance Optimizations

- **Database Indexing** on frequently queried fields
- **Connection Pooling** with Prisma
- **Efficient Queries** with proper relations and includes
- **Client-side Caching** with Zustand persistence
- **Optimized Bundle** with Next.js
- **Image Optimization** with Next.js Image component
- **Real-time Updates** with Socket.IO for instant messaging
- **File Upload Optimization** with Multer and streaming

## 🎨 Advanced Features

### User Experience Enhancements
- **User Presence System**: Real-time online/offline indicators with avatar overlays
- **Notification Center**: Comprehensive notification system with categorized alerts
- **Workspace Switcher**: Quick workspace navigation with member counts and settings
- **Keyboard Shortcuts**: Full keyboard navigation (Ctrl+K for quick switcher, Ctrl+/ for help)
- **Quick Switcher**: Instant search and navigation to channels and users
- **Error Boundaries**: Graceful error handling with recovery options
- **Performance Monitoring**: Real-time FPS, memory, and latency tracking

### File Upload System
- **Secure File Handling**: Multer middleware with type validation
- **File Size Limits**: 10MB maximum file size
- **Supported Formats**: Images (JPEG, PNG, GIF, WebP), Documents (PDF, DOC, DOCX, XLS, XLSX), Text files
- **File Preview**: In-app preview for images, PDFs, and text files
- **Download Protection**: Access control based on channel permissions
- **Drag & Drop**: Modern file upload interface with drag-and-drop support

### Emoji Reaction System
- **Rich Emoji Picker**: Categorized emoji selection with frequently used section
- **Real-time Reactions**: Instant reaction updates via Socket.IO
- **Reaction Grouping**: Smart grouping by emoji type with user counts
- **User Tracking**: See who reacted with which emoji
- **Quick Reactions**: Fast access to commonly used emojis

### Enhanced Message System
- **File Attachments**: Messages can now include file attachments
- **Reaction Display**: Visual reaction indicators on messages
- **Message Search**: Full-text search across channel messages with real-time results
- **Improved UI**: Better message layout with file previews and reactions
- **Access Control**: File access based on channel membership

### System Monitoring
- **Health Checks**: Comprehensive system health monitoring
- **Performance Metrics**: Database response time, memory usage, connection counts
- **Real-time Status**: Live system status dashboard for administrators
- **Error Tracking**: Detailed error reporting and logging
- **Uptime Monitoring**: System uptime tracking and alerts

## 🚀 Deployment

### Production Deployment

FlowSpace includes a complete production deployment setup with Docker, Nginx, and SSL support.

#### Prerequisites
- Docker and Docker Compose
- Domain name (for SSL certificates)
- Server with at least 2GB RAM

#### Quick Deployment

1. **Clone and Configure**
   ```bash
   git clone <repository-url>
   cd flowspace
   cp .env.prod.example .env.prod
   # Edit .env.prod with your production values
   ```

2. **SSL Certificates**
   ```bash
   # Place your SSL certificates in nginx/ssl/
   mkdir -p nginx/ssl
   # Copy your cert.pem and key.pem files
   ```

3. **Deploy**
   ```bash
   # Linux/Mac
   ./deploy.sh
   
   # Windows
   .\deploy.ps1
   ```

#### Manual Deployment

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Run database migrations
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma db push
```

#### Production Features
- **Multi-stage Docker builds** for optimized images
- **Nginx reverse proxy** with SSL termination
- **Redis caching** for sessions and performance
- **Health checks** for all services
- **Rate limiting** and security headers
- **Gzip compression** for static assets
- **File upload optimization** with proper caching

### Development Environment Variables

#### Backend
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/flowspace"
JWT_ACCESS_SECRET="your-development-access-secret"
JWT_REFRESH_SECRET="your-development-refresh-secret"
NODE_ENV=development
PORT=5000
CORS_ORIGIN="http://localhost:3000"
```

#### Frontend
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@flowspace.com or join our Slack channel.

---

**🎉 FlowSpace Enterprise Complete** ✅ 

A production-grade real-time collaboration platform with enterprise features including:
- **Complete Testing Suite** with unit, integration, and E2E tests
- **Comprehensive API Documentation** with interactive Swagger interface
- **Enterprise Audit Logging** for compliance and security
- **Advanced Analytics & Monitoring** with real-time dashboards
- **Redis Caching & Performance** optimization
- **Automated Backup & Recovery** system
- **Admin Dashboard** with system management tools
- **Security Hardening** with rate limiting and protection

Ready for enterprise deployment and capable of competing with industry leaders like Slack and Microsoft Teams!