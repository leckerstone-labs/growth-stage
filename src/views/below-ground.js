// Soil and roots, shared by every crop family so all crops look the same
// (and new crops get it for free): a cut-away soil block under the plant
// (the far half of the surface plus a vertical cut face), roots drawn in it
// at true scale down to the bottom of the block, where they thin out, and
// the real rooting depth in the readout and a label. Real roots go 1–2 m
// deep, far deeper than the plant view can show, so the block deepens as
// the plant grows instead.
//
// The Roots toggle (main.js, state.roots) chooses between that and a
// reduced look, the default: every root cut short at SHORT_ROOTS cm (the
// seed, radicle and first roots, as a seedling has them) in a shallow block,
// so the plant fills the frame. Rooting depth is still in the readout.
//
// A crop family's view calls belowGround() for the plant view and
// belowGroundOther() for every other view that shows the plant. The mesh
// must have setRoots(opts) and rootSystem (see render/roots-mesh.js), and
// rootArgs.st.seed (the seed's position) for the reduced look.

import * as THREE from 'three';
import { clamp } from '../model/interp.js';

const OTHER_DEPTH = 9; // soil shown in the close-up views, cm
// Roots toggle off: each root is drawn at most this long (cm). About the
// rooting depth at emergence, so a seedling looks the same either way.
const SHORT_ROOTS = 6;
const SHORT_SOIL = 10; // soil shown with the toggle off, at least (cm)

// Width of the drawn plant (box), largest horizontal extent.
const widthOf = (box) => (box.isEmpty() ? 0 : Math.max(box.max.x - box.min.x, box.max.z - box.min.z));
const topOf = (box) => (box.isEmpty() ? 1 : Math.max(1, box.max.y));

// Soil depth drawn below the plant (cm), from the plant's size: its height,
// or half its spread for a low, wide plant (a rosette, a prostrate tiller).
export const soilDepthFor = (box) => clamp(7 + 0.22 * Math.max(topOf(box), 0.5 * widthOf(box)), 9, 26);

// Root drawing options: the soil depth shown, and minR, which keeps fine
// roots about a pixel wide or more with the whole plant in frame (so a big
// plant's roots are drawn thicker than life; the readout says so).
export function rootOptions(box, shown) {
  const frame = Math.max(topOf(box) + shown, 0.78 * widthOf(box));
  return { clip: shown, minR: 0.0014 * frame };
}

// Camera goal for the plant view: the plant above ground (box, without the
// roots) and the whole soil block below it, seen from the front, a little
// above the surface.
export function plantGoal(box, shown) {
  const b = box.clone();
  if (b.isEmpty()) b.setFromPoints([new THREE.Vector3(0, 0, 0)]);
  b.min.y = -shown;
  b.max.y = Math.max(b.max.y, 1);
  const size = b.getSize(new THREE.Vector3());
  const center = b.getCenter(new THREE.Vector3());
  return {
    target: new THREE.Vector3(0, center.y, 0),
    height: Math.max(size.y * 1.08 + 1, 4.5),
    width: Math.max(Math.max(size.x, size.z) * 1.05 + 1, 4.5),
    dir: new THREE.Vector3(0.3, 0.16, 1),
  };
}

// Readable rooting depth: one decimal for a seedling, then whole cm, then
// to the nearest 5 cm (the model is no more precise than that).
export function depthText(d) {
  if (d < 10) return `${d.toFixed(1)} cm`;
  if (d < 40) return `${Math.round(d)} cm`;
  return `~${Math.round(d / 5) * 5} cm`;
}

// Readout rows and overlay label for the roots. system: from model/roots.js
// (as drawn); depth: real rooting depth, cm; shown: soil depth drawn.
export function rootReadout(system, depth, shown, { minR = 0 } = {}) {
  const rows = [], items = [];
  if (!(depth > 0.05)) return { rows, items };
  rows.push(['Rooting depth (deepest roots)', depthText(depth)]);
  if (system.cut && depth > shown + 1) {
    // Label the deepest drawn root, about where it fades out.
    let deepest = null;
    for (const r of system.roots) if (!deepest || r.pts.at(-1)[1] < deepest.pts.at(-1)[1]) deepest = r;
    const y = -shown * 0.72;
    const p = deepest.pts.find((q) => q[1] <= y) || deepest.pts.at(-1);
    items.push({ kind: 'label', p: new THREE.Vector3(p[0], p[1], p[2]), text: `Roots continue to ${depthText(depth)} ↓`, tone: 'muted', side: 'right', dx: 70, dy: 6 });
    // minR above ~0.5 mm: the main roots are drawn thicker than life.
    rows.push(['Drawing', `${minR > 0.045 ? 'roots thicker than life; ' : ''}soil shown to ${Math.round(shown)} cm`]);
  }
  return { rows, items };
}

// Plant view: size the soil block from the drawn plant (box: above ground,
// without roots), draw the roots, and return readout rows, labels and the
// camera goal. depth: real rooting depth (cm). minShown: soil to show at
// least (cm), for a crop sown deep enough that its seed would otherwise sit
// in the faded bottom of the block (field beans).
// full: the Roots toggle (off: the reduced look, see belowGroundShort).
export function belowGround({ soil, mesh, box, depth, minShown = 0, full = true }) {
  if (!full) return belowGroundShort({ soil, mesh, box, depth });
  const shown = Math.max(soilDepthFor(box), minShown);
  soil.setDepth(shown);
  soil.setFull(false);
  const opts = rootOptions(box, shown);
  mesh.setRoots(opts);
  return { ...rootReadout(mesh.rootSystem, depth, shown, opts), goal: plantGoal(box, shown) };
}

// Plant view with the Roots toggle off: roots cut short near the seed and
// crown, ending in a fine tip rather than fading out; a soil block just deep
// enough for them, and framed down to the deepest drawn root, not the whole
// block (which fades out below the frame).
function belowGroundShort({ soil, mesh, box, depth }) {
  const seedDepth = Math.max(0, -(mesh.rootArgs?.st?.seed?.[1] ?? 0));
  const shown = Math.max(SHORT_SOIL, seedDepth + SHORT_ROOTS + 1.5);
  soil.setDepth(shown);
  soil.setFull(false);
  // A clip far below the roots: no bottom fade.
  mesh.setRoots({ clip: 1000, minR: rootOptions(box, shown).minR, cap: SHORT_ROOTS });
  let low = seedDepth + 1;
  for (const r of mesh.rootSystem.roots) for (const p of r.pts) low = Math.max(low, -p[1]);
  const rows = depth > 0.05 ? [['Rooting depth (deepest roots)', depthText(depth)]] : [];
  return { rows, items: [], goal: plantGoal(box, Math.min(shown, low + 0.8)) };
}

// Other views (close-ups): a shallow block; roots as the mesh builds them
// for that view (stubs or none). full: whole surface, for a view looking
// straight down.
export function belowGroundOther({ soil, mesh, full = false }) {
  soil.setDepth(OTHER_DEPTH);
  soil.setFull(full);
  mesh.setRoots({ clip: OTHER_DEPTH, minR: 0 });
}
