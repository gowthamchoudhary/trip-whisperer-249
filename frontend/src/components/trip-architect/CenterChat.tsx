import { useState } from "react";
import type { ComponentType, FormEvent } from "react";
import type { TripCandidate, TripListing, TripSummary } from "@/lib/tripArchitectApi";
import {
  Send,
  Maximize2,
  Reply,
  Plane,
  Tag,
  Bell,
  Map,
  MoreHorizontal,
  MapPin,
  ArrowRight,
  Cloud,
  Wallet,
  TrendingUp,
  Paperclip,
  SlidersHorizontal,
  Mic,
  ArrowUp,
  CheckCircle2,
  Loader2,
  LogOut,
} from "lucide-react";

const actionPills = [
  { icon: Reply, label: "Reply" },
  { icon: Plane, label: "Plan New Trip" },
  { icon: Tag, label: "Find Deals" },
  { icon: Bell, label: "Price Watch" },
  { icon: Map, label: "Itinerary" },
  { icon: MoreHorizontal, label: "More" },
];

interface CenterChatProps {
  error: string | null;
  isPlanning: boolean;
  onSignOut: () => Promise<void>;
  onSend: (message: string) => Promise<void>;
  tripSummary: TripSummary | null;
  userEmail?: string | null;
}

function formatCurrency(value?: number | null, currency = "INR") {
  if (!Number.isFinite(Number(value))) return "Pending";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function bestListing(summary: TripSummary | null) {
  if (!summary) return null;
  return summary.listings.find((listing) => listing.is_chosen) || summary.listings[0] || null;
}

function candidateForListing(summary: TripSummary | null, listing: TripListing | null) {
  if (!summary || !listing) return null;
  return summary.candidates.find((candidate) => candidate.id === listing.candidate_id) || null;
}

function weatherScore(candidate: TripCandidate | null) {
  return candidate?.weather_scores?.[0]?.match_score ?? null;
}

export function CenterChat({ error, isPlanning, onSend, onSignOut, tripSummary, userEmail }: CenterChatProps) {
  const [input, setInput] = useState("");
  const selectedListing = bestListing(tripSummary);
  const selectedCandidate = candidateForListing(tripSummary, selectedListing);
  const matchScore = weatherScore(selectedCandidate);

  async function submitMessage(event: FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || isPlanning) return;
    setInput("");
    await onSend(message);
  }

  return (
    <section className="flex flex-1 flex-col overflow-hidden bg-card">
      <header className="flex items-center justify-between border-b border-border/60 px-6 py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className={isPlanning ? "h-2 w-2 rounded-full bg-amber-500" : "h-2 w-2 rounded-full bg-emerald-500"} />
          <span className="font-medium text-foreground">AI Trip Architect</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {userEmail && <span className="hidden max-w-[180px] truncate sm:inline">{userEmail}</span>}
          <span>{tripSummary?.trip_request.status || "ready"}</span>
          <button aria-label="Sign out" className="hover:text-foreground" onClick={onSignOut}>
            <LogOut className="h-4 w-4" />
          </button>
          <button aria-label="Expand" className="hover:text-foreground">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-brand-soft">
              <Send className="h-6 w-6 -rotate-45 text-brand" />
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
              Your AI Travel Architect
            </h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              I find destinations with ideal weather, live stays, flights, and price monitoring.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {actionPills.map(({ icon: Icon, label }) => (
              <button
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-muted"
              >
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                {label}
              </button>
            ))}
          </div>

          <hr className="my-8 border-border/60" />

          <div className="space-y-4 text-sm text-foreground">
            {(tripSummary?.messages.length ?? 0) === 0 ? (
              <>
                <p>Hey Gowtham,</p>
                <p className="text-muted-foreground">
                  Tell me your budget, dates, weather preference, and travel style. I will send it
                  to the backend planner and show live progress here.
                </p>
              </>
            ) : (
              <div className="space-y-3">
                {tripSummary?.messages.map((message) => (
                  <div
                    key={message.id}
                    className={
                      message.role === "user"
                        ? "ml-auto max-w-[82%] rounded-2xl bg-brand px-4 py-2 text-sm text-brand-foreground"
                        : "max-w-[82%] rounded-2xl border border-border/60 bg-surface px-4 py-2 text-sm text-foreground"
                    }
                  >
                    {message.content}
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger-foreground">
                {error}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 text-sm font-medium text-foreground">
              <MapPin className="h-4 w-4 text-brand" />
              {selectedListing ? "Top Pick for You" : "Planner Preview"}
            </div>

            <article className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.12)]">
              <div className="relative">
                <img
                  src={
                    selectedListing?.image_url ||
                    "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=75"
                  }
                  alt={selectedListing?.listing_name || "Trip destination"}
                  className="h-56 w-full object-cover"
                />
                <span className="absolute right-3 top-3 rounded-lg bg-success px-2.5 py-1 text-xs font-semibold text-success-foreground shadow-sm">
                  {matchScore ? `Best Weather Match ${matchScore}%` : tripSummary?.trip_request.status || "Ready"}
                </span>
              </div>
              <div className="grid gap-3 p-5 md:grid-cols-[1fr_auto] md:items-end">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {selectedCandidate
                      ? `${selectedCandidate.destination_name}${selectedCandidate.region ? `, ${selectedCandidate.region}` : ""}`
                      : "Plan your next trip"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedListing?.listing_name ||
                      "Destinations, weather, listings, flights, and monitoring will appear here."}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-success-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {isPlanning ? "Planning in progress" : "Best Weather Match"}{" "}
                    <span className="text-foreground/80">{matchScore ? `${matchScore}%` : ""}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">From</p>
                  <p className="text-lg font-semibold text-foreground">
                    {formatCurrency(selectedListing?.price, selectedListing?.currency || "INR")}{" "}
                    <span className="text-xs font-normal text-muted-foreground">/ stay</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">stays, flights and monitoring</p>
                  <a
                    href={selectedListing?.listing_url || undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground shadow-sm hover:opacity-90"
                  >
                    View Full Plan
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </article>

            <div className="grid gap-3 md:grid-cols-3">
              <StatCard
                icon={Cloud}
                label="Avg. Temperature"
                value={
                  selectedCandidate?.weather_scores?.[0]?.avg_temp
                    ? `${Math.round(selectedCandidate.weather_scores[0].avg_temp)} C`
                    : "Pending"
                }
                sub={tripSummary?.trip_request.weather_preference || "Weather scoring"}
              />
              <StatCard
                icon={Wallet}
                label="Budget Fit"
                value={formatCurrency(selectedListing?.price, selectedListing?.currency || "INR")}
                sub={tripSummary?.trip_request.budget ? "Compared with your budget" : "Waiting for budget"}
              />
              <StatCard
                icon={TrendingUp}
                label="Pipeline"
                value={tripSummary?.trip_request.status || "Idle"}
                sub="Live backend status"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60 px-6 py-4">
        <div className="mx-auto max-w-2xl">
          <form
            onSubmit={submitMessage}
            className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-sm"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="3 days, cloudy mountains, 40000 INR, from Bengaluru next month..."
              className="flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
              disabled={isPlanning}
            />
            <button aria-label="Voice" className="text-muted-foreground hover:text-foreground" type="button">
              <Mic className="h-4 w-4" />
            </button>
            <button
              aria-label="Send"
              disabled={isPlanning || input.trim().length === 0}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-sm hover:opacity-90 disabled:opacity-60"
            >
              {isPlanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </form>
          <div className="mt-2 flex items-center gap-3 pl-1 text-muted-foreground">
            <button aria-label="Attach" className="hover:text-foreground">
              <Paperclip className="h-4 w-4" />
            </button>
            <button aria-label="Options" className="hover:text-foreground">
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}
