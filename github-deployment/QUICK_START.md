# Quick Start Guide

## Local Development

1. Clone this repository
2. Run the setup script:
   ```bash
   ./setup.sh
   ```
3. Update environment variables in `.env` and `backend/.env`
4. Start the application:
   ```bash
   npm run dev
   ```

## Deployment

### Frontend (Netlify)
1. Connect this repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Add environment variable: `REACT_APP_API_URL=your-backend-url`

### Backend (Render)
1. Connect this repository to Render
2. Set root directory: `backend`
3. Set build command: `npm install && npx prisma generate`
4. Set start command: `npx prisma migrate deploy && node server.js`
5. Add environment variables from `backend/.env.example`

## Demo Account
- Email: demo@vaspla.gov
- Password: demo2024

See `DEPLOYMENT.md` for detailed instructions.
