import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Supabase env vars are missing. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running the pipeline.');
}

export const supabase = createClient(SUPABASE_URL || 'http://localhost:54321', SUPABASE_SERVICE_ROLE_KEY || 'missing-key', {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function unwrap(query, label) {
  const { data, error } = await query;
  if (error) {
    throw new Error(`${label}: ${error.message}`);
  }
  return data;
}

export function updateTripStatus(id, status) {
  return unwrap(
    supabase.from('trip_requests').update({ status }).eq('id', id).select().single(),
    'Failed to update trip status'
  );
}

export function updateTripRequest(id, values) {
  return unwrap(
    supabase.from('trip_requests').update(values).eq('id', id).select().single(),
    'Failed to update trip request'
  );
}

export function getTripRequestById(id) {
  return unwrap(
    supabase.from('trip_requests').select('*').eq('id', id).single(),
    'Failed to fetch trip request'
  );
}

export function insertChatMessage(tripRequestId, role, content, stageIcon = null) {
  return unwrap(
    supabase.from('chat_messages').insert({
      trip_request_id: tripRequestId,
      role,
      content,
      stage_icon: stageIcon
    }).select().single(),
    'Failed to insert chat message'
  );
}

export function getUserMessagesForTrip(tripRequestId) {
  return unwrap(
    supabase
      .from('chat_messages')
      .select('content')
      .eq('trip_request_id', tripRequestId)
      .eq('role', 'user')
      .order('created_at', { ascending: true }),
    'Failed to fetch user messages'
  );
}

export function insertTripRequest(row) {
  return unwrap(supabase.from('trip_requests').insert(row).select().single(), 'Failed to insert trip request');
}

export function insertCandidate(row) {
  return unwrap(supabase.from('candidates').insert(row).select().single(), 'Failed to insert candidate');
}

export function insertWeatherScore(row) {
  return unwrap(supabase.from('weather_scores').insert(row).select().single(), 'Failed to insert weather score');
}

export function insertListing(row) {
  return unwrap(supabase.from('listings').insert(row).select().single(), 'Failed to insert listing');
}

export function insertFlight(row) {
  return unwrap(supabase.from('flights').insert(row).select().single(), 'Failed to insert flight');
}

export function insertMonitor(row) {
  return unwrap(supabase.from('monitors').insert(row).select().single(), 'Failed to insert monitor');
}

export function updateListingChosen(listingId, isChosen = true, rank = null) {
  return unwrap(
    supabase.from('listings').update({ is_chosen: isChosen, rank }).eq('id', listingId).select().single(),
    'Failed to update chosen listing'
  );
}

export function resetListingDecisions(tripRequestId) {
  return unwrap(
    supabase.from('listings').update({ is_chosen: false, rank: null }).eq('trip_request_id', tripRequestId).select(),
    'Failed to reset listing decisions'
  );
}

export function getListingById(id) {
  return unwrap(supabase.from('listings').select('*').eq('id', id).single(), 'Failed to fetch listing');
}

export function getMonitorByAnakinId(anakinMonitorId) {
  return unwrap(
    supabase.from('monitors').select('*').eq('anakin_monitor_id', anakinMonitorId).single(),
    'Failed to fetch monitor'
  );
}

export function updateMonitor(id, values) {
  return unwrap(supabase.from('monitors').update(values).eq('id', id).select().single(), 'Failed to update monitor');
}

export function insertItineraryDay(row) {
  return unwrap(supabase.from('itinerary_days').insert(row).select().single(), 'Failed to insert itinerary day');
}
