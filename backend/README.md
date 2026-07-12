# Trip Architect Backend

Node.js + Express backend for the Trip Architect travel-planning agent.

## Run locally

```bash
cd backend
npm install
cp .env.example .env
npm start
```

The API starts on `http://localhost:4000` by default.

Apply `supabase/create_flights_table.sql` once in Supabase before enabling the flight stage.

## Environment variables

- `PORT`: Express server port.
- `FRONTEND_ORIGIN`: Lovable/Vite frontend origin for CORS, usually `http://localhost:5173`.
- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key for backend inserts and updates.
- `GROQ_API_KEY`: Groq API key for intent parsing and ranking.
- `GROQ_MODEL`: Optional Groq model override. Defaults to `llama-3.3-70b-versatile`.
- `ANAKIN_API_KEY`: Anakin API key for agentic search, Wire listings, Wire weather, Wire flights, and monitors.
- `MONITOR_WEBHOOK_SECRET`: Shared secret for verifying Anakin monitor webhook signatures.
- `MONITOR_WEBHOOK_URL`: Public webhook URL passed to Anakin when creating listing monitors.

## Endpoints

- `POST /api/plan-trip`: Starts the async planning pipeline. Body: `{ "trip_request_id": "...", "user_message": "..." }`.
- `POST /api/webhook/monitor-alert`: Receives signed Anakin monitor alerts.
- `GET /health`: Basic health check.

## Pipeline

The orchestrator runs:

1. Parse trip intent with Groq.
2. Research destinations with Anakin agentic search.
3. Geocode and score weather through Anakin Wire's Open-Meteo actions.
4. Find Airbnb and Agoda listings through confirmed Wire action IDs.
5. Find Google Flights options through Wire where airport mappings are available.
6. Rank options with Groq using weather, stay price, flight price, and total cost.
7. Create an Anakin monitor and update Supabase status/messages for frontend realtime updates.
