// Visual key states for winter oats, one row per checkpoint. Same channels
// as spring oats (src/crops/spring-oats/keyframes.js). Differences:
//   - vH runs to 11 by GS39 (11 main-stem leaves), as wheat's does.
//   - habit drops low over winter (prostrate) and recovers at GS30.
//   - The panicle is longer (22 cm) and stands a little higher above the
//     flag leaf ligule at GS59 (Opti-Oat: 65 cm to the ligule, 93 cm to the
//     top).
//   - roots: Opti-Oat's winter chart runs to about 2 m; about 1.6 m by
//     flowering here (illustrative).

export const ROWS = [
  { code: 5, vH: -1.6, habit: 0.8, coleo: 0, subcrown: 0, roots: 0.5,
    i1: 0, i2: 0, i3: 0, i4: 0, i5: 0, ped: 0, earPos: -1, flagS: 0,
    earL: 0.02, earW: 0.08, open: 0, flower: 0, fill: 0, ripe: 0, grain: 0 },
  { code: 7, vH: -1.0, coleo: 0.8, roots: 2.5 },
  { code: 9, vH: -0.15, coleo: 3.3, subcrown: 0.9, roots: 4 },
  { code: 10, vH: 0.4, coleo: 3.5, subcrown: 1.5, roots: 6 },
  { code: 11, vH: 1.0, habit: 0.75, subcrown: 1.8, roots: 12 },
  { code: 12, vH: 2.0, habit: 0.68, subcrown: 2.0, roots: 22 },
  { code: 13, vH: 3.0, habit: 0.55, roots: 32 },
  { code: 21, vH: 3.6, habit: 0.25, earL: 0.05, earW: 0.1, roots: 40 },
  { code: 22, vH: 4.5, habit: 0.1, roots: 50 },
  { code: 23, vH: 5.4, habit: 0.12, earL: 0.12, earW: 0.12, roots: 60 },
  { code: 30, vH: 7.5, habit: 0.7, i1: 0.55, i2: 0.2, i3: 0.05, earL: 0.3, earW: 0.15, roots: 85 },
  { code: 31, vH: 8.15, habit: 0.86, i1: 1.3, i2: 0.9, i3: 0.3, i4: 0.1, i5: 0.03, ped: 0.02, earL: 0.6, earW: 0.2, roots: 100 },
  { code: 32, vH: 9.05, habit: 0.95, i1: 2.3, i2: 2.15, i3: 0.8, i4: 0.25, i5: 0.06, ped: 0.05, earL: 1.4, earW: 0.25, roots: 110 },
  { code: 33, vH: 9.75, habit: 1, i1: 2.5, i2: 4.3, i3: 2.15, i4: 0.7, i5: 0.15, ped: 0.1, earL: 3, earW: 0.3, roots: 120 },
  { code: 37, vH: 10.2, i2: 5.2, i3: 5.5, i4: 3.2, i5: 0.6, ped: 0.3, earL: 7.5, earW: 0.24, roots: 132 },
  { code: 39, vH: 11.0, i2: 5.5, i3: 9, i4: 9.4, i5: 2.2, ped: 0.6, earL: 13, earW: 0.26, roots: 142 },
  { code: 41, vH: 11.4, i3: 9.3, i4: 11.5, i5: 4, earPos: -0.3, flagS: 0.35, earL: 16.5, earW: 0.3 },
  { code: 43, vH: 11.7, i3: 9.5, i4: 13, i5: 6.2, earPos: -0.24, flagS: 0.65, earL: 17, earW: 0.46 },
  { code: 45, vH: 12.0, i4: 13.7, i5: 8.3, earPos: -0.17, flagS: 0.9, earL: 19, earW: 0.62, roots: 150 },
  { code: 47, vH: 12.3, i4: 14, i5: 10, earPos: -0.08, flagS: 1, earL: 20.8, earW: 0.66, open: 0.6 },
  { code: 51, vH: 12.6, i5: 11, earPos: 0.08, open: 1, earL: 22, earW: 0.8 },
  { code: 55, vH: 12.9, i5: 11.8, earPos: 0.5, earW: 0.9 },
  { code: 59, vH: 13.2, i5: 12.5, earPos: 1.27, earW: 0.95 },
  { code: 61, vH: 13.5, i5: 13.8, earPos: 1.33, flower: 0.1, roots: 160 },
  { code: 65, vH: 13.9, i5: 15.3, earPos: 1.39, flower: 0.4, earW: 1 },
  { code: 69, vH: 14.3, i5: 16.6, earPos: 1.44, flower: 0.78 },
  { code: 71, vH: 14.7, i5: 17.5, earPos: 1.47, flower: 1.0, fill: 0.1, ripe: 0.04, grain: 1 },
  { code: 75, vH: 15.3, i5: 18.5, earPos: 1.5, flower: 1.2, fill: 0.6, ripe: 0.12, grain: 2 },
  { code: 77, vH: 15.8, flower: 1.3, fill: 0.8, ripe: 0.25, grain: 3 },
  { code: 85, vH: 16.4, fill: 0.95, ripe: 0.5, grain: 3.5 },
  { code: 87, vH: 16.9, fill: 1, ripe: 0.72, grain: 4 },
  { code: 91, vH: 17.5, ripe: 0.9, grain: 4.6 },
  { code: 92, vH: 17.9, fill: 0.97, ripe: 1, grain: 5 },
];
