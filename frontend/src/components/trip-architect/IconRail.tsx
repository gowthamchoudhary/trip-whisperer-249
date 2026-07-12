import { Send, Compass, Star, MapPin, Bookmark, FileText, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { icon: Compass, active: true, label: "Explore" },
  { icon: Star, label: "Saved" },
  { icon: MapPin, label: "Destinations" },
  { icon: Bookmark, label: "Bookmarks" },
  { icon: FileText, label: "Docs" },
];

export function IconRail() {
  return (
    <aside className="flex w-[72px] shrink-0 flex-col items-center gap-3 border-r border-border/60 bg-surface py-4">
      <button
        aria-label="Trip Architect home"
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-sm"
      >
        <Send className="h-5 w-5 -rotate-45" />
      </button>

      <nav className="mt-4 flex flex-col items-center gap-2">
        {navItems.map(({ icon: Icon, active, label }) => (
          <button
            key={label}
            aria-label={label}
            className={
              "flex h-11 w-11 items-center justify-center rounded-xl transition-colors " +
              (active
                ? "bg-brand text-brand-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground")
            }
          >
            <Icon className="h-5 w-5" />
          </button>
        ))}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-3">
        <button
          aria-label="Settings"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Settings className="h-5 w-5" />
        </button>
        <Avatar className="h-10 w-10 border border-border">
          <AvatarImage src="https://i.pravatar.cc/80?img=12" alt="Your profile" />
          <AvatarFallback>GC</AvatarFallback>
        </Avatar>
      </div>
    </aside>
  );
}
