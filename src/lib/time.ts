export function formatCountdown(target: Date): string {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return "00:00";

  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

export function startCountdown(
  duration: number,
  onTick: (remaining: number) => void,
  onComplete: () => void
) {
  let remaining = duration;
  const interval = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(interval);
      onComplete();
    } else {
      onTick(remaining);
    }
  }, 1000);
}
