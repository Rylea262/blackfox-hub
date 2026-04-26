# Blackfox Hub

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- ESLint (default Next.js config)

## Local development

```bash
npm install
cp .env.local.example .env.local
# fill in the Supabase values in .env.local
npm run dev
```

The app runs at <http://localhost:3000>.

## Deploy target

Railway.
