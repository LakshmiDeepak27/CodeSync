# CodeSync — Zero-Cost Production Deployment Guide

This guide walks you through deploying CodeSync **100% free of charge**, with zero server fees, fully configured with your MySQL database and external Judge0 execution engine.

---

## 1. Architecture Options

| Method | Cost | Best For | Complexity |
| :--- | :--- | :--- | :--- |
| **Option A: Render Unified Web Service** *(Recommended)* | **$0.00 / month** | Complete platform (Frontend, Backend, WebSockets, Prisma) on a single free service | **Easiest & Most Reliable** (No CORS, No cookie domain issues) |
| **Option B: Vercel + Render** | **$0.00 / month** | Global Edge CDN for React SPA + Render for Node API & WebSockets | Medium (Separate frontend & backend repos/settings) |
| **Option C: Docker Compose on Free VPS** | **$0.00 / month** | Oracle Cloud Always Free VM (4 OCPUs, 24GB RAM) or personal server | Advanced (Requires SSH & Linux administration) |

---

## 2. Step 1: Database Setup (Free MySQL)

CodeSync uses Prisma ORM with MySQL 8.0. You have two free options:

### Option 2A: Use Your Existing MySQL Database
If you already have a MySQL database (from your cloud provider or host), simply copy the connection URI:
```env
DATABASE_URL="mysql://<user>:<password>@<host>:<port>/<database>?sslaccept=strict"
```

### Option 2B: TiDB Cloud Serverless (100% Free Forever)
If you need a free hosted MySQL 8.0 compatible cloud database:
1. Go to [TiDB Cloud](https://tidbcloud.com) and create a free account (no credit card required).
2. Create a new **Serverless Cluster** (Free tier provides 5GB storage and 50 million Request Units monthly).
3. Click **Connect** → select **Prisma** or **General MySQL**.
4. Copy the connection string. It will look like:
   ```env
   DATABASE_URL="mysql://<username>:<password>@gateway01.<region>.prod.aws.tidbcloud.com:4000/<dbname>?sslaccept=strict"
   ```

---

## 3. Step 2: Judge0 Execution Engine Setup (100% Free — No Credit Card Needed)

You do **NOT** need to pay for Judge0 or provide a credit card on RapidAPI. You can use the official public **Judge0 Community Edition** server:

```env
JUDGE0_BASE_URL="https://ce.judge0.com"
```

- **Cost**: $0.00 (Completely Free)
- **Credit Card**: None required
- **Sign-up**: None required
- **Supported Languages**: C++, C, Python, JavaScript, and more!

> [!NOTE]
> When using `https://ce.judge0.com`, you leave `JUDGE0_API_KEY` and `JUDGE0_HOST` empty or omit them entirely!


---

## 4. Step 3: Deploy to Render.com (100% Free — Option A)

Render allows you to host a full Node.js Web Service with WebSocket support completely free.

### 1. Push your CodeSync repository to GitHub
Make sure your CodeSync code is pushed to your GitHub account.

### 2. Create a New Web Service on Render
1. Go to the [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Fill in the service configuration:
   - **Name**: `codesync` (or your preferred name)
   - **Region**: Closest to your users (e.g., Oregon, Frankfurt, Singapore)
   - **Branch**: `main` (or your default branch)
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install --include=dev && npm run build
     ```
   - **Start Command**:
     ```bash
     npx prisma migrate deploy && npm start
     ```
   - **Instance Type**: **Free** ($0 / month)

### 3. Configure Environment Variables in Render
In the **Environment Variables** tab, add the following:

| Variable | Value | Notes |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations |
| `PORT` | `10000` | Render assigns port 10000 automatically |
| `DATABASE_URL` | `<your-mysql-connection-string>` | MySQL or TiDB connection string |
| `JWT_SECRET` | `<random-64-character-secret>` | Secret for authentication tokens |
| `JWT_EXPIRES_IN` | `7d` | Token expiry duration |
| `JUDGE0_BASE_URL` | `https://ce.judge0.com` | Official free Judge0 server |
| `JUDGE0_API_KEY` | *(leave empty)* | Not required for `ce.judge0.com` |
| `COOKIE_SECURE` | `true` | Enforces HTTPS-only cookies |
| `CLIENT_URL` | `https://<your-render-app-name>.onrender.com` | Your Render public URL |
| `SERVER_URL` | `https://<your-render-app-name>.onrender.com` | Same as CLIENT_URL in unified mode |

### 4. Deploy!
Click **Create Web Service**. Render will:
1. Run `npm install`
2. Compile Prisma Client & generate the React SPA Vite bundle (`npm run build`)
3. Execute pending MySQL database migrations (`npx prisma migrate deploy`)
4. Launch Express + Socket.IO (`npm start`)

Your live platform will be available at:
`https://<your-service-name>.onrender.com`

---

## 5. Option B: Decoupled Deployment (Vercel Frontend + Render Backend)

If you prefer hosting the React frontend on Vercel's global CDN:

### Backend on Render:
Deploy the backend as described in Step 4, with:
- `CLIENT_URL`: `https://<your-app>.vercel.app`

### Frontend on Vercel:
1. Go to [Vercel](https://vercel.com) → **Add New Project**.
2. Select your CodeSync repository.
3. In **Build and Output Settings**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build --workspace=codesync-client`
   - **Output Directory**: `client/dist`
4. In **Environment Variables**:
   - `VITE_SERVER_URL`: `https://<your-render-app-name>.onrender.com`
   - `VITE_API_URL`: `https://<your-render-app-name>.onrender.com/api`
   - `VITE_SOCKET_URL`: `https://<your-render-app-name>.onrender.com`
5. Click **Deploy**.

---

## 6. Verification Checklist

After deployment, perform these checks:

1. **Health Check**:
   Visit `https://<your-app-domain>/health`. You should receive:
   ```json
   { "status": "ok", "service": "codesync-server" }
   ```
2. **Account Registration**:
   Open the application in your browser, go to `/signup`, create an account, and confirm you are redirected to `/dashboard`.
3. **Room Creation & File Tree**:
   Create a new room (`#CS-XXXX`). Verify the starter C++ file loads in the Monaco Editor.
4. **WebSocket Collaboration**:
   Open the same room in an incognito or secondary window. Check if presence indicators and live cursor movements display.
5. **Sandboxed Code Execution**:
   Click **Run Code** (`Ctrl + Enter`) to execute code through the hosted Judge0 sandbox. Confirm standard output and metrics render in the terminal tab.
