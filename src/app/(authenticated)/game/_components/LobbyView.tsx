"use client";

import { Clock } from "@/components/icons";
import { AvatarDiamond } from "./AvatarDiamond";
import ChatDrawer from "./ChatDrawer";

import ChatTickerOverlay from "./ChatTickerOverlay";
import GradientMask from "./GradientMask";

export default function GameLobby() {
  const players = 125;
  return (
    <div className="relative mx-auto min-h-screen w-full text-foreground flex flex-col ">
      {/* Main scrollable section */}
      <section
        className="
          flex-1 flex flex-col items-center gap-3 p-0
          overflow-y-auto
          w-full
          pt-20 pb-4

        "
      >
        {/* Content (top bar) */}
        <div className="flex w-full  h-10 items-center justify-center gap-1.5 px-2">
          {/* Title */}
          <div className="flex h-7 w-full flex-col justify-center">
            <div className="flex h-7 w-full items-center gap-2">
              <Clock />
              <div className="truncate">GAME STARTS IN</div>
            </div>
          </div>

          {/* Timer pill */}
          <div
            className="
              flex flex-row items-center justify-center
              px-5 py-2 gap-1
              min-w-[72px] max-w-[120px] w-fit
              h-10 sm:h-9
              border-2 border-[#FB72FF] rounded-full
              flex-none order-1
              box-border
            "
          >
            <span
              className="
                flex items-end justify-center text-center
                min-w-[48px] w-auto
                h-[1.1em] not-italic font-normal
                text-[clamp(5px,2vw,16px)] leading-[115%]
                text-[#FB72FF]
                flex-none order-0 select-none
              "
            >
              24M 03s
            </span>
          </div>
        </div>

        {/* Prize copy */}
        <div className="flex w-full min-h-[6rem] flex-col items-center justify-end gap-1 pb-2.5">
          <p
            className="
              text-center
              font-medium font-display
              text-[0.95rem] sm:text-base md:text-lg
              leading-[1.3] tracking-tight
              text-muted
              w-auto
              min-w-[60px] sm:min-w-[80px]
              select-none
            "
          >
            Current prize pool
          </p>
          <div className="flex min-h-[2.5rem] sm:min-h-[2.7rem] w-full items-center justify-center px-2 sm:px-4">
            <span
              className="
                block text-center
                font-body
                font-normal
                text-[clamp(2rem,6vw,3rem)]
                leading-[0.92]
                tracking-tight
                text-success
                min-w-[70px] sm:min-w-[90px]
                select-none
              "
            >
              $2,500
            </span>
          </div>
        </div>

        {/* Avatar diamond */}
        <div className="w-full flex justify-center">
          <AvatarDiamond
            avatars={[
              { id: "1", src: "/images/avatars/a.png", alt: "Avatar 1" },
              { id: "2", src: "/images/avatars/b.png", alt: "Avatar 2" },
              { id: "3", src: "/images/avatars/c.png", alt: "Avatar 3" },
              {
                id: "4",
                src: "/images/avatars/d.png",
                alt: "Avatar 4",
                opacity: 0.2,
              },
              { id: "5", src: "/images/avatars/a.png", alt: "Avatar 5" },
              { id: "6", src: "/images/avatars/a.png", alt: "Avatar 6" },
              { id: "7", src: "/images/avatars/a.png", alt: "Avatar 7" },
              { id: "8", src: "/images/avatars/a.png", alt: "Avatar 8" },
              {
                id: "9",
                src: "/images/avatars/a.png",
                alt: "Avatar 9",
                opacity: 0.2,
              },
              { id: "10", src: "/images/avatars/a.png", alt: "Avatar 10" },
              { id: "11", src: "/images/avatars/a.png", alt: "Avatar 11" },
              { id: "12", src: "/images/avatars/a.png", alt: "Avatar 12" },
              { id: "13", src: "/images/avatars/a.png", alt: "Avatar 13" },
              { id: "14", src: "/images/avatars/a.png", alt: "Avatar 14" },
              { id: "15", src: "/images/avatars/a.png", alt: "Avatar 15" },
              { id: "16", src: "/images/avatars/a.png", alt: "Avatar 16" },
              {
                id: "17",
                src: "/images/avatars/a.png",
                alt: "Avatar 17",
                opacity: 0.2,
              },
            ]}
            cellMin={32}
            cellMax={54}
            gap={2}
            className="sm:scale-100 scale-95"
          />
        </div>

        {/* joined count */}
        <p className="text-center mt-1 min-w-[120px] font-display font-medium text-[clamp(13px,4vw,16px)] leading-[130%] tracking-[-0.03em] text-muted">
          {players} players have joined
        </p>
      </section>

      {/* bottom shadow mask (the gradient group) */}
      <div className="pointer-events-none absolute left-0 right-0 bottom-[78px] h-28 w-full mx-auto">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 6%, #FFFFFF 100%)",
            opacity: 0,
          }}
        />
        {/* If you want to place an image under the gradient, keep this DIV and set a bg image */}
        <div className="absolute inset-0 opacity-0" />
      </div>

      {/* Cards row at the very bottom */}
      <GradientMask className="bottom-28 sm:bottom-32" height={136} />
      <ChatTickerOverlay
        className="bottom-[7.5rem] sm:bottom-36"
        maxItems={4}
      />
      <ChatDrawer />
    </div>
  );
}
