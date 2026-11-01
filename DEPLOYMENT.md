# ScholarPulse AI — Deployment Guide

ScholarPulse AI is a full-stack research platform (Express API + Vite React + Gemini Engine). Because it performs real-time PDF extraction and AI map-reduce synthesis, it requires a persistent Node.js runtime or container, rather than restrictive 10-second serverless functions.

---

## Recommended Platform 1: Render (render.com) — Free & 1-Click

Render natively runs full-stack Node.js applications with generous execution timeouts.

### Steps:
1. Push your latest GitHub repository changes.
2. Go to [render.com](https://render.com) and click **New + > Web Service**.
3. Select your GitHub repository.
4. Render will auto-detect the `render.yaml` Blueprint or enter:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. In **Environment Variables**, add:
   - `GEMINI_API_KEY`: *(Your Google Gemini API Key)*
   - `NODE_ENV`: `production`
6. Click **Deploy Web Service**.
Your app will be live with full functionality at `https://your-app-name.onrender.com`.

---

## Recommended Platform 2: Railway (railway.app) — Easiest Zero-Config

Railway deploys full-stack Node.js repositories with zero configuration.

### Steps:
1. Go to [railway.app](https://railway.app) and click **New Project > Deploy from GitHub repo**.
2. Select your repository.
3. In the project settings, click **Variables** and add:
   - `GEMINI_API_KEY`: *(Your Google Gemini API Key)*
4. Railway will automatically detect `package.json`, build the client, and start the engine.
5. In **Settings > Networking**, click **Generate Domain** to get your public URL.

---

## Recommended Platform 3: Koyeb (koyeb.com) — Free Container Deployment

Koyeb automatically builds and runs the included `Dockerfile`:

### Steps:
1. Go to [koyeb.com](https://koyeb.com) and click **Create Service > GitHub**.
2. Select your repository.
3. Koyeb will detect the `Dockerfile`.
4. Add environment variable:
   - `GEMINI_API_KEY`: *(Your Google Gemini API Key)*
5. Click **Deploy**.

---

## Why These Platforms Work Better Than Vercel for Full-Stack AI:
- **No 10-second serverless execution limits:** Research papers and deep LLM synthesis can run naturally without getting aborted mid-execution.
- **Unified Process:** The Express backend and static frontend run as a single coordinated service.
- **Full File and Stream Support:** PDF parsing and undici connections operate with full Node.js capabilities.
