# 🚀 Social Media Feed API

A backend-focused **Social Media Feed API** built with **NestJS, TypeScript, PostgreSQL, Prisma, Redis, and Docker**.

> 🎯 **Main Goal:** Learning by Building — with a strong focus on **NestJS backend architecture, Redis caching, Redis-based rate limiting, and efficient database querying**.

---

## 📌 About The Project

This project was developed as a practical backend engineering exercise to build a production-oriented social media feed backend from scratch.

Rather than focusing only on implementing CRUD operations, the project focuses on understanding and applying real backend concepts such as:

* 🏗️ NestJS modular architecture
* 🔐 JWT Authentication & Guards
* 🗄️ PostgreSQL database design
* 🔄 Prisma ORM
* ⚡ Redis caching
* 🚦 Redis-based rate limiting
* 📊 Pagination
* 🌳 Nested comments / replies
* 🚫 Avoiding N+1 query patterns
* 🐳 Docker & Docker Compose
* 🧪 End-to-End testing
* 📚 API documentation with Swagger

The project was intentionally built as a **learning-by-building project**, with particular attention given to understanding how **NestJS and Redis can be used together in a real backend application**.

---

## 🎯 Learning Objectives

The main purpose of this project was to gain practical experience with:

### 🟢 NestJS

* Modules
* Controllers
* Services
* Dependency Injection
* Guards
* DTOs
* Validation Pipes
* Authentication
* Swagger/OpenAPI
* Application architecture

### 🔴 Redis

Redis was one of the main learning areas of this project.

Implemented Redis features include:

* ⚡ Feed caching
* 🗑️ Cache invalidation
* ⏱️ TTL-based cache expiration
* 🚦 Redis-based rate limiting
* 🔢 Atomic counters with `INCR`
* 🔍 Redis key scanning with `SCAN`

### 🔵 Database & Prisma

* PostgreSQL relational database design
* Prisma ORM
* Database migrations
* Relations
* Self-referencing comment relations
* Aggregations with `_count`
* Pagination
* Query optimization

### 🐳 Docker

The entire application can run using Docker Compose:

```text
┌──────────────────────────────────────┐
│           Docker Compose             │
│                                      │
│  ┌────────────┐   ┌──────────────┐  │
│  │  NestJS    │──▶│ PostgreSQL   │  │
│  │    API     │   │      18      │  │
│  └─────┬──────┘   └──────────────┘  │
│        │                             │
│        ▼                             │
│  ┌────────────┐                      │
│  │   Redis    │                      │
│  │     7      │                      │
│  └────────────┘                      │
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

# ✨ Features

## 🔐 Authentication

The API supports:

* User registration
* User login
* Password hashing with bcrypt
* JWT access tokens
* Protected routes using NestJS Guards
* Authentication through Bearer tokens

### Endpoints

```http
POST /auth/register
POST /auth/login
GET  /auth/me
```

---

# 📝 Posts

Authenticated users can create posts.

```http
POST /posts
```

The user ID is extracted from the authenticated JWT rather than being supplied by the client.

Example:

```json
{
  "content": "Hello world!",
  "contentType": "text",
  "caption": "My first post"
}
```

---

# 💬 Comments & Nested Replies

Posts support comments and nested replies.

```http
POST /posts/:postId/comments
```

A comment can optionally specify:

```json
{
  "parentCommentId": 10
}
```

This creates a reply to another comment.

The database uses a **self-referencing relationship** to support nested comment structures.

```text
Post
 │
 ├── Comment
 │    ├── Reply
 │    │    └── Reply
 │    │
 │    └── Reply
 │
 └── Comment
```

---

# 📰 Feed

```http
GET /posts
```

The feed provides:

* Newest posts first
* Post author
* Total comments
* Total replies included in comment count
* Latest comment
* Pagination metadata

Example pagination:

```json
{
  "pagination": {
    "currentPage": 1,
    "itemsPerPage": 10,
    "totalItems": 25
  }
}
```

---

# ⚡ Redis Feed Caching

One of the main goals of this project was understanding practical Redis caching.

The post feed is cached using a key based on the pagination parameters:

```text
posts:page:1:limit:10
```

Cached responses have a TTL of **60 seconds**.

### Cache Flow

```text
GET /posts
      │
      ▼
   Redis?
   /    \
 HIT     MISS
 │        │
 ▼        ▼
