export function useVibration() {
  const vibrate = (pattern: number | number[] = 80) => {
    if (typeof window !== "undefined" && "vibrate" in navigator)
      navigator.vibrate(pattern);
  };
  return { vibrate };
}
