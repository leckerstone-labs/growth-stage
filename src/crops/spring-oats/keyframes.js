// Visual key states for spring oats, one row per checkpoint.
//
// Same channels as winter wheat (documented in
// src/crops/winter-wheat/keyframes.js), with five elongating internodes
// below the peduncle (i1..i5) instead of four. Differences worth knowing
// when editing:
//   - vH runs to 9 by GS39 (9 main-stem leaves), so leaf 4 (from the top)
//     emerges at GS30 at vH ≈ 5.5.
//   - habit stays high: spring oats are fairly erect from the start.
//   - earL/earW describe the panicle: earL its length (19 cm when full
//     grown), earW how full the folded panicle is in the boot.
//   - earPos: (panicle tip − flag ligule) / panicle length, as for ears. It
//     keeps rising after GS59 because the peduncle carries on growing until
//     final height at GS75 (Opti-Oat).
//   - flower runs top-down through the panicle (render/panicle-mesh.js).
//   - roots: rooting depth from the seed, cm; Opti-Oat's spring chart runs
//     to about 1 m (illustrative).
// checks.js verifies the stage rules at each checkpoint.

export const ROWS = [
  { code: 5, vH: -1.6, habit: 0.85, coleo: 0, subcrown: 0, roots: 0.5,
    i1: 0, i2: 0, i3: 0, i4: 0, i5: 0, ped: 0, earPos: -1, flagS: 0,
    earL: 0.02, earW: 0.08, open: 0, flower: 0, fill: 0, ripe: 0, grain: 0 },
  { code: 7, vH: -1.0, coleo: 0.8, roots: 2.5 },
  { code: 9, vH: -0.15, coleo: 3.3, subcrown: 0.9, roots: 4 },
  { code: 10, vH: 0.4, coleo: 3.5, subcrown: 1.5, roots: 6 },
  { code: 11, vH: 1.0, habit: 0.85, subcrown: 1.8, roots: 11 },
  { code: 12, vH: 2.0, habit: 0.8, subcrown: 2.0, roots: 19 },
  { code: 13, vH: 3.0, habit: 0.75, roots: 27 },
  { code: 21, vH: 3.6, habit: 0.62, earL: 0.05, earW: 0.1, roots: 33 },
  { code: 22, vH: 4.5, habit: 0.6, earL: 0.12, earW: 0.12, roots: 40 },
  { code: 30, vH: 5.5, habit: 0.8, i1: 0.55, i2: 0.2, i3: 0.05, earL: 0.3, earW: 0.15, roots: 48 },
  { code: 31, vH: 6.15, habit: 0.92, i1: 1.3, i2: 0.9, i3: 0.3, i4: 0.1, i5: 0.03, ped: 0.02, earL: 0.6, earW: 0.2, roots: 56 },
  { code: 32, vH: 7.05, habit: 0.97, i1: 2.6, i2: 2.15, i3: 0.8, i4: 0.25, i5: 0.06, ped: 0.05, earL: 1.4, earW: 0.25, roots: 63 },
  { code: 33, vH: 7.75, habit: 1, i1: 3, i2: 4.3, i3: 2.15, i4: 0.7, i5: 0.15, ped: 0.1, earL: 3, earW: 0.3, roots: 70 },
  { code: 37, vH: 8.2, i2: 5.6, i3: 5.5, i4: 3, i5: 0.6, ped: 0.3, earL: 7, earW: 0.24, roots: 78 },
  { code: 39, vH: 9.0, i2: 6, i3: 8.6, i4: 7.6, i5: 2.2, ped: 0.6, earL: 11.5, earW: 0.26, roots: 84 },
  { code: 41, vH: 9.4, i3: 9.4, i4: 10.5, i5: 4.5, earPos: -0.3, flagS: 0.35, earL: 14.5, earW: 0.3 },
  { code: 43, vH: 9.7, i3: 9.8, i4: 12.5, i5: 7, earPos: -0.24, flagS: 0.65, earL: 17, earW: 0.46 },
  { code: 45, vH: 10.0, i3: 10, i4: 13.5, i5: 9.5, earPos: -0.17, flagS: 0.9, earL: 18.3, earW: 0.62, roots: 90 },
  { code: 47, vH: 10.3, i4: 14, i5: 11.5, earPos: -0.08, flagS: 1, earL: 19, earW: 0.66, open: 0.6 },
  { code: 51, vH: 10.6, i5: 13, earPos: 0.08, open: 1, earW: 0.8 },
  { code: 55, vH: 10.9, i5: 14.2, earPos: 0.5, earW: 0.9 },
  { code: 59, vH: 11.2, i5: 15, earPos: 1.1, earW: 0.95 },
  { code: 61, vH: 11.5, i5: 15.8, earPos: 1.3, flower: 0.1, roots: 98 },
  { code: 65, vH: 11.9, i5: 16.6, earPos: 1.48, flower: 0.4, earW: 1 },
  { code: 69, vH: 12.3, i5: 17.2, earPos: 1.62, flower: 0.78 },
  { code: 71, vH: 12.7, i5: 17.6, earPos: 1.72, flower: 1.0, fill: 0.1, ripe: 0.04, grain: 1, roots: 100 },
  { code: 75, vH: 13.3, i5: 18, earPos: 1.84, flower: 1.2, fill: 0.6, ripe: 0.12, grain: 2 },
  { code: 77, vH: 13.8, flower: 1.3, fill: 0.8, ripe: 0.25, grain: 3 },
  { code: 85, vH: 14.4, fill: 0.95, ripe: 0.5, grain: 3.5 },
  { code: 87, vH: 14.9, fill: 1, ripe: 0.72, grain: 4 },
  { code: 91, vH: 15.5, ripe: 0.9, grain: 4.6 },
  { code: 92, vH: 15.9, fill: 0.97, ripe: 1, grain: 5 },
];
