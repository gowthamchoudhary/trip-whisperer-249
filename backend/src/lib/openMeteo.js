async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Open-Meteo request failed (${response.status}): ${text}`);
  }
  return response.json();
}

export async function geocodeLocation(name, count = 5) {
  const params = new URLSearchParams({
    name,
    count: String(count),
    language: 'en',
    format: 'json'
  });
  return fetchJson(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`);
}

export async function forecastWeather(latitude, longitude, forecast_days = 7) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    forecast_days: String(forecast_days),
    daily: 'temperature_2m_max,temperature_2m_min,cloud_cover_mean,precipitation_sum',
    timezone: 'auto'
  });
  return fetchJson(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
}
