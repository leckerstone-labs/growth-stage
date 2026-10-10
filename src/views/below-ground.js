// Soil and roots, shared by every crop family so all crops look the same
// (and new crops get it for free): a cut-away soil block under the plant
// (the far half of the surface plus a vertical cut face), roots drawn in it
// at true scale down to the bottom of the block, where they thin out, and
// the real rooting depth in the readout and a label. Real roots go 1–2 m
// deep, far deeper than the plant view can show, so the block deepens as
// the plant grows instead.
//
// A crop family's view calls belowGround() for the plant view and
// belowGroundOther() for every other view that shows the plant. The mesh
// must have setRoots(opts) and rootSystem (see render/roots-mesh.js).

import * as THREE from 'three';
import { clamp } from '../model/interp.js';

const OTHER_DEPTH = 9; // soil shown in the close-up views, cm

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
export function belowGround({ soil, mesh, box, depth, minShown = 0 }) {
  const shown = Math.max(soilDepthFor(box), minShown);
  soil.setDepth(shown);
  soil.setFull(false);
  const opts = rootOptions(box, shown);
  mesh.setRoots(opts);
  return { ...rootReadout(mesh.rootSystem, depth, shown, opts), goal: plantGoal(box, shown) };
}

// Other views (close-ups): a shallow block; roots as the mesh builds them
// for that view (stubs or none). full: whole surface, for a view looking
// straight down.
export function belowGroundOther({ soil, mesh, full = false }) {
  soil.setDepth(OTHER_DEPTH);
  soil.setFull(full);
  mesh.setRoots({ clip: OTHER_DEPTH, minR: 0 });
}
