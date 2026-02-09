# GleePack - Full Stack Application

A full-stack food delivery application built with React, Express, and MongoDB.

## 📁 Project Structure

```
gleepack/
├── client/        # React + Vite Frontend
├── server/        # Express.js Backend
└── README.md      # This file
```

## 🚀 Quick Start

### Frontend
```bash
cd client
npm install
npm run dev
```

### Backend
```bash
cd server
npm install
npm run start
```

## 📋 Requirements

- Node.js 16+
- npm or yarn
- MongoDB Atlas account
- Razorpay account (for payments)
- Google OAuth credentials

## 🔧 Environment Setup

### For Team Members
Ask your team lead for:
- `.env` file for client/
- `.env` file for server/
- These contain production/staging URLs and secrets

### Local Development
Create `.env.development` files with values from your team lead:

**client/.env.development**
```
VITE_API_URL=http://localhost:3000
VITE_FRONTEND_URL=http://localhost:5173
VITE_SOCKET_URL=http://localhost:3010
```

**server/.env.development**
```
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
MONGODB_URI=[your-mongodb-uri]
JWT_SECRET=[your-jwt-secret]
RAZORPAY_KEY_ID=[your-key]
RAZORPAY_KEY_SECRET=[your-secret]
GOOGLE_CLIENT_ID=[your-google-id]
GOOGLE_CLIENT_SECRET=[your-google-secret]
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

## 🏗️ Tech Stack

### Frontend
- React 18
- Vite
- TypeScript
- Tailwind CSS
- Shadcn/ui Components
- React Router
- Socket.IO Client

### Backend
- Express.js
- MongoDB
- JWT Authentication
- Passport.js (Google OAuth)
- Razorpay Integration
- Socket.IO
- Helmet (Security)

## 🔐 Security

- Environment variables for all sensitive data
- JWT-based authentication
- CORS configured
- Helmet security headers
- Rate limiting
- Password hashing with bcrypt

## 📊 API Routes

All API routes require authentication (except `/api/auth/*` and `/api/products`):

- `GET /api/products` - List all products
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- And more...

## 🚢 Deployment

Deployed on Vercel (frontend and backend separate).

For deployment documentation, ask your team lead.

## 📞 Support

Contact your team lead for:
- Deployment access
- Database credentials
- API keys and secrets
- Production environment details

## 📝 License

Internal Use Only - © 2026 GleePack
