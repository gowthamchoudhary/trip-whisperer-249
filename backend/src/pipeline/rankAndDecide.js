import { askGroqJSON } from '../lib/groq.js';
import { insertChatMessage, updateListingChosen } from '../lib/supabase.js';

function cheapestFlightForListing(listing, flights) {
  const matching = flights.filter((flight) => flight.candidate?.id === listing.candidate?.id && Number.isFinite(Number(flight.price)));
  return matching.sort((a, b) => Number(a.price) - Number(b.price))[0] || null;
}

export async function rankAndDecide(tripRequestId, listings, flights, intent) {
  const systemPrompt = `You rank travel options that combine a destination, accommodation listing, and flight context.
Consider weather match, total trip cost, budget fit, stay price, flight price, rating, and listing quality.
Total trip cost is flight price plus stay price when both are available.
Return JSON:
{
  "chosen_listing_id": "id from the provided listings",
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

  const decision = await askGroqJSON(systemPrompt, userPrompt);
  const chosenListingId = decision.chosen_listing_id || listings[0]?.id;
  const reasoningText = decision.reasoning_text || 'I picked the strongest match based on weather, total cost, and listing quality.';

  await updateListingChosen(chosenListingId, true);
  await insertChatMessage(tripRequestId, 'assistant', reasoningText);

  return {
    chosen_listing_id: chosenListingId,
    reasoning_text: reasoningText
  };
}
