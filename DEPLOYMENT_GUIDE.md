# Vercel Deployment Guide

## Quick Deployment Steps

1. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect it's a Next.js project

2. **Set Environment Variables**
   In your Vercel dashboard, go to Settings → Environment Variables and add:
   
   ```
   CONTRACT_ID=game-v0.testnet
   RESOLVER_ACCOUNT_ID=resolver-v0.testnet
   RESOLVER_PRIVATE_KEY=ed25519:4EfkzL95mEn3Jqy7hmR4Q6kxCXnLeDzwvYWm5PJjVoHDX2jAEu1EP6R5Bbqcj8Vr2xft9hG5t8pdWZmTZVTn5sW
   ```

3. **Deploy**
   - Click "Deploy" in Vercel dashboard
   - The build will use the optimized configuration

## Build Optimizations Applied

✅ **Fixed Issues:**
- Removed undefined `accountId` reference in test-wallet page
- Fixed top-level await in golem API route
- Removed unnecessary React Native dependencies
- Cleaned up package.json scripts
- Optimized Next.js configuration for production

✅ **Vercel Configuration:**
- Created `vercel.json` with proper API timeout settings
- Added `.vercelignore` to exclude unnecessary files
- Configured CORS headers for API routes
- Set up proper build commands

✅ **Dependencies Cleaned:**
- Removed `@react-native-async-storage/async-storage`
- Removed `@types/react-native`
- Removed `express` (not needed for frontend)
- Removed `pino-pretty` (not needed for frontend)

## Build Commands

The project uses these optimized build commands:
- `npm run build` - Production build
- `npm run dev` - Development server
- `npm run start` - Production server

## Troubleshooting

If deployment fails:
1. Check Vercel build logs for specific errors
2. Ensure all environment variables are set
3. Verify the build completes locally first
4. Check that all dependencies are properly installed

## Performance Features

- **API Timeout**: 30 seconds for API routes
- **CORS Headers**: Properly configured for cross-origin requests
- **Build Optimization**: Package imports optimized for better performance
- **File Exclusions**: Unnecessary files excluded from deployment
