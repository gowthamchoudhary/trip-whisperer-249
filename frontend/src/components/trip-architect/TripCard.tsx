import { ArrowUpRight } from "lucide-react";
import type { TripRequest } from "@/lib/tripArchitectApi";

export interface TripHistoryCardProps {
  active: boolean;
  destinations: string[];
  matchScore: number | null;
  trip: TripRequest;
  onClick: () => void;
}

function formatDate(value?: string) {
  if (!value) return "Just now";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusClass(status: string) {
  if (status === "completed") return "bg-success text-success-foreground";
  if (status === "failed") return "bg-danger text-danger-foreground";
  if (status === "queued") return "bg-muted text-muted-foreground";
  return "bg-info text-info-foreground";
}

export function TripCard({ active, destinations, matchScore, trip, onClick }: TripHistoryCardProps) {
  const title = destinations.length > 0 ? destinations.slice(0, 2).join(", ") : "Trip in progress";

  return (
    <button
      onClick={onClick}
      className={
        "w-full rounded-2xl border bg-card p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.08)] transition-shadow hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-14px_rgba(15,23,42,0.12)] " +
        (active ? "border-brand" : "border-border/60")
      }
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{formatDate(trip.created_at)}</p>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </header>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${statusClass(trip.status)}`}>
          {trip.status}
        </span>
        {matchScore !== null && (
          <span className="rounded-lg bg-card px-2 py-1 text-[11px] font-semibold text-success-foreground ring-1 ring-border/60">
            Weather {Math.round(matchScore)}%
          </span>
        )}
      </div>
    </button>
  );
}
