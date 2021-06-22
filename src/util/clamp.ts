export function clamp(min: number, max: number, val: number): number {
  return val < min ? min : val > max ? max : val;
}
