// Visual key states for spring wheat, one row per checkpoint.
//
// Same channels as winter wheat (documented in
// src/crops/winter-wheat/keyframes.js). Differences:
//   - vH runs to 8 by GS39 (8 main-stem leaves), so leaf 4 (from the top) is
//     leaf 5: emerging at GS30, fully out by GS31. Tillering (GS21–GS24) fits
//     between leaf 3 and leaf 5, with the tillers' `appear` values in
//     params.js (the same leaf timings as spring barley).
//   - habit stays high: upright from the start, no prostrate winter phase.
//   - Shorter internodes (about 10 cm less final height) and a smaller ear.
//   - roots: shallower than winter wheat (about 1.1 m by flowering;
//     illustrative, see ROOTS in params.js).
// After GS39 the rows follow winter wheat's, with vH 3 lower.
// checks.js verifies the stage rules at each checkpoint.

export const ROWS = [
  { code: 5, vH: -1.6, habit: 0.85, coleo: 0, subcrown: 0, roots: 0.5,
    i1: 0, i2: 0, i3: 0, i4: 0, ped: 0, earPos: -1, flagS: 0,
    earL: 0.02, earW: 0.08, open: 0, flower: 0, fill: 0, ripe: 0, grain: 0 },
  { code: 7, vH: -1.0, coleo: 0.8, roots: 2.5 },
  { code: 9, vH: -0.15, coleo: 3.3, subcrown: 0.9, roots: 4 },
  { code: 10, vH: 0.4, coleo: 3.5, subcrown: 1.5, roots: 7 },
  { code: 11, vH: 1.0, habit: 0.82, subcrown: 1.8, roots: 12 },
  { code: 12, vH: 2.0, habit: 0.78, subcrown: 2.0, roots: 18 },
  { code: 13, vH: 3.0, habit: 0.72, roots: 25 },
  { code: 21, vH: 3.25, habit: 0.66, earL: 0.05, earW: 0.1, roots: 30 },
  { code: 22, vH: 3.6, habit: 0.62, roots: 36 },
  { code: 23, vH: 3.95, habit: 0.62, roots: 41 },
  { code: 24, vH: 4.3, habit: 0.7, earL: 0.15, earW: 0.12, roots: 46 },
  { code: 30, vH: 4.6, habit: 0.82, i1: 0.55, i2: 0.2, i3: 0.05, earL: 0.3, earW: 0.15, roots: 52 },
  { code: 31, vH: 5.1, habit: 0.92, i1: 1.3, i2: 0.9, i3: 0.3, i4: 0.1, ped: 0.02, earL: 0.5, earW: 0.2, roots: 62 },
  { code: 32, vH: 6.05, habit: 0.97, i1: 3.0, i2: 2.15, i3: 0.8, i4: 0.25, ped: 0.05, earL: 1.0, earW: 0.26, roots: 70 },
  { code: 33, vH: 6.6, habit: 1, i1: 3.4, i2: 4.0, i3: 2.15, i4: 0.7, ped: 0.1, earL: 1.8, earW: 0.32, roots: 76 },
  { code: 37, vH: 7.2, i1: 3.5, i2: 6, i3: 4.6, i4: 1.5, ped: 0.3, earL: 3.6, earW: 0.22, roots: 84 },
  { code: 39, vH: 8.0, i2: 6.8, i3: 8.2, i4: 4.6, ped: 0.7, earL: 5.4, earW: 0.24, roots: 92 },
  { code: 41, vH: 8.4, i2: 7, i3: 9.5, i4: 7.2, earPos: -0.22, flagS: 0.35, earL: 6.2, earW: 0.25 },
  { code: 43, vH: 8.7, i3: 10.3, i4: 9.8, earPos: -0.2, flagS: 0.65, earL: 7.1, earW: 0.36 },
  { code: 45, vH: 9.0, i3: 10.5, i4: 12.5, earPos: -0.16, flagS: 0.9, earL: 7.7, earW: 0.56, roots: 100 },
  { code: 47, vH: 9.3, i4: 13.8, earPos: -0.1, flagS: 1, earL: 8, earW: 0.62, open: 0.6 },
  { code: 49, vH: 9.5, i4: 14.3, earPos: -0.03, open: 0.8 },
  { code: 51, vH: 9.7, i4: 14.7, earPos: 0.08, open: 1, earW: 0.85 },
  { code: 55, vH: 10.0, i4: 15, earPos: 0.5, earW: 0.92 },
  { code: 59, vH: 10.3, earPos: 1.03, earW: 0.96 },
  { code: 61, vH: 10.6, earPos: 1.4, flower: 0.1, roots: 108 },
  { code: 65, vH: 11.0, earPos: 1.8, flower: 0.36, earW: 1 },
  { code: 69, vH: 11.4, earPos: 2.05, flower: 0.75 },
  { code: 71, vH: 11.8, earPos: 2.15, flower: 1.0, fill: 0.1, ripe: 0.04, grain: 1 },
  { code: 75, vH: 12.4, earPos: 2.2, flower: 1.2, fill: 0.6, ripe: 0.12, grain: 2, earW: 1 },
  { code: 77, vH: 12.9, flower: 1.3, fill: 0.8, ripe: 0.25, grain: 3 },
  { code: 85, vH: 13.5, fill: 0.95, ripe: 0.5, grain: 3.5 },
  { code: 87, vH: 14.0, fill: 1, ripe: 0.72, grain: 4 },
  { code: 89, vH: 14.6, ripe: 0.9, grain: 4.6 },
  { code: 92, vH: 15.0, fill: 0.97, ripe: 1, grain: 5 },
];