Return   PostgreSQL
cache      │
           ▼
         Redis
           │
           ▼
         Return
```

This reduces unnecessary database queries for frequently requested feed pages.

---

# 🗑️ Cache Invalidation

When a new post is successfully created:

```http
POST /posts
```

the cached feed is invalidated.

```text
Create Post
     │
     ▼
Post saved in PostgreSQL
     │
     ▼
Invalidate posts:* cache
     │
     ▼
Next GET /posts
     │
     ▼
Fresh data from PostgreSQL
     │
     ▼
Store new result in Redis
```

This ensures that users do not continue receiving stale feed data after a new post is created.

---

# 🚦 Redis Rate Limiting

Another major Redis learning component is a custom rate limiter specifically for:

```http
POST /posts
```

The current policy is:

```text
5 post creations / 60 seconds / user
```

Redis maintains an atomic counter:

```text
rate-limit:posts:<userId>
```

Using Redis `INCR` makes the counter atomic.

When the limit is exceeded:

```http
HTTP 429 Too Many Requests
```

is returned.

Example:

```text
Request 1 → ✅
Request 2 → ✅
Request 3 → ✅
Request 4 → ✅
Request 5 → ✅
Request 6 → ❌ 429 Too Many Requests
```

---

# 🔎 Post Details

```http
GET /posts/:postId
```

Returns:

* Post information
* Author
* Paginated top-level comments
* Comment authors
* Number of replies for each comment

Example:

```json
{
  "id": 1,
  "content": "Hello world!",
  "author": {
    "id": 1,
    "username": "parsa"
  },
  "comments": [
    {
      "id": 10,
      "text": "Great post!",
      "author": {
        "id": 2,
        "username": "user2"
      },
      "totalReplies": 3
    }
  ]
}
```

---

# 👤 User Profile

```http
GET /users/:userId/profile
```

The profile endpoint provides:

* User information
* Total posts created
* Total comments made
* Five most recent mixed actions

The recent actions combine:

```text
Posts + Comments
       ↓
Sort by createdAt
       ↓
Take latest 5
```

---

# 🧠 Database Design

The main entities are:

```text
User
 │
 ├───────────────┐
 ▼               ▼
Post           Comment
 │               │
 │               └──────┐
 │                      │
 └──────────────────────┘
```

### User

```text
User
 ├── id
 ├── username
 ├── email
 ├── passwordHash
 ├── createdAt
 └── updatedAt
```

### Post

```text
Post
 ├── id
 ├── authorId
 ├── content
 ├── contentType
 ├── caption
 └── createdAt
```

### Comment

```text
Comment
 ├── id
 ├── postId
 ├── authorId
 ├── parentCommentId
 ├── text
 └── createdAt
```

The `parentCommentId` field enables the self-referencing comment/reply relationship.

---

# 🚫 N+1 Query Consideration

The feed was implemented with Prisma relational queries and aggregation rather than fetching each post's author/comments individually in a loop.

For example, author information and comment counts are retrieved as part of the database query.

This avoids the classic:

```text
1 query for posts
+
N queries for authors
+
N queries for comments
```

pattern.

Instead, related information is loaded using Prisma's relational querying capabilities.

---

# 📄 Pagination

Pagination is implemented for:

### Feed

```http
GET /posts?page=1&limit=10
```

### Post comments

```http
GET /posts/1?page=1&limit=10
```

The API returns:

```json
{
  "pagination": {
    "currentPage": 1,
    "itemsPerPage": 10,
    "totalItems": 100
  }
}
```

---

# 🧪 Testing

The project includes End-to-End tests using:

* Jest
* Supertest
* NestJS Testing utilities

Current E2E coverage includes:

```text
Authentication
├── Register
└── Login

