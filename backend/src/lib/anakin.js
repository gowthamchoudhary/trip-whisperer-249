import 'dotenv/config';

const BASE_URL = 'https://api.anakin.io/v1';

function requireApiKey() {
  if (!process.env.ANAKIN_API_KEY) {
    throw new Error('ANAKIN_API_KEY is not configured.');
  }
  return process.env.ANAKIN_API_KEY;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry(url, options, maxAttempts = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (response.status >= 500 || response.status === 429) {
        throw new Error(`Retryable HTTP ${response.status}`);
      }
      return response;
    } catch (error) {
      lastError = error;
      console.warn(`[Anakin] Attempt ${attempt}/${maxAttempts} failed for ${url}: ${error.message}`);
      if (attempt < maxAttempts) {
        await sleep(500 * Math.pow(3, attempt - 1));
      }
    }
  }

  throw new Error(`All ${maxAttempts} attempts failed for ${url}: ${lastError.message}`);
}

async function anakinFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetchWithRetry(url, {
    ...options,
    headers: {
      'X-API-Key': requireApiKey(),
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anakin request failed (${response.status} ${path}): ${errorText}`);
  }

  if (response.status === 204) {
    return null;
  }
  return response.json();
}

function summarizeWireResponse(payload) {
  const firstResult = Array.isArray(payload)
    ? payload[0]
    : payload?.results?.[0] || payload?.data?.results?.[0] || payload?.data?.[0] || payload?.listings?.[0] || payload;
  const text = JSON.stringify(firstResult || null);
  return text.length > 500 ? `${text.slice(0, 500)}...` : text;
}

export async function researchDestinations(prompt) {
  const created = await anakinFetch('/agentic-search', {
    method: 'POST',
    body: JSON.stringify({ prompt })
  });

  const id = created.id || created.search_id || created.task_id || created.job_id;
  if (!id) {
    return created;
  }

  for (let attempt = 0; attempt < 60; attempt += 1) {
    const status = await anakinFetch(`/agentic-search/${id}`);
    if (status.status === 'completed') {
      return status;
    }
    if (status.status === 'failed' || status.status === 'error') {
      throw new Error(status.error || 'Anakin research failed.');
    }
    await sleep(10000);
  }

  throw new Error('Anakin research timed out.');
}

export async function getWireCatalog(provider) {
  return anakinFetch(`/wire/catalog/${provider}`);
}

export async function wireCall(action_id, params) {
  console.log(`[Trip Architect] Wire call: ${action_id}`, params);
  const created = await anakinFetch('/wire/task', {
    method: 'POST',
    body: JSON.stringify({
      action_id,
      params
    })
  });

  const jobId = created.id || created.job_id || created.task_id;
  if (!jobId) {
    console.log(`[Trip Architect] Wire response ${action_id}: ${summarizeWireResponse(created)}`);
    return created;
  }

  for (let attempt = 0; attempt < 60; attempt += 1) {
    const job = await anakinFetch(`/wire/jobs/${jobId}`);
    if (job.status === 'completed') {
      const result = job.result || job.output || job.data || job;
      console.log(`[Trip Architect] Wire response ${action_id}: ${summarizeWireResponse(result)}`);
      return result;
    }
    if (job.status === 'failed' || job.status === 'error') {
      throw new Error(job.error || `Wire job failed for ${action_id}`);
    }
    await sleep(3000);
  }

  throw new Error(`Wire job timed out for ${action_id}`);
}

export async function wireSearch(actionId, params) {
  return wireCall(actionId, params);
}

export async function airbnbLocationSearch(query) {
  return wireCall('ab_location_search', { query, num_results: '10' });
}

export async function airbnbSearchListings(query, checkin, checkout, adults = '2') {
  return wireCall('ab_search_listings', { query, checkin, checkout, adults });
}

export async function airbnbListingDetails(listing_id, checkin, checkout, adults = '2') {
  return wireCall('ab_listing_details', { listing_id, checkin, checkout, adults });
}

export async function airbnbListingAvailability(listing_id) {
  return wireCall('ab_listing_availability', { listing_id, currency: 'INR', locale: 'en' });
}

export async function agodaLocationSearch(query) {
  return wireCall('ag_location_search', { query, language_id: 1 });
}

export async function agodaSearchHotels(city_id, check_in, check_out, adults = 2, rooms = 1) {
  return wireCall('ag_search_hotels', {
    city_id,
    check_in,
    check_out,
    adults,
    rooms,
    children: 0,
    currency: 'INR',
    language_id: 1,
    page: 1,
    page_size: 25,
    sort_by: 'ranking'
  });
}

export async function agodaHotelDetails(hotel_id) {
  return wireCall('ag_hotel_details', { hotel_id, language_id: 1, currency_code: 'INR' });
}

export async function flightSearch(origin, destination, date, adults = '1') {
  return wireCall('flight_search', { origin, destination, date, adults, currency: 'INR' });
}

export async function weatherLocationGeocoding(name, count = 5) {
  return wireCall('location_geocoding', { name, count });
}

export async function weatherForecast(latitude, longitude, forecast_days = 7) {
  return wireCall('weather_forecast', {
    latitude,
    longitude,
    forecast_days,
    daily: 'temperature_2m_max,temperature_2m_min,cloudcover_mean,precipitation_sum'
  });
}

export async function weatherHistorical(latitude, longitude, start_date, end_date) {
  return wireCall('historical_weather', {
    latitude,
    longitude,
    start_date,
    end_date,
    daily: 'temperature_2m_max,temperature_2m_min,cloudcover_mean'
  });
}

export async function createMonitor(config) {
  const requiredFields = ['url', 'scope', 'wireActionId', 'wireCatalogSlug', 'wireParams', 'intervalMinutes', 'alertWebhookUrl'];
  const missingFields = requiredFields.filter((field) => config[field] === undefined || config[field] === null || config[field] === '');
  if (missingFields.length > 0) {
    throw new Error(`Monitor config is missing required field(s): ${missingFields.join(', ')}`);
  }

  return anakinFetch('/monitors', {
    method: 'POST',
    body: JSON.stringify(config)
  });
}
