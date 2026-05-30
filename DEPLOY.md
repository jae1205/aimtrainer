# Deployment Guide

## Vercel

This project is a Vite React single-page app deployed through Vercel.

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Production branch: `main`
- SPA routing: all paths rewrite to `/index.html`

The repository-level Vercel settings are defined in `vercel.json`. Vercel's GitHub integration should deploy production whenever `main` is updated. Pull requests or non-production branches can be used for preview deployments, depending on the Vercel project settings.

## Local Verification

Run the same build command Vercel uses:

```bash
npm run build
```

Then preview the production build locally:

```bash
npm run preview
```

## Release Flow

1. Work on `dev`.
2. Push `dev`.
3. Open and merge a pull request from `dev` into `main`.
4. Confirm the Vercel deployment for `main` succeeds in the Vercel dashboard.

Avoid putting GitHub personal access tokens in repository files or command examples. Use the authenticated `origin` remote or GitHub CLI instead.
