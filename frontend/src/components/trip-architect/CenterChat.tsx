import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, ArrowUp, CheckCircle2, Loader2, LogOut, Send } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import type { TripCandidate, TripListing, TripSummary } from "@/lib/tripArchitectApi";

interface CenterChatProps {
  activeTripId: string | null;
  error: string | null;
  isPlanning: boolean;
  onSignOut: () => Promise<void>;
  onSend: (message: string) => Promise<void>;
  tripSummary: TripSummary | null;
  userEmail?: string | null;
}

function formatCurrency(value?: number | null, currency = "INR") {
  if (!Number.isFinite(Number(value)) || Number(value) <= 0) return "Price pending";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function chosenListing(summary: TripSummary | null) {
  if (!summary || summary.trip_request.status !== "completed") return null;
  return summary.listings.find((listing) => listing.is_chosen) || null;
}

function candidateForListing(summary: TripSummary | null, listing: TripListing | null) {
  if (!summary || !listing) return null;
  return summary.candidates.find((candidate) => candidate.id === listing.candidate_id) || null;
}

function weatherScore(candidate: TripCandidate | null) {
  return candidate?.weather_scores?.[0]?.match_score ?? null;
}

export function CenterChat({
  activeTripId,
  error,
  isPlanning,
  onSend,
  onSignOut,
  tripSummary,
  userEmail,
}: CenterChatProps) {
  const [input, setInput] = useState("");
  const listing = chosenListing(tripSummary);
  const candidate = candidateForListing(tripSummary, listing);
  const matchScore = weatherScore(candidate);
  const status = tripSummary?.trip_request.status || (activeTripId ? "loading" : "ready");
  const failedMessage =
    status === "failed" ? tripSummary?.messages[tripSummary.messages.length - 1]?.content || "Trip planning failed." : null;

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
          {userEmail && <span className="hidden max-w-[220px] truncate sm:inline">{userEmail}</span>}
          <span>{status}</span>
          <button aria-label="Sign out" className="hover:text-foreground" onClick={onSignOut}>
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto flex min-h-full max-w-2xl flex-col">
          {!activeTripId ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <BrandMark className="h-16 w-16" />
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
                Your AI Travel Architect
              </h1>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Tell me your budget, dates, weather preference, and travel style. I will show real progress here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
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

              {isPlanning && (
                <div className="inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-surface px-4 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Working on your trip...
                </div>
              )}

              {(error || failedMessage) && (
                <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger-foreground">
                  {error || failedMessage}
                </div>
              )}

              {listing && (
                <article className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.12)]">
                  {listing.image_url ? (
                    <img src={listing.image_url} alt={listing.listing_name} className="h-56 w-full object-cover" />
                  ) : (
                    <div className="flex h-56 w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                      No listing image available
                    </div>
                  )}
                  <div className="grid gap-3 p-5 md:grid-cols-[1fr_auto] md:items-end">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-medium text-success-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {matchScore !== null ? `Weather match ${Math.round(matchScore)}%` : "Chosen stay"}
                      </div>
                      <h3 className="mt-2 text-lg font-semibold text-foreground">
                        {candidate
                          ? `${candidate.destination_name}${candidate.region ? `, ${candidate.region}` : ""}`
                          : listing.listing_name}
                      </h3>
                      <p className="text-xs text-muted-foreground">{listing.listing_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Stay price</p>
                      <p className="text-lg font-semibold text-foreground">
                        {formatCurrency(listing.price, listing.currency || "INR")}
                      </p>
                      {listing.listing_url && (
                        <a
                          href={listing.listing_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground shadow-sm hover:opacity-90"
                        >
                          Book on {listing.source_platform === "airbnb" ? "Airbnb" : "Agoda"}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border/60 px-6 py-4">
        <div className="mx-auto max-w-2xl">
          {!activeTripId ? (
            <form
              onSubmit={submitMessage}
              className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-sm"
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="3 days, cloudy mountains, 40000 INR, from Bengaluru..."
                className="flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
                disabled={isPlanning}
              />
              <button
                aria-label="Send"
                disabled={isPlanning || input.trim().length === 0}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-sm hover:opacity-90 disabled:opacity-60"
              >
                {isPlanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
              </button>
            </form>
          ) : (
            <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-muted-foreground">
              Viewing a real trip. Use New Trip to start another plan.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
