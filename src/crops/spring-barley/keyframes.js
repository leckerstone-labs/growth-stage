// Visual key states for spring barley (two-row), one row per checkpoint.
//
// Same channels as winter barley (src/crops/winter-barley/keyframes.js;
// documented in src/crops/winter-wheat/keyframes.js). Differences:
//   - vH runs to 8 by GS39 (8 main-stem leaves), so leaf 4 (from the top) is
//     leaf 5: emerging at GS30, fully out by GS31. Tillering (GS21–GS24) fits
//     between leaf 3 and leaf 5, with the tillers' `appear` values in
//     params.js.
//   - habit stays high: upright from the start, no prostrate winter phase.
//   - Shorter internodes, and more of the final height reached by GS39
//     (AHDB: 57%).
//   - roots: shallower than winter barley (about 1 m by flowering;
//     illustrative, see ROOTS in params.js).
// After GS39 the rows follow winter barley's, with vH 6 lower.
// checks.js verifies the stage rules at each checkpoint.

export const ROWS = [
  { code: 5, vH: -1.6, habit: 0.85, coleo: 0, subcrown: 0, roots: 0.5,
    i1: 0, i2: 0, i3: 0, i4: 0, ped: 0, earPos: -1, flagS: 0, awnL: 0,
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
  { code: 33, vH: 6.6, habit: 1, i1: 3.8, i2: 4.2, i3: 2.15, i4: 0.7, ped: 0.1, earL: 1.8, earW: 0.32, roots: 76 },
  { code: 37, vH: 7.2, i1: 4, i2: 6.3, i3: 6, i4: 2.5, ped: 0.3, earL: 3.2, earW: 0.24, awnL: 0.3, roots: 84 },
  { code: 39, vH: 8.0, i2: 7, i3: 10, i4: 6, ped: 0.6, earL: 4.5, earW: 0.26, awnL: 1, roots: 90 },
  { code: 41, vH: 8.4, i3: 10.8, i4: 9, earPos: -1.0, flagS: 0.35, earL: 5.2, earW: 0.3, awnL: 2.5 },
  { code: 43, vH: 8.7, i3: 11, i4: 11.5, earPos: -1.28, flagS: 0.65, earL: 5.7, earW: 0.4, awnL: 4.5 },
  { code: 45, vH: 9.0, i4: 13.5, earPos: -1.72, flagS: 0.9, earL: 6.0, earW: 0.62, awnL: 7, flower: 0.05, roots: 97 },
  { code: 47, vH: 9.3, i4: 14.4, earPos: -1.6, flagS: 1, earL: 6.2, earW: 0.7, awnL: 8.5, open: 0.6, flower: 0.15 },
  { code: 49, vH: 9.5, i4: 14.7, earPos: -1.42, awnL: 10, open: 0.8, flower: 0.3 },
  { code: 51, vH: 9.7, i4: 15, earPos: 0.08, awnL: 11, open: 1, earW: 0.85, flower: 0.45 },
  { code: 55, vH: 10.0, earPos: 0.5, earW: 0.92, flower: 0.6 },
  { code: 59, vH: 10.3, earPos: 1.03, earW: 0.96, flower: 0.7 },
  { code: 61, vH: 10.6, earPos: 1.5, flower: 0.75, roots: 100 },
  { code: 65, vH: 11.0, earPos: 1.95, earW: 1, flower: 0.88 },
  { code: 69, vH: 11.4, earPos: 2.2, flower: 1.0 },
  { code: 71, vH: 11.8, earPos: 2.35, flower: 1.05, fill: 0.1, ripe: 0.04, grain: 1 },
  { code: 75, vH: 12.4, earPos: 2.4, fill: 0.6, ripe: 0.12, grain: 2 },
  { code: 77, vH: 12.9, fill: 0.8, ripe: 0.25, grain: 3 },
  { code: 85, vH: 13.5, fill: 0.95, ripe: 0.5, grain: 3.5 },
  { code: 87, vH: 14.0, fill: 1, ripe: 0.72, grain: 4 },
  { code: 89, vH: 14.6, ripe: 0.9, grain: 4.6 },
  { code: 92, vH: 15.0, fill: 0.97, ripe: 1, grain: 5 },
];
