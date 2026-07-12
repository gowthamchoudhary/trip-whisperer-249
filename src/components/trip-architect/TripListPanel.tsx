import { Search, SlidersHorizontal } from "lucide-react";
import { TripCard, type TripCardProps } from "./TripCard";

const trips: TripCardProps[] = [
  {
    name: "Gowtham Choudhary",
    avatar: "https://i.pravatar.cc/80?img=12",
    time: "09:45 AM",
    title: "Spiti Valley Escape 🏔️",
    dateRange: "20 May – 25 May 2025",
    image:
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=70",
    temp: "14°C",
    weather: "cloudy",
    weatherLabel: "Cloudy",
    badgeText: "Best Weather Match 94%",
    badgeTone: "success",
  },
  {
    name: "Kerala Backwaters 🌴",
    avatar: "https://i.pravatar.cc/80?img=47",
    time: "12:20 PM · 18 Jun – 22 Jun 2025",
    title: "Kerala Backwaters",
    dateRange: "Houseboat · Alleppey",
    image:
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=70",
    temp: "26°C",
    weather: "rain",
    weatherLabel: "Light Rain",
    badgeText: "Great Deal ₹12,500 off",
    badgeTone: "success",
  },
  {
    name: "Japan Cherry Blossom 🌸",
    avatar: "https://i.pravatar.cc/80?img=15",
    time: "08:15 AM · 25 Mar – 02 Apr 2026",
    title: "Sakura Season",
    dateRange: "Tokyo · Kyoto · Osaka",
    image:
      "https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=800&q=70",
    temp: "12°C",
    weather: "clear",
    weatherLabel: "Clear",
    badgeText: "Price Watching  -₹3,200",
    badgeTone: "violet",
  },
  {
    name: "Weekend in Goa 🏖️",
    avatar: "https://i.pravatar.cc/80?img=33",
    time: "Yesterday",
    title: "Beach Reset",
    dateRange: "North Goa · 2 nights",
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=70",
    temp: "29°C",
    weather: "sunny",
    weatherLabel: "Sunny",
    badgeText: "Plan Now · 3 deals found",
    badgeTone: "info",
  },
];

export function TripListPanel() {
  return (
    <section className="flex w-[330px] shrink-0 flex-col border-r border-border/60 bg-surface">
      <div className="flex items-center gap-2 border-b border-border/60 p-4">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-card px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Search trips, places..."
          />
          <button aria-label="Filters" className="text-muted-foreground hover:text-foreground">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {trips.map((t) => (
          <TripCard key={t.title + t.time} {...t} />
        ))}
      </div>
    </section>
  );
}
