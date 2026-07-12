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
