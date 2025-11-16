import { SoundOffIcon, SoundOnIcon } from "@/components/icons";
import { useSound } from "@/components/providers/SoundContext";

/**
 * A simple button to toggle the sound on and off.
 * It uses the hook to get the current state and the toggle function.
 */
export function SoundToggle() {
  const { isSoundEnabled, toggleSound, playSound } = useSound();

  const handleClick = () => {
    playSound("click");
    toggleSound();
  };

  return (
    <button
      onClick={handleClick}
      aria-label={isSoundEnabled ? "Mute sound" : "Unmute sound"}
      type="button"
      className="
          mr-auto ml-3 flex items-center justify-center
          w-[34px] h-[34px]
          gap-2
          rounded-full
          p-2
          bg-white/10
          backdrop-blur-sm
          transition-transform
          active:scale-95
        "
      style={{
        borderImage:
          "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 100%) 1",
      }}
    >
      {isSoundEnabled ? (
        <SoundOnIcon className="w-4 h-4 text-white" />
      ) : (
        <SoundOffIcon className="w-4 h-4 text-white" />
      )}
    </button>
  );
}
