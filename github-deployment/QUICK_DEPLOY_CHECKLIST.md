# ⚡ Quick Deploy Checklist

## 1️⃣ Netlify (Frontend) - 5 minutes

1. **Go to**: [app.netlify.com](https://app.netlify.com)
2. **Click**: "Add new site" → "Import an existing project"
3. **Connect**: GitHub → Select your repo
4. **Build settings** (should auto-detect):
   - Build command: `npm run build`
   - Publish directory: `build`
5. **Environment variable**:
   - `REACT_APP_API_URL` = `https://temp-url.com/api` (update later)
6. **Deploy**: Click "Deploy site"
7. **Get URL**: Note your Netlify URL (e.g., `amazing-newton-123.netlify.app`)

---

## 2️⃣ Render (Backend) - 10 minutes

### A. Create Database First
1. **Go to**: [dashboard.render.com](https://dashboard.render.com)
2. **Click**: "New +" → "PostgreSQL"
3. **Name**: `vasp-legal-db`
4. **Plan**: Free
5. **Create**: Click "Create Database"
6. **Copy**: Internal Database URL (wait 2 mins for it to be ready)

### B. Deploy Backend
1. **Click**: "New +" → "Web Service"
2. **Connect**: Your GitHub repo
3. **Configure**:
   - Name: `vasp-legal-api`
   - Root Directory: `backend`
   - Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
   - Start Command: `node server.js`
4. **Environment Variables** (click Advanced):
   ```
   DATABASE_URL = [paste Internal Database URL from step A]
   JWT_SECRET = any-random-32-character-string-here
   CLIENT_URL = https://[your-netlify-name].netlify.app
   DEMO_EMAIL = demo@vaspla.gov
   DEMO_PASSWORD = demo2024
   NODE_ENV = production
   ```
5. **Create**: Click "Create Web Service"
6. **Get URL**: Note your Render URL (e.g., `vasp-legal-api.onrender.com`)

---

## 3️⃣ Connect Frontend to Backend - 2 minutes

1. **Go back to Netlify**: Site settings → Environment variables
2. **Update**: `REACT_APP_API_URL` = `https://[your-render-url].onrender.com/api`
3. **Redeploy**: Deploys → Trigger deploy → Deploy site

---

## 4️⃣ Test - 2 minutes

1. **Visit**: Your Netlify URL
2. **Login with demo**:
   - Email: `demo@vaspla.gov`
   - Password: `demo2024`
3. **Success!** 🎉

---

## ⏱️ Total Time: ~20 minutes

## 🚨 Common Issues

**"Cannot POST /api/auth/login"**
- Check REACT_APP_API_URL has `/api` at the end
- Redeploy frontend after fixing

**"Network Error"**
- Backend might still be starting (takes 5-10 mins first time)
- Check Render logs

**"Invalid credentials"**
- Make sure backend environment variables are set
- Check JWT_SECRET is set

## 📝 Your URLs

Fill these in as you go:
- Frontend URL: `https://________________.netlify.app`
- Backend URL: `https://________________.onrender.com`
- API Endpoint: `https://________________.onrender.com/api`