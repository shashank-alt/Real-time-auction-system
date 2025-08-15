# BidMaster - Live Auction Platform

A modern, real-time auction platform built with React, Node.js, and Supabase. Features live bidding, seller dashboards, and comprehensive auction management.

## 🚀 Features

- **Live Auctions**: Real-time bidding with WebSocket connections
- **User Authentication**: Secure sign-up/sign-in with Supabase Auth
- **Seller Dashboard**: Create and manage auction listings
- **Real-time Notifications**: Instant updates for bids and auction status
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Admin Tools**: System diagnostics and auction management
- **Email Integration**: Automated notifications via SendGrid
- **SMS Notifications**: Optional Twilio integration

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Supabase Client** for authentication and real-time features

### Backend
- **Node.js** with Fastify framework
- **WebSocket** for real-time communication
- **Supabase** for database and authentication
- **Redis** (Upstash) for caching and rate limiting
- **SendGrid** for email notifications
- **Twilio** for SMS notifications (optional)

## 🏗 Architecture

```
BidMaster/
├── apps/
│   ├── client/          # React frontend
│   └── server/          # Node.js backend
├── packages/
│   └── shared/          # Shared types and utilities
└── docs/               # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Upstash Redis account (optional)
- SendGrid account (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bidmaster
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy the example files and fill in your credentials:
   ```bash
   cp apps/client/.env.example apps/client/.env
   cp apps/server/.env.example apps/server/.env
   ```

4. **Configure Supabase**
   - Create a new Supabase project
   - Run the SQL schema from `apps/server/supabase.sql`
   - Update your environment variables with Supabase credentials

5. **Start development servers**
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:8080

## 📝 Environment Configuration

### Client (.env)
```env
VITE_API_BASE=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Server (.env)
```env
PORT=8080
PUBLIC_ORIGIN=http://localhost:5173

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_KEY=your_supabase_service_key
DATABASE_URL=your_postgres_connection_string
USE_SUPABASE_REST=true

# Redis (Optional)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Email (Optional)
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=your_verified_email

# SMS (Optional)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_FROM=your_twilio_phone
```

## 🎯 Core Features

### Auction Management
- Create auctions with custom start times and durations
- Set starting prices and bid increments
- Real-time bid updates via WebSocket
- Automatic auction ending based on time

### User Roles
- **Bidders**: Browse auctions, place bids, receive notifications
- **Sellers**: Create auctions, manage listings, accept/reject bids
- **Admins**: System diagnostics, global auction management

### Real-time Features
- Live bid updates
- Countdown timers
- Instant notifications
- WebSocket-based communication

### Security
- JWT-based authentication via Supabase
- Row-level security policies
- Rate limiting
- Input validation and sanitization

## 🚀 Deployment

### Using Docker
```bash
docker build -t bidmaster .
docker run -p 8080:8080 --env-file apps/server/.env bidmaster
```

### Using Render.com
1. Fork this repository
2. Connect to Render.com
3. Configure environment variables
4. Deploy using the included `render.yaml`

## 🧪 Testing

Run the API test suite:
```bash
cd apps/server
node test_api.js
```

## 📚 API Documentation

### Authentication
All protected endpoints require a Bearer token in the Authorization header.

### Key Endpoints
- `GET /api/auctions` - List auctions
- `POST /api/auctions` - Create auction
- `POST /api/auctions/:id/bids` - Place bid
- `GET /api/notifications` - Get user notifications
- `POST /api/auctions/:id/decision` - Accept/reject/counter bid

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in the `/docs` folder
- Review the example configurations

## 🔧 Development

### Project Structure
- `apps/client/` - React frontend application
- `apps/server/` - Node.js backend API
- `packages/shared/` - Shared TypeScript types
- `render.yaml` - Deployment configuration

### Key Technologies
- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Fastify, WebSocket, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Caching**: Redis (Upstash)
- **Authentication**: Supabase Auth
- **Real-time**: WebSocket + Supabase Realtime

---

Built with ⚡ by the BidMaster team