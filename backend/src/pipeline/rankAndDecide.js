import { askGroqJSON } from '../lib/groq.js';
import { insertChatMessage, resetListingDecisions, updateListingChosen } from '../lib/supabase.js';

function cheapestFlightForListing(listing, flights) {
  const matching = flights.filter((flight) => flight.candidate?.id === listing.candidate?.id && Number.isFinite(Number(flight.price)));
  return matching.sort((a, b) => Number(a.price) - Number(b.price))[0] || null;
}

function fallbackRanking(listings) {
  return [...listings]
    .sort((a, b) => {
      const weatherDelta = Number(b.weather_score?.match_score || 0) - Number(a.weather_score?.match_score || 0);
      if (weatherDelta !== 0) return weatherDelta;

      const aPrice = Number(a.price) || Number.MAX_SAFE_INTEGER;
      const bPrice = Number(b.price) || Number.MAX_SAFE_INTEGER;
      if (aPrice !== bPrice) return aPrice - bPrice;

      return Number(b.rating || 0) - Number(a.rating || 0);
    })
    .map((listing) => listing.id);
}

function normalizeRanking(decision, listings) {
  const listingIds = new Set(listings.map((listing) => listing.id));
  const rankedFromModel = Array.isArray(decision.ranked_listing_ids)
    ? decision.ranked_listing_ids.filter((id) => listingIds.has(id))
    : [];
  const chosen = decision.chosen_listing_id && listingIds.has(decision.chosen_listing_id)
    ? decision.chosen_listing_id
    : null;
  const fallback = fallbackRanking(listings);
  const ordered = [];

  for (const id of [chosen, ...rankedFromModel, ...fallback]) {
    if (id && !ordered.includes(id)) {
      ordered.push(id);
    }
  }

  return ordered;
}

export async function rankAndDecide(tripRequestId, listings, flights, intent) {
  const systemPrompt = `You rank travel options that combine a destination, accommodation listing, and flight context.
Consider weather match, total trip cost, budget fit, stay price, flight price, rating, and listing quality.
Total trip cost is flight price plus stay price when both are available.
Return JSON:
{
  "chosen_listing_id": "id from the provided listings",
  "ranked_listing_ids": ["listing id in best-to-worst order, include every listing id"],
  "reasoning_text": "short explanation for the traveler"
}`;

  const userPrompt = JSON.stringify({
    intent,
    listings: listings.map((listing) => {
      const flight = cheapestFlightForListing(listing, flights);
      const stayPrice = Number(listing.price) || 0;
      const flightPrice = Number(flight?.price) || 0;

      return {
        id: listing.id,
        destination_name: listing.candidate?.destination_name,
        region: listing.candidate?.region,
        weather_match_score: listing.weather_score?.match_score,
        listing_name: listing.listing_name,
        stay_price: listing.price,
        flight_price: flight?.price ?? null,
        estimated_total_cost: stayPrice + flightPrice,
        currency: listing.currency,
        rating: listing.rating,
        airline: flight?.airline ?? null,
        flight_duration: flight?.duration ?? null,
        listing_url: listing.listing_url,
        flight_booking_url: flight?.booking_url ?? null
      };
    })
  });

  const decision = await askGroqJSON(systemPrompt, userPrompt) || {};
  const rankedListingIds = normalizeRanking(decision, listings);
  const chosenListingId = rankedListingIds[0] || listings[0]?.id;
  const reasoningText = decision.reasoning_text || 'I picked the strongest match based on weather, total cost, and listing quality.';

  await resetListingDecisions(tripRequestId);
  await Promise.all(
    rankedListingIds.map((listingId, index) => updateListingChosen(listingId, listingId === chosenListingId, index + 1))
  );
  await insertChatMessage(tripRequestId, 'assistant', reasoningText, 'check');

  return {
    chosen_listing_id: chosenListingId,
    ranked_listing_ids: rankedListingIds,
    reasoning_text: reasoningText
  };
}
