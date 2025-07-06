# Production Deployment Checklist

## Security
- [ ] Generate secure JWT_SECRET (32+ characters)
- [ ] Change DEMO_PASSWORD from default
- [ ] Enable HTTPS (automatic on most platforms)
- [ ] Review CORS settings
- [ ] Set NODE_ENV=production

## Database
- [ ] Migrate from SQLite to PostgreSQL
- [ ] Run database migrations
- [ ] Set up automated backups
- [ ] Create database indexes for performance

## Environment Variables
- [ ] Backend: DATABASE_URL (PostgreSQL)
- [ ] Backend: JWT_SECRET (secure random string)
- [ ] Backend: CLIENT_URL (frontend URL)
- [ ] Frontend: REACT_APP_API_URL (backend URL)

## Features to Consider
- [ ] Email notifications (SendGrid/AWS SES)
- [ ] File storage (S3 for PDFs)
- [ ] Rate limiting
- [ ] API monitoring (Sentry/LogRocket)
- [ ] Analytics (Google Analytics/Plausible)

## Legal Compliance
- [ ] Add Terms of Service
- [ ] Add Privacy Policy
- [ ] Implement audit logging
- [ ] Data retention policies
- [ ] GDPR compliance if applicable

## Performance
- [ ] Enable gzip compression
- [ ] Set up CDN for assets
- [ ] Optimize images
- [ ] Implement caching strategies
- [ ] Lazy load components

## Testing
- [ ] Test all auth flows
- [ ] Test document generation
- [ ] Test CSV uploads
- [ ] Load testing
- [ ] Mobile responsiveness

## Monitoring
- [ ] Set up uptime monitoring
- [ ] Configure error alerts
- [ ] Monitor API response times
- [ ] Track user metrics
- [ ] Set up logs aggregation