// Visual key states for winter field beans, one row per checkpoint. The
// channels are the same as spring beans' (documented in
// src/crops/spring-beans/keyframes.js); the rows differ:
//   - deeper sowing, so the shoot has further to grow before it emerges;
//   - the plant overwinters at about three leaves (GS13), then grows two
//     basal side shoots in early spring (GS21, GS22; params BRANCHES);
//   - first flowers on a lower node (leaf 6), deeper roots.
// The side shoots run these rows with a lag (BRANCHES[].lag) and their own
// leaf clock, so they flower and ripen just after the main stem.

export const ROWS = [
  { code: 5, roots: 0.5, epi: 0, hook: 1, vL: -2, fl: -6, podFull: -0.5, seed: 0, leafLoss: 0, stemRipe: 0 },
  { code: 7, roots: 3, epi: 1.8, vL: -1.8 },
  { code: 9, roots: 8, epi: 10.75, hook: 0.8, vL: -0.9 },
  { code: 10, roots: 11, epi: 11.0, hook: 0, vL: 0.2 },
  { code: 11, roots: 15, vL: 1 },
  { code: 12, roots: 19, vL: 2 },
  { code: 13, roots: 25, vL: 3 },
  { code: 21, roots: 36, vL: 4.2 },
  { code: 22, roots: 43, vL: 5.0 },
  { code: 50, roots: 50, vL: 6.0, fl: -2.6 },
  { code: 51, vL: 6.6, fl: -2.0 },
  { code: 55, roots: 56, vL: 7.3, fl: -1.3 },
  { code: 59, vL: 8.0, fl: -0.4 },
  { code: 60, roots: 64, vL: 8.6, fl: 0.15 },
  { code: 61, vL: 9.2, fl: 0.6 },
  { code: 63, vL: 11, fl: 2.5 },
  { code: 65, roots: 74, vL: 13, fl: 4.5 },
  { code: 67, vL: 16, fl: 11.5 },
  { code: 69, roots: 85, vL: 17, fl: 15.2, podFull: -0.1 },
  { code: 71, podFull: 0.15, seed: 0.6 },
  { code: 75, roots: 92, podFull: 0.52, seed: 1.2, leafLoss: 0.05 },
  { code: 79, roots: 96, podFull: 0.97, seed: 1.9, leafLoss: 0.15 },
  { code: 80, seed: 2.5, leafLoss: 0.25 },
  { code: 81, seed: 3.78, leafLoss: 0.35 },
  { code: 83, seed: 4.26, leafLoss: 0.5 },
  { code: 85, seed: 4.74, leafLoss: 0.65 },
  { code: 89, roots: 100, seed: 5.7, leafLoss: 0.85, stemRipe: 0.05 },
  { code: 95, seed: 5.85, leafLoss: 0.97, stemRipe: 0.55 },
  { code: 97, seed: 6, leafLoss: 1, stemRipe: 1 },
];
