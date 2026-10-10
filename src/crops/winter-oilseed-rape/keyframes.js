// Visual key states for winter oilseed rape, one row per checkpoint. Values
// carry forward from the row before and are interpolated with a monotone
// spline (src/model/keyframes.js), so nothing overshoots between rows.
//
// Channels (read by src/model/brassica.js):
//   roots     taproot length from the seed, real cm (src/model/roots.js; the
//             rooting depth readout adds the seed depth)
//   hypo      hypocotyl length from the seed, cm (seed at SEED_DEPTH)
//   hook      hypocotyl hook: 1 = bent over below ground, 0 = straight
//   coty      cotyledons opening: 0 folded together, 1 flat
//   vL        leaf clock: true leaves unfolded on the main stem (fractional)
//   habit     rosette leaf spread: 0 upright … 1 flat on the ground (winter)
//   collar    root collar radius, cm
//   ext       stem extension 0 → 1; internodes extend in turn from the base
//   bud       size of the main flower-bud cluster 0 → 1
//   enclose   youngest leaves folded over the buds: 1 hidden … 0 open
//   spread    buds separating on their own stalks (0 tight cluster, 1 apart)
//   rach      main raceme (rachis) length, cm
//   yb        flower positions (fraction from the bottom) showing yellow
//   opened    flower positions that have opened (main raceme, from bottom)
//   fallen    flower positions whose petals have fallen
//   podFull   pod positions at final size (negative: none yet)
//   seed      seed state of a pod in the middle of the main raceme:
//             1 expanding, 2 green, 3 green-brown, 4 brown, 5 black and hard
//   leafLoss  stem leaves yellowing and falling, lowest first, 0 → 1
//   stemRipe  stem colour, green 0 → straw-brown 1
//
// Side racemes reuse these rows with a lag (params BRANCHES), so they flower
// and ripen a little after the main raceme. checks.js verifies the BBCH stage
// rules at each checkpoint.

export const ROWS = [
  { code: 5, roots: 0.4, hypo: 0, hook: 1, coty: 0, vL: -1.6, habit: 0, collar: 0.03, ext: 0, bud: 0, enclose: 1,
    spread: 0, rach: 0, yb: 0, opened: 0, fallen: 0, podFull: -0.4, seed: 0, leafLoss: 0, stemRipe: 0 },
  { code: 7, roots: 1.8, hypo: 0.7 },
  { code: 9, roots: 3.5, hypo: 1.82, hook: 0.85, vL: -0.9 },
  { code: 10, roots: 5, hypo: 2.4, hook: 0, coty: 1, vL: 0 },
  { code: 11, roots: 7, vL: 1, collar: 0.045 },
  { code: 12, roots: 9, vL: 2, collar: 0.06, habit: 0.04 },
  { code: 13, roots: 12, vL: 3, collar: 0.08, habit: 0.1 },
  { code: 14, roots: 15, vL: 4, collar: 0.11, habit: 0.18 },
  { code: 16, roots: 21, vL: 6, collar: 0.17, habit: 0.32 },
  { code: 19, roots: 30, vL: 9.3, collar: 0.28, habit: 0.6, bud: 0.04 },
  { code: 30, roots: 45, vL: 12, collar: 0.4, habit: 0.9, hypo: 2.0, bud: 0.12 },
  { code: 50, roots: 60, vL: 13.2, collar: 0.45, habit: 0.75, ext: 0.05, bud: 0.32 },
  { code: 51, vL: 14.2, habit: 0.65, ext: 0.15, bud: 0.48, enclose: 0.35, spread: 0.05, rach: 0.4 },
  { code: 53, roots: 75, vL: 15.8, habit: 0.6, ext: 0.31, bud: 0.62, enclose: 0, spread: 0.2, rach: 1.5 },
  { code: 55, vL: 17.2, ext: 0.42, bud: 0.76, spread: 0.6, rach: 1.8 },
  { code: 57, vL: 18.6, ext: 0.56, bud: 0.88, spread: 0.85, rach: 2.8 },
  { code: 59, roots: 95, vL: 19.6, ext: 0.7, bud: 1, spread: 1, rach: 3.8, yb: 0.08 },
  { code: 60, vL: 20, ext: 0.8, rach: 5, yb: 0.14, opened: 0.03 },
  { code: 61, ext: 0.87, rach: 8, yb: 0.24, opened: 0.12 },
  { code: 63, ext: 0.93, rach: 14, yb: 0.42, opened: 0.32, fallen: 0.04 },
  { code: 65, roots: 115, ext: 0.98, rach: 20, yb: 0.62, opened: 0.52, fallen: 0.18, podFull: -0.3 },
  { code: 67, ext: 1, rach: 28, yb: 0.88, opened: 0.8, fallen: 0.56, podFull: -0.2 },
  { code: 69, roots: 125, rach: 35, yb: 1, opened: 1, fallen: 1, podFull: -0.08, seed: 0.2, leafLoss: 0.05 },
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
