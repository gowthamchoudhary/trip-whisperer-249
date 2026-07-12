import { createMonitor } from '../lib/anakin.js';
import {
  getListingById,
  insertChatMessage,
  insertMonitor,
  updateTripRequest,
  updateTripStatus
} from '../lib/supabase.js';
import { findListings } from './findListings.js';
import { findFlights } from './findFlights.js';
import { parseIntent } from './parseIntent.js';
import { rankAndDecide } from './rankAndDecide.js';
import { researchDestinations } from './researchDestinations.js';
import { weatherFilter } from './weatherFilter.js';

async function stage(tripRequestId, status, message) {
  console.log(`[Trip Architect] ${tripRequestId}: ${status}`);
  await updateTripStatus(tripRequestId, status);
  await insertChatMessage(tripRequestId, 'assistant', message);
}

export async function orchestrateTrip(tripRequest, userMessage) {
  let intent = null;

  try {
    console.log(`[Trip Architect] ${tripRequest.id}: parsing_intent`);
    intent = await parseIntent(userMessage);
    await updateTripRequest(tripRequest.id, {
      budget: intent.budget ?? tripRequest.budget,
      duration_days: intent.duration_days ?? tripRequest.duration_days,
      terrain_preference: intent.terrain_preference ?? tripRequest.terrain_preference,
      weather_preference: intent.weather_preference ?? tripRequest.weather_preference,
      date_range_start: intent.date_range_start ?? tripRequest.date_range_start,
      date_range_end: intent.date_range_end ?? tripRequest.date_range_end,
      origin_city: intent.origin_city ?? tripRequest.origin_city ?? 'Bengaluru'
    });

    const mergedIntent = {
      ...tripRequest,
      ...intent,
      origin_city: intent.origin_city || tripRequest.origin_city || 'Bengaluru'
    };

    await stage(tripRequest.id, 'researching', 'I am researching destinations that match your trip style.');
    const candidates = await researchDestinations(tripRequest.id, mergedIntent);

    await stage(tripRequest.id, 'filtering_weather', 'I am checking forecasts and scoring destinations against your weather preference.');
    const weatherFiltered = await weatherFilter(candidates, mergedIntent);

    await stage(tripRequest.id, 'finding_listings', 'I am searching for stays in the strongest destinations.');
    const listings = await findListings(tripRequest, weatherFiltered, mergedIntent);

    await stage(tripRequest.id, 'finding_flights', 'I am checking flight options for the strongest destinations.');
    const flights = await findFlights(tripRequest, weatherFiltered, mergedIntent);

    await stage(tripRequest.id, 'ranking', 'I am ranking the options and choosing the best fit.');
    const decision = await rankAndDecide(tripRequest.id, listings, flights, mergedIntent);
    const chosenListing = await getListingById(decision.chosen_listing_id);

    await stage(tripRequest.id, 'monitoring', 'I am setting up price monitoring for the chosen listing.');
    const monitor = await createMonitor({
      scope: 'wire',
      listing_id: chosenListing.id,
      listing_url: chosenListing.listing_url,
      current_price: chosenListing.price,
      currency: chosenListing.currency,
      webhook_url: process.env.MONITOR_WEBHOOK_URL
    });

    await insertMonitor({
      listing_id: chosenListing.id,
      anakin_monitor_id: monitor.id || monitor.monitor_id,
      status: monitor.status || 'active',
      last_checked_at: new Date().toISOString(),
      current_price: chosenListing.price,
      price_history: [
        {
          price: chosenListing.price,
          currency: chosenListing.currency,
          checked_at: new Date().toISOString()
        }
      ]
    });

    await stage(tripRequest.id, 'completed', 'Your trip plan is ready, and I will watch the chosen listing for price changes.');
    return decision;
  } catch (error) {
    console.error(`[Trip Architect] ${tripRequest.id}: failed`, error);
    await updateTripStatus(tripRequest.id, 'failed');
    await insertChatMessage(
      tripRequest.id,
      'assistant',
      `I hit a problem while planning the trip: ${error.message}`
    );
    return null;
  }
}
