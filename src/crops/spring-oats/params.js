// Spring oat plant dimensions and shape settings, read by the shared
// morphology (src/model/morphology.js) and renderers. Plain numbers only.
// Winter oats (src/crops/winter-oats/params.js) reuse the panicle, collar,
// grain and colours from here.
//
// Benchmarks (Opti-Oat Oat Growth Guide, 2019, spring cv. Canyon): 46 cm to
// the flag leaf ligule at GS39; 70 cm to the ligule and 91 cm to the top of
// the panicle at GS59; final height 108 cm to the top of the panicle (73 cm
// to the ligule), reached at GS75; six internodes, the top one (peduncle)
// the longest; 44 grains per panicle; 445 shoots/m² at GS31 falling to 370
// at harvest from 260 plants/m² (about 1.4 panicles per plant).
//
// Estimates (no published figure; illustrative, to be measured on a real
// crop): 9 main-stem leaves, every leaf and sheath size, stem radii, the
// panicle's whorl layout and branch lengths, spikelet size and rooting
// depths.
//
// Botanical structure (main shoot, 9 leaves in this model):
//   - Leaves 1–3 attach at crown nodes that never elongate.
//   - Leaf 4 attaches at the base node, leaves 5–9 at nodes 1–5.
//   - Six internodes elongate: i1..i5 and the peduncle (under the panicle).
//   - Flag leaf = leaf 9, leaf 2 = leaf 8, leaf 3 = 7, leaf 4 = 6.

import { smoothstep } from '../../model/interp.js';

// Main-shoot leaves, leaf 1 (oldest) to leaf 9 (flag). Oat leaves are broad
// (flag ~20–30 × 1.5–2 cm, lower leaves ~25–35 × 1.5–2.2 cm; estimates in
// the research notes) and the flag leaf is a little smaller than leaf 2.
export const MAIN = {
  N: 9,
  internodes: 5, // elongating internodes below the peduncle (oats: six in all)
  blade: [10, 13, 17, 21, 25, 28, 30, 29, 23],
  width: [0.5, 0.65, 0.85, 1.05, 1.3, 1.55, 1.75, 1.85, 1.65],
  sheath: [4, 5, 6.5, 8, 11, 14, 17, 20, 23],
  earLen: 19, // panicle length, lowest whorl to tip (estimate)
  // Final stem radius per elongated internode, base → peduncle, cm. Oat
  // stems are thicker than wheat's (Opti-Oat), ≈4 mm across low down.
  stemR: [0.2, 0.2, 0.19, 0.18, 0.165, 0.125],
  // Leaves twist anticlockwise seen from above, the opposite way to wheat
  // and barley (AHDB wild-oat page).
  twist: -1,
};

// Shoots: the main shoot and two tillers at most. Spring oats tiller little
// (Opti-Oat: under two shoots per plant at GS31); T2 dies during stem
// extension, leaving two panicles. Spring oats stand fairly upright, so
// tillers lean out much less than in winter crops.
export const shoots = (tAt, between) => [
  { id: 'MS', k: 0, lag: 0, scale: 1, leanP: 0, leanE: 0 },
  { id: 'T1', k: 1, lag: 1.0, scale: 0.93, leanP: 32, leanE: 13 },
  { id: 'T2', k: 2, lag: 2.0, scale: 0.8, leanP: 36, leanE: 13,
    death: { start: between(31, 32, 0.6), end: between(33, 37, 0.6), hide: between(41, 43, 0.6) } },
];

// Erect leaf angle from the shoot axis (degrees), by leaf number from the
// top. Oat leaves are broad and lax.
export const ERECT_ANGLE = [0, 28, 36, 42, 48, 54];

// Radius profile of the folded panicle in the boot (u = 0 base … 1 tip),
// fraction of max: spindle-shaped, tapering to the top spikelet.
export function earProfile(u) {
  const base = smoothstep(0, 0.12, u);
  const tip = 1 - 0.5 * smoothstep(0.7, 1, u);
  return (0.5 + 0.5 * base) * tip;
}

export const EAR = {
  type: 'panicle', // inflorescence builder: render/panicle-mesh.js
  // Radius of the folded panicle per unit of the earW channel; the flag leaf
  // sheath is fitted round it, and the folded panicle is squeezed to fit.
  radius: 0.5,
  nod: 6, // degrees the ripening panicle leans over
  // The rachis arches over as the grain ripens: the bend runs from just
  // below the panicle to its tip.
  neck: 40,
  neckSpan: [-3, 'top'],
};

