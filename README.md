# 🛒 E-Commerce Platform

A full-stack distributed e-commerce platform built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring microservices architecture, real-time updates, and comprehensive admin analytics.

## 🏗️ Architecture

This project follows a **microservices architecture** with the following components:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                  CLIENT                                     │
│                         (React + TypeScript SPA)                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               NGINX (Reverse Proxy)                         │
│                     • Load Balancing • SSL Termination                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
              ┌──────────┐     ┌──────────┐      ┌──────────┐
              │ REST API │     │ WebSocket│      │  Static  │
              │  /api/*  │     │ Socket.IO│      │  Assets  │
              └──────────┘     └──────────┘      └──────────┘
                    │                 │
                    ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            API GATEWAY (Express.js)                         │
│              • Request Routing • Rate Limiting • Authentication             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
        ┌─────────────┬───────────────┼───────────────┬─────────────┐
        ▼             ▼               ▼               ▼             ▼
   ┌─────────┐   ┌─────────┐    ┌─────────┐    ┌─────────┐   ┌─────────┐
   │  User   │   │ Product │    │  Cart   │    │  Order  │   │Analytics│
   │ Service │   │ Service │    │ Service │    │ Service │   │ Service │
   │ :3001   │   │ :3002   │    │ :3003   │    │ :3004   │   │(Orders) │
   └─────────┘   └─────────┘    └─────────┘    └─────────┘   └─────────┘
        │             │               │               │             │
        └─────────────┴───────────────┼───────────────┴─────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MongoDB Atlas (Cloud)                             │
│                    • Users • Products • Categories • Orders                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + TypeScript | UI Framework |
| **State Management** | Redux Toolkit | Global state |
| **Forms** | React Hook Form + Zod | Form handling & validation |
| **Styling** | Tailwind CSS | Rapid UI development |
| **Charts** | Recharts | Admin analytics |
| **Real-time** | Socket.IO Client | WebSocket communication |
| **Backend** | Node.js + Express.js | API servers |
| **Validation** | Zod | Schema validation (shared) |
| **Database** | MongoDB + Mongoose | Data persistence |
| **Authentication** | JWT | Token-based auth |
| **File Upload** | Multer + Cloudinary | Image management |
| **API Docs** | Swagger (OpenAPI) | Documentation |
| **Containerization** | Docker + Docker Compose | Deployment |
| **Reverse Proxy** | NGINX | Load balancing & routing |

## 📁 Project Structure

```
e-commerce-platform/
├── backend/
│   ├── config/              # Shared configuration
│   ├── gateway/             # API Gateway service
│   ├── services/
│   │   ├── user-service/    # Authentication & user management
│   │   ├── product-service/ # Product & inventory
│   │   ├── cart-service/    # Shopping cart (real-time)
│   │   └── order-service/   # Orders & analytics
│   └── shared/              # Shared utilities & schemas
├── frontend/
│   └── src/
│       ├── components/      # React components
│       ├── pages/           # Page components
│       ├── services/        # API services
│       ├── store/           # Redux store
│       ├── hooks/           # Custom hooks
│       ├── types/           # TypeScript types
│       └── utils/           # Utilities
├── docs/
│   ├── diagrams/            # Architecture diagrams
│   └── api-specs/           # API specifications
├── docker/                  # Docker configurations
├── nginx/                   # NGINX configuration
└── docker-compose.yml       # Container orchestration
```

## ✨ Features

### Customer Features
- 🔐 User registration (multi-step) and authentication
- 🛍️ Product browsing with filters, search, and sorting
- 🛒 Real-time shopping cart updates
- 💳 Secure checkout process
- 📦 Order tracking and history
- 👤 Profile and address management

### Admin Features
- 📊 Analytics dashboard with real-time metrics
- 📦 Product management (CRUD, images, inventory)
- 🏷️ Category management
- 📋 Order management and status updates
- 👥 User management and role assignment
- 📈 Sales reports and charts

### Technical Features
- 🔄 Real-time updates via WebSocket
- 🔒 JWT authentication with refresh tokens
- 🛡️ Role-based access control (RBAC)
- ✅ Input validation (Zod - shared frontend/backend)
- 🚦 Rate limiting and CORS protection
- 📝 API documentation (Swagger)
- 🐳 Docker containerization
- ☁️ Cloud database (MongoDB Atlas)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB (local or Atlas)
- Docker (optional, for containerized deployment)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd e-commerce-platform
   ```

2. **Install dependencies**
   ```bash
   # Install all service dependencies
   npm run install:all
   ```

3. **Configure environment variables**
   ```bash
   # Copy example environment files
   cp backend/config/.env.example backend/config/.env
   cp frontend/.env.example frontend/.env
   ```

4. **Start development servers**
   ```bash
   # Start all services
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - API Gateway: http://localhost:5000
   - API Docs: http://localhost:5000/api-docs

### Docker Deployment

```bash
# Build and start all containers
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

## 📚 Documentation

- [Project Plan](./docs/Project%20Plan.md)
- [API Specifications](./docs/api-specs/)
- [Architecture Diagrams](./docs/diagrams/)

## 📄 License

This project is developed for educational purposes as part of the Advanced Web Development course.

## 👨‍💻 Author

Muhammad Umar - COMSATS Islamabad
