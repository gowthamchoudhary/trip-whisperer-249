import type { ReactNode } from "react";
import { ArrowDown, ArrowRight, ArrowUp, Bell, CalendarDays, Plus, Star } from "lucide-react";
import type { TripListing, TripMonitor, TripSummary } from "@/lib/tripArchitectApi";

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

function sortedOptions(listings: TripListing[] = []) {
  return [...listings]
    .sort((a, b) => {
      const aRank = Number.isFinite(Number(a.rank)) ? Number(a.rank) : Number.MAX_SAFE_INTEGER;
      const bRank = Number.isFinite(Number(b.rank)) ? Number(b.rank) : Number.MAX_SAFE_INTEGER;
      if (aRank !== bRank) return aRank - bRank;
      if (a.is_chosen !== b.is_chosen) return a.is_chosen ? -1 : 1;
      return Number(a.price || Number.MAX_SAFE_INTEGER) - Number(b.price || Number.MAX_SAFE_INTEGER);
    })
    .slice(0, 3);
}

function platformLabel(platform: string) {
  if (platform === "airbnb") return "Airbnb";
  if (platform === "agoda") return "Agoda";
  return platform;
}

export function RightPanel({ activeTripId, onNewTrip, tripSummary }: RightPanelProps) {
  const options = sortedOptions(tripSummary?.listings || []);
  const chosenListing = options.find((listing) => listing.is_chosen) || options[0] || null;
  const monitor = (tripSummary?.monitors || []).find((item) => item.listing_id === chosenListing?.id) || null;
  const itineraryDays = tripSummary?.itinerary_days || [];

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

      <Section title="Your Options">
        {options.length > 0 ? (
          <div className="space-y-3">
            {options.map((listing, index) => {
              const isBest = index === 0;
              return (
                <article
                  key={listing.id}
                  className={
                    "rounded-xl border p-3 " +
                    (isBest ? "border-brand/50 bg-brand/5 shadow-sm" : "border-border/70 bg-surface/70")
                  }
                >
                  <div className="flex gap-3">
                    {listing.image_url ? (
                      <img
                        src={listing.image_url}
                        alt={listing.listing_name}
                        className={isBest ? "h-16 w-16 shrink-0 rounded-lg object-cover" : "h-12 w-12 shrink-0 rounded-lg object-cover"}
                      />
                    ) : (
                      <div className={isBest ? "flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted text-[10px] text-muted-foreground" : "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-[10px] text-muted-foreground"}>
                        No image
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          #{listing.rank || index + 1}
                        </span>
                        {isBest && (
                          <span className="rounded-md bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-brand-foreground">
                            Best Match
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-sm font-medium text-foreground">{listing.listing_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{platformLabel(listing.source_platform)}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {formatCurrency(listing.price, listing.currency || "INR")}
                        </p>
                        {listing.rating !== null && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {listing.rating}
                          </span>
                        )}
                      </div>
                      {listing.listing_url && (
                        <a
                          href={listing.listing_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                        >
                          Book on {platformLabel(listing.source_platform)}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState text={activeTripId ? "Stay options will appear as soon as ranking completes." : "Start or select a trip to see options."} />
        )}
      </Section>

      <Section title="Your Itinerary" icon={<CalendarDays className="h-4 w-4 text-brand" />}>
        {itineraryDays.length > 0 ? (
          <ol className="space-y-3">
            {itineraryDays.map((day) => {
              const activities = Array.isArray(day.activities) ? day.activities : [];
              return (
                <li key={day.id} className="border-l border-border pl-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Day {day.day_number}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{day.title}</p>
                  <ul className="mt-2 space-y-1">
                    {activities.map((activity, index) => (
                      <li key={`${day.id}-${index}`} className="text-xs leading-5 text-muted-foreground">
                        {activity}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>
        ) : (
          <EmptyState text={activeTripId ? "Your day-by-day plan will appear after ranking." : "Start or select a trip to see an itinerary."} />
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
