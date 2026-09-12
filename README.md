# CodeSync — Real-Time Collaborative Coding Platform

> **Code together. Build together.**

CodeSync is a real-time collaborative coding platform designed for developer teams, pair programming, technical interviews, and algorithmic problem solving. Multiple developers can join shared coding rooms, edit files simultaneously with live multi-user cursors, communicate through integrated team chat, and execute programs in a sandboxed environment powered by **Judge0**.

---

## 1. Features

- **Real-Time Concurrent Multi-User Editing**: Simultaneous editing with live remote cursors, selections, and presence indicators without lost updates.
- **Sandboxed Program Execution (Judge0)**: Instant compilation and execution for C++ and multiple languages with stdout, stderr, compile diagnostics, stdin input, and execution metrics (runtime in ms, memory in KB).
- **Persistent SQL Workspaces**: Full relational data model in **MySQL 8.0** managed by **Prisma ORM** with versioned migrations.
- **VS-Code Inspired File Explorer**: Multi-file workspace management (create, open, rename, delete files) with language syntax highlighting.
- **Production-Grade Authentication**:
  - Email/Password authentication with bcrypt password hashing and real-time password strength validation.
  - **Continue with Google** (OAuth 2.0 / OpenID Connect).
  - Secure HTTP-only cookies with SameSite and JWT verification.
- **Room Authorization & Roles**: Role-based access control (`OWNER`, `EDITOR`, `VIEWER`) enforced across both REST APIs and WebSockets.
- **Integrated Team Chat**: Real-time room chat with user avatars, timestamps, auto-scroll, and SQL persistence.
- **Developer-Focused UI/UX**: Dark theme inspired by VS Code, Linear, and Raycast without generic SaaS templates or vibe-coding fluff.

---

## 2. Architecture & Technology Stack

```text
                    ┌─────────────────────────┐
                    │     CodeSync Client     │
                    │ React + Monaco + JSX    │
                    └───────────┬─────────────┘
                                │ (HTTP + WebSocket)
                                ↓
                    ┌─────────────────────────┐
                    │   Node.js + Express     │
                    │   Socket.IO Server      │
                    └──────┬────────────┬─────┘
                           │            │
             (Prisma ORM)  │            │ (HTTP Submissions)
                           ↓            ↓
                    ┌───────────┐  ┌─────────────┐
                    │   MySQL   │  │   Judge0    │
                    │  Database │  │   Sandbox   │
                    └───────────┘  └─────────────┘
```

### Frontend
- **Framework**: React 18 with Vite
- **Language**: JavaScript (ES Modules, JSX)
- **Editor**: Monaco Editor (`@monaco-editor/react`)
- **Styling**: Tailwind CSS with custom dark tokens
- **Routing**: React Router DOM (v6)
- **WebSockets**: Socket.IO Client

### Backend
- **Runtime**: Node.js (v20+ / v22)
- **Server**: Express.js (ES Modules)
- **Real-Time Engine**: Socket.IO
- **ORM**: Prisma ORM (v5)
- **Database**: MySQL 8.0
- **Authentication**: JWT (JSON Web Tokens) in HTTP-only cookies + bcryptjs
- **Execution Integration**: Dedicated Judge0 client, mapper, and service layer

---

## 3. Database Architecture (MySQL + Prisma)

CodeSync uses a relational schema in MySQL with versioned migrations (`prisma/migrations/`):

- **User**: User profiles, credentials, unique usernames/emails, Google OAuth identifiers.
- **Room**: Collaborative workspaces with unique room codes (`#CS-XXXX`), visibility (`PUBLIC`, `PRIVATE`), and owner references.
- **RoomMember**: Room membership mappings with role enforcement (`OWNER`, `EDITOR`, `VIEWER`).
- **File**: Workspace files with path, code content (`LONGTEXT`), file extension language, and monotonic version counters.
- **ChatMessage**: Room discussion stream persisted with sender associations and timestamps.

---

## 4. Execution Architecture (Judge0 Only)

Code execution strictly isolates untrusted user code from the API server:
1. User writes code in Monaco Editor and clicks **Run Code** (`Ctrl + Enter`).
2. CodeSync frontend sends code and optional stdin to `POST /api/execute`.
3. Backend validates authentication, room membership, and permissions (`OWNER` or `EDITOR`).
4. Rate limiting protects the endpoint from submission abuse.
5. The backend forwards the submission to the **Judge0 API** (`http://127.0.0.1:2358` or cloud provider).
6. Backend polls or awaits the submission result and maps it into CodeSync's normalized format:
   ```json
   {
     "status": "COMPLETED",
     "stdout": "Hello, CodeSync!",
     "stderr": "",
     "compileError": "",
     "runtimeError": "",
     "exitCode": 0,
     "executionTime": 0.012,
     "memoryUsed": 3328
   }
   ```
7. Results, compilation diagnostics, and metrics render cleanly in the multi-tab Terminal.

---

## 5. Local Setup & Getting Started

### Prerequisites
- Node.js (v20 or v22) & npm
- Docker & Docker Compose
- Judge0 running locally on port `2358` (or cloud Judge0 API)

### 1. Clone & Configure Environment
```bash
git clone <repo-url> codesync
cd codesync
cp .env.example .env
```

### 2. Start MySQL via Docker
```bash
docker compose up -d mysql
```
MySQL will be healthy on `localhost:3308`.

### 3. Install Dependencies & Migrate Database
```bash
npm install
npx prisma migrate dev
```

### 4. Start Development Servers
Run both backend and frontend concurrently:
```bash
npm run dev
```
- Client runs on: `http://localhost:5173`
- Backend runs on: `http://localhost:5000`

---

## 6. Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Express API port | `5000` |
| `NODE_ENV` | Environment mode (`development`/`production`) | `development` |
| `DATABASE_URL` | MySQL connection string | `mysql://root:codesyncpassword@localhost:3308/codesync` |
| `JWT_SECRET` | Secret key for signing authentication tokens | *Set secure string* |
| `JWT_EXPIRES_IN` | Token duration | `7d` |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID | |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 Client Secret | |
| `GOOGLE_CALLBACK_URL` | OAuth redirect URI | `http://localhost:5000/api/auth/google/callback` |
| `CLIENT_URL` | Frontend URL for CORS configuration | `http://localhost:5173` |
| `JUDGE0_BASE_URL` | Judge0 server endpoint | `http://127.0.0.1:2358` |
| `JUDGE0_API_KEY` | Optional RapidAPI or Judge0 API key | |
| `EXECUTION_RATE_LIMIT_MAX` | Max code executions per window | `30` |

---

## 7. Testing

Run the automated integration test suite covering authentication, room permissions, file operations, chat persistence, and Judge0 C++ compilation:

```bash
node server/test/integration.test.js
```

---

## 8. Docker Deployment

To build and run the entire production stack:
```bash
docker compose up -d --build
```
This deploys:
- `codesync-mysql` (MySQL 8.0 on port 3308)
- `codesync-server` (Express API + WebSockets on port 5000)
- `codesync-client` (Production Nginx SPA on port 5173)

---

## 9. Security Considerations

- Untrusted user code is **never** executed on the Express server; it is isolated in Judge0 sandbox containers.
- Authentication tokens are delivered exclusively in **HTTP-only, SameSite cookies** to prevent XSS credential theft.
- Role-based access control (`requireRoomRole`) is enforced server-side for all sensitive endpoints.
- Rate limiting protects authentication and code execution routes against brute-force and DDoS attacks.
- Input validation via **Zod** protects all API boundaries.
