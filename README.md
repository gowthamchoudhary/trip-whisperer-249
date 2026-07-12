# Trip Architect

Trip Architect combines a Lovable-generated React frontend with a Node.js + Express backend travel-planning agent.

## Structure

```text
trip-architect/
  frontend/  Lovable React app cloned from gowthamchoudhary/trip-whisperer-249
  backend/   Express backend and planning pipeline
```

## Start the frontend

```bash
cd frontend
bun install
bun run dev
```

For Supabase email/password auth, create `frontend/.env` from `frontend/.env.example` and fill:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BACKEND_URL=http://localhost:4000
```

## Start the backend

```bash
cd backend
npm install
cp .env.example .env
npm start
```

Fill in the backend `.env` with Supabase, Groq, and Anakin keys before running the full pipeline.
