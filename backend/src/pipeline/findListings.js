import {
  agodaHotelDetails,
  agodaLocationSearch,
  agodaSearchHotels,
  airbnbListingDetails,
  airbnbLocationSearch,
  airbnbSearchListings
} from '../lib/anakin.js';
import { insertListing } from '../lib/supabase.js';

function pickResults(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data?.results)) return payload.data.results;
  if (Array.isArray(payload?.data?.listings)) return payload.data.listings;
  if (Array.isArray(payload?.data?.hotels)) return payload.data.hotels;
  if (Array.isArray(payload?.listings)) return payload.listings;
  if (Array.isArray(payload?.hotels)) return payload.hotels;
  return [];
}

function firstValue(object, keys) {
  for (const key of keys) {
    if (object?.[key] !== undefined && object?.[key] !== null) {
      return object[key];
    }
  }
  return null;
}

function extractPrice(detail) {
  const raw = firstValue(detail, ['price', 'total_price', 'nightly_price', 'amount', 'display_price']);
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const parsed = Number(raw.replace(/[^\d.]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function extractImage(detail) {
  const image = firstValue(detail, ['image_url', 'image', 'thumbnail', 'picture_url']);
  if (image) return image;
  const images = detail?.images || detail?.photos;
  if (Array.isArray(images)) {
    const first = images[0];
    return typeof first === 'string' ? first : first?.url || first?.image_url || null;
  }
  return null;
}

function extractAirbnbListingId(item) {
  return firstValue(item, ['listing_id', 'id', 'room_id']);
}

function extractAgodaCityId(item) {
  return firstValue(item, ['city_id', 'cityId', 'id']);
}

function extractAgodaHotelId(item) {
  return firstValue(item, ['hotel_id', 'hotelId', 'id']);
}

function agodaBookingUrl(detail, cityId, hotelId, checkin, checkout, adults) {
  const direct = firstValue(detail, ['url', 'slug', 'deeplink', 'booking_url']);
  if (direct) return direct;

  const params = new URLSearchParams({
    city: String(cityId),
    hotelId: String(hotelId),
    checkIn: checkin,
    checkOut: checkout,
    adults: String(adults),
    rooms: '1',
    currencyCode: 'INR'
  });
  return `https://www.agoda.com/search?${params.toString()}`;
}

async function insertAirbnbListings(tripRequest, candidate, checkin, checkout, adults) {
  const locationResults = pickResults(await airbnbLocationSearch(candidate.destination_name));
  if (locationResults.length === 0) {
    console.warn(`[Trip Architect] Airbnb location search empty for ${candidate.destination_name}`);
  }

  const searchResults = pickResults(await airbnbSearchListings(candidate.destination_name, checkin, checkout, String(adults)));
  const listingIds = searchResults.map(extractAirbnbListingId).filter(Boolean).slice(0, 3);

  const rows = [];
  for (const listingId of listingIds) {
    const detail = await airbnbListingDetails(String(listingId), checkin, checkout, String(adults));
    const detailRoot = detail?.data || detail?.result || detail;
    const row = await insertListing({
      trip_request_id: tripRequest.id,
      candidate_id: candidate.id,
      source_platform: 'airbnb',
      listing_name: firstValue(detailRoot, ['listing_name', 'name', 'title']) || 'Airbnb stay',
      price: extractPrice(detailRoot),
      currency: firstValue(detailRoot, ['currency', 'currency_code']) || 'INR',
      rating: firstValue(detailRoot, ['rating', 'review_score']) ? Number(firstValue(detailRoot, ['rating', 'review_score'])) : null,
      image_url: extractImage(detailRoot),
      listing_url: `https://www.airbnb.co.in/rooms/${listingId}?check_in=${checkin}&check_out=${checkout}`,
      is_chosen: false
    });
    rows.push({ ...row, candidate, weather_score: candidate.weather_score });
  }

  return rows;
}

async function insertAgodaListings(tripRequest, candidate, checkin, checkout, adults) {
  const locationResults = pickResults(await agodaLocationSearch(candidate.destination_name));
  const cityId = locationResults.map(extractAgodaCityId).find(Boolean);
  if (!cityId) {
    console.warn(`[Trip Architect] Agoda location search empty for ${candidate.destination_name}`);
    return [];
  }

  const searchResults = pickResults(await agodaSearchHotels(cityId, checkin, checkout, Number(adults), 1));
  const hotelIds = searchResults.map(extractAgodaHotelId).filter(Boolean).slice(0, 3);

  const rows = [];
  for (const hotelId of hotelIds) {
    const detail = await agodaHotelDetails(hotelId);
    const detailRoot = detail?.data || detail?.result || detail;
    const row = await insertListing({
      trip_request_id: tripRequest.id,
      candidate_id: candidate.id,
      source_platform: 'agoda',
      listing_name: firstValue(detailRoot, ['listing_name', 'hotel_name', 'name', 'title']) || 'Agoda hotel',
      price: extractPrice(detailRoot),
      currency: firstValue(detailRoot, ['currency', 'currency_code']) || 'INR',
      rating: firstValue(detailRoot, ['rating', 'review_score', 'star_rating'])
        ? Number(firstValue(detailRoot, ['rating', 'review_score', 'star_rating']))
        : null,
      image_url: extractImage(detailRoot),
      listing_url: agodaBookingUrl(detailRoot, cityId, hotelId, checkin, checkout, adults),
      is_chosen: false
    });
    rows.push({ ...row, candidate, weather_score: candidate.weather_score });
  }

  return rows;
}

export async function findListings(tripRequest, candidates, intent) {
  const checkin = intent.date_range_start || tripRequest.date_range_start;
  const checkout = intent.date_range_end || tripRequest.date_range_end;
  const adults = intent.adults || tripRequest.adults || 2;
  const listings = [];

  for (const candidate of candidates) {
    const platformResults = await Promise.allSettled([
      insertAirbnbListings(tripRequest, candidate, checkin, checkout, adults),
      insertAgodaListings(tripRequest, candidate, checkin, checkout, adults)
    ]);

    for (const result of platformResults) {
      if (result.status === 'fulfilled') {
        listings.push(...result.value);
      } else {
        console.warn(`[Trip Architect] Listing search failed for ${candidate.destination_name}: ${result.reason.message}`);
      }
    }
  }

  if (listings.length === 0) {
    throw new Error('No listings were returned by Airbnb or Agoda Wire searches.');
  }

  return listings;
}
