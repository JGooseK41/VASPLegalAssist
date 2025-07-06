# 🛠️ Fix Deployment Issues

## Issue: Missing Dependencies

The deployment is failing because some dependencies are missing from package.json files.

## Solution: Update Your GitHub Repository

### Option 1: Update Files in GitHub Web Interface

1. **Go to your GitHub repository**
2. **Navigate to `package.json`** (in root directory)
3. **Click the pencil icon** to edit
4. **Replace the entire content** with:

```json
{
  "name": "vasp-legal-assistant",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/dom": "^10.4.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^13.5.0",
    "axios": "^1.6.0",
    "lodash": "^4.17.21",
    "lucide-react": "^0.518.0",
    "papaparse": "^5.5.3",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router-dom": "^6.8.0",
    "react-scripts": "5.0.1",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "devDependencies": {
    "autoprefixer": "^10.4.21",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.17"
  }
}
```

5. **Commit the changes**

### Option 2: Push Updated Files from Local

1. **Copy the updated files** from `github-deployment` folder
2. **Push to GitHub**:
```bash
cd github-deployment
git add package.json backend/package.json
git commit -m "Fix missing dependencies"
git push
```

## After Updating

### Netlify will automatically:
1. Detect the change
2. Trigger a new build
3. Install all dependencies
4. Deploy successfully

### Render will automatically:
1. Detect the change
2. Rebuild the backend
3. Deploy successfully

## Verify Success

1. **Check Netlify dashboard** → Deploy should show "Published"
2. **Check Render dashboard** → Service should show "Live"
3. **Visit your site** → Should load without errors

## Still Having Issues?

### Clear Netlify Cache:
1. Go to Netlify dashboard
2. Deploys → Deploy settings
3. Build & deploy → Build settings
4. Clear cache and retry deploy

### Check Logs:
- **Netlify**: Deploys → Click failed deploy → View logs
- **Render**: Dashboard → Your service → Logs

## Common Errors and Fixes

**"Cannot find module 'axios'"**
- Make sure axios is in dependencies
- Clear cache and redeploy

**"Cannot find module 'react-router-dom'"**
- Make sure react-router-dom is in dependencies
- Version should be ^6.8.0 or higher

**Build failed on Netlify**
- Check if all imports in your code match installed packages
- Verify no typos in import statements