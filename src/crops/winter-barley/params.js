// Winter barley (two-row) plant dimensions and shape settings, read by the
// shared morphology (src/model/morphology.js) and renderers. Plain numbers.
//
// Benchmarks (AHDB barley growth guide): about 14 main-stem leaves; 4 nodes
// (5 internodes) in the extended stem; final height 89–98 cm; nearly half of
// final height at GS39; about 3 ear-bearing shoots per plant; 24 grains/ear.
//
// Botanical structure (main shoot, 14 leaves in this model):
//   - Leaves 1–9 attach at crown nodes that never elongate.
//   - Leaf 10 attaches at the base node, leaves 11–14 at nodes 1–4.
//   - Five internodes elongate: i1..i4 and the peduncle (under the ear).
//   - Flag leaf = leaf 14, leaf 2 = leaf 13, leaf 3 = 12, leaf 4 = 11.
// Values are illustrative and need checking against real plants.

import { smoothstep } from '../../model/interp.js';

// Main-shoot leaves, leaf 1 (oldest) to leaf 14 (flag). Barley leaves are
// broad; the flag leaf is small — clearly shorter and narrower than leaf 2.
export const MAIN = {
  N: 14,
  blade: [6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 21, 22, 13],
  width: [0.35, 0.45, 0.5, 0.55, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.25, 1.4, 1.45, 1.1],
  sheath: [3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10, 12, 13, 15, 21],
  earLen: 7, // two-row ear without awns
  // Final stem radius per elongated internode, base → peduncle, cm. Barley
  // straw is a little thinner than wheat's.
  stemR: [0.16, 0.155, 0.145, 0.13, 0.1],
};

// Shoots: main shoot and primary tillers T1–T4, as for wheat (AHDB: shoot
// numbers peak around GS30 at well over 4 per plant, then fall to about 3
// ear-bearing shoots). T3 and T4 die during stem extension.
export const shoots = (tAt, between) => [
  { id: 'MS', k: 0, lag: 0, scale: 1, leanP: 0, leanE: 0 },
  { id: 'T1', k: 1, lag: 1.2, scale: 0.96, leanP: 60, leanE: 8 },
  { id: 'T2', k: 2, lag: 2.4, scale: 0.92, leanP: 64, leanE: 11 },
  { id: 'T3', k: 3, lag: 3.6, scale: 0.82, leanP: 68, leanE: 15,
    death: { start: between(31, 32, 0.75), end: between(33, 37, 0.5), hide: between(41, 43, 0.6) } },
  { id: 'T4', k: 4, lag: 4.8, scale: 0.72, leanP: 70, leanE: 18,
    death: { start: tAt(31), end: between(32, 33, 0.5), hide: tAt(39) } },
];

// Erect leaf angle from the shoot axis (degrees), by leaf number from the
// top. Barley leaves are laxer than wheat's.
export const ERECT_ANGLE = [0, 30, 38, 44, 50, 55];

// Ear radius profile along the ear (u = 0 base … 1 tip), fraction of max.
// Two-row ears are fairly parallel-sided with a short taper at the tip.
export function earProfile(u) {
  const base = smoothstep(0, 0.1, u);
  const tip = 1 - 0.45 * smoothstep(0.82, 1, u);
  return (0.6 + 0.4 * base) * tip;
}

export const EAR = {
  type: 'barley', // two-row builder in render/ear-mesh.js
  // Half-width per unit of the earW channel, matching the drawn ear.
  radius: 0.5,
  nod: 0, // the ripe ear hangs via the neck bend instead
  // Ripe ears hang over: degrees the top of the peduncle bends by harvest.
  neck: 140,
};

// Ligule and auricles: large, hairless auricles that wrap right round the
// stem and cross over on the far side (AHDB GS39 ligule inset).
export const COLLAR = {
  ligule: 0.22,
  sweep: 2.25,
  rise: 0.05,
  width: 0.17,
  flare: 0.06, // lie flat against the stem
  overlap: 0.012,
  hairs: false,
};

// Hulled grain: the lemma and palea stay on, so the grain is longer,
// spindle-shaped, with a shallow crease, faint vein ridges and a pale straw
// colour when ripe (grain-view.js). Sizes ×10 cm (0.9 → 9 mm).
export const GRAIN = {
  shape: { a: 0.75, b: 0.85, crease: 0.35, ridges: 0.025, germ: 0.2, tip: 'awn' },
  states: [
    { g: 0, len: 0.3, wid: 0.08, dep: 0.07, coat: '#dfe9c4', fill: '#eef1e0' },
    { g: 1, len: 0.6, wid: 0.2, dep: 0.15, coat: '#c4dc94', fill: '#e6eedc' }, // watery
    { g: 2, len: 0.88, wid: 0.32, dep: 0.25, coat: '#a6c86a', fill: '#f7f5ec' }, // milk
    { g: 3, len: 0.9, wid: 0.35, dep: 0.28, coat: '#bfcb72', fill: '#f3ecd6' }, // late milk
    { g: 3.5, len: 0.9, wid: 0.36, dep: 0.28, coat: '#d8c77c', fill: '#ecdfba' }, // soft dough
    { g: 4, len: 0.9, wid: 0.36, dep: 0.28, coat: '#e0c983', fill: '#ebdfbf' }, // hard dough
    { g: 5, len: 0.88, wid: 0.35, dep: 0.27, coat: '#dcc58a', fill: '#f3ecd9' }, // hard
  ],
};

// Colour changes (hex) from the shared palette (render/materials.js): barley leaves
// are a brighter, paler green; ears ripen to a pale straw gold.
export const PALETTE = {
  leafYoung: '#9cc25e',
  leaf: '#6c9a3f',
  leafDeep: '#669840',
  flag: '#6a9c48',
  ear: '#a3c463',
  earPale: '#c2d585',
  earGold: '#e2ca7c',
  earRipe: '#dcc38a',
  stemRipe: '#e4cd8a',
};
