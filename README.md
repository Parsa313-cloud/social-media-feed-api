# 🚀 Social Media Feed API

A backend-focused **Social Media Feed API** built with **NestJS, TypeScript, PostgreSQL, Prisma, Redis, and Docker**.

> 🎯 **Main Goal:** Learning by Building — with a strong focus on **NestJS backend architecture, Redis caching, Redis-based rate limiting, and efficient database querying**.

---

## 📌 About The Project

This project was developed as a practical **Backend Engineering Task** focused on building a production-oriented social media feed backend.

Instead of focusing only on CRUD operations, the project emphasizes practical backend concepts such as:

* 🏗️ NestJS modular architecture
* 🔐 JWT Authentication & Guards
* 🗄️ PostgreSQL & Prisma
* ⚡ Redis caching
* 🚦 Redis-based rate limiting
* 📊 Pagination
* 🌳 Nested comments / replies
* 🚫 Avoiding N+1 query patterns
* 🐳 Docker & Docker Compose
* 🧪 End-to-End testing
* 📚 Swagger API documentation

The project was intentionally built as a **learning-by-building project**, with particular attention to understanding how **NestJS and Redis work together in a real backend application**.

---

## 🎯 Learning Objectives

### 🟢 NestJS

Practical experience with:

* Modules
* Controllers & Services
* Dependency Injection
* Guards & Authentication
* DTOs & Validation Pipes
* Exception handling
* Swagger / OpenAPI
* Backend application architecture

### 🔴 Redis

Redis was one of the main learning areas of this project.

Implemented use cases include:

* ⚡ Feed caching
* 🗑️ Cache invalidation
* ⏱️ TTL-based expiration
* 🚦 Redis-based rate limiting
* 🔢 Atomic counters with `INCR`
* 🔍 Redis key scanning with `SCAN`

### 🔵 PostgreSQL & Prisma

* Relational data modeling
* Prisma ORM
* Database migrations
* Nested/self-referencing comments
* Aggregations
* Pagination
* Efficient relational queries

### 🐳 Docker

The complete backend stack runs through Docker Compose:

```text
┌──────────────────────────────────────┐
│           Docker Compose             │
│                                      │
│   ┌────────────┐   ┌──────────────┐  │
│   │  NestJS    │──▶│ PostgreSQL   │  │
│   │    API     │   │      18      │  │
│   └─────┬──────┘   └──────────────┘  │
│         │                            │
│         ▼                            │
│   ┌────────────┐                     │
│   │   Redis    │                     │
│   │      7     │                     │
│   └────────────┘                     │
│                                      │
└──────────────────────────────────────┘
```

---

# 🛠️ Tech Stack

| Technology    | Purpose               |
| ------------- | --------------------- |
| 🟢 NestJS     | Backend framework     |
| 🔷 TypeScript | Programming language  |
| 🐘 PostgreSQL | Relational database   |
| ◇ Prisma      | ORM & migrations      |
| 🔴 Redis      | Cache & rate limiting |
| 🔐 JWT        | Authentication        |
| 🐳 Docker     | Containerization      |
| 🧪 Jest       | Testing               |
| 🔬 Supertest  | E2E HTTP testing      |
| 📖 Swagger    | API documentation     |

---

# ✨ Core Features

## 🔐 Authentication

* User registration & login
* Password hashing with bcrypt
* JWT access tokens
* Protected routes using NestJS Guards
* Bearer token authentication

---

## 📝 Posts & Comments

* Authenticated post creation
* Nested comments and replies
* Self-referencing comment relationships
* User-owned post creation based on JWT identity

---

## 📰 Feed

The feed supports:

* Newest posts first
* Author information
* Dynamic comment counts including replies
* Latest comment information
* Pagination with metadata

The implementation uses Prisma relational queries and aggregations to avoid unnecessary database queries.

---

# ⚡ Redis Feed Caching

The posts feed is cached in Redis using pagination-aware cache keys.

```text
GET /posts
      │
      ▼
   Redis?
   /    \
 HIT    MISS
 │        │
 ▼        ▼
Return  PostgreSQL
cache      │
           ▼
         Redis
           │
           ▼
         Return
```

Cached responses use a **60-second TTL**.

This reduces unnecessary database queries for frequently requested feed pages.

---

# 🗑️ Cache Invalidation

When a new post is successfully created, cached feed data is invalidated.

```text
Create Post
     │
     ▼
Post saved
     │
     ▼
Invalidate posts:* cache
     │
     ▼
Next GET /posts
     │
     ▼
Fresh data
```

This prevents users from receiving stale feed results after new posts are created.

---

# 🚦 Redis Rate Limiting

A custom Redis-based rate limiter protects:

```http
POST /posts
```

Current policy:

```text
5 post creations / 60 seconds / user
```

Redis `INCR` is used for the counter and `EXPIRE` controls the time window.

When the limit is exceeded:

```text
HTTP 429 Too Many Requests
```

is returned.

---

# 🚫 N+1 Query Prevention

The feed avoids the classic N+1 query pattern by using Prisma relational queries and aggregations instead of fetching related data individually inside loops.

```text
❌ N+1

1 query → posts
N queries → authors
N queries → comments
```

Related information such as authors and comment counts is retrieved through optimized relational queries.

---

# 📄 Pagination

Pagination is implemented for:

* 📰 Post feed
* 💬 Post comments

Example:

```http
GET /posts?page=1&limit=10
```

The API returns pagination metadata including:

```text
currentPage
itemsPerPage
totalItems
```

---

# 🧪 Testing

The project includes **14 End-to-End tests** using Jest, Supertest, and NestJS Testing utilities.

Coverage includes:

* Authentication
* Posts
* Comments & nested replies
* Feed
* User profiles
* Rate limiting
* Redis cache invalidation
* Error handling

```text
14 tests
14 passed
0 failed
```

---

# 🐳 Running With Docker

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd social-media-feed-api
```

### 2. Build the containers

```bash
docker compose build
```

### 3. Start the application

```bash
docker compose up -d
```

### 4. Apply Prisma migrations

```bash
docker compose exec api npx prisma migrate deploy
```

The services will be available at:

```text
NestJS API  → http://localhost:3000
PostgreSQL  → localhost:5432
Redis       → localhost:6379
```

---

# 📚 API Documentation

Swagger documentation:

```text
http://localhost:3000/docs
```

Swagger can be used to explore and test the available API endpoints.

---

# 🔧 Environment Variables

For local development, create a `.env` file based on:

```text
.env.example
```

Required variables:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/social_media_feed?schema=public
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
```


---

# 🚀 Future Improvements

Possible next steps:

* [ ] Refresh tokens
* [ ] Cursor-based pagination
* [ ] Advanced Redis caching strategies
* [ ] DataLoader for complex relational queries
* [ ] Separate test database
* [ ] CI/CD pipeline
* [ ] Structured logging & request tracing
* [ ] Health check endpoints
* [ ] Production secret management

---

# 👨‍💻 Author

**Parsa Harooni**

Backend Developer | Django / NestJS

Interested in:

* Backend Development
* System Design
* Distributed Systems
* Redis
* PostgreSQL
* Docker
* DevOps
* Data Structures & Algorithms

---

## ⭐ Final Note

This project was built with a **learning-first, engineering-oriented approach**.

The goal was not simply to implement endpoints, but to understand the backend concepts behind them — especially **NestJS architecture, Prisma, efficient database querying, Redis caching, Redis rate limiting, testing, and containerized development**.

> **Build it. Break it. Understand it. Improve it. 🚀**
