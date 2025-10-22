export function useSound() {
  const play = (src: string, volume = 0.6) => {
    const audio = new Audio(src);
    audio.volume = volume;
    audio.play().catch(() => {});
  };
  return { play };
}
