import { ArrowUpRight, Cloud, CloudRain, Sun, CloudSun } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Weather = "cloudy" | "rain" | "clear" | "sunny";
type BadgeTone = "success" | "info" | "violet" | "warn";

const weatherIcon = {
  cloudy: Cloud,
  rain: CloudRain,
  clear: CloudSun,
  sunny: Sun,
};

const toneStyles: Record<BadgeTone, string> = {
  success: "bg-success text-success-foreground",
  info: "bg-info text-info-foreground",
  violet: "bg-violet text-violet-foreground",
  warn: "bg-warn text-warn-foreground",
};

export interface TripCardProps {
  name: string;
  avatar: string;
  time: string;
  title: string;
  dateRange: string;
  image: string;
  temp: string;
  weather: Weather;
  weatherLabel: string;
  badgeText: string;
  badgeTone: BadgeTone;
}

export function TripCard({
  name,
  avatar,
  time,
  title,
  dateRange,
  image,
  temp,
  weather,
  weatherLabel,
  badgeText,
  badgeTone,
}: TripCardProps) {
  const WIcon = weatherIcon[weather];
  return (
    <article className="rounded-2xl border border-border/60 bg-card p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.08)] transition-shadow hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-14px_rgba(15,23,42,0.12)]">
      <header className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <p className="text-sm font-medium text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground">{time}</p>
          </div>
        </div>
        <button aria-label="Open trip" className="text-muted-foreground hover:text-foreground">
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </header>

      <h3 className="mt-3 text-[15px] font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground">{dateRange}</p>

      <div className="relative mt-3 overflow-hidden rounded-xl">
        <img src={image} alt={title} className="h-36 w-full object-cover" loading="lazy" />
        <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-lg bg-card/95 px-2 py-1 text-xs shadow-sm backdrop-blur">
          <WIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="leading-tight">
            <p className="font-semibold text-foreground">{temp}</p>
            <p className="text-[10px] text-muted-foreground">{weatherLabel}</p>
          </div>
        </div>
        <span
          className={
            "absolute right-2 top-2 rounded-lg px-2 py-1 text-[11px] font-semibold shadow-sm " +
            toneStyles[badgeTone]
          }
        >
          {badgeText}
        </span>
      </div>
    </article>
  );
}
