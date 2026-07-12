import { createFileRoute } from "@tanstack/react-router";
import { IconRail } from "@/components/trip-architect/IconRail";
import { TripListPanel } from "@/components/trip-architect/TripListPanel";
import { CenterChat } from "@/components/trip-architect/CenterChat";
import { RightPanel } from "@/components/trip-architect/RightPanel";

export const Route = createFileRoute("/app")({
  component: TripArchitectPage,
});

function TripArchitectPage() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface font-sans text-foreground">
      <IconRail />
      <TripListPanel />
      <CenterChat />
      <RightPanel />
    </div>
  );
}
