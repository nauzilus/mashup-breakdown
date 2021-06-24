export function secondsToTime(seconds: number, long: boolean = false): string {
  const floored = Math.floor(seconds);
  const s = floored % 60;
  const m = Math.floor(floored / 60) % 60;
  const h = Math.floor(floored / 3600);

  return (long || h > 0 ? [h] : [])
    .concat(m, s)
    .map((x) => `0${x}`.substr(-2))
    .join(":");
}
