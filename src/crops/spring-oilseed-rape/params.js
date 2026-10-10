// Spring oilseed rape plant dimensions and shape settings, read by the
// brassica morphology (src/model/brassica.js) and renderer. The seed depth,
// pods, seed colours, plant colours and root type are winter oilseed rape's
// (src/crops/winter-oilseed-rape/params.js); this file sets what differs.
//
// Benchmarks (few are UK figures; see the notes on each):
//   - AHDB: sown February–April at a higher population than winter crops
//     (at least 40–50 plants/m²). AHDB's descriptive list scores spring
//     varieties 6–7 for shortness of stem but gives no height in cm.
//   - Canola Council of Canada (spring canola, the same crop type): 9–30
//     leaves on the main stem; first flower 40–60 days after sowing;
//     75–175 cm tall; main stem 30–60% of its final length just before
//     flowering.
//   - Ontario canola guide (Field Crop News): flowers 45–50 days after
//     emergence, matures in 90–96 days, 100–175 cm, 3–7 branches.
//   - Bayer (canola staging): stem extension may begin by the six-leaf stage.
// This model: 13 main-stem leaves (7 rosette + 6 stem leaves), about 110 cm
// final height (a UK crop is shorter than winter oilseed rape; estimate),
// five side branches and about 120 pods per plant (estimate: no UK pod
// benchmark for spring crops was found).
//
// Structure of the main stem in this model (13 leaves):
//   - Leaves 1–7 form a short-lived rosette at soil level (no winter).
//   - Leaves 8–13 are stem leaves, one above each of the first six
//     extending internodes; a seventh internode carries the main raceme.
//   - Side branches grow from the axils of the top five stem leaves.
// Values are illustrative and need checking against real plants.

import * as winter from '../winter-oilseed-rape/params.js';

export const { SEED_DEPTH, POD, SEED_SPREAD, RIPE_SEED, SEEDS, COLOURS } = winter;

export const LEAVES = {
  rosette: 7,
  stem: 6,
  // Final length (stalk + blade), cm, leaf 1 → 13. Canola Council: largest
  // leaves about 250 cm² (≈ 22 cm long at this shape).
  len: [6, 9, 13, 17, 20, 22, 22, 19, 15, 12, 9.5, 7.5, 6],
  width: [0.62, 0.58, 0.52, 0.5, 0.47, 0.45, 0.44, 0.42, 0.4, 0.37, 0.34, 0.31, 0.28],
  petiole: [0.35, 0.35, 0.34, 0.33, 0.32, 0.31, 0.3, 0.2, 0.1, 0, 0, 0, 0],
  lobes: [0, 0, 1, 2, 2, 3, 3, 2, 1, 0, 0, 0, 0],
};

// Final internode lengths, cm: under stem leaves 8–13, then the top
// internode up to the base of the main raceme.
export const INTERNODES = [2.4, 4.6, 6.8, 9, 10.5, 12, 14];

// Stem radius, cm: thinner than winter oilseed rape (estimate).
export const STEM = { base: 0.55, top: 0.22 };

// Main raceme: fewer flower positions and a shorter rachis than winter
// oilseed rape (estimate).
export const MAIN_RACEME = { n: 40, len: 44, podLen: [6.5, 4.5], scale: 0.95 };

// Side branches from the axils of stem leaves (index into stem leaves 1–6),
// top first: five branches (Ontario: 3–7 per plant). lag: timeline units
// behind the main raceme; a short season, so they keep closer to it than
// winter oilseed rape's.
export const BRANCHES = [
  { leaf: 6, lag: 2.0, stalk: 10, angle: 32, n: 24, len: 26, scale: 0.9 },
  { leaf: 5, lag: 2.7, stalk: 14, angle: 36, n: 22, len: 24, scale: 0.87 },
  { leaf: 4, lag: 3.4, stalk: 18, angle: 39, n: 20, len: 22, scale: 0.84 },
  { leaf: 3, lag: 4.1, stalk: 21, angle: 41, n: 17, len: 19, scale: 0.8 },
  { leaf: 2, lag: 4.8, stalk: 23, angle: 43, n: 14, len: 16, scale: 0.75 },
];

// Root system: winter oilseed rape's taproot with laterals, a little smaller
// (a thinner root collar comes from the `collar` keyframe channel). Rooting
// depth (`roots` channel) is illustrative: about 1 m by the end of flowering,
// shallower than the winter crop. Canola Council: roots grow nearly 2 cm a
// day in moist soil and average about 140 cm (90–190) at maturity on the
// Canadian prairies.
export const ROOTS = {
  ...winter.ROOTS,
  laterals: { ...winter.ROOTS.laterals, len: 12 },
};