Posts
├── Authentication
└── Creation

Comments
├── Authentication
├── Top-level comments
└── Replies

Feed
└── Pagination + metadata + comments

Post Details
├── Details
└── 404 handling

Profile
├── Statistics
├── Recent actions
└── 404 handling

Rate Limiting
└── 429 after limit

Redis Cache
└── Cache invalidation after post creation
```

### Current Result

```text
14 tests
14 passed
0 failed
```

---

# 🐳 Running With Docker

## 1. Clone the repository

```bash
git clone <your-repository-url>
cd social-media-feed-api
```

## 2. Build the containers

```bash
docker compose build
```

## 3. Start the application

```bash
docker compose up -d
```

The stack contains:

```text
NestJS API       → localhost:3000
PostgreSQL       → localhost:5432
Redis            → localhost:6379
```

## 4. Apply Prisma migrations

```bash
docker compose exec api npx prisma migrate deploy
```

## 5. Check containers

```bash
docker compose ps
```

Expected services:

```text
social-media-feed-api
social-media-feed-postgres
social-media-feed-redis
```

---

# 📚 API Documentation

Swagger documentation is available at:

```text
http://localhost:3000/docs
```

Swagger can be used to explore and test the API endpoints.

---

# 🔧 Environment Variables

For local development, create a `.env` file based on:

```text
.env.example
```

Example:

```env
PORT=3000

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/social_media_feed?schema=public

JWT_SECRET=your-secret-key

REDIS_URL=redis://localhost:6379
```

> ⚠️ Never commit real secrets or `.env` files to the repository.

---

# 🏗️ Project Structure

```text
social-media-feed-api/
│
├── src/
│   ├── auth/
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── strategies/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   │
│   ├── posts/
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── posts.controller.ts
│   │   ├── posts.service.ts
│   │   └── posts.module.ts
│   │
│   ├── comments/
│   │   ├── dto/
│   │   ├── comments.controller.ts
│   │   ├── comments.service.ts
│   │   └── comments.module.ts
│   │
│   ├── users/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   │
│   ├── prisma/
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   │
│   ├── redis/
│   │   ├── redis.service.ts
│   │   └── redis.module.ts
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── .env.example
├── prisma.config.ts
├── package.json
└── README.md
```

---

# 🎓 What I Learned

This project was primarily a **hands-on learning project**.

The biggest focus areas were:

### NestJS

Understanding how to structure a backend application using:

```text
Controller
    ↓
Service
    ↓
Prisma
    ↓
PostgreSQL
```

and how NestJS Guards, DTOs, validation, modules, and dependency injection fit into this architecture.

### Redis

The most important learning area was Redis.

I implemented Redis in two different backend use cases:

```text
Redis
├── ⚡ Feed Cache
│   ├── GET
│   ├── SET
│   ├── TTL
│   └── Cache Invalidation
│
└── 🚦 Rate Limiter
    ├── INCR
    ├── EXPIRE
    └── 429 handling
```

This helped me understand Redis not only as a simple key-value store, but as a practical backend infrastructure component.

### Docker

I also practiced running the entire backend stack as independent services:

```text
NestJS
PostgreSQL
Redis
```

and connecting them through Docker Compose service networking.

---

# 🚀 Future Improvements

Possible improvements for a more production-ready version include:

* [ ] Refresh tokens
* [ ] More advanced Redis caching strategies
* [ ] Distributed rate limiting improvements
* [ ] Redis atomic Lua-based rate limiting
* [ ] Cursor-based pagination
* [ ] Full-text post search
* [ ] DataLoader for more complex relational queries
* [ ] More comprehensive unit tests
* [ ] Separate test database
* [ ] CI/CD pipeline
* [ ] Structured logging
* [ ] Request tracing
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

The goal was not simply to implement endpoints, but to understand the backend concepts behind them — especially **NestJS architecture, PostgreSQL data modeling, Prisma, Redis caching, Redis rate limiting, and containerized development**.

> **Build it. Break it. Understand it. Improve it. 🚀**
