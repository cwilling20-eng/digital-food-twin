# Complete Codebase Export
Generated: 2026-01-29

## Project Structure
```
project/
├── src/
│   ├── components/     (React components)
│   ├── data/          (Static data)
│   ├── lib/           (Supabase client)
│   └── types/         (TypeScript types)
├── supabase/
│   └── migrations/    (Database schema)
└── [config files]
```

## Quick Setup Instructions
1. `npm install`
2. Copy `.env` with your Supabase credentials
3. Run migrations in Supabase dashboard
4. `npm run dev`

---

## Key Files to Copy

### Essential Files
- All files in `src/` directory (18 files)
- All files in `supabase/migrations/` (3 files)
- `package.json` - Dependencies
- `.env` - Environment variables
- `vite.config.ts`, `tailwind.config.js`, `tsconfig.json`

### n8n Integration Endpoints
- Menu Scan: `https://exponentmarketing.app.n8n.cloud/webhook/341c1c9e-85e0-4923-8f89-29b1a23cb839`
- Chat: `https://exponentmarketing.app.n8n.cloud/webhook/chat`

---

## Environment Variables (.env)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

See `codebase_dump.md` for full source code of all files.
