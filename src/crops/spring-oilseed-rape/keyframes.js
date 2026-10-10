// Visual key states for spring oilseed rape, one row per checkpoint. The
// channels are winter oilseed rape's (documented in
// src/crops/winter-oilseed-rape/keyframes.js). Values carry forward and are
// interpolated with a monotone spline.
//
// What differs from winter oilseed rape: no GS19 checkpoint and no winter
// rosette. The plant has about seven leaves when the buds form and the stem
// starts to extend (Bayer: by the six-leaf stage), and keeps unfolding stem
// leaves while the buds rise (13 in all). The rosette stays more upright
// (`habit`), the root collar thinner (`collar`) and the roots shallower
// (`roots`, illustrative). From flowering on the rows are winter's.

export const ROWS = [
  { code: 5, roots: 0.4, hypo: 0, hook: 1, coty: 0, vL: -1.6, habit: 0, collar: 0.03, ext: 0, bud: 0, enclose: 1,
    spread: 0, rach: 0, yb: 0, opened: 0, fallen: 0, podFull: -0.4, seed: 0, leafLoss: 0, stemRipe: 0 },
  { code: 7, roots: 1.8, hypo: 0.7 },
  { code: 9, roots: 3.5, hypo: 1.82, hook: 0.85, vL: -0.9 },
  { code: 10, roots: 5, hypo: 2.4, hook: 0, coty: 1, vL: 0 },
  { code: 11, roots: 7, vL: 1, collar: 0.045 },
  { code: 12, roots: 9, vL: 2, collar: 0.06, habit: 0.04 },
  { code: 13, roots: 12, vL: 3, collar: 0.075, habit: 0.08 },
  { code: 14, roots: 15, vL: 4, collar: 0.095, habit: 0.14 },
  { code: 16, roots: 22, vL: 6, collar: 0.13, habit: 0.24 },
  { code: 30, roots: 30, vL: 7.1, collar: 0.17, habit: 0.32, hypo: 2.1, bud: 0.12 },
  { code: 50, roots: 40, vL: 7.8, collar: 0.2, habit: 0.32, ext: 0.05, bud: 0.32 },
  { code: 51, vL: 8.5, habit: 0.3, ext: 0.15, bud: 0.48, enclose: 0.35, spread: 0.05, rach: 0.4 },
  { code: 53, roots: 52, vL: 9.6, ext: 0.31, bud: 0.62, enclose: 0, spread: 0.2, rach: 1.5 },
  { code: 55, vL: 10.6, ext: 0.42, bud: 0.76, spread: 0.6, rach: 1.8 },
  { code: 57, vL: 11.6, ext: 0.56, bud: 0.88, spread: 0.85, rach: 2.8 },
  { code: 59, roots: 70, vL: 12.4, ext: 0.7, bud: 1, spread: 1, rach: 3.8, yb: 0.08 },
  { code: 60, vL: 13, ext: 0.8, rach: 5, yb: 0.14, opened: 0.03 },
  { code: 61, ext: 0.87, rach: 8, yb: 0.24, opened: 0.12 },
  { code: 63, ext: 0.93, rach: 14, yb: 0.42, opened: 0.32, fallen: 0.04 },
  { code: 65, roots: 88, ext: 0.98, rach: 20, yb: 0.62, opened: 0.52, fallen: 0.18, podFull: -0.3 },
  { code: 67, ext: 1, rach: 28, yb: 0.88, opened: 0.8, fallen: 0.56, podFull: -0.2 },
  { code: 69, roots: 100, rach: 35, yb: 1, opened: 1, fallen: 1, podFull: -0.08, seed: 0.2, leafLoss: 0.05 },
  { code: 71, rach: 40, podFull: 0.13, seed: 0.5, leafLoss: 0.12 },
  { code: 75, rach: 45, podFull: 0.52, seed: 1, leafLoss: 0.3 },
  { code: 79, rach: 48, podFull: 0.93, seed: 1.6, leafLoss: 0.55 },
  { code: 80, rach: 48.5, podFull: 1.05, seed: 2.2, leafLoss: 0.65, stemRipe: 0.05 },
  { code: 81, seed: 3.6, leafLoss: 0.75, stemRipe: 0.2 },
  { code: 83, seed: 4.05, leafLoss: 0.85, stemRipe: 0.4 },
  { code: 85, seed: 4.5, leafLoss: 0.93, stemRipe: 0.6 },
  { code: 87, seed: 4.98, leafLoss: 1, stemRipe: 0.8 },
  { code: 89, seed: 5.6, stemRipe: 1 },
];
