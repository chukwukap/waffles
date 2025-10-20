import { WaffleIcon, ZapIcon } from "@/components/icons";
import { Game } from "@/stores/profileStore";

export const GameHistoryItem = ({ game }: { game: Game }) => (
  <div className="flex items-center justify-between p-3 bg-card-bg border border-card-border rounded-2xl">
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
        <WaffleIcon />
      </div>
      <div>
        <p className="font-edit-undo text-xl leading-none">{game.name}</p>
        <div className="flex items-center gap-1 mt-1">
          <ZapIcon />
          <span className="font-brockmann text-xs font-medium">
            {game.score}
          </span>
        </div>
      </div>
    </div>
    <p
      className={`font-brockmann font-medium text-base ${
        game.winningsColor === "green"
          ? "text-waffle-green"
          : "text-waffle-gray"
      }`}
    >
      ${game.winnings.toFixed(2)}
    </p>
  </div>
);
