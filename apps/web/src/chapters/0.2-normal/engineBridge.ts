export { choose } from "../../engine/discrete";
export function factorialSafe(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}
