import { PixelButton } from "@/components/buttons/PixelButton";

export function LeaderboardControls({
  activeTab,
  setActiveTab,
}: {
  activeTab: "current" | "allTime";
  setActiveTab: (tab: "current" | "allTime") => void;
}) {
  return (
    <div className="px-4 py-4">
      <div className="grid grid-cols-2 gap-2">
        <PixelButton onClick={() => setActiveTab("current")}>
          Current game
        </PixelButton>
        <PixelButton onClick={() => setActiveTab("allTime")}>
          All time
        </PixelButton>
      </div>
      <p className="mt-4 text-center text-xs text-text-secondary">
        The greatest of all time
      </p>
    </div>
  );
}
