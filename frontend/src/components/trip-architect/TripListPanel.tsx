import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getTripHistory, type TripHistoryRow } from "@/lib/tripArchitectApi";
import { TripCard } from "./TripCard";

interface TripListPanelProps {
  activeTripId: string | null;
  refreshKey: number;
  userId: string | null;
  onSelectTrip: (tripId: string) => void;
}

export function TripListPanel({ activeTripId, refreshKey, userId, onSelectTrip }: TripListPanelProps) {
  const [trips, setTrips] = useState<TripHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setTrips([]);
      return;
    }

    let cancelled = false;

    async function loadTrips() {
      setLoading(true);
      try {
        const history = await getTripHistory(userId);
        if (!cancelled) {
          setTrips(history.trips);
        }
      } catch {
        if (!cancelled) {
          setTrips([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTrips();

    const channel = supabase
      .channel(`trip-history-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trip_requests", filter: `user_id=eq.${userId}` },
        loadTrips,
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [refreshKey, userId]);

  return (
    <section className="flex w-[330px] shrink-0 flex-col border-r border-border/60 bg-surface">
      <div className="flex items-center gap-2 border-b border-border/60 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <History className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Past Trips</p>
          <p className="text-xs text-muted-foreground">{loading ? "Loading..." : `${trips.length} saved`}</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {!loading && trips.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
            No trips yet - start your first one below
          </div>
        ) : (
          trips.map((trip) => {
            const destinations = (trip.candidates || []).map((candidate) => candidate.destination_name).filter(Boolean);
            const matchScore =
              (trip.candidates || [])
                .flatMap((candidate) => candidate.weather_scores || [])
                .map((score) => score.match_score)
                .find((score): score is number => Number.isFinite(Number(score))) ?? null;

            return (
              <TripCard
                key={trip.id}
                active={trip.id === activeTripId}
                destinations={destinations}
                matchScore={matchScore}
                trip={trip}
                onClick={() => onSelectTrip(trip.id)}
              />
            );
          })
        )}
      </div>
    </section>
  );
}
