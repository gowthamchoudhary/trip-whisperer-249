import { researchDestinations as anakinResearchDestinations } from '../lib/anakin.js';
import { insertCandidate } from '../lib/supabase.js';

function pickArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.candidates)) return payload.candidates;
  if (Array.isArray(payload?.destinations)) return payload.destinations;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data?.results)) return payload.data.results;
  if (Array.isArray(payload?.data?.candidates)) return payload.data.candidates;
  if (Array.isArray(payload?.data?.destinations)) return payload.data.destinations;
  if (Array.isArray(payload?.output?.candidates)) return payload.output.candidates;
  if (Array.isArray(payload?.output?.destinations)) return payload.output.destinations;
  if (Array.isArray(payload?.result?.candidates)) return payload.result.candidates;
  if (Array.isArray(payload?.result?.destinations)) return payload.result.destinations;
  if (Array.isArray(payload?.generatedJson?.structured_data?.candidates)) {
    return payload.generatedJson.structured_data.candidates;
  }
  if (Array.isArray(payload?.generatedJson?.structured_data?.destinations)) {
    return payload.generatedJson.structured_data.destinations;
  }
  if (Array.isArray(payload?.generatedJson?.structured_data)) {
    return payload.generatedJson.structured_data;
  }
  return [];
}

function summarizePayload(payload) {
  const text = JSON.stringify(payload);
  return text.length > 1200 ? `${text.slice(0, 1200)}...` : text;
}

function normalizeCandidate(item, index) {
  if (typeof item === 'string') {
    return {
      destination_name: item,
      region: '',
      reasoning_text: 'Suggested by Anakin destination research.',
      source_citations: []
    };
  }

  return {
    destination_name: item.destination_name || item.name || item.destination || `Destination ${index + 1}`,
    region: item.region || item.state || item.country || '',
    reasoning_text: item.reasoning_text || item.reason || item.summary || item.description || '',
    source_citations: item.source_citations || item.citations || item.sources || []
  };
}

export async function researchDestinations(tripRequestId, intent) {
  if (intent.destination) {
    const row = await insertCandidate({
      trip_request_id: tripRequestId,
      destination_name: intent.destination,
      region: '',
      reasoning_text: 'Destination specified directly by traveler.',
      source_citations: []
    });

    return [row];
  }

  const dateRange = [intent.date_range_start, intent.date_range_end].filter(Boolean).join(' to ') || 'flexible dates';
  const prompt = `Best ${intent.terrain_preference || 'travel'} destinations reachable from ${intent.origin_city || 'Bengaluru'} in ${dateRange}, budget ${intent.budget || 'flexible'} INR. Return 4-6 structured destinations with destination_name, region, reasoning_text, and source_citations.`;

  const response = await anakinResearchDestinations(prompt);
  const rawCandidates = pickArray(response).slice(0, 6);

  if (rawCandidates.length === 0) {
    console.error(`[Trip Architect] Empty Anakin destination response: ${summarizePayload(response)}`);
    throw new Error('Anakin did not return any destination candidates.');
  }

  const inserted = [];
  for (const [index, raw] of rawCandidates.entries()) {
    const candidate = normalizeCandidate(raw, index);
    const row = await insertCandidate({
      trip_request_id: tripRequestId,
      ...candidate
    });
    inserted.push(row);
  }

  return inserted;
}
