import Logo from "@/components/logo/Logo";
import { LeaveGameIcon } from "@/components/icons";
import React from "react";

const GameInfoBar = () => {
  return (
    <div className="fixed top-0 left-0 right-0 bg-figma z-30 w-full box-border flex flex-row items-center  px-4 border-b border-white/5 h-14 sm:h-16">
      <div className="flex w-full items-center justify-between">
        {/* Left Section: Logo and Live Indicator */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Logo />
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-danger" />
            <span className="font-edit-undo text-base sm:text-lg leading-[92%] tracking-tight text-danger">
              LIVE
            </span>
          </div>
        </div>

        {/* Right Section: Leave Game Button */}
        <div className="flex items-center justify-end">
          <button className="flex h-7 sm:h-8 items-center justify-center rounded-full bg-white/10 px-3 sm:px-4 py-1.5 transition hover:bg-white/20">
            <LeaveGameIcon />
            <span className="font-edit-undo text-sm sm:text-base leading-none text-white">
              Leave game
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameInfoBar;
