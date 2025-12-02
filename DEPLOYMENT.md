# Deployment Guide

## Deploy to Cloudflare Pages

This app is 100% static and ready to deploy to Cloudflare Pages for free hosting with global CDN.

### Step 1: Connect Repository

1. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
2. Click "Create a project"
3. Connect your GitHub account
4. Select the `hrm-rtpcr` repository

### Step 2: Configure Build Settings

Use these settings:

- **Project name**: `hrm-analyzer` (or your preferred name)
- **Production branch**: `main`
- **Framework preset**: `None`
- **Build command**: (leave empty)
- **Build output directory**: `/`
- **Root directory**: `/` (or leave empty)

### Step 3: Deploy

Click "Save and Deploy" - your app will be live in minutes!

Your app will be available at: `https://hrm-analyzer.pages.dev`

## Deploy to GitHub Pages

Alternatively, you can deploy to GitHub Pages:

1. Go to your repository settings
2. Navigate to "Pages" section
3. Under "Source", select "Deploy from a branch"
4. Select branch: `main` and folder: `/ (root)`
5. Click "Save"

Your app will be available at: `https://denishdholaria.github.io/hrm-rtpcr/`

## Deploy to Netlify

1. Go to [Netlify](https://app.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select `hrm-rtpcr`
4. Build settings:
   - **Build command**: (leave empty)
   - **Publish directory**: `/`
5. Click "Deploy site"

## Deploy to Vercel

1. Go to [Vercel](https://vercel.com/)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Framework Preset: `Other`
5. Root Directory: `./` (or leave default)
6. Build Command: (leave empty)
7. Output Directory: `./`
8. Click "Deploy"

## Custom Domain

After deployment, you can add a custom domain in your hosting provider's settings:

- Cloudflare Pages: Project Settings → Custom domains
- GitHub Pages: Repository Settings → Pages → Custom domain
- Netlify: Site settings → Domain management
- Vercel: Project Settings → Domains

## Environment Variables

This app doesn't require any environment variables - it runs entirely client-side!

## HTTPS

All the hosting providers above automatically provide free HTTPS certificates.

## Performance Tips

The app is already optimized with:
- Service Worker for offline caching
- Minified libraries
- Efficient CSS and JavaScript
- PWA capabilities

For best performance:
1. Enable HTTP/2 (automatic on Cloudflare/Netlify/Vercel)
2. Enable Brotli compression (automatic on most platforms)
3. Use a CDN (Cloudflare Pages includes this by default)

## Testing Deployment

After deployment, test these features:
1. Upload a CSV file
2. Upload an .eds file
3. Run analysis
4. Export results
5. Install as PWA (click install prompt in browser)
6. Test offline functionality

## Troubleshooting

**Service Worker not registering:**
- Ensure you're using HTTPS (required for service workers)
- Check browser console for errors

**Files not loading:**
- Verify all paths are relative (no leading `/`)
- Check that all files were committed to git

**PWA not installable:**
- Ensure manifest.json is accessible
- Verify all icon files exist
- Check that you're using HTTPS

## Updates

To update your deployed app:

```bash
git add .
git commit -m "Your update message"
git push origin main
```

The hosting provider will automatically rebuild and deploy your changes.
