// Spring wheat plant dimensions and shape settings, read by the shared
// morphology (src/model/morphology.js) and renderers. Plain numbers.
// The collar, leaf angles, ear shape and colours are winter wheat's
// (src/crops/winter-wheat/params.js); this file sets what differs.
//
// Benchmarks:
//   - AHDB Recommended List 2022/23: spring wheat straw 72–80 cm without
//     PGR, against 82–95 cm for winter wheat, so about 10 cm shorter.
//   - AHDB winter wheat guide: later sowing reduces the number of leaves
//     (about 9 from a November drilling). NDSU Extension: most spring wheats
//     make 8 main-stem leaves (7 under heat or drought stress).
//   - Agronomist advice (Farmers Weekly): spring wheat "doesn't tiller like a
//     winter wheat"; target about 600 ears/m² from 325–400 seeds/m², i.e.
//     about 2 ears per plant.
// This model: about 67 cm final height (10 cm less than the winter wheat
// model), 8 leaves, a main shoot and one tiller at harvest.
//
// Botanical structure (main shoot, 8 leaves in this model):
//   - Leaves 1–3 attach at crown nodes that never elongate.
//   - Leaf 4 attaches at the base node, leaves 5–8 at nodes 1–4.
//   - Flag leaf = leaf 8, leaf 2 = leaf 7, leaf 3 = 6, leaf 4 = 5.
// Values are illustrative and need checking against real plants.

import * as winter from '../winter-wheat/params.js';

export const { ERECT_ANGLE, earProfile, COLLAR } = winter;

// Main-shoot leaves, leaf 1 (oldest) to leaf 8 (flag). Estimates: the top
// four follow winter wheat's top leaves, slightly smaller; the flag leaf is
// shorter and broader than leaf 2, as in winter wheat.
export const MAIN = {
  N: 8,
  blade: [7, 9, 12, 15, 18, 22, 24, 20],
  width: [0.35, 0.45, 0.55, 0.7, 0.9, 1.1, 1.3, 1.6],
  sheath: [3, 3.5, 4.5, 6, 8.5, 10.5, 12.5, 16],
  earLen: 8, // estimate: a slightly smaller ear than winter wheat's 9 cm
  // Slightly thinner stem than winter wheat (estimate).
  stemR: [0.16, 0.155, 0.145, 0.13, 0.11],
};

// Shoots: main shoot and primary tillers T1–T4. With only 8 leaves, the
// tillers appear closer together in leaf terms (`appear`: main-shoot leaf
// clock at which each tiller shows), as in spring barley. NDSU: the first
// tiller starts at about 2.5 leaves on the main stem. Upright from the start
// (small leanP: no prostrate winter habit). T2–T4 die during stem
// extension, leaving the main shoot and T1 to form ears (about 2 ears per
// plant: see the benchmarks above).
export const shoots = (tAt, between) => [
  { id: 'MS', k: 0, lag: 0, scale: 1, leanP: 0, leanE: 0 },
  { id: 'T1', k: 1, appear: 3.0, lag: 1.2, scale: 0.95, leanP: 28, leanE: 8 },
  { id: 'T2', k: 2, appear: 3.35, lag: 2.4, scale: 0.88, leanP: 32, leanE: 12,
    death: { start: tAt(39), end: between(43, 45, 0.5), hide: between(49, 51, 0.5) } },
  { id: 'T3', k: 3, appear: 3.7, lag: 3.6, scale: 0.78, leanP: 36, leanE: 15,
    death: { start: between(31, 32, 0.75), end: between(33, 37, 0.5), hide: between(41, 43, 0.6) } },
  { id: 'T4', k: 4, appear: 4.05, lag: 4.8, scale: 0.68, leanP: 38, leanE: 18,
    death: { start: tAt(31), end: between(32, 33, 0.5), hide: tAt(39) } },
];

export const EAR = {
  ...winter.EAR,
  // Spikelets per main-shoot ear (winter wheat: 21). Estimate, to go with
  // the shorter ear; tillers' ears have fewer (ear-mesh.js).
  spikelets: 19,
};

// Root system: winter wheat's fibrous system with fewer crown roots (fewer
// leaves and tillers). Rooting depth (the `roots` keyframe channel) is
// illustrative: about 1.1 m by flowering, from AHDB's spring root growth
// rate of about 18 mm/day over the two to three months from emergence to
// flowering (same reasoning as spring barley). Spring cereals root less
// deeply than winter ones, which have had all winter.
export const ROOTS = {
  ...winter.ROOTS,
  nodal: { ...winter.ROOTS.nodal, max: 14 },
};
