import { askGroqJSON } from '../lib/groq.js';

export async function parseIntent(userMessage) {
  const systemPrompt = `Extract a travel planning intent from the user's message.
Return JSON with exactly these keys:
{
  "budget": number | null,
  "duration_days": number | null,
  "terrain_preference": string | null,
  "weather_preference": string | null,
  "date_range_start": "YYYY-MM-DD" | null,
  "date_range_end": "YYYY-MM-DD" | null,
  "origin_city": string
}
Default origin_city to "Bengaluru" if it is not mentioned. Interpret budget as INR.`;

  return askGroqJSON(systemPrompt, userMessage);
}
