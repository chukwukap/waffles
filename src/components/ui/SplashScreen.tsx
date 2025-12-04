import { WaffleLoader } from "./WaffleLoader";

export function SplashScreen() {
  return (
    <div className="inset-0 z-80 flex items-center justify-center text-white h-dvh fixed bg-[#191919]">
      <WaffleLoader text="WAFFLES" size={160} />
    </div>
  );
}

