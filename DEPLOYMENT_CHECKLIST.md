# SafeJourney Deployment Checklist

Use this checklist to ensure a smooth deployment on Render.

## Pre-Deployment

- [ ] All code is committed and pushed to GitHub
- [ ] All environment variables documented
- [ ] API keys obtained (TomTom, Gemini, Twilio if needed)
- [ ] Tested locally to ensure everything works

## Backend Deployment

- [ ] Created Render account
- [ ] Connected GitHub repository
- [ ] Created new Web Service for backend
- [ ] Set root directory to `backend`
- [ ] Set build command: `npm install`
- [ ] Set start command: `npm start`
- [ ] Added environment variables:
  - [ ] `NODE_ENV` = `production`
  - [ ] `PORT` = `10000`
  - [ ] `FRONTEND_URL` = (will update after frontend deployment)
  - [ ] `TOMTOM_API_KEY` = (your key)
  - [ ] `GEMINI_API_KEY` = (if using)
  - [ ] `TWILIO_ACCOUNT_SID` = (if using)
  - [ ] `TWILIO_AUTH_TOKEN` = (if using)
  - [ ] `TWILIO_PHONE_NUMBER` = (if using)
- [ ] Deployment completed successfully
- [ ] Backend URL noted: `https://safejourney-backend.onrender.com`
- [ ] Tested health endpoint: `/api/health`

## Frontend Deployment

- [ ] Created new Web Service for frontend
- [ ] Set root directory to `frontend`
- [ ] Set build command: `npm install && npm run build`
- [ ] Set start command: `npm start`
- [ ] Added environment variables:
  - [ ] `NEXT_PUBLIC_API_URL` = (backend URL from above)
  - [ ] `NEXT_PUBLIC_TOMTOM_API_KEY` = (your key)
- [ ] Deployment completed successfully
- [ ] Frontend URL noted: `https://safejourney-frontend.onrender.com`

## Post-Deployment Configuration

- [ ] Updated backend `FRONTEND_URL` environment variable with frontend URL
- [ ] Backend redeployed with updated CORS settings

## Testing

- [ ] Frontend URL loads correctly
- [ ] Login page displays
- [ ] Can register new user
- [ ] Can login with existing user
- [ ] Route planning works
- [ ] Routes are displayed on map
- [ ] Navigation view works
- [ ] Live location sharing works (if applicable)
- [ ] No console errors in browser
- [ ] API calls succeed (check Network tab)

## Final Verification

- [ ] Both services show "Live" status in Render dashboard
- [ ] No critical errors in logs
- [ ] Application is accessible from external network
- [ ] SSL/HTTPS working correctly
- [ ] Environment variables are correct

## Optional Enhancements

- [ ] Custom domain configured (if applicable)
- [ ] Upgraded to paid plan for always-on services
- [ ] Set up monitoring and alerts
- [ ] Database configured (if upgrading from JSON files)

---

**Deployment Date:** ___________  
**Backend URL:** ___________  
**Frontend URL:** ___________  
**Status:** [ ] Successful  [ ] Issues Encountered

