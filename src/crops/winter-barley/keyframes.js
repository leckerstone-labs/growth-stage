// Visual key states for winter barley (two-row), one row per checkpoint.
//
// Same channels as winter wheat (documented in
// src/crops/winter-wheat/keyframes.js), plus:
//   awnL    awn length above the ear tip, cm. Awns grow inside the boot and
//           show above the flag leaf ligule at GS49, before the ear.
//
// Differences from wheat worth knowing when editing:
//   - vH runs to 14 by GS39 (14 main-stem leaves), so the leaf/stage links
//     (leaf 4 emerging at GS30, flag tip at GS37…) shift by 3 leaves.
//   - While booting the ear sits low in the long flag leaf sheath with the
//     awns above it; earPos is negative enough that the awns stay hidden
//     until GS49. The peduncle then extends quickly to GS59.
//   - flower runs during booting/heading: barley flowers inside the florets.
// checks.js verifies the stage rules at each checkpoint.

export const ROWS = [
  { code: 5, vH: -1.6, habit: 0.8, coleo: 0, subcrown: 0, roots: 0.5, crownRoots: 0,
    i1: 0, i2: 0, i3: 0, i4: 0, ped: 0, earPos: -1, flagS: 0, awnL: 0,
    earL: 0.02, earW: 0.08, open: 0, flower: 0, fill: 0, ripe: 0, grain: 0 },
  { code: 7, vH: -1.0, coleo: 0.8, roots: 2.5 },
  { code: 9, vH: -0.15, coleo: 3.3, subcrown: 0.9, roots: 4 },
  { code: 10, vH: 0.4, coleo: 3.5, subcrown: 1.5, roots: 5.5 },
  { code: 11, vH: 1.0, habit: 0.75, subcrown: 1.8, roots: 6.5 },
  { code: 12, vH: 2.0, habit: 0.68, subcrown: 2.0, roots: 8 },
  { code: 13, vH: 3.0, habit: 0.55, roots: 9, crownRoots: 0.6 },
  { code: 21, vH: 3.6, habit: 0.25, roots: 10, crownRoots: 2, earL: 0.05, earW: 0.1 },
  { code: 22, vH: 4.5, habit: 0.08 },
  { code: 23, vH: 5.6, habit: 0.08 },
  { code: 24, vH: 7.2, habit: 0.3, earL: 0.15, earW: 0.12, crownRoots: 5 },
  { code: 30, vH: 10.5, habit: 0.7, i1: 0.55, i2: 0.2, i3: 0.05, earL: 0.3, earW: 0.15, crownRoots: 8, roots: 12 },
  { code: 31, vH: 11.15, habit: 0.86, i1: 1.3, i2: 0.9, i3: 0.3, i4: 0.1, ped: 0.02, earL: 0.45, earW: 0.2 },
  { code: 32, vH: 12.05, habit: 0.95, i1: 3.2, i2: 2.15, i3: 0.8, i4: 0.25, ped: 0.05, earL: 0.9, earW: 0.26 },
  { code: 33, vH: 12.75, habit: 1, i1: 4.2, i2: 4.5, i3: 2.15, i4: 0.7, ped: 0.1, earL: 1.7, earW: 0.32 },
  { code: 37, vH: 13.2, i1: 4.8, i2: 7, i3: 5.5, i4: 1.8, ped: 0.3, earL: 3.2, earW: 0.24, awnL: 0.3 },
  { code: 39, vH: 14.0, i1: 5, i2: 8.5, i3: 10, i4: 5.5, ped: 0.6, earL: 4.8, earW: 0.26, awnL: 1 },
  { code: 41, vH: 14.4, i2: 9, i3: 12, i4: 9, earPos: -1.0, flagS: 0.35, earL: 5.6, earW: 0.3, awnL: 2.5 },
  { code: 43, vH: 14.7, i3: 13, i4: 12.5, earPos: -1.28, flagS: 0.65, earL: 6.3, earW: 0.4, awnL: 5 },
  { code: 45, vH: 15.0, i3: 13.8, i4: 15.5, earPos: -1.72, flagS: 0.9, earL: 6.8, earW: 0.62, awnL: 7.5, flower: 0.05 },
  { code: 47, vH: 15.3, i3: 14, i4: 17, earPos: -1.6, flagS: 1, earL: 7, earW: 0.7, awnL: 9.5, open: 0.6, flower: 0.15 },
  { code: 49, vH: 15.5, i4: 17.8, earPos: -1.42, awnL: 11, open: 0.8, flower: 0.3 },
  { code: 51, vH: 15.7, i4: 18.4, earPos: 0.08, awnL: 12, open: 1, earW: 0.85, flower: 0.45 },
  { code: 55, vH: 16.0, i4: 19, earPos: 0.5, earW: 0.92, flower: 0.6 },
  { code: 59, vH: 16.3, earPos: 1.03, earW: 0.96, flower: 0.7 },
  { code: 61, vH: 16.6, earPos: 1.6, flower: 0.75 },
  { code: 65, vH: 17.0, earPos: 2.2, earW: 1, flower: 0.88 },
  { code: 69, vH: 17.4, earPos: 2.6, flower: 1.0 },
  { code: 71, vH: 17.8, earPos: 2.8, flower: 1.05, fill: 0.1, ripe: 0.04, grain: 1 },
  { code: 75, vH: 18.4, earPos: 2.9, fill: 0.6, ripe: 0.12, grain: 2 },
  { code: 77, vH: 18.9, fill: 0.8, ripe: 0.25, grain: 3 },
  { code: 85, vH: 19.5, fill: 0.95, ripe: 0.5, grain: 3.5 },
  { code: 87, vH: 20.0, fill: 1, ripe: 0.72, grain: 4 },
  { code: 89, vH: 20.6, ripe: 0.9, grain: 4.6 },
  { code: 92, vH: 21.0, fill: 0.97, ripe: 1, grain: 5 },
];
