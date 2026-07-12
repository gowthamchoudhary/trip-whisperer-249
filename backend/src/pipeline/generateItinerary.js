import { askGroqJSON } from '../lib/groq.js';
import { researchDestinations as anakinResearch } from '../lib/anakin.js';
import { insertItineraryDay } from '../lib/supabase.js';

function compactJson(value) {
  if (!value) return '';
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function pickStructuredData(payload) {
  return (
    payload?.generatedJson?.structured_data ||
    payload?.generatedJson?.structuredData ||
    payload?.structured_data ||
    payload?.structuredData ||
    payload?.data?.generatedJson?.structured_data ||
    payload?.data?.structured_data ||
    null
  );
}

function pickSummary(payload) {
  return (
    payload?.generatedJson?.summary ||
    payload?.summary ||
    payload?.data?.generatedJson?.summary ||
    payload?.data?.summary ||
    payload?.result?.generatedJson?.summary ||
    payload?.result?.summary ||
    ''
  );
}

function pickCitations(payload) {
  const structuredData = pickStructuredData(payload);
  const candidates = [
    payload?.generatedJson?.citations,
    payload?.generatedJson?.source_citations,
    payload?.generatedJson?.sources,
    payload?.generatedJson?.structured_data?.citations,
    payload?.generatedJson?.structured_data?.sources,
    payload?.citations,
    payload?.source_citations,
    payload?.sources,
    payload?.structured_data?.citations,
    payload?.structured_data?.sources,
    payload?.data?.generatedJson?.citations,
    payload?.data?.citations,
    payload?.data?.sources,
    payload?.result?.generatedJson?.citations,
    payload?.result?.citations,
    payload?.result?.sources,
    structuredData?.citations,
    structuredData?.sources
  ];

  for (const value of candidates) {
    if (Array.isArray(value)) return value;
  }

  return [];
}

function extractResearchContent(payload) {
  const summary = pickSummary(payload);
  const structuredData = pickStructuredData(payload);
  const citations = pickCitations(payload);
  const structuredText = compactJson(structuredData);
  const researchText = [summary, structuredText].filter(Boolean).join('\n\nStructured data:\n');

  return {
    researchText,
    citations
  };
}

function normalizeDays(payload, durationDays, destinationName) {
  const rawDays = Array.isArray(payload?.days) ? payload.days : [];
  const days = rawDays
    .map((day, index) => ({
      day_number: Number(day.day_number) || index + 1,
      title: day.title || `Day ${index + 1} in ${destinationName}`,
      activities: Array.isArray(day.activities)
        ? day.activities.map(String).filter(Boolean).slice(0, 3)
        : []
    }))
    .filter((day) => day.day_number > 0)
    .slice(0, durationDays);

  if (days.length > 0) {
    return days;
  }

  return Array.from({ length: durationDays }, (_, index) => ({
    day_number: index + 1,
    title: `Day ${index + 1} in ${destinationName}`,
    activities: [
      `Explore a well-known neighborhood or viewpoint in ${destinationName}.`,
      `Try a local meal and leave time for an unhurried evening.`
    ]
  }));
}

export async function generateItinerary(tripRequest, chosenCandidate, durationDays) {
  const destinationName = chosenCandidate?.destination_name || tripRequest.destination || 'your destination';
  const daysCount = Math.max(1, Math.min(Number(durationDays) || Number(tripRequest.duration_days) || 3, 14));
  let sourceCitations = [];
  let payload;

  try {
    const researchPrompt = `Top attractions, local experiences, food, and activities in ${destinationName} for a ${daysCount}-day trip, with practical day-by-day pacing suggestions.`;
    const researchPayload = await anakinResearch(researchPrompt);
    const { researchText, citations } = extractResearchContent(researchPayload);

    if (!researchText.trim()) {
      throw new Error('Anakin itinerary research returned no usable summary or structured data.');
    }

    sourceCitations = citations;
    payload = await askGroqJSON(
      `Using ONLY the research provided below, organize it into a realistic ${daysCount}-day itinerary.
Do not add attractions, places, restaurants, foods, or details not mentioned in the research.
Return JSON only in this shape:
{
  "days": [
    { "day_number": number, "title": string, "activities": [string] }
  ]
}`,
      `Research:
${researchText}`
    );
  } catch (error) {
    console.warn(
      `[Trip Architect] Research-backed itinerary unavailable for ${destinationName}; ` +
        `falling back to LLM-generated itinerary. Reason: ${error.message}`
    );
    payload = await generateFallbackItinerary(destinationName, daysCount);
  }

  const days = normalizeDays(payload, daysCount, destinationName);
  const inserted = [];

  for (const day of days) {
    const row = await insertItineraryDay({
      trip_request_id: tripRequest.id,
      day_number: day.day_number,
      title: day.title,
      activities: day.activities,
      source_citations: sourceCitations
    });
    inserted.push(row);
  }

  return inserted;
}

async function generateFallbackItinerary(destinationName, daysCount) {
  const systemPrompt = `Generate realistic day-by-day travel itineraries.
Return JSON only in this shape:
{
  "days": [
    { "day_number": number, "title": string, "activities": [string] }
  ]
}`;
  const userPrompt = `Generate a realistic ${daysCount}-day itinerary for ${destinationName}.
For each day return a title and 2-3 concrete activity suggestions appropriate to that real place.
Use real landmarks, typical activities, neighborhoods, food, and pacing where possible.`;

  return askGroqJSON(systemPrompt, userPrompt);
}
