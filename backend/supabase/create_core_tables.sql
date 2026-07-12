create extension if not exists pgcrypto;

create table if not exists trip_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  status text not null default 'queued',
  budget numeric,
  duration_days integer,
  terrain_preference text,
  weather_preference text,
  date_range_start date,
  date_range_end date,
  origin_city text default 'Bengaluru',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  trip_request_id uuid not null references trip_requests(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists candidates (
  id uuid primary key default gen_random_uuid(),
  trip_request_id uuid not null references trip_requests(id) on delete cascade,
  destination_name text not null,
  region text,
  reasoning_text text,
  source_citations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists weather_scores (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  lat numeric,
  lon numeric,
  forecast_data jsonb,
  avg_temp numeric,
  cloud_cover_pct numeric,
  match_score numeric,
  created_at timestamptz not null default now()
);

create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  trip_request_id uuid not null references trip_requests(id) on delete cascade,
  candidate_id uuid references candidates(id) on delete set null,
  source_platform text not null,
  listing_name text not null,
  price numeric,
  currency text,
  rating numeric,
  image_url text,
  listing_url text,
  is_chosen boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists flights (
  id uuid primary key default gen_random_uuid(),
  trip_request_id uuid references trip_requests(id) on delete cascade,
  origin text,
  destination text,
  airline text,
  price numeric,
  duration text,
  departure_time text,
  booking_url text,
  created_at timestamptz default now()
);

create table if not exists monitors (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  anakin_monitor_id text,
  alert_webhook_secret text,
  status text not null default 'active',
  last_checked_at timestamptz,
  current_price numeric,
  price_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table if exists monitors
  add column if not exists alert_webhook_secret text;

create index if not exists chat_messages_trip_request_id_idx on chat_messages(trip_request_id);
create index if not exists candidates_trip_request_id_idx on candidates(trip_request_id);
create index if not exists weather_scores_candidate_id_idx on weather_scores(candidate_id);
create index if not exists listings_trip_request_id_idx on listings(trip_request_id);
create index if not exists listings_candidate_id_idx on listings(candidate_id);
create index if not exists flights_trip_request_id_idx on flights(trip_request_id);
create index if not exists monitors_listing_id_idx on monitors(listing_id);
create index if not exists monitors_anakin_monitor_id_idx on monitors(anakin_monitor_id);
