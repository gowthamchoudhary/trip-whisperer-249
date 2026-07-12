import { History } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function IconRail() {
  return (
    <aside className="flex w-[72px] shrink-0 flex-col items-center gap-3 border-r border-border/60 bg-surface py-4">
      <button
        aria-label="Trip Architect home"
        className="flex h-11 w-11 items-center justify-center rounded-xl shadow-sm"
      >
        <BrandMark className="h-11 w-11" />
      </button>

      <nav className="mt-4 flex flex-col items-center gap-2">
        <button
          aria-label="Past trips"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-sm"
        >
          <History className="h-5 w-5" />
        </button>
      </nav>

      <div className="mt-auto flex flex-col items-center gap-3">
        <Avatar className="h-10 w-10 border border-border">
          <AvatarFallback>TA</AvatarFallback>
        </Avatar>
      </div>
    </aside>
  );
}
