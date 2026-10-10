// Spring barley (two-row) plant dimensions and shape settings, read by the
// shared morphology (src/model/morphology.js) and renderers. Plain numbers.
// The collar, grain, ear shape and colours are winter barley's
// (src/crops/winter-barley/params.js); this file sets what differs.
//
// Benchmarks:
//   - AHDB barley growth guide: spring varieties are 10–20 cm shorter than
//     winter ones and reach 57% of final height at flag leaf emergence;
//     fewer tillers than winter barley; 19–24 grains per ear; 4 nodes
//     (5 internodes) in the extended stem.
//   - Teagasc Spring Barley Guide (Irish benchmark crops): 8 main-stem
//     leaves (7–9), only the top four on the extended stem; final height
//     59 cm (54–64); about 1,100 shoots/m² at the peak and 870 ears/m² from
//     about 276 plants/m², i.e. about 4 shoots per plant falling to 3 ears.
// This model: about 70 cm final height (between the two), 55% of it at GS39.
//
// Botanical structure (main shoot, 8 leaves in this model):
//   - Leaves 1–3 attach at crown nodes that never elongate.
//   - Leaf 4 attaches at the base node, leaves 5–8 at nodes 1–4.
//   - Flag leaf = leaf 8, leaf 2 = leaf 7, leaf 3 = 6, leaf 4 = 5.
// Values are illustrative and need checking against real plants.

import * as winter from '../winter-barley/params.js';

export const { ERECT_ANGLE, earProfile, COLLAR, GRAIN, PALETTE } = winter;

// Main-shoot leaves, leaf 1 (oldest) to leaf 8 (flag). The flag leaf is
// small, as in winter barley. Leaf 2's sheath is longer than internode 4,
// so it covers node 4 (that keeps the crop over half its final height at
// GS39).
export const MAIN = {
  N: 8,
  blade: [7, 9, 11, 13, 15, 17, 18, 11],
  width: [0.4, 0.5, 0.6, 0.7, 0.85, 1.0, 1.15, 0.95],
  sheath: [3, 3.5, 4.5, 6, 9, 13, 17, 19],
  earLen: 6.2, // two-row ear without awns; fewer grains than winter barley
  stemR: winter.MAIN.stemR,
};

// Shoots: main shoot and primary tillers T1–T4. With only 8 leaves, the
// tillers appear closer together in leaf terms (`appear`: main-shoot leaf
// clock at which each tiller shows) so tillering fits between leaf 3 and
// the start of stem extension. Upright from the start (small leanP: no
// prostrate winter habit). T3 and T4 die during stem extension, leaving
// 3 ear-bearing shoots (Teagasc: ~4 shoots per plant at the peak, ~3 ears).
export const shoots = (tAt, between) => [
  { id: 'MS', k: 0, lag: 0, scale: 1, leanP: 0, leanE: 0 },
  { id: 'T1', k: 1, appear: 3.0, lag: 1.2, scale: 0.95, leanP: 30, leanE: 8 },
  { id: 'T2', k: 2, appear: 3.35, lag: 2.4, scale: 0.9, leanP: 34, leanE: 11 },
  { id: 'T3', k: 3, appear: 3.7, lag: 3.6, scale: 0.8, leanP: 38, leanE: 15,
    death: { start: between(31, 32, 0.75), end: between(33, 37, 0.5), hide: between(41, 43, 0.6) } },
  { id: 'T4', k: 4, appear: 4.05, lag: 4.8, scale: 0.7, leanP: 40, leanE: 18,
    death: { start: tAt(31), end: between(32, 33, 0.5), hide: tAt(39) } },
];

export const EAR = {
  ...winter.EAR,
  // Rachis nodes per main-shoot ear ≈ grains per ear (AHDB: 19–24 for
  // spring barley; Teagasc benchmark ≈ 21). At most 24 (ear-mesh.js).
  nodes: 21,
};

// Root system: winter barley's fibrous system with fewer crown roots (fewer
// leaves and tillers). Rooting depth (the `roots` keyframe channel) is
// illustrative: about 1 m by flowering, from AHDB's spring root growth rate
// of about 18 mm/day over the roughly two months from emergence to
// flowering. Spring cereals root less deeply than winter ones, which have
// had all winter.
export const ROOTS = {
  ...winter.ROOTS,
  nodal: { ...winter.ROOTS.nodal, max: 14 },
};
