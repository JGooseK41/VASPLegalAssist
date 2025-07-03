# Deployment Guide for VASP Legal Assistant

## Prerequisites
- GitHub account (to host your code)
- Netlify account (free tier works)
- Render/Railway account (free tier available)

## Step 1: Prepare Your Code

1. **Update environment variables**
   ```bash
   # Generate a secure JWT secret
   openssl rand -base64 32
   ```
   Save this value for later use.

2. **Create production build**
   ```bash
   npm run build
   ```

3. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

## Step 2: Deploy Backend (Choose One)

### Option A: Deploy to Render (Recommended - Free)

1. Sign up at [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: vasp-legal-assistant-api
   - **Root Directory**: backend
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npx prisma migrate deploy && node server.js`
5. Add environment variables:
   - `DATABASE_URL`: (Render will provide PostgreSQL URL)
   - `JWT_SECRET`: Your generated secret
   - `CLIENT_URL`: Your Netlify URL (add after frontend deployment)
   - `DEMO_EMAIL`: demo@vaspla.gov
   - `DEMO_PASSWORD`: demo2024
6. Click "Create Web Service"

### Option B: Deploy to Railway

1. Sign up at [railway.app](https://railway.app)
2. Create new project from GitHub
3. Add PostgreSQL database
4. Deploy backend service
5. Set environment variables in Railway dashboard

### Option C: Deploy to Heroku (Paid)

1. Install Heroku CLI
2. Create `Procfile` in backend folder:
   ```
   web: npx prisma migrate deploy && node server.js
   ```
3. Deploy:
   ```bash
   cd backend
   heroku create your-app-name
   heroku addons:create heroku-postgresql:hobby-dev
   git push heroku main
   ```

## Step 3: Deploy Frontend to Netlify

1. Sign up at [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select your repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
5. Add environment variable:
   - `REACT_APP_API_URL`: Your backend URL (e.g., https://your-app.onrender.com/api)
6. Click "Deploy site"

## Step 4: Post-Deployment Setup

1. **Update CORS**: Once you have your Netlify URL, update the backend's `CLIENT_URL` environment variable

2. **Test the deployment**:
   - Visit your Netlify URL
   - Try logging in with demo account
   - Create a new user account
   - Generate a test document

3. **Set up custom domain** (optional):
   - In Netlify: Settings → Domain management
   - Add your custom domain

## Important Security Steps

1. **Change default passwords**:
   - Update `DEMO_PASSWORD` in production
   - Use strong JWT secret (32+ characters)

2. **Enable HTTPS** (automatic on Netlify/Render)

3. **Set up monitoring**:
   - Render: Built-in health checks
   - Consider adding Sentry for error tracking

## Troubleshooting

### CORS Errors
- Ensure `CLIENT_URL` in backend matches your Netlify URL exactly
- Check that backend allows your frontend origin

### Database Connection Issues
- Verify `DATABASE_URL` is set correctly
- Check if database is provisioned and running
- Run migrations: `npx prisma migrate deploy`

### Build Failures
- Check Node version compatibility (16+)
- Ensure all dependencies are in package.json
- Check build logs for specific errors

### PDF Generation Issues
- Ensure `generated-pdfs` directory exists
- Check file permissions on server
- Consider using cloud storage (S3) for production

## Performance Optimization

1. **Enable caching**:
   - Add CDN for static assets
   - Cache VASP data (currently 1-hour cache)

2. **Optimize images**:
   - Compress any images used
   - Use WebP format where possible

3. **Database indexes**:
   - Add indexes for frequently queried fields
   - Monitor query performance

## Scaling Considerations

As your usage grows:
1. Upgrade to paid tiers for more resources
2. Add Redis for session management
3. Implement queue system for PDF generation
4. Consider microservices architecture
5. Add load balancing

## Backup Strategy

1. **Database backups**:
   - Render: Automatic daily backups (paid tier)
   - Set up manual backup script

2. **Document storage**:
   - Currently stores PDFs locally
   - Consider S3/CloudFlare R2 for production

3. **Code backups**:
   - GitHub provides version control
   - Tag releases for easy rollback