import { askGroqJSON } from '../lib/groq.js';

function toDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function nextWeekendStart() {
  const today = new Date();
  const start = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const day = start.getUTCDay();
  const friday = 5;
  let daysUntilFriday = (friday - day + 7) % 7;

  if (daysUntilFriday < 2) {
    daysUntilFriday += 7;
  }

  return addDays(start, daysUntilFriday);
}

function normalizeIntent(intent) {
  const destination = typeof intent.destination === 'string' && intent.destination.trim()
    ? intent.destination.trim()
    : null;

  const normalized = {
    ...intent,
    destination,
    terrain_preference: destination ? null : intent.terrain_preference || null,
    origin_city: intent.origin_city || 'Bengaluru'
  };
  const durationDays = Number(normalized.duration_days) > 0 ? Number(normalized.duration_days) : 3;

  if (!normalized.date_range_start && !normalized.date_range_end) {
    const start = nextWeekendStart();
    normalized.date_range_start = toDateOnly(start);
    normalized.date_range_end = toDateOnly(addDays(start, durationDays));
    return normalized;
  }

  if (normalized.date_range_start && !normalized.date_range_end) {
    normalized.date_range_end = toDateOnly(addDays(new Date(`${normalized.date_range_start}T00:00:00.000Z`), durationDays));
  }

  if (!normalized.date_range_start && normalized.date_range_end) {
    normalized.date_range_start = toDateOnly(addDays(new Date(`${normalized.date_range_end}T00:00:00.000Z`), -durationDays));
  }

  const start = new Date(`${normalized.date_range_start}T00:00:00.000Z`);
  const end = new Date(`${normalized.date_range_end}T00:00:00.000Z`);
  if (Number.isFinite(start.getTime()) && Number.isFinite(end.getTime()) && end <= start) {
    normalized.date_range_end = toDateOnly(addDays(start, durationDays));
  }

  return normalized;
}

export async function parseIntent(userMessage) {
  const systemPrompt = `Extract a travel planning intent from the user's message.
Return JSON with exactly these keys:
{
  "budget": number | null,
  "duration_days": number | null,
  "destination": string | null,
  "terrain_preference": string | null,
  "weather_preference": string | null,
  "date_range_start": "YYYY-MM-DD" | null,
  "date_range_end": "YYYY-MM-DD" | null,
  "origin_city": string
}
If the user names a specific place they want to go, extract it into destination and leave terrain_preference null.
Only use terrain_preference when the user describes a style/vibe without naming a place.
Default origin_city to "Bengaluru" if it is not mentioned. Interpret budget as INR.`;

  const intent = await askGroqJSON(systemPrompt, userMessage);
  return normalizeIntent(intent);
}
