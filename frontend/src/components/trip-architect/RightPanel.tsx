import type { ReactNode } from "react";
import { ArrowDown, ArrowRight, ArrowUp, Bell, Plus, Star } from "lucide-react";
import type { TripMonitor, TripSummary } from "@/lib/tripArchitectApi";

interface RightPanelProps {
  activeTripId: string | null;
  onNewTrip: () => void;
  tripSummary: TripSummary | null;
}

function formatCurrency(value?: number | null, currency = "INR") {
  if (!Number.isFinite(Number(value)) || Number(value) <= 0) return "Price pending";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatDate(value?: string | null) {
  if (!value) return "Not checked yet";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function trendForMonitor(monitor: TripMonitor | null) {
  const history = monitor?.price_history || [];
  if (history.length < 2) return null;
  const previous = Number(history[history.length - 2]?.price);
  const latest = Number(history[history.length - 1]?.price);
  if (!Number.isFinite(previous) || !Number.isFinite(latest) || previous === latest) return null;
  return {
    direction: latest > previous ? "up" : "down",
    delta: Math.abs(latest - previous),
  };
}

export function RightPanel({ activeTripId, onNewTrip, tripSummary }: RightPanelProps) {
  const chosenListing = tripSummary?.listings.find((listing) => listing.is_chosen) || null;
  const monitor = (tripSummary?.monitors || []).find((item) => item.listing_id === chosenListing?.id) || null;

  const trend = trendForMonitor(monitor);

  return (
    <aside className="flex w-[340px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-border/60 bg-surface p-4">
      <div className="flex items-center justify-end">
        <button
          onClick={onNewTrip}
          className="inline-flex items-center gap-1 rounded-full bg-brand px-3 py-2 text-xs font-semibold text-brand-foreground shadow-sm hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          New Trip
        </button>
      </div>

      <Section title="Your Pick">
        {chosenListing && tripSummary?.trip_request.status === "completed" ? (
          <div className="flex gap-3">
            {chosenListing.image_url ? (
              <img src={chosenListing.image_url} alt={chosenListing.listing_name} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted text-[10px] text-muted-foreground">
                No image
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{chosenListing.listing_name}</p>
              <p className="truncate text-xs text-muted-foreground">{chosenListing.source_platform}</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {formatCurrency(chosenListing.price, chosenListing.currency || "INR")}
                </p>
                {chosenListing.rating !== null && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {chosenListing.rating}
                  </span>
                )}
              </div>
              {chosenListing.listing_url && (
                <a
                  href={chosenListing.listing_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                >
                  Book on {chosenListing.source_platform === "airbnb" ? "Airbnb" : "Agoda"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        ) : (
          <EmptyState text={activeTripId ? "Your chosen stay will appear when planning completes." : "Start or select a trip to see your pick."} />
        )}
      </Section>

      <Section title="Price Watcher" icon={<Bell className="h-4 w-4 text-brand" />}>
        {monitor ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">{monitor.status}</p>
                <p className="text-xs text-muted-foreground">Last checked {formatDate(monitor.last_checked_at)}</p>
              </div>
              <span className="rounded-md bg-success px-1.5 py-0.5 text-[10px] font-semibold text-success-foreground">
                {monitor.status}
              </span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Current price</p>
                <p className="text-lg font-semibold text-foreground">{formatCurrency(monitor.current_price)}</p>
              </div>
              {trend && (
                <span
                  className={
                    "inline-flex items-center gap-1 text-xs font-semibold " +
                    (trend.direction === "down" ? "text-success-foreground" : "text-danger-foreground")
                  }
                >
                  {trend.direction === "down" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
                  {formatCurrency(trend.delta)}
                </span>
              )}
            </div>
          </div>
        ) : (
          <EmptyState text={activeTripId ? "No monitor exists for this trip yet." : "Select a completed trip to see price monitoring."} />
        )}
      </Section>
    </aside>
  );
}

function Section({ children, icon, title }: { children: ReactNode; icon?: ReactNode; title: string }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <header className="mb-3 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </header>
      {children}
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-border bg-surface p-3 text-sm text-muted-foreground">{text}</div>;
}
