import { weatherForecast, weatherLocationGeocoding } from '../lib/anakin.js';
import { forecastWeather, geocodeLocation } from '../lib/openMeteo.js';
import { insertWeatherScore } from '../lib/supabase.js';

const WEATHER_BACKEND = 'Anakin Wire weather actions with Open-Meteo fallback';
let useOpenMeteoFallback = false;
let hasLoggedWeatherBackend = false;

function pickResults(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data?.results)) return payload.data.results;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function pickDaily(payload) {
  return payload?.daily || payload?.result?.daily || payload?.data?.daily || payload?.forecast?.daily || {};
}

function isMissingWireAction(error) {
  return error.message.includes('Action not found') || error.message.includes('404 /wire/task');
}

async function geocodeDestination(destinationName) {
  if (useOpenMeteoFallback) {
    return geocodeLocation(destinationName);
  }

  try {
    return await weatherLocationGeocoding(destinationName);
  } catch (error) {
    if (!isMissingWireAction(error)) {
      throw error;
    }
    useOpenMeteoFallback = true;
    console.warn(`[Trip Architect] Wire weather geocoding unavailable, using Open-Meteo for ${destinationName}`);
    return geocodeLocation(destinationName);
  }
}

async function getForecast(latitude, longitude) {
  if (useOpenMeteoFallback) {
    return forecastWeather(latitude, longitude, 7);
  }

  try {
    return await weatherForecast(latitude, longitude, 7);
  } catch (error) {
    if (!isMissingWireAction(error)) {
      throw error;
    }
    useOpenMeteoFallback = true;
    console.warn('[Trip Architect] Wire weather forecast unavailable, using Open-Meteo forecast');
    return forecastWeather(latitude, longitude, 7);
  }
}

function average(values = []) {
  const valid = values.map(Number).filter((value) => Number.isFinite(value));
  if (valid.length === 0) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function computeMatchScore(weatherPreference = '', avgTemp, cloudCoverPct, precipitation) {
  const preference = weatherPreference.toLowerCase();
  let score = 60;
  const moderateTempScore = 100 - Math.abs((avgTemp ?? 24) - 24) * 4;

  if (preference.includes('cloud')) {
    score = cloudCoverPct * 0.75 + moderateTempScore * 0.25;
  } else if (preference.includes('sun') || preference.includes('clear')) {
    score = (100 - cloudCoverPct) * 0.8 + moderateTempScore * 0.2;
  } else if (preference.includes('cool') || preference.includes('cold')) {
    score = 100 - Math.abs((avgTemp ?? 18) - 18) * 5;
  } else if (preference.includes('warm')) {
    score = 100 - Math.abs((avgTemp ?? 26) - 26) * 5;
  } else if (preference.includes('dry')) {
    score = 100 - Math.min((precipitation ?? 0) * 12, 80);
  } else if (preference.includes('rain')) {
    score = Math.min((precipitation ?? 0) * 18 + cloudCoverPct * 0.4, 100);
  } else if (Number.isFinite(avgTemp) && Number.isFinite(cloudCoverPct)) {
    const balancedCloudScore = 100 - Math.abs(cloudCoverPct - 45);
    score = moderateTempScore * 0.7 + balancedCloudScore * 0.3;
  }

  return Math.round(clamp(score));
}

function activeWeatherCall(wireName, fallbackName) {
  return useOpenMeteoFallback ? `${fallbackName} (Open-Meteo)` : `${wireName} (Anakin Wire)`;
}

export async function weatherFilter(candidates, intent) {
  if (!hasLoggedWeatherBackend) {
    console.log(`[WeatherFilter] Using weather backend: ${WEATHER_BACKEND}`);
    hasLoggedWeatherBackend = true;
  }

  const scored = [];

  for (const candidate of candidates) {
    let activeCall = activeWeatherCall('weatherLocationGeocoding', 'geocodeLocation');

    try {
      const geocoding = await geocodeDestination(candidate.destination_name);
      const location = pickResults(geocoding)[0];
      const lat = location?.latitude ?? location?.lat;
      const lon = location?.longitude ?? location?.lon ?? location?.lng;

      if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) {
        console.warn(`[Trip Architect] No weather geocode result for ${candidate.destination_name}`);
        continue;
      }

      activeCall = activeWeatherCall('weatherForecast', 'forecastWeather');
      const forecast = await getForecast(Number(lat), Number(lon));
      const daily = pickDaily(forecast);
      const maxTemp = average(daily.temperature_2m_max || []);
      const minTemp = average(daily.temperature_2m_min || []);
      const avgTemp = Number.isFinite(maxTemp) && Number.isFinite(minTemp) ? (maxTemp + minTemp) / 2 : maxTemp ?? minTemp;
      const cloudCoverPct = average(daily.cloudcover_mean || daily.cloud_cover_mean || []) ?? 0;
      const precipitation = average(daily.precipitation_sum || []) ?? 0;
      const matchScore = computeMatchScore(intent.weather_preference || '', avgTemp, cloudCoverPct, precipitation);

      activeCall = 'insertWeatherScore';
      const weatherScore = await insertWeatherScore({
        candidate_id: candidate.id,
        lat: Number(lat),
        lon: Number(lon),
        forecast_data: forecast,
        avg_temp: avgTemp,
        cloud_cover_pct: cloudCoverPct,
        match_score: matchScore
      });

      scored.push({
        ...candidate,
        weather_score: weatherScore
      });
    } catch (error) {
      console.error(`[WeatherFilter] Failed for ${candidate.destination_name}:`, {
        call: activeCall,
        message: error.message,
        cause: error.cause,
        stack: error.stack
      });
    }
  }

  if (scored.length === 0) {
    throw new Error('No candidates could be scored with weather data.');
  }

  return scored.sort((a, b) => b.weather_score.match_score - a.weather_score.match_score).slice(0, 3);
}
