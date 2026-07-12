import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
  const [tripRequestId, setTripRequestId] = useState<string | undefined>();
  const [tripSummary, setTripSummary] = useState<TripSummary | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = tripSummary?.trip_request.status;
  const shouldPoll = useMemo(
    () =>
      Boolean(
        tripRequestId &&
          status !== "completed" &&
          status !== "failed",
      ),
    [status, tripRequestId],
  );

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

  useEffect(() => {
    if (!tripRequestId || !shouldPoll) return;

    let cancelled = false;

    async function poll() {
      try {
        const summary = await getTripSummary(tripRequestId);
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

    poll();
    const interval = window.setInterval(poll, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [shouldPoll, tripRequestId]);

  async function handleSend(message: string) {
    setError(null);
    setIsPlanning(true);

    try {
      const started = await startTripPlan(message, tripRequestId, user?.id);
      setTripRequestId(started.trip_request_id);
      const summary = await getTripSummary(started.trip_request_id);
      setTripSummary(summary);
    } catch (sendError) {
      setIsPlanning(false);
      setError(sendError instanceof Error ? sendError.message : "Unable to start trip planning.");
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (!authChecked) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface font-sans text-foreground">
        <div className="rounded-2xl border border-border bg-card px-5 py-4 text-sm shadow-sm">
          Checking your session...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface font-sans text-foreground">
      <IconRail />
      <TripListPanel />
      <CenterChat
        error={error}
        isPlanning={isPlanning}
        onSignOut={handleSignOut}
        onSend={handleSend}
        tripSummary={tripSummary}
        userEmail={user?.email}
      />
      <RightPanel tripSummary={tripSummary} />
    </div>
  );
}
