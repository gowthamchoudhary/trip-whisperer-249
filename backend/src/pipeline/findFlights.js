import { flightSearch } from '../lib/anakin.js';
import { insertFlight } from '../lib/supabase.js';

const CITY_IATA = {
  bengaluru: 'BLR',
  bangalore: 'BLR',
  mumbai: 'BOM',
  delhi: 'DEL',
  'new delhi': 'DEL',
  hyderabad: 'HYD',
  chennai: 'MAA',
  kolkata: 'CCU'
};

const DESTINATION_IATA = {
  goa: 'GOI',
  panaji: 'GOI',
  manali: 'KUU',
  kullu: 'KUU',
  leh: 'IXL',
  ladakh: 'IXL',
  jaipur: 'JAI',
  udaipur: 'UDR',
  kochi: 'COK',
  munnar: 'COK',
  pondicherry: 'PNY',
  puducherry: 'PNY',
  mysuru: 'MYQ',
  mysore: 'MYQ',
  ooty: 'CJB',
  coorg: 'CNN',
  rishikesh: 'DED',
  dehradun: 'DED',
  darjeeling: 'IXB',
  gangtok: 'IXB',
  varanasi: 'VNS',
  agra: 'AGR'
};

function resolveIata(name, map) {
  const normalized = String(name || '').trim().toLowerCase();
  if (map[normalized]) return map[normalized];
  const matchedKey = Object.keys(map).find((key) => normalized.includes(key));
  return matchedKey ? map[matchedKey] : null;
}

function pickResults(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data?.results)) return payload.data.results;
  if (Array.isArray(payload?.flights)) return payload.flights;
  if (Array.isArray(payload?.data?.flights)) return payload.data.flights;
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

function parsePrice(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^\d.]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function googleFlightsUrl(origin, destination, date) {
  const query = encodeURIComponent(`Flights from ${origin} to ${destination} on ${date}`);
  return `https://www.google.com/travel/flights?q=${query}`;
}

export async function findFlights(tripRequest, candidates, intent) {
  const origin = resolveIata(intent.origin_city || tripRequest.origin_city || 'Bengaluru', CITY_IATA);
  const date = intent.date_range_start || tripRequest.date_range_start;
  const adults = intent.adults || tripRequest.adults || '1';
  const flights = [];

  if (!origin) {
    console.warn(`[Trip Architect] No IATA mapping for origin city: ${intent.origin_city || tripRequest.origin_city}`);
    return flights;
  }

  for (const candidate of candidates) {
    const destination = resolveIata(`${candidate.destination_name} ${candidate.region || ''}`, DESTINATION_IATA);
    if (!destination) {
      // TODO: Add a richer nearest-airport resolver for destinations outside the demo lookup table.
      console.warn(`[Trip Architect] No destination airport mapping for ${candidate.destination_name}`);
      continue;
    }

    const payload = await flightSearch(origin, destination, date, String(adults));
    const results = pickResults(payload).slice(0, 3);
    for (const flight of results) {
      const row = await insertFlight({
        trip_request_id: tripRequest.id,
        origin,
        destination,
        airline: firstValue(flight, ['airline', 'carrier', 'airline_name']) || 'Unknown airline',
        price: parsePrice(firstValue(flight, ['price', 'amount', 'total_price'])),
        duration: firstValue(flight, ['duration', 'total_duration']),
        departure_time: firstValue(flight, ['departure_time', 'departure', 'depart_at']),
        booking_url: 
        googleFlightsUrl(origin, destination, date)
      });

      flights.push({
        ...row,
        candidate,
        destination_name: candidate.destination_name
      });
    }
  }

  return flights;
}
