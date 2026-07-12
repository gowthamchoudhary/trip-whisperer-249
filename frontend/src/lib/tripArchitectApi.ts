const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export interface TripMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface TripRequest {
  id: string;
  status: string;
  budget?: number | null;
  duration_days?: number | null;
  terrain_preference?: string | null;
  weather_preference?: string | null;
  date_range_start?: string | null;
  date_range_end?: string | null;
  origin_city?: string | null;
}

export interface TripListing {
  id: string;
  candidate_id: string;
  source_platform: "airbnb" | "agoda" | string;
  listing_name: string;
  price: number | null;
  currency: string | null;
  rating: number | null;
  image_url: string | null;
  listing_url: string | null;
  is_chosen: boolean;
}

export interface TripCandidate {
  id: string;
  destination_name: string;
  region: string | null;
  reasoning_text: string | null;
  weather_scores?: Array<{
    avg_temp: number | null;
    cloud_cover_pct: number | null;
    match_score: number | null;
  }>;
}

export interface TripFlight {
  id: string;
  origin: string;
  destination: string;
  airline: string | null;
  price: number | null;
  duration: string | null;
  departure_time: string | null;
  booking_url: string | null;
}

export interface TripSummary {
  trip_request: TripRequest;
  messages: TripMessage[];
  candidates: TripCandidate[];
  listings: TripListing[];
  flights: TripFlight[];
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Request failed with ${response.status}`);
  }
  return payload as T;
}

export async function startTripPlan(userMessage: string, tripRequestId?: string, userId?: string) {
  const response = await fetch(`${API_BASE_URL}/api/plan-trip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      trip_request_id: tripRequestId,
      user_message: userMessage,
      user_id: userId,
    }),
  });

  return parseResponse<{ status: string; trip_request_id: string }>(response);
}

export async function getTripSummary(tripRequestId: string) {
  const response = await fetch(`${API_BASE_URL}/api/trip/${tripRequestId}`);
  return parseResponse<TripSummary>(response);
}
