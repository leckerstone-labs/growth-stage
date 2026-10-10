// Visual key states for spring field beans, one row per checkpoint. Values
// carry forward from the row before and are interpolated with a monotone
// spline (src/model/keyframes.js), so nothing overshoots between rows.
//
// Channels (read by src/model/legume.js):
//   roots     taproot length from the seed, real cm (src/model/roots.js)
//   epi       shoot length from the seed until emergence, cm (the epicotyl;
//             the cotyledons stay in the seed below ground)
//   hook      shoot tip hooked over below ground: 1 hooked … 0 straight
//   vL        leaf clock: true leaves unfolded on the main stem (fractional);
//             each internode lengthens as the leaf above it grows
//   fl        flowering front, in flowering nodes: the raceme at flowering
//             node k (0 = lowest) opens its first flower when fl passes k.
//             Negative values are the bud stages (GS50–59).
//   podFull   pod positions (fraction of the main stem's pods, from the
//             bottom) at final length; negative: none yet
//   seed      seed state of a pod halfway up the main stem:
//             1 expanding, 2 green filling the pod, 3 full size with the
//             hilum turning black, 4 pod blackening, 5 black pod, seed hard
//   leafLoss  leaves dying (blackening) and falling, lowest first, 0 → 1
//   stemRipe  stem darkening from the base up, 0 green → 1 black
//
// Flowering (GS6x) and pod growth (GS7x) overlap in the field: the first pods
// reach final length while the top racemes still flower. As for oilseed rape
// the model keeps the stage order simple: pods reach final length after the
// last flowers close. checks.js verifies the BBCH stage rules.

export const ROWS = [
  { code: 5, roots: 0.5, epi: 0, hook: 1, vL: -2, fl: -6, podFull: -0.5, seed: 0, leafLoss: 0, stemRipe: 0 },
  { code: 7, roots: 3, epi: 1.6, vL: -1.8 },
  { code: 9, roots: 7, epi: 8.75, hook: 0.8, vL: -0.9 },
  { code: 10, roots: 10, epi: 9.0, hook: 0, vL: 0.2 },
  { code: 11, roots: 13, vL: 1 },
  { code: 12, roots: 17, vL: 2 },
  { code: 13, roots: 21, vL: 3 },
  { code: 14, roots: 26, vL: 4 },
  { code: 16, roots: 34, vL: 6 },
  { code: 50, roots: 42, vL: 7.1, fl: -2.6 },
  { code: 51, vL: 7.7, fl: -2.0 },
  { code: 55, roots: 48, vL: 8.4, fl: -1.3 },
  { code: 59, vL: 9.1, fl: -0.4 },
  { code: 60, roots: 54, vL: 9.7, fl: 0.15 },
  { code: 61, vL: 10.3, fl: 0.6 },
  { code: 63, vL: 12, fl: 2.5 },
  { code: 65, roots: 62, vL: 14, fl: 4.5 },
  { code: 67, vL: 17, fl: 11.5 },
  { code: 69, roots: 70, vL: 18, fl: 15.2, podFull: -0.1 },
  { code: 71, podFull: 0.15, seed: 0.6 },
  { code: 75, roots: 75, podFull: 0.52, seed: 1.2, leafLoss: 0.05 },
  { code: 79, roots: 78, podFull: 0.97, seed: 1.9, leafLoss: 0.15 },
  { code: 80, seed: 2.5, leafLoss: 0.25 },
  { code: 81, seed: 3.78, leafLoss: 0.35 },
  { code: 83, seed: 4.26, leafLoss: 0.5 },
  { code: 85, seed: 4.74, leafLoss: 0.65 },
  { code: 89, roots: 80, seed: 5.7, leafLoss: 0.85, stemRipe: 0.05 },
  { code: 95, seed: 5.85, leafLoss: 0.97, stemRipe: 0.55 },
  { code: 97, seed: 6, leafLoss: 1, stemRipe: 1 },
];
