# Render Deployment Fix - Build Command Issue

## Problem
Render is trying to run `npm start` as the build command, causing the error:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'express'
```

## Solution

### Option 1: Fix in Render Dashboard (RECOMMENDED)

1. **Go to your Backend Service on Render Dashboard**

2. **Navigate to Settings** → Scroll to **"Build & Deploy"** section

3. **Update the Build Command:**
   - **Current (WRONG):** `npm start`
   - **Change to:** `npm install`
   - ⚠️ **CRITICAL:** Make sure Build Command is `npm install`, NOT `npm start`

4. **Verify Start Command:**
   - Should be: `npm start`
   - This is correct, don't change it

5. **Verify Root Directory:**
   - Should be: `backend`
   - If not, change it to `backend`

6. **Click "Save Changes"** - This will trigger a new deployment

7. **Wait for deployment** - Should now build successfully

### Option 2: Use render.yaml (Alternative)

If you want to use the `render.yaml` file:

1. **Ensure `backend/render.yaml` exists** with correct configuration
2. **In Render Dashboard** → Go to your service → **Settings** → **Build Settings**
3. **Enable "Auto-Deploy"** and ensure render.yaml is being read
4. **Or manually update** the Build Command as in Option 1

## Verification

After fixing, the build logs should show:
```
==> Running build command 'npm install'...
==> Installing dependencies...
```

NOT:
```
==> Running build command 'npm start'...  ❌ WRONG
```

## Quick Checklist

- [ ] Build Command = `npm install` (NOT `npm start`)
- [ ] Start Command = `npm start`
- [ ] Root Directory = `backend`
- [ ] All environment variables are set
- [ ] Save changes and redeploy

## Why This Happened

Render sometimes defaults to `npm start` for the build command if not explicitly set. Always verify:
- **Build Command:** Installs dependencies (`npm install`)
- **Start Command:** Starts the application (`npm start`)

---

**After fixing, your deployment should work correctly!**

