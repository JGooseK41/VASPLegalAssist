# 🚀 Netlify & Render Deployment Guide

## Prerequisites
- Your code is uploaded to GitHub
- You have accounts on Netlify and Render (free tier is fine)

---

## 📱 Part 1: Deploy Frontend to Netlify

### Step 1: Connect to Netlify
1. Go to [app.netlify.com](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **"Deploy with GitHub"**
4. Authorize Netlify to access your GitHub account
5. Select your `vasp-legal-assistant` repository

### Step 2: Configure Build Settings
Netlify should auto-detect these, but verify:
- **Base directory**: ` ` (leave empty)
- **Build command**: `npm run build`
- **Publish directory**: `build`

### Step 3: Add Environment Variables
1. Click **"Show advanced"** before deploying
2. Click **"New variable"**
3. Add:
   - Key: `REACT_APP_API_URL`
   - Value: `https://YOUR-APP-NAME.onrender.com/api` (you'll update this after Render deployment)

### Step 4: Deploy
1. Click **"Deploy site"**
2. Wait 2-3 minutes for build to complete
3. Your site will be live at: `https://random-name.netlify.app`

### Step 5: Change Site Name (Optional)
1. Go to **Site settings** → **General** → **Site details**
2. Click **"Change site name"**
3. Choose something like: `vasp-legal-assistant`
4. Your URL becomes: `https://vasp-legal-assistant.netlify.app`

---

## 🖥️ Part 2: Deploy Backend to Render

### Step 1: Create PostgreSQL Database
1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `vasp-legal-db`
   - **Database**: `vasp_legal_assistant` (optional)
   - **User**: `vasp_user` (optional)
   - **Region**: Choose closest to you
   - **PostgreSQL Version**: 15
   - **Plan**: Free
4. Click **"Create Database"**
5. Wait for database to be ready (2-3 minutes)
6. Copy the **"Internal Database URL"** - you'll need this

### Step 2: Deploy Backend Service
1. Click **"New +"** → **"Web Service"**
2. Click **"Build and deploy from a Git repository"**
3. Click **"Connect GitHub"** and authorize Render
4. Select your `vasp-legal-assistant` repository
5. Configure:
   - **Name**: `vasp-legal-assistant-api`
   - **Region**: Same as your database
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command**: `node server.js`
   - **Plan**: Free

### Step 3: Add Environment Variables
Click **"Advanced"** and add these environment variables:

1. **DATABASE_URL**
   - Value: (paste the Internal Database URL from Step 1)

2. **JWT_SECRET**
   - Value: Generate a secure random string (32+ characters)
   - Quick generation: `openssl rand -base64 32`

3. **CLIENT_URL**
   - Value: `https://your-site.netlify.app` (your Netlify URL)

4. **DEMO_EMAIL**
   - Value: `demo@vaspla.gov`

5. **DEMO_PASSWORD**
   - Value: `demo2024` (or change it)

6. **NODE_ENV**
   - Value: `production`

### Step 4: Deploy
1. Click **"Create Web Service"**
2. Wait 5-10 minutes for build and deployment
3. Your API will be live at: `https://vasp-legal-assistant-api.onrender.com`

---

## 🔗 Part 3: Connect Frontend to Backend

### Update Netlify Environment Variable
1. Go back to Netlify dashboard
2. Go to **Site settings** → **Environment variables**
3. Update `REACT_APP_API_URL` to your Render URL:
   - Value: `https://vasp-legal-assistant-api.onrender.com/api`
4. Go to **Deploys** → **Trigger deploy** → **Deploy site**

---

## ✅ Part 4: Verify Everything Works

### Test Your Application
1. Visit your Netlify URL: `https://your-site.netlify.app`
2. Try the demo login:
   - Email: `demo@vaspla.gov`
   - Password: `demo2024`
3. Create a new account
4. Test document generation

### Check Health Endpoints
- Frontend: `https://your-site.netlify.app`
- Backend Health: `https://your-api.onrender.com/api/health`

---

## 🛠️ Troubleshooting

### "Cannot connect to backend"
- Check REACT_APP_API_URL in Netlify env vars
- Ensure it includes `/api` at the end
- Redeploy frontend after changing env vars

### "Database connection failed"
- Check DATABASE_URL in Render env vars
- Ensure PostgreSQL database is running
- Check Render logs for specific errors

### "Build failed on Render"
- Check if `backend` folder is set as root directory
- Ensure all dependencies are in package.json
- Check build logs for specific errors

### "CORS error"
- Verify CLIENT_URL in Render matches your Netlify URL
- Should be exact match (https included)

---

## 📊 Monitoring

### Netlify
- **Analytics**: Basic analytics in free tier
- **Deploy logs**: Shows build process
- **Function logs**: Not used in this app

### Render
- **Logs**: Real-time application logs
- **Metrics**: CPU/Memory usage
- **Health checks**: Automatic monitoring

---

## 🔄 Updating Your App

### To deploy updates:
1. Push changes to GitHub
2. Both Netlify and Render auto-deploy on push
3. Monitor deploy status in dashboards

### Manual redeploy:
- **Netlify**: Deploys tab → "Trigger deploy"
- **Render**: Manual Deploy → "Deploy latest commit"

---

## 🎉 Success Checklist

- [ ] Frontend deployed to Netlify
- [ ] Backend deployed to Render
- [ ] PostgreSQL database connected
- [ ] Environment variables configured
- [ ] Demo login works
- [ ] Can create new users
- [ ] Can generate documents
- [ ] No CORS errors

Your VASP Legal Assistant is now live! 🚀