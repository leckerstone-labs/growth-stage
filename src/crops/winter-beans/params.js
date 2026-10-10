// Winter field bean (Vicia faba) plant dimensions and shape settings, read by
// the legume morphology (src/model/legume.js) and renderer
// (src/render/legume-mesh.js). Plain numbers; colours are hex strings.
//
// What differs from spring beans (src/crops/spring-beans/params.js), after
// Link et al. 2010 and PGRO: winter beans overwinter as small plants with two
// or three leaves, grow "two or more rather synchronous" stems from the base,
// are taller and flower and mature earlier. Sown deeper (often ploughed in).
// Structure of the main stem in this model (17 true leaves): two scale
// leaves, true leaves 1–17, racemes in the axils of leaves 6–15 (an
// estimate), pods on the lowest six flowering nodes. Two basal side shoots
// grow from the scale-leaf nodes in early spring (BRANCHES).
// Dimensions are illustrative and need checking against real plants.

import * as spring from '../spring-beans/params.js';

export const SEED_DEPTH = 10; // cm: winter beans go in deeper than spring beans
export const SEED = { len: 1.7, width: 1.25, thick: 0.78 };
export const SCALE_LEAVES = spring.SCALE_LEAVES;

export const LEAVES = {
  leaflets: [2, 2, 2, 3, 4, 4, 4, 5, 5, 6, 6, 6, 6, 6, 5, 4, 4],
  len: [3.6, 4.2, 4.8, 5.8, 6.6, 7.2, 7.7, 8.0, 8.2, 8.2, 7.9, 7.7, 7.3, 7.0, 6.4, 5.5, 4.8],
  width: [0.68, 0.67, 0.65, 0.63, 0.61, 0.59, 0.58, 0.57, 0.56, 0.55, 0.54, 0.53, 0.52, 0.51, 0.5, 0.5, 0.5],
  petiole: [1.4, 1.8, 2.2, 2.6, 3.0, 3.2, 3.5, 3.8, 3.8, 3.8, 3.6, 3.5, 3.4, 3.1, 2.9, 2.6, 2.3],
  spacing: 1.95,
  stipule: 0.9,
};

// Winter: short lower internodes (the overwintering plant), longer above.
export const INTERNODES = [2, 1.5, 2, 3.5, 5, 6.5, 7.5, 8, 8.5, 8.5, 8.5, 8.5, 8, 8, 7.5, 7, 6];

export const STEM = { base: 0.45, top: 0.2 };

export const FLOWERING = { first: 6, flowers: [4, 5, 5, 5, 4, 4, 4, 3, 3, 3], open: 5 };

export const PODS = { perNode: [2, 2, 2, 1, 1, 1], len: [7.0, 5.8], r: 0.78, beak: 0.5, seeds: spring.PODS.seeds };

// Basal side shoots from the scale-leaf nodes (index 0 lower, 1 upper).
//   start: main-stem leaf count when the shoot starts to grow (spring)
//   rate: its leaves per main-stem leaf; leaves: its final leaf count
//   offset: its leaf 1 is sized like main-stem leaf 1 + offset
//   first / nodes: leaf with its first raceme, and flowering nodes
//   perNode: pods per flowering node
//   lag: timeline units behind the main stem for flowering, pods, ripening
//   az: direction it leans (radians round the main stem); angle: lean
//   from vertical at the base, degrees; scale: size relative to main stem
// Each shoot also gets a little seeded variation (model/legume.js).
export const BRANCHES = [
  { node: 0, start: 3.3, rate: 1.3, leaves: 14, offset: 2, first: 4, nodes: 9, perNode: [2, 1, 1, 1], lag: 1.0, az: -0.4, angle: 24, scale: 0.94 },
  { node: 1, start: 4.3, rate: 1.3, leaves: 13, offset: 2, first: 4, nodes: 8, perNode: [1, 1, 1, 1], lag: 1.6, az: 2.7, angle: 21, scale: 0.9 },
];

export const SEED_SPREAD = spring.SEED_SPREAD;
export const RIPE_SEED = spring.RIPE_SEED;
export const SEEDS = spring.SEEDS;
export const COLOURS = spring.COLOURS;

// Deeper roots than spring beans: the winter crop has longer to root.
export const ROOTS = {
  ...spring.ROOTS,
  nodules: { ...spring.ROOTS.nodules, from: 18, full: 50 },
};
