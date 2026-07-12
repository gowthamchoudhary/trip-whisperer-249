import { useState } from "react";
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
} from "lucide-react";

const actionPills = [
  { icon: Reply, label: "Reply" },
  { icon: Plane, label: "Plan New Trip" },
  { icon: Tag, label: "Find Deals" },
  { icon: Bell, label: "Price Watch" },
  { icon: Map, label: "Itinerary" },
  { icon: MoreHorizontal, label: "More" },
];

export function CenterChat() {
  const [input, setInput] = useState("");
  return (
    <section className="flex flex-1 flex-col overflow-hidden bg-card">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border/60 px-6 py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="font-medium text-foreground">AI Trip Architect</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>21 May, 2025</span>
          <button aria-label="Expand" className="hover:text-foreground">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto max-w-2xl">
          {/* Intro */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-brand-soft">
              <Send className="h-6 w-6 -rotate-45 text-brand" />
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
              Your AI Travel Architect ✨
            </h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              I find the best destinations with ideal weather, real deals, and nonstop price
              monitoring.
            </p>
          </div>

          {/* Action pills */}
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

          {/* Assistant message */}
          <div className="space-y-4 text-sm text-foreground">
            <p>Hey Gowtham,</p>
            <p className="text-muted-foreground">
              Based on your preferences — 3 days, ₹40,000 budget, Mountains, Cool & Cloudy — here
              are the best real-time options for your trip.
            </p>

            <div className="flex items-center gap-2 pt-2 text-sm font-medium text-foreground">
              <MapPin className="h-4 w-4 text-brand" />
              Top Pick for You
            </div>

            {/* Top pick card */}
            <article className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.12)]">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=75"
                  alt="Darjeeling"
                  className="h-56 w-full object-cover"
                />
                <span className="absolute right-3 top-3 rounded-lg bg-success px-2.5 py-1 text-xs font-semibold text-success-foreground shadow-sm">
                  Best Weather Match 92%
                </span>
              </div>
              <div className="grid gap-3 p-5 md:grid-cols-[1fr_auto] md:items-end">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Darjeeling, West Bengal</h3>
                  <p className="text-xs text-muted-foreground">
                    3 Days · Mountains · Cool & Cloudy
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-success-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Best Weather Match <span className="text-foreground/80">92%</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">From</p>
                  <p className="text-lg font-semibold text-foreground">₹10,450 <span className="text-xs font-normal text-muted-foreground">/ person</span></p>
                  <p className="text-[11px] text-muted-foreground">including stays &amp; flights</p>
                  <button className="mt-2 inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground shadow-sm hover:opacity-90">
                    View Full Plan
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>

            {/* Stat cards */}
            <div className="grid gap-3 md:grid-cols-3">
              <StatCard
                icon={Cloud}
                label="Avg. Temperature"
                value="15°C – 18°C"
                sub="Perfect for your vibe"
              />
              <StatCard
                icon={Wallet}
                label="Budget Fit"
                value="₹38,250"
                sub="Within your budget"
              />
              <StatCard
                icon={TrendingUp}
                label="Price Trend"
                value="Dropping"
                sub="Book in next 2 days"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Chat input */}
      <div className="border-t border-border/60 px-6 py-4">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-sm">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your trip..."
              className="flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button aria-label="Voice" className="text-muted-foreground hover:text-foreground">
              <Mic className="h-4 w-4" />
            </button>
            <button
              aria-label="Send"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-sm hover:opacity-90"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
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
  icon: React.ComponentType<{ className?: string }>;
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