// Panicle layout (render/panicle-mesh.js). Opti-Oat: 5–7 whorls of branches
// (often about four) on the rachis; spikelets per whorl fall towards the
// top, about 75% on the bottom three whorls; spikelets have 2–3 florets,
// most setting two grains. 21 spikelets + the terminal one = 22 spikelets,
// about 44 grains (benchmark 44). Positions and lengths are estimates.
export const PANICLE = {
  whorls: [0, 0.3, 0.5, 0.64, 0.76, 0.86], // share of panicle length
  branches: [4, 4, 3, 3, 2, 2],
  spikelets: [6, 5, 4, 3, 2, 1],
  branchLen: [0.44, 0.38, 0.31, 0.25, 0.19, 0.13], // share of panicle length
  spread: [42, 40, 37, 34, 31, 28], // degrees from the rachis once open
  droop: 0.85, // radians the branch tips bend down at flowering
  pedicel: [0.5, 1.3], // cm at full size: at a branch tip, further in
  anthers: 0.5, // share of florets that push their anthers out
};

// Ligule only: oats have no auricles. The ligule is large and membranous,
// rounded with a finely toothed edge (~3–5 mm; drawn a little larger).
export const COLLAR = {
  ligule: 0.42,
  ligArc: 1.55,
  ligRound: 0.5,
  ligTeeth: 0.12,
  auricles: false,
  hairs: false,
};

// Hulled grain: the lemma and palea stay on as the husk, so the grain is
// long and slender, pointed at the tip, with a shallow crease and faint
// veins. Green husk ripening to pale cream. Sizes ×10 cm (1.0 → 10 mm).
export const GRAIN = {
  shape: { a: 0.8, b: 1.15, crease: 0.3, ridges: 0.02, germ: 0.12, tip: 'none' },
  states: [
    { g: 0, len: 0.3, wid: 0.07, dep: 0.06, coat: '#dde8c6', fill: '#eef1e0' },
    { g: 1, len: 0.7, wid: 0.16, dep: 0.13, coat: '#c4da9a', fill: '#e6eedc' }, // watery
    { g: 2, len: 0.98, wid: 0.25, dep: 0.21, coat: '#b0cf7c', fill: '#f7f5ec' }, // milk
    { g: 3, len: 1.0, wid: 0.27, dep: 0.23, coat: '#c3cf84', fill: '#f3ecd6' }, // late milk
    { g: 3.5, len: 1.0, wid: 0.28, dep: 0.24, coat: '#d9d396', fill: '#ecdfba' }, // soft dough
    { g: 4, len: 1.0, wid: 0.28, dep: 0.24, coat: '#e2d6a2', fill: '#ebdfbf' }, // hard dough
    { g: 5, len: 0.98, wid: 0.27, dep: 0.23, coat: '#e4d7aa', fill: '#f3ecd9' }, // hard
  ],
};

// Colour changes (hex) from the shared palette (render/materials.js): oat
// leaves are a paler, bluish green; the panicle ripens to pale straw.
export const PALETTE = {
  leafYoung: '#93ba7a',
  leaf: '#5b8e5c',
  leafDeep: '#578b5b',
  flag: '#5c9165',
  sheath: '#8db780',
  sheathPale: '#bdd3a4',
  stem: '#a2c27e',
  ear: '#b0cb8a',
  earPale: '#d8e4bb',
  earGold: '#e5d8a8',
  earRipe: '#ece2c0',
  stemRipe: '#e2d0a0',
};

// Root system (src/model/roots.js): fibrous, as the other cereals. Oats
// usually have fewer seminal roots than wheat (three here) and a wider,
// deeper root plate (Opti-Oat), so the crown roots spread wider. The
// rooting-depth keyframes are read approximately from the Opti-Oat charts
// (axis to about 1 m for spring oats): illustrative.
export const ROOTS = {
  type: 'fibrous',
  // [azimuth rad, angle from down °, starts at rooting depth cm, length share]
  seminal: { r: 0.024, gravity: 0.08, roots: [[0, 0, 0, 1], [0.9, 46, 1.2, 0.85], [4.0, 52, 1.6, 0.85]] },
  nodal: { start: 2.5, perLeaf: 2, max: 18, rate: 12, r: 0.036, tilt: [60, 84], gravity: 0.05 },
  laterals: { from: 1.5, spacing: 1.8, tipZone: 2, len: 6, rate: 0.25, decay: 30, angle: 55, r: 0.01, gravity: 0.06 },
};
