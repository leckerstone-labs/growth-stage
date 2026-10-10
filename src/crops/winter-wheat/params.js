// Winter wheat plant dimensions and shape settings, read by the shared
// morphology (src/model/morphology.js) and renderers. Plain numbers only.
//
// Botanical structure (main shoot, 11 leaves in this model):
//   - Leaves 1–6 attach at crown nodes that never elongate.
//   - Leaf 7 attaches at the base node, leaves 8–11 at nodes 1–4.
//   - Five internodes elongate: i1..i4 and the peduncle (under the ear).
//   - Counting down from the top: flag leaf = leaf 11, leaf 2 = leaf 10,
//     leaf 3 = leaf 9, leaf 4 = leaf 8 (AHDB/industry convention).

import { smoothstep } from '../../model/interp.js';

// Main-shoot leaf dimensions, leaf 1 (oldest) to leaf 11 (flag). Illustrative
// values for a UK winter wheat; the flag leaf is typically shorter and
// broader than leaf 2.
export const MAIN = {
  N: 11,
  blade: [7, 9, 11, 13, 15, 16, 18, 20, 24, 26, 22],
  width: [0.35, 0.45, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.2, 1.4, 1.75],
  sheath: [3, 3.5, 4.5, 5.5, 6.5, 7.5, 9, 10.5, 11.5, 13, 17],
  earLen: 9,
  // Final stem (culm) radius per elongated internode, base → peduncle, cm.
  // ≈3.4 mm diameter at the base tapering to ≈2.3 mm under the ear.
  stemR: [0.17, 0.165, 0.155, 0.14, 0.115],
};

// Shoots: main shoot (MS) and primary tillers T1–T4. Tiller Tk grows from the
// axil of main-shoot leaf k and appears as main-shoot leaf k+3 emerges, so it
// is (k+2) leaves behind. T3 and T4 die during stem extension, as the
// youngest tillers usually do. Timings refer to stage codes.
export const shoots = (tAt, between) => [
  { id: 'MS', k: 0, lag: 0, scale: 1, leanP: 0, leanE: 0 }, // kept vertical so section views cut it cleanly
  { id: 'T1', k: 1, lag: 1.2, scale: 0.96, leanP: 58, leanE: 7 },
  { id: 'T2', k: 2, lag: 2.4, scale: 0.92, leanP: 62, leanE: 10 },
  { id: 'T3', k: 3, lag: 3.6, scale: 0.8, leanP: 66, leanE: 14,
    death: { start: between(31, 32, 0.75), end: between(33, 37, 0.5), hide: between(41, 43, 0.6) } },
  { id: 'T4', k: 4, lag: 4.8, scale: 0.7, leanP: 68, leanE: 17,
    death: { start: tAt(31), end: between(32, 33, 0.5), hide: tAt(39) } },
];

// Erect leaf angle from the shoot axis (degrees), by leaf number from the top.
export const ERECT_ANGLE = [0, 24, 32, 38, 44, 50]; // index = leaf-from-top

// Ear radius profile along the ear (u = 0 base … 1 tip), fraction of max.
export function earProfile(u) {
  const base = smoothstep(0, 0.16, u);
  const tip = 1 - 0.55 * smoothstep(0.78, 1, u);
  return (0.55 + 0.45 * base) * tip;
}

export const EAR = {
  type: 'wheat', // inflorescence builder in render/ear-mesh.js
  // Half the face width per unit of the earW channel; matches the ear-mesh
  // geometry so the sheaths are fitted around the drawn ear.
  radius: 0.62,
  nod: 9, // degrees the ripe ear bows over
};

// Ligule and auricles (render/plant-mesh.js buildCollar).
export const COLLAR = {
  type: 'wheat', // small, hairy auricles; short ligule
};

// Root system (src/model/roots.js); the rooting depth comes from the `roots`
// keyframe channel. AHDB: three to six seminal roots before the second leaf;
// crown (nodal) roots from the 3–4 leaf stage; 20 or more main roots per
// plant with many branches; over 70% of root length in the top 30 cm.
export const ROOTS = {
  type: 'fibrous',
  // Seminal roots: the radicle, then two pairs. Each row: azimuth (rad),
  // angle from straight down (°), rooting depth (cm) before it starts,
  // length as a share of the rooting depth.
  seminal: { r: 0.022, gravity: 0.08, roots: [[0, 0, 0, 1], [0.6, 48, 1.2, 0.85], [3.7, 52, 1.2, 0.85], [2.1, 62, 2.2, 0.85], [5.2, 58, 2.2, 0.85]] },
  // Nodal roots from the crown: from leaf clock `start`, `perLeaf` per leaf
  // up to `max`; each grows `rate` cm per leaf, leaving at `tilt` (° from down).
  nodal: { start: 2.5, perLeaf: 2, max: 20, rate: 12, r: 0.032, tilt: [55, 80], gravity: 0.06 },
  // Branch roots: every `spacing` cm from `from` cm, none in the last
  // `tipZone` cm; up to `len` cm, shorter with depth (e-fold `decay` cm).
  laterals: { from: 1.5, spacing: 1.8, tipZone: 2, len: 6, rate: 0.25, decay: 30, angle: 55, r: 0.01, gravity: 0.06 },
};
