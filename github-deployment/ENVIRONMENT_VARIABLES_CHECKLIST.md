# Environment Variables Deployment Checklist

## Frontend Environment Variables (.env or .env.production)

### Required Variables:
- [ ] `REACT_APP_API_URL` - Set to your production backend URL (e.g., `https://api.yourdomain.com/api`)
  - ⚠️ **CRITICAL**: If not set, the app will fallback to `http://localhost:5000/api`
  - This is the most common cause of "localhost:3000" connection errors

### Example Frontend .env.production:
```
REACT_APP_API_URL=https://your-backend-url.com/api
```

## Backend Environment Variables

### Required Variables:
- [ ] `APP_URL` or `CLIENT_URL` - Set to your production frontend URL (e.g., `https://yourdomain.com`)
  - ⚠️ **CRITICAL**: If not set, email verification links will point to localhost:3000
- [ ] `ALLOWED_ORIGINS` - Comma-separated list of allowed frontend URLs for CORS
- [ ] `DATABASE_URL` - Your production database connection string
- [ ] `JWT_SECRET` - Strong secret for JWT tokens
- [ ] `ENCRYPTION_KEY` - Strong key for data encryption

### Example Backend .env:
```
APP_URL=https://theblockrecord.com
CLIENT_URL=https://theblockrecord.com
ALLOWED_ORIGINS=https://theblockrecord.com,https://www.theblockrecord.com
DATABASE_URL=postgresql://user:pass@host:port/db?schema=public
JWT_SECRET=your-strong-secret-here
ENCRYPTION_KEY=your-strong-key-here
```

## Common Issues and Solutions

### Issue: "Unable to connect to localhost:3000"
**Cause**: Frontend is using hardcoded localhost URL instead of production API URL
**Solution**: 
1. Ensure `REACT_APP_API_URL` is set in your frontend deployment
2. Rebuild and redeploy the frontend after setting the environment variable

### Issue: Email verification links point to localhost
**Cause**: Backend missing `APP_URL` or `CLIENT_URL` environment variable
**Solution**: Set either `APP_URL` or `CLIENT_URL` to your production frontend URL

### Issue: CORS errors
**Cause**: Frontend URL not in allowed origins list
**Solution**: Add your frontend URL to `ALLOWED_ORIGINS` in backend environment

## Deployment Steps

1. **Backend Deployment**:
   - Set all required backend environment variables
   - Deploy backend and verify it's accessible
   - Note the backend URL for frontend configuration

2. **Frontend Deployment**:
   - Set `REACT_APP_API_URL` to your backend URL
   - Build the frontend: `npm run build`
   - Deploy the built files
   - Test that API calls are going to the correct backend URL

3. **Verification**:
   - Open browser developer tools Network tab
   - Sign up or log in
   - Verify all API calls are going to production URLs, not localhost
   - Check email verification links point to production URL

## Platform-Specific Notes

### Netlify
- Set environment variables in Site settings → Environment variables
- Trigger a new build after setting variables

### Vercel
- Set environment variables in Project Settings → Environment Variables
- Redeploy after setting variables

### Render
- Set environment variables in Environment → Environment Variables
- Service will automatically restart

Remember: Environment variables are read at build time for frontend apps, so you must rebuild after changing them!