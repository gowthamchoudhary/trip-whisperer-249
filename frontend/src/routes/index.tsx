import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Send,
  ArrowRight,
  ShieldCheck,
  Cloud,
  MapPin,
  Star,
  Plane,
  CheckCircle2,
  Tag,
  Bell,
  Map as MapIcon,
  Twitter,
  Instagram,
  Youtube,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "Trip Architect — Weather-Matched Trips, Perfectly Planned" },
      {
        name: "description",
        content:
          "Tell us your budget, duration, and vibe. Trip Architect finds destinations with great weather, real deals, and tracks prices until you book.",
      },
    ],
  }),
});

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10">
        <Send className="h-4 w-4 -rotate-45 text-brand" strokeWidth={2.5} />
      </span>
      <span className="text-lg font-semibold tracking-tight text-foreground">
        Trip Architect
      </span>
    </Link>
  );
}

function Nav() {
  const items = ["Home", "How It Works", "Destinations", "Pricing", "Blog", "About Us"];
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
      <Logo />
      <nav className="hidden items-center gap-8 md:flex">
        {items.map((i) => (
          <a
            key={i}
            href="#"
            className={`text-sm ${i === "Home" ? "font-semibold text-foreground underline underline-offset-8 decoration-2" : "text-muted-foreground hover:text-foreground"}`}
          >
            {i}
          </a>
        ))}
      </nav>
      <div className="flex items-center gap-4">
        <Link to="/auth" className="text-sm text-foreground hover:opacity-80">
          Log in
        </Link>
        <Link
          to="/auth"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-sm hover:opacity-90"
        >
          Get Started
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-6xl px-6 pt-8 pb-16 text-center">
        {/* Headline */}
        <h1 className="mt-2 text-5xl font-bold tracking-tight text-foreground md:text-6xl">
          Weather-Matched Trips.
          <br />
          <span className="text-brand">Perfectly Planned for You.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Tell us your budget, duration, and vibe — we find destinations with great weather,{" "}
          <a href="#" className="font-medium text-brand underline underline-offset-2">
            real deals
          </a>
          , and keep tracking prices until you book with confidence.
        </p>

        {/* Filter bar with annotations */}
        <div className="relative mx-auto mt-10 max-w-3xl">
          {/* Left annotation */}
          <div className="pointer-events-none absolute -left-4 top-1/2 hidden -translate-x-full -translate-y-1/2 lg:block">
            <p className="whitespace-nowrap font-caveat text-xl text-foreground/80">
              Mountains
              <br />
              Cool &amp; Cloudy
            </p>
            <svg
              className="ml-16 mt-1 text-brand"
              width="52"
              height="24"
              viewBox="0 0 52 24"
              fill="none"
            >
              <path
                d="M2 22 C 18 18, 30 8, 48 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M42 2 L48 3 L45 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>

          {/* Right annotation */}
          <div className="pointer-events-none absolute -right-4 top-1/2 hidden -translate-y-1/2 translate-x-full lg:block">
            <p className="whitespace-nowrap font-caveat text-xl text-foreground/80">
              Smarter trips
              <br />
              start here
            </p>
            <svg
              className="-mt-1 text-brand"
              width="52"
              height="28"
              viewBox="0 0 52 28"
              fill="none"
            >
              <path
                d="M50 2 C 34 8, 22 18, 4 24"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M10 18 L4 24 L11 27"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card p-2 shadow-[0_4px_20px_-8px_rgba(15,23,42,0.12)]">
            <FilterField label="Budget" value="Your budget" />
            <div className="h-10 w-px bg-border" />
            <FilterField label="Duration" value="Trip length" />
            <div className="h-10 w-px bg-border" />
            <FilterField label="Vibe" value="Weather + style" />
            <Link
              to="/app"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground shadow-sm hover:opacity-90"
            >
              Plan My Trip
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-brand" />
          Personalized picks, timely prices, and weather-aware planning
        </p>

        {/* Cards row */}
        <div className="mx-auto mt-8 grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-[1fr_1.3fr_1fr]">
          <WeatherCard />
          <HeroImageCard />
          <DealsCard />
        </div>

        {/* Trust bar */}
        <div className="mx-auto mt-14 max-w-5xl">
          <p className="text-xs text-muted-foreground">
            Loved by smart travelers and trusted by leading platforms
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 rounded-2xl border border-border/60 bg-card px-6 py-5">
            {[
              { name: "agoda", cls: "font-bold text-[#5c4bd6]" },
              { name: "airbnb", cls: "font-bold italic text-[#ff5a5f]" },
              { name: "AbhiBus", cls: "font-bold text-[#d32029]" },
              { name: "makemytrip", cls: "font-bold text-[#0d5eb2]" },
              { name: "ixigo", cls: "font-bold text-[#ee7623]" },
              { name: "cleartrip", cls: "font-bold text-[#f68b1e]" },
            ].map((l) => (
              <span key={l.name} className={`text-lg ${l.cls}`}>
                {l.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FilterField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col items-start px-4 py-2 text-left">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

function WeatherCard() {
  const days = [
    { d: "Today", t: "18°" },
    { d: "Fri", t: "16°" },
    { d: "Sat", t: "15°" },
    { d: "Sun", t: "17°" },
    { d: "Mon", t: "18°" },
  ];

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 text-left shadow-sm">
      <p className="text-sm font-semibold text-foreground">Manali, Himachal Pradesh</p>
      <div className="mt-3 flex items-start justify-between">
        <div>
          <p className="text-4xl font-bold text-foreground">18°C</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Cloud className="h-3 w-3" /> Cloudy
          </p>
          <p className="text-[11px] text-muted-foreground">Feels like 17°C</p>
        </div>
        <Cloud className="h-10 w-10 text-muted-foreground/60" />
      </div>
      <p className="mt-3 border-l-2 border-success-foreground pl-2 text-xs font-medium text-success-foreground">
        Great weather for your trip!
      </p>
      <div className="mt-4 grid grid-cols-5 gap-1 text-center">
        {days.map((day) => (
          <div key={day.d}>
            <p className="text-[10px] text-muted-foreground">{day.d}</p>
            <Cloud className="mx-auto my-1 h-4 w-4 text-muted-foreground/70" />
            <p className="text-[11px] font-semibold text-foreground">{day.t}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 flex items-center gap-1.5 border-t border-border/60 pt-3 text-[10px] text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Weather source: OpenWeatherMap
      </p>
    </div>
  );
}

function HeroImageCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <img
        src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=75"
        alt="Manali"
        className="h-full min-h-[280px] w-full object-cover"
      />
      <span className="absolute right-3 top-3 rounded-lg bg-success px-2.5 py-1 text-[11px] font-semibold text-success-foreground shadow-sm">
        Best Match 92%
      </span>
      <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-card/95 p-3 shadow-lg backdrop-blur">
        <p className="text-sm font-semibold text-foreground">Manali, Himachal Pradesh</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          3 Days · Mountains · Cloudy
        </p>
        <div className="mt-2 flex items-end justify-between">
          <p className="text-xs text-muted-foreground">
            From <span className="text-base font-bold text-success-foreground">₹8,450</span>{" "}
            <span className="text-[11px]">/ person</span>
          </p>
          <button className="rounded-full bg-[#1c1c1c] px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

function DealsCard() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-5 text-left shadow-sm">
      <div>
        <p className="text-xs font-semibold text-muted-foreground">Top Stay Deal</p>
        <div className="mt-2 flex items-start gap-3">
          <img
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=200&q=75"
            alt=""
            className="h-12 w-12 rounded-lg object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">The Orchard Greens</p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              4.5 (812)
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-foreground">
              ₹3,200 <span className="text-[10px] font-normal text-muted-foreground">/ night</span>
            </p>
            <a href="#" className="text-[11px] font-medium text-brand">
              View on Agoda
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-border/60 pt-3">
        <p className="text-xs font-semibold text-muted-foreground">Top Flight Deal</p>
        <div className="mt-2 flex items-start gap-3">
          <Plane className="mt-1 h-5 w-5 text-brand" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              Delhi (DEL) → Kullu (KUU)
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              IndiGo · 1h 20m · Non-stop
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-foreground">₹4,250</p>
            <a href="#" className="text-[11px] font-medium text-brand">
              View on MakeMyTrip
            </a>
          </div>
        </div>
      </div>
      <p className="mt-auto flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
        Prices update in real-time
      </p>
    </div>
  );
}

function Features() {
  const items = [
    {
      icon: Cloud,
      title: "Weather-First Matching",
      desc: "We analyze real-time weather forecasts to recommend the best destinations.",
    },
    {
      icon: Tag,
      title: "Real Deals, Live Prices",
      desc: "Stays and price monitoring stay aligned with your budget.",
    },
    {
      icon: Bell,
      title: "Price Watch Agent",
      desc: "We track price changes 24/7 and notify you when it's the best time to book.",
    },
    {
      icon: MapIcon,
      title: "Personalized Itineraries",
      desc: "AI-crafted day-by-day plans based on your vibe, time and interests.",
    },
  ];
  return (
    <section className="border-t border-border/60 bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[1fr_2.2fr]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Powerful Features for
            <br />
            Smarter Travel Planning
          </h2>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Everything you need to plan the perfect trip, backed by real-time data and
            intelligent AI.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
                <Icon className="h-5 w-5 text-brand" />
              </div>
              <p className="mt-4 text-sm font-semibold text-foreground">{title}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    { title: "Product", items: ["How It Works", "Destinations", "Pricing", "Features"] },
    { title: "Company", items: ["About Us", "Blog", "Careers", "Contact Us"] },
    { title: "Legal", items: ["Privacy Policy", "Terms of Service", "Refund Policy"] },
  ];
  return (
    <footer className="border-t border-border/60 bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr_1.4fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-muted-foreground">
              Your AI travel agent that plans, tracks, and perfects your trips with
              real-time data.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <p className="text-sm font-semibold text-foreground">{c.title}</p>
              <ul className="mt-4 space-y-2.5">
                {c.items.map((i) => (
                  <li key={i}>
                    <a href="#" className="text-xs text-muted-foreground hover:text-foreground">
                      {i}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="text-sm font-semibold text-foreground">Stay in the loop</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Get travel tips, deals, and updates straight to your inbox.
            </p>
            <form className="mt-4 flex items-center gap-2 rounded-xl border border-border/70 bg-card p-1.5">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-transparent px-2 py-1.5 text-xs outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="flex h-8 w-9 items-center justify-center rounded-lg bg-brand text-brand-foreground hover:opacity-90"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
        <div className="mt-10 flex items-center justify-between border-t border-border/60 pt-6">
          <p className="text-xs text-muted-foreground">
            © 2025 Trip Architect. All rights reserved.
          </p>
          <div className="flex items-center gap-3 text-muted-foreground">
            <a href="#" aria-label="Twitter" className="hover:text-foreground">
              <Twitter className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Instagram" className="hover:text-foreground">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="#" aria-label="YouTube" className="hover:text-foreground">
              <Youtube className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function LandingPage() {
  return (
    <div
      className="min-h-screen bg-surface bg-cover bg-center bg-fixed font-sans text-foreground"
      style={{
        backgroundImage:
          "linear-gradient(rgba(244,244,242,0.38), rgba(244,244,242,0.52)), url('/bg.png')",
      }}
    >
      <Nav />
      <Hero />
      <Features />
      <Footer />
    </div>
  );
}
