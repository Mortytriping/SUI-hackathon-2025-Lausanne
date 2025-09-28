# zkLogin Setup Instructions

## 🚀 Quick Setup

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to **"APIs & Services"** > **"Credentials"**
4. Click **"Create Credentials"** > **"OAuth client ID"**
5. Choose **"Web application"**
6. Set **Name**: "Sui Alarm App"
7. Add **Authorized redirect URIs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3001/auth/callback` (in case port 3000 is busy)
8. Click **"Create"**
9. Copy the **Client ID**

### 2. Configure Environment Variables

Edit `.env.local` file:

```env
# Replace with your actual Google OAuth Client ID
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here.googleusercontent.com

# Keep these as they are for development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ZKLOGIN_SALT=random-salt-for-development-12345
```

### 3. Restart Your Development Server

```bash
# Stop the current server (Ctrl+C) then restart
pnpm dev
```

### 4. Test zkLogin

1. Go to your app
2. Switch to **"🔐 zkLogin (OAuth)"** mode  
3. Click **"Sign in with Google"**
4. Complete the Google OAuth flow
5. You should be redirected back and authenticated!

## 🔧 Troubleshooting

### Error: "Missing required parameter: client_id"
- Make sure `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set in `.env.local`
- Restart your development server after adding the environment variable

### Error: "redirect_uri_mismatch"
- Make sure you added `http://localhost:3000/auth/callback` to your Google OAuth configuration
- If your app runs on a different port, add that redirect URI too

### Error: "invalid_request"
- Double-check your Google Client ID is correct
- Make sure there are no extra spaces in your `.env.local` file

## 🌐 Production Setup

For production deployment:

1. Update `NEXT_PUBLIC_APP_URL` to your production domain
2. Add your production redirect URI to Google OAuth: `https://yourdomain.com/auth/callback`
3. Use a secure random salt for `NEXT_PUBLIC_ZKLOGIN_SALT`

## 🎯 Features

Once configured, users can:
- ✅ Sign in with Google (no wallet needed)
- ✅ Create alarms with zkLogin authentication  
- ✅ Interact with blockchain without managing private keys
- ✅ Secure, privacy-preserving authentication