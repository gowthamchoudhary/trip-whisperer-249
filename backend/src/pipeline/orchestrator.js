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
import { generateItinerary } from './generateItinerary.js';
import { parseIntent } from './parseIntent.js';
import { rankAndDecide } from './rankAndDecide.js';
import { researchDestinations } from './researchDestinations.js';
import { weatherFilter } from './weatherFilter.js';

const STAGE_ICONS = {
  awaiting_input: 'help',
  researching: 'search',
  filtering_weather: 'cloud',
  finding_listings: 'home',
  finding_flights: 'plane',
  ranking: 'check',
  building_itinerary: 'calendar',
  monitoring: 'bell',
  completed: 'check',
  failed: 'alert'
};

async function stage(tripRequestId, status, message) {
  console.log(`[Trip Architect] ${tripRequestId}: ${status}`);
  await updateTripStatus(tripRequestId, status);
  await insertChatMessage(tripRequestId, 'assistant', message, STAGE_ICONS[status] || 'sparkles');
}

function hasPositiveNumber(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function missingCriticalFields(intent) {
  const missing = [];
  if (!hasPositiveNumber(intent.budget)) missing.push('budget');
  if (!hasPositiveNumber(intent.duration_days)) missing.push('duration_days');
  if (!hasText(intent.destination) && !hasText(intent.terrain_preference)) {
    missing.push('destination_or_style');
  }
  return missing;
}

function buildClarifyingQuestion(missing) {
  const questions = {
    budget: "what's your budget for this trip?",
    duration_days: 'how many days are you planning?',
    destination_or_style: 'where do you want to go, or what kind of place should I search for?'
  };
  const parts = missing.map((field) => questions[field]).filter(Boolean);

  if (parts.length === 1) {
    return `Before I plan this properly, ${parts[0]}`;
  }

  return `Before I plan this properly, I need a few details: ${parts.join(' ')}`;
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
    await insertChatMessage(tripRequestId, 'assistant', `Price monitoring was skipped: ${reason}`, 'bell');
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
    await insertChatMessage(tripRequestId, 'assistant', `Price monitoring could not be started: ${error.message}`, 'bell');
    return false;
  }
}

export async function orchestrateTrip(tripRequest, userMessage) {
  let intent = null;

  try {
    console.log(`[Trip Architect] ${tripRequest.id}: parsing_intent`);
    intent = await parseIntent(userMessage);
    const destination = intent.destination || tripRequest.destination || null;
    const tripValues = {
      budget: intent.budget ?? tripRequest.budget,
      duration_days: intent.duration_days ?? tripRequest.duration_days,
      destination,
      terrain_preference: destination ? null : intent.terrain_preference ?? tripRequest.terrain_preference,
      weather_preference: intent.weather_preference ?? tripRequest.weather_preference,
      date_range_start: intent.date_range_start ?? tripRequest.date_range_start,
      date_range_end: intent.date_range_end ?? tripRequest.date_range_end,
      origin_city: intent.origin_city ?? tripRequest.origin_city ?? 'Bengaluru'
    };
    const updatedTripRequest = await updateTripRequest(tripRequest.id, tripValues);

    const mergedIntent = {
      ...updatedTripRequest,
      ...tripValues
    };

    const missing = missingCriticalFields(mergedIntent);
    if (missing.length > 0) {
      const question = buildClarifyingQuestion(missing);
      console.log(`[Trip Architect] ${tripRequest.id}: awaiting_input`);
      await updateTripStatus(tripRequest.id, 'awaiting_input');
      await insertChatMessage(tripRequest.id, 'assistant', question, STAGE_ICONS.awaiting_input);
      return {
        status: 'awaiting_input',
        missing
      };
    }

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
    const chosenListingWithCandidate = listings.find((listing) => listing.id === decision.chosen_listing_id);
    const chosenCandidate =
      chosenListingWithCandidate?.candidate ||
      weatherFiltered.find((candidate) => candidate.id === chosenListingWithCandidate?.candidate_id) ||
      weatherFiltered[0];

    await stage(tripRequest.id, 'building_itinerary', 'I am building a day-by-day itinerary for the chosen destination.');
    await generateItinerary(updatedTripRequest, chosenCandidate, mergedIntent.duration_days);

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
      `I hit a problem while planning the trip: ${error.message}`,
      STAGE_ICONS.failed
    );
    return null;
  }
}
