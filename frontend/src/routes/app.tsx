import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { IconRail } from "@/components/trip-architect/IconRail";
import { TripListPanel } from "@/components/trip-architect/TripListPanel";
import { CenterChat } from "@/components/trip-architect/CenterChat";
import { RightPanel } from "@/components/trip-architect/RightPanel";
import {
  getTripSummary,
  startTripPlan,
  type TripSummary,
} from "@/lib/tripArchitectApi";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/app")({
  component: TripArchitectPage,
});

function TripArchitectPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [tripSummary, setTripSummary] = useState<TripSummary | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session?.user) {
        navigate({ to: "/auth" });
        return;
      }
      setUser(data.session.user);
      setAuthChecked(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
        navigate({ to: "/auth" });
        return;
      }
      setUser(session.user);
      setAuthChecked(true);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [navigate]);

  const loadTrip = useCallback(async (tripId: string) => {
    const summary = await getTripSummary(tripId);
    setTripSummary(summary);
    setIsPlanning(
      summary.trip_request.status !== "completed" &&
        summary.trip_request.status !== "failed",
    );
  }, []);

  useEffect(() => {
    if (!activeTripId) {
      setTripSummary(null);
      setIsPlanning(false);
      return;
    }

    let cancelled = false;
    let debounceId: number | undefined;

    async function refresh() {
      try {
        const summary = await getTripSummary(activeTripId);
        if (!cancelled) {
          setTripSummary(summary);
          setIsPlanning(
            summary.trip_request.status !== "completed" &&
              summary.trip_request.status !== "failed",
          );
        }
      } catch (pollError) {
        if (!cancelled) {
          setError(pollError instanceof Error ? pollError.message : "Unable to load trip updates.");
        }
      }
    }

    function scheduleRefresh() {
      if (debounceId) window.clearTimeout(debounceId);
      debounceId = window.setTimeout(refresh, 250);
    }

    refresh();
    const interval = window.setInterval(refresh, 3000);

    const tripChannel = supabase
      .channel(`trip-request-${activeTripId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trip_requests", filter: `id=eq.${activeTripId}` },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_messages", filter: `trip_request_id=eq.${activeTripId}` },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listings", filter: `trip_request_id=eq.${activeTripId}` },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "flights", filter: `trip_request_id=eq.${activeTripId}` },
        scheduleRefresh,
      )
      .subscribe();

    const relatedChannel = supabase
      .channel(`trip-related-${activeTripId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "candidates" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "weather_scores" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "monitors" }, scheduleRefresh)
      .subscribe();

    return () => {
      cancelled = true;
      if (debounceId) window.clearTimeout(debounceId);
      window.clearInterval(interval);
      supabase.removeChannel(tripChannel);
      supabase.removeChannel(relatedChannel);
    };
  }, [activeTripId, loadTrip]);

  async function handleSend(message: string) {
    if (!user?.id) return;
    setError(null);
    setIsPlanning(true);

    try {
      const started = await startTripPlan(message, undefined, user.id);
      setActiveTripId(started.trip_request_id);
      setHistoryRefreshKey((key) => key + 1);
      await loadTrip(started.trip_request_id);
    } catch (sendError) {
      setIsPlanning(false);
      setError(sendError instanceof Error ? sendError.message : "Unable to start trip planning.");
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  function handleNewTrip() {
    setActiveTripId(null);
    setTripSummary(null);
    setIsPlanning(false);
    setError(null);
  }

  async function handleSelectTrip(tripId: string) {
    setError(null);
    setActiveTripId(tripId);
    try {
      await loadTrip(tripId);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load trip.");
    }
  }

  if (!authChecked) {
    return (
      <div
        suppressHydrationWarning
        className="flex h-screen w-screen items-center justify-center bg-surface font-sans text-foreground"
      >
        <div suppressHydrationWarning className="rounded-2xl border border-border bg-card px-5 py-4 text-sm shadow-sm">
          Checking your session...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface font-sans text-foreground">
      <IconRail />
      <TripListPanel
        activeTripId={activeTripId}
        refreshKey={historyRefreshKey}
        userId={user?.id || null}
        onSelectTrip={handleSelectTrip}
      />
      <CenterChat
        activeTripId={activeTripId}
        error={error}
        isPlanning={isPlanning}
        onSignOut={handleSignOut}
        onSend={handleSend}
        tripSummary={tripSummary}
        userEmail={user?.email}
      />
      <RightPanel activeTripId={activeTripId} onNewTrip={handleNewTrip} tripSummary={tripSummary} />
    </div>
  );
}
