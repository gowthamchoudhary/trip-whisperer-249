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

function extractListingProviderId(listing) {
  if (!listing?.listing_url) return null;

  try {
    const url = new URL(listing.listing_url);

    if (listing.source_platform === 'airbnb') {
      const roomMatch = url.pathname.match(/\/rooms\/([^/?#]+)/);
      return roomMatch?.[1] || null;
    }

    if (listing.source_platform === 'agoda') {
      return url.searchParams.get('hotelId') || url.searchParams.get('hotel_id') || url.searchParams.get('hotel');
    }
  } catch {
    return null;
  }

  return null;
}

function buildMonitorConfig(listing, intent) {
  const alertWebhookUrl = process.env.MONITOR_WEBHOOK_URL;
  if (!alertWebhookUrl) {
    return {
      config: null,
      reason: 'MONITOR_WEBHOOK_URL is not configured.'
    };
  }

  const providerId = extractListingProviderId(listing);
  if (!providerId) {
    return {
      config: null,
      reason: `Could not derive provider listing id from ${listing.source_platform} URL.`
    };
  }

  const intervalMinutes = Number(process.env.MONITOR_INTERVAL_MINUTES || 360);
  const checkin = intent.date_range_start;
  const checkout = intent.date_range_end;
  const adults = String(intent.adults || 2);

  if (listing.source_platform === 'airbnb') {
    return {
      config: {
        url: listing.listing_url,
        scope: 'wire',
        wireActionId: 'ab_listing_details',
        wireCatalogSlug: 'airbnb',
        wireParams: {
          listing_id: String(providerId),
          checkin,
          checkout,
          adults
        },
        intervalMinutes,
        alertWebhookUrl
      }
    };
  }

  if (listing.source_platform === 'agoda') {
    return {
      config: {
        url: listing.listing_url,
        scope: 'wire',
        wireActionId: 'ag_hotel_details',
        wireCatalogSlug: 'agoda',
        wireParams: {
          hotel_id: String(providerId),
          language_id: 1,
          currency_code: listing.currency || 'INR'
        },
        intervalMinutes,
        alertWebhookUrl
      }
    };
  }

  return {
    config: null,
    reason: `Unsupported monitor source platform: ${listing.source_platform}.`
  };
}

async function tryCreateMonitor(tripRequestId, listing, intent) {
  const { config, reason } = buildMonitorConfig(listing, intent);
  if (!config) {
    console.warn(`[Trip Architect] ${tripRequestId}: monitoring skipped - ${reason}`);
    await insertChatMessage(tripRequestId, 'assistant', `Price monitoring was skipped: ${reason}`);
    return false;
  }

  try {
    const monitor = await createMonitor(config);
    console.log(
      `[Trip Architect] ${tripRequestId}: monitor created ${monitor.id || monitor.monitor_id || 'unknown'} ` +
        `(webhook secret ${monitor.alertWebhookSecret || monitor.alert_webhook_secret ? 'returned' : 'not returned'})`
    );

    await insertMonitor({
      listing_id: listing.id,
      anakin_monitor_id: monitor.id || monitor.monitor_id,
      alert_webhook_secret: monitor.alertWebhookSecret || monitor.alert_webhook_secret || null,
      status: monitor.status || 'active',
      last_checked_at: new Date().toISOString(),
      current_price: listing.price,
      price_history: [
        {
          price: listing.price,
          currency: listing.currency,
          checked_at: new Date().toISOString()
        }
      ]
    });

    return true;
  } catch (error) {
    console.error(`[Trip Architect] ${tripRequestId}: monitoring failed`, error);
    await insertChatMessage(tripRequestId, 'assistant', `Price monitoring could not be started: ${error.message}`);
    return false;
  }
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
    const monitorStarted = await tryCreateMonitor(tripRequest.id, chosenListing, mergedIntent);

    await stage(
      tripRequest.id,
      'completed',
      monitorStarted
        ? 'Your trip plan is ready, and I will watch the chosen listing for price changes.'
        : 'Your trip plan is ready. Price monitoring was skipped, but the itinerary and booking options are available.'
    );
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
