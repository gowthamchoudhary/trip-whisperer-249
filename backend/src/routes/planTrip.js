import express from 'express';
import { getTripRequestById, insertChatMessage, insertTripRequest, supabase } from '../lib/supabase.js';
import { orchestrateTrip } from '../pipeline/orchestrator.js';

export const planTripRouter = express.Router();

planTripRouter.post('/plan-trip', async (req, res) => {
  const {
    trip_request_id: tripRequestId,
    user_message: userMessage,
    user_id: userId,
    message_inserted: messageInserted
  } = req.body || {};

  if (!userMessage) {
    return res.status(400).json({ error: 'user_message is required.' });
  }

  try {
    const tripRequest = tripRequestId
      ? await getTripRequestById(tripRequestId)
      : await insertTripRequest({
          user_id: userId || null,
          status: 'queued',
          origin_city: 'Bengaluru'
        });

    if (!messageInserted) {
      await insertChatMessage(tripRequest.id, 'user', userMessage);
    }

    setImmediate(() => {
      orchestrateTrip(tripRequest, userMessage).catch((error) => {
        console.error(`[Trip Architect] Background orchestration failed: ${error.message}`);
      });
    });

    return res.status(202).json({ status: 'started', trip_request_id: tripRequest.id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

planTripRouter.get('/trip/:tripRequestId', async (req, res) => {
  const { tripRequestId } = req.params;

  try {
    const [tripRequest, messages, candidates, listings, flights] = await Promise.all([
      getTripRequestById(tripRequestId),
      supabase
        .from('chat_messages')
        .select('*')
        .eq('trip_request_id', tripRequestId)
        .order('created_at', { ascending: true }),
      supabase
        .from('candidates')
        .select('*, weather_scores(*)')
        .eq('trip_request_id', tripRequestId)
        .order('created_at', { ascending: true }),
      supabase
        .from('listings')
        .select('*')
        .eq('trip_request_id', tripRequestId)
        .order('created_at', { ascending: true }),
      supabase
        .from('flights')
        .select('*')
        .eq('trip_request_id', tripRequestId)
        .order('created_at', { ascending: true })
    ]);

    for (const result of [messages, candidates, listings, flights]) {
      if (result.error) {
        throw new Error(result.error.message);
      }
    }

    const listingIds = (listings.data || []).map((listing) => listing.id);
    const monitors = listingIds.length > 0
      ? await supabase.from('monitors').select('*').in('listing_id', listingIds)
      : { data: [], error: null };

    if (monitors.error) {
      throw new Error(monitors.error.message);
    }

    return res.json({
      trip_request: tripRequest,
      messages: messages.data || [],
      candidates: candidates.data || [],
      listings: listings.data || [],
      flights: flights.data || [],
      monitors: monitors.data || []
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

planTripRouter.get('/trips', async (req, res) => {
  const { user_id: userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'user_id is required.' });
  }

  try {
    const { data, error } = await supabase
      .from('trip_requests')
      .select('*, candidates(destination_name, weather_scores(match_score))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return res.json({ trips: data || [] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
