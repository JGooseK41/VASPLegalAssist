# 🔌 Reconnect Netlify and Render to New Repository

## 📱 Reconnect Netlify (Frontend)

### Step 1: Go to Your Netlify Site
1. Go to [app.netlify.com](https://app.netlify.com)
2. Click on your site (should show as disconnected/failed)

### Step 2: Reconnect Repository
1. Go to **Site configuration** → **Build & deploy** → **Continuous deployment**
2. You'll see a warning that the repository is not found
3. Click **Link to a different repository**
4. Choose **GitHub**
5. You may need to:
   - Click **Configure the Netlify app on GitHub**
   - Grant access to your new repository
6. Select `JGooseK41/VASPLegalAssist`
7. Keep the same build settings:
   - Build command: `npm run build`
   - Publish directory: `build`
8. Click **Deploy site**

### Step 3: Verify Environment Variables
1. Go to **Site configuration** → **Environment variables**
2. Make sure you still have:
   - `REACT_APP_API_URL` = Your Render backend URL

---

## 🖥️ Reconnect Render (Backend)

### Step 1: Go to Your Render Service
1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click on your web service (vasp-legal-assistant-api)

### Step 2: Reconnect Repository
1. Go to **Settings** tab
2. Under **Build & Deploy** section
3. You'll see GitHub repository is disconnected
4. Click **Connect GitHub account** or **Update repository**
5. Authorize Render if needed
6. Select your new repository: `JGooseK41/VASPLegalAssist`
7. Verify settings:
   - Root Directory: `backend`
   - Build Command: `npm install && npx prisma generate && npx prisma db push --accept-data-loss`
   - Start Command: `node server.js`

### Step 3: Verify Environment Variables
Go to **Environment** tab and ensure these are still set:
- `DATABASE_URL` (from your PostgreSQL database)
- `JWT_SECRET`
- `CLIENT_URL` (your Netlify URL)
- `DEMO_EMAIL`
- `DEMO_PASSWORD`
- `NODE_ENV`

### Step 4: Manual Deploy
1. Click **Manual Deploy** → **Deploy latest commit**
2. Watch the logs to ensure successful build

---

## ✅ Verification Steps

### 1. Check Netlify Deploy
- Should show "Published" status
- Visit your site URL
- Should load the login page

### 2. Check Render Deploy
- Should show "Live" status
- Test API endpoint: `https://your-api.onrender.com/api/health`
- Should return: `{"status":"ok","timestamp":"..."}`

### 3. Test Full Application
1. Go to your Netlify URL
2. Login with demo account:
   - Email: `demo@vaspla.gov`
   - Password: `demo2024`
3. Should successfully login!

---

## 🚨 Common Issues

### "Repository not found" in Netlify
- Make sure you granted Netlify access to the new repo
- Go to GitHub Settings → Applications → Netlify → Configure
- Add repository access for VASPLegalAssist

### "Build failed" in Render
- Check that all backend files are present
- Verify root directory is set to `backend`
- Check environment variables are set

### "Cannot connect to backend"
- Make sure `REACT_APP_API_URL` in Netlify points to your Render URL
- Include `/api` at the end: `https://your-app.onrender.com/api`
- Redeploy Netlify after updating

---

## 🎉 Success Indicators

✅ Netlify: Shows "Published" with green checkmark
✅ Render: Shows "Live" with green dot
✅ Can access your site
✅ Can login with demo account
✅ API health check works

Your app should be fully functional now! 🚀