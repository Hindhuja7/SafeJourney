# SafeJourney - Render Deployment Guide

This guide provides step-by-step instructions for deploying SafeJourney on Render.

## Prerequisites

1. GitHub account with repository access
2. Render account (sign up at https://render.com)
3. API keys:
   - TomTom API key
   - (Optional) Gemini API key
   - (Optional) Twilio credentials

---

## Step 1: Push Code to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit - Ready for Render deployment"

# Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/safejourney.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend

1. **Go to Render Dashboard** → Click **"New +"** → Select **"Web Service"**

2. **Connect Repository:**
   - Connect your GitHub account
   - Select the `safejourney` repository

3. **Configure Backend Service:**
   - **Name:** `safejourney-backend`
   - **Environment:** `Node`
   - **Region:** Choose closest to your users (e.g., `Oregon (US West)`)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** `Free` (or upgrade for always-on)

4. **Add Environment Variables:**
   - `NODE_ENV` = `production`
   - `PORT` = `10000` (Render will auto-assign, but set as fallback)
   - `FRONTEND_URL` = `https://safejourney-frontend.onrender.com` (update after frontend is deployed)
   - `TOMTOM_API_KEY` = `your_tomtom_api_key`
   - `GEMINI_API_KEY` = `your_gemini_key` (optional, if using Gemini)
   - `TWILIO_ACCOUNT_SID` = `your_twilio_sid` (optional, if using Twilio)
   - `TWILIO_AUTH_TOKEN` = `your_twilio_token` (optional, if using Twilio)
   - `TWILIO_PHONE_NUMBER` = `your_twilio_number` (optional, if using Twilio)

5. **Click "Create Web Service"**

6. **Wait for deployment** - First build may take 5-10 minutes

7. **Note your backend URL** - It will be something like `https://safejourney-backend.onrender.com`

---

## Step 3: Deploy Frontend

1. **Go to Render Dashboard** → Click **"New +"** → Select **"Web Service"**

2. **Connect Repository:**
   - Select the same `safejourney` repository

3. **Configure Frontend Service:**
   - **Name:** `safejourney-frontend`
   - **Environment:** `Node`
   - **Region:** Same as backend
   - **Branch:** `main`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** `Free` (or upgrade for always-on)

4. **Add Environment Variables:**
   - `NEXT_PUBLIC_API_URL` = `https://safejourney-backend.onrender.com` (your backend URL from Step 2)
   - `NEXT_PUBLIC_TOMTOM_API_KEY` = `your_tomtom_api_key`

5. **Click "Create Web Service"**

6. **Wait for deployment** - First build may take 10-15 minutes (Next.js builds can be slow)

7. **Note your frontend URL** - It will be something like `https://safejourney-frontend.onrender.com`

---

## Step 4: Update Backend CORS

1. Go to your **Backend Service** on Render
2. Navigate to **Environment** tab
3. Update `FRONTEND_URL` to match your frontend URL: `https://safejourney-frontend.onrender.com`
4. Click **Save Changes** - This will trigger a redeploy

---

## Step 5: Test Deployment

1. **Visit your frontend URL:** `https://safejourney-frontend.onrender.com`

2. **Test the following:**
   - ✅ Home page loads
   - ✅ Login/Register works
   - ✅ Route planning works
   - ✅ Navigation works
   - ✅ Map displays correctly

3. **Check Logs if Issues:**
   - Backend: Dashboard → Backend Service → Logs
   - Frontend: Dashboard → Frontend Service → Logs

---

## Important Notes

### Free Tier Limitations

- **Cold Starts:** Services spin down after 15 minutes of inactivity
- **First Request:** May take 30-60 seconds to wake up the service
- **Build Time:** Free tier has slower builds (can take 10-15 minutes)

### Recommendations

- **Upgrade Plan:** Consider upgrading to a paid plan for:
  - Always-on services (no cold starts)
  - Faster builds
  - More resources

### Environment Variables

- Never commit `.env` files to GitHub
- Always set sensitive keys via Render's Environment Variables UI
- Use different API keys for production vs development

### Data Persistence

The backend uses JSON files in `backend/data/` for storage. On Render's free tier:
- Data persists between deploys
- Data is lost if service is deleted
- Consider upgrading to a database (PostgreSQL) for production

---

## Troubleshooting

### Build Fails

**Issue:** Build command fails  
**Solution:**
- Check build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify Node version compatibility

### CORS Errors

**Issue:** Frontend can't connect to backend  
**Solution:**
- Verify `FRONTEND_URL` in backend environment variables matches frontend URL
- Check backend CORS settings in `backend/index.js`
- Ensure both services are deployed and running

### API Not Responding

**Issue:** API calls fail  
**Solution:**
- Check backend logs for errors
- Verify `NEXT_PUBLIC_API_URL` is set correctly in frontend
- Test backend health endpoint: `https://safejourney-backend.onrender.com/api/health`

### Map Not Loading

**Issue:** TomTom map doesn't display  
**Solution:**
- Verify `NEXT_PUBLIC_TOMTOM_API_KEY` is set in frontend environment
- Check browser console for API key errors
- Ensure TomTom API key has correct permissions

### Blank Page

**Issue:** Frontend shows blank page  
**Solution:**
- Check browser console for errors
- Verify build completed successfully
- Check frontend logs for runtime errors
- Ensure environment variables are set correctly

---

## Custom Domain (Optional)

1. **Add Custom Domain:**
   - Go to your service → Settings → Custom Domains
   - Add your domain (e.g., `app.safejourney.com`)

2. **Update DNS:**
   - Add CNAME record pointing to your Render URL
   - Wait for DNS propagation (can take up to 48 hours)

3. **SSL Certificate:**
   - Render automatically provisions SSL certificates
   - HTTPS is enabled by default

---

## Monitoring

- **Logs:** View real-time logs in Render dashboard
- **Metrics:** Monitor CPU, memory, and request metrics
- **Alerts:** Set up alerts for service failures

---

## Support

- **Render Docs:** https://render.com/docs
- **Render Community:** https://community.render.com
- **SafeJourney Issues:** Report issues in GitHub repository

---

## Quick Reference

- **Backend URL:** `https://safejourney-backend.onrender.com`
- **Frontend URL:** `https://safejourney-frontend.onrender.com`
- **Health Check:** `https://safejourney-backend.onrender.com/api/health`

---

**Last Updated:** 2024

