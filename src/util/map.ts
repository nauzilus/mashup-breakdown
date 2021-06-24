// adapted from P5.map
// https://github.com/processing/p5.js/blob/1250864d63e6353233789f0059f62ebe0188a2a5/src/math/calculation.js#L450

export function map(
  n: number,
  start1: number,
  stop1: number,
  start2: number,
  stop2: number
): number {
  return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
}
