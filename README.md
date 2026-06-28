# SANAD 26

Final Share-to-SANAD PWA application.

## Stack

- Next.js App Router
- TypeScript
- Supabase browser client
- Arabic RTL UI
- IBM Plex Sans Arabic
- PWA manifest and service worker

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Required Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Only the public anon key is used by the frontend. Do not place `service_role` keys in this app.

## Routes

- `/`
- `/share`
- `/share/[id]`
- `/workspace`

## Share Intake Flow

The `/share` page creates records in the existing Supabase tables:

1. `share_intakes`
2. `share_intake_files`
3. `share_processing_jobs`

The binary upload path is intentionally isolated as a placeholder structure until the production Storage bucket
and RLS policies are confirmed. No Firebase, mock database, database migration, or service-role logic is included.

## Notes

This app assumes the existing Supabase tables expose insert permissions for the anon role through the correct RLS
policies. If inserts fail locally, check the table policies and the exact required column names in Supabase.
