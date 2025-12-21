# Strava OAuth Redirect Loop - Troubleshooting Guide

## Problem
When authorizing the app, you get redirected back and forth between your app and Strava in an infinite loop.

## Root Cause
The **Authorization Callback Domain** in your Strava API settings doesn't match what your app is using.

## Solution

### Step 1: Check Your Current Setup

1. Open your browser's developer console (F12)
2. Look for logs starting with `=== STRAVA AUTH DEBUG ===`
3. Note the **Redirect URI** value (e.g., `http://localhost:5173/callback`)

### Step 2: Update Strava App Settings

1. Go to https://www.strava.com/settings/api
2. Find your Sport Year application
3. Look at the **Authorization Callback Domain** field

#### For Local Development (localhost):

**IMPORTANT:** Strava has specific requirements for localhost:

- ✅ **Correct:** `localhost` (domain only, no port)
- ❌ **Wrong:** `localhost:5173` (ports not allowed)
- ❌ **Wrong:** `http://localhost` (no protocol)
- ❌ **Wrong:** `http://localhost:5173/callback` (no full URL)

#### For Production (custom domain):

- ✅ **Correct:** `yourdomain.com` (domain only)
- ❌ **Wrong:** `https://yourdomain.com` (no protocol)
- ❌ **Wrong:** `yourdomain.com/callback` (no path)

### Step 3: How Redirect URIs Work

When you set **Authorization Callback Domain** to `localhost`, Strava will accept these redirect URIs:
- `http://localhost/callback` ✅
- `http://localhost:5173/callback` ✅
- `http://localhost:3000/callback` ✅
- Any port on localhost ✅

The key is that the **domain** must match, and Strava automatically handles different ports on localhost.

### Step 4: Clear Browser Storage

After updating Strava settings:

1. Open DevTools (F12) → Application tab → Storage
2. Clear:
   - Local Storage
   - Session Storage
3. Reload the page

### Step 5: Re-enter Credentials

1. Go to Settings → Strava Settings in your app
2. Delete and re-enter your **Client ID** and **Client Secret**
3. Save

### Step 6: Test the Flow

1. Click "Connect with Strava"
2. Check the browser console for debug logs:
   ```
   === STRAVA AUTH DEBUG ===
   Client ID: 123456
   Redirect URI: http://localhost:5173/callback
   ```
3. Authorize on Strava
4. Check callback logs:
   ```
   === CALLBACK DEBUG ===
   Current URL: http://localhost:5173/callback?code=...
   Code parameter: abc123...
   ```

## Common Issues

### Issue: "No code or error in callback URL"

**Cause:** Strava callback domain mismatch

**Fix:**
1. Check that Strava app has domain set to `localhost` (not `localhost:5173`)
2. Make sure you clicked "Update" after changing Strava settings
3. Clear browser cache

### Issue: "Token exchange failed" with 401 error

**Cause:** Wrong Client ID or Client Secret

**Fix:**
1. Double-check your credentials in Strava API settings
2. Make sure there are no extra spaces when copying
3. Re-enter them in the app settings

### Issue: Redirect loop even with correct settings

**Cause:** Stale localStorage data

**Fix:**
1. Open DevTools → Application → Local Storage
2. Delete all `sport-year-*` entries
3. Refresh page
4. Re-enter your Strava credentials

## Still Having Issues?

Check the browser console for detailed error messages. The debug logs will show:
- What redirect URI the app is using
- What Strava is returning
- Any errors during token exchange

The most common issue is that the **Authorization Callback Domain** in Strava settings doesn't match. It should be set to just `localhost` for local development.
