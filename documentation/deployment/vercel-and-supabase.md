# Deployment Guide: Vercel + Supabase

This guide deploys the FinishIt frontend to Vercel and connects it to a Supabase project for data and authentication.

## 1. Prerequisites

- GitHub repository with this project
- Vercel account
- Supabase account and project
- Node.js 20+ locally for pre-deployment validation

## 2. Prepare Supabase

### 2.1 Create project

- Create a new Supabase project
- Save the following from Project Settings -> API:
  - Project URL
  - anon public key

### 2.2 Apply schema

In Supabase SQL Editor, execute:

1. database/schema/tables/001_phase4_core_schema.sql
2. database/migrations/001_calendar_task_sync.sql

### 2.3 Configure authentication

- Enable Email provider in Authentication settings
- Configure site URL and redirect URL(s):
  - Local: http://localhost:5173
  - Production: your Vercel domain (for example, https://finishit.vercel.app)

### 2.4 Optional Google Calendar support

If using calendar integration:

- Create Google OAuth client credentials
- Add your production domain and local URL as authorized origins
- Keep the client ID for Vercel environment variables

## 3. Deploy Frontend to Vercel

## 3.1 Import project

- In Vercel, click Add New -> Project
- Import the GitHub repository
- Set Root Directory to frontend

## 3.2 Build settings

Use:

- Framework Preset: Vite
- Build Command: npm run build
- Output Directory: dist
- Install Command: npm install

## 3.3 Environment variables

Add these in Vercel Project Settings -> Environment Variables:

- VITE_APP_NAME=FinishIt
- VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
- VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_PUBLIC_KEY
- VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID (optional if calendar is enabled)

Set variables for all target environments you use (Production/Preview/Development).

## 3.4 Deploy

- Trigger deployment from Vercel dashboard
- Confirm deployment succeeds
- Open the production URL

## 4. Post-Deployment Validation

Perform smoke tests:

- Login page loads
- Authenticated routing to dashboard works
- Task create/update/delete works
- Habit create and daily toggle works
- Notifications page loads and refreshes
- Calendar page loads (and OAuth + sync works if configured)

## 5. Troubleshooting

## Blank app or auth warning screen

Likely cause: missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in Vercel.

Action: verify environment variables and redeploy.

## Calendar connect fails

Likely causes:

- Missing VITE_GOOGLE_CLIENT_ID
- OAuth origin mismatch in Google Console

Action: update Google OAuth origins and Vercel env vars.

## SQL relation/table errors at runtime

Likely cause: schema files not fully applied.

Action: rerun SQL scripts in correct order and verify all tables exist.

## 6. Recommended Production Hardening

- Enable and validate Row Level Security on all user-owned tables
- Add monitoring/alerting for frontend runtime errors and API failures
- Use preview deployments for migration validation before production rollout
- Document rollback process for schema and release versions
