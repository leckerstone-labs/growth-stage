// Inspection views for the cereals (wheat, barley): builds the plant, ear and
// grain geometry for the current view and returns the readout rows, overlay
// items and camera goal. main.js owns the timeline, header and camera; a crop
// family supplies one of these view controllers (see src/views/brassica.js).

import * as THREE from 'three';
import { CROWN_DEPTH } from '../model/morphology.js';
import { clamp } from '../model/interp.js';
import { setSection, setGhost } from '../render/materials.js';
import { PlantMesh } from '../render/plant-mesh.js';
import { EarMesh } from '../render/ear-mesh.js';
import { GrainView, grainStateText } from '../render/grain-view.js';
import { belowGround, belowGroundOther } from './below-ground.js';

export function createCerealView({ crop, model, M, scene, soil, state }) {
  const { measureMain, tAt } = model;
  const plantMesh = new PlantMesh(M, crop);
  const earMesh = new EarMesh(M, model);
  scene.add(plantMesh.group, earMesh.group);
  const grainView = new GrainView(crop.params.GRAIN);
  // What the crop calls its inflorescence in the readout and labels: the ear
  // (wheat, barley) or the panicle (oats).
  const ear = crop.ui.ear || 'ear';
  const Ear = ear[0].toUpperCase() + ear.slice(1);

  function enabled(mode, t) {
    if (mode === 'grain') return t >= tAt(69) - 1;
    if (mode === 'ear') return t >= tAt(32);
    if (mode === 'collar') return t >= tAt(11); // first ligule
    if (mode === 'stem') return t >= tAt(10);
    return true;
  }

  function build(plant, mode) {
    const t = plant.t;
    const ms = plant.main;
    const m = measureMain(plant);
    const boot = mode === 'ear' && m.earEmerged <= 0.02;

    if (mode !== 'grain') {
      plantMesh.build(plant, { mode });
      // Soil and roots: the plant view sizes them from the plant (below).
      if (mode !== 'plant') belowGroundOther({ soil, mesh: plantMesh });
      const ears = (mode === 'plant' ? plant.shoots : [ms])
        .filter((sh) => sh.earLen > 0.05)
        .map((sh) => ({ sh, axis: plantMesh.axes.get(sh.id) }));
      earMesh.build(plant, ears, { variant: state.variant });
      setSection(M, mode === 'stem');
      setGhost(M, boot);
      soil.group.visible = true;
      // Tall shoots are widened in the stem view so nodes stay legible.
      const widen = mode === 'stem' ? clamp((Math.max(ms.earTop, ms.node4) + 4) / 6, 1, 4) : 1;
      state.widen = widen;
      plantMesh.group.scale.set(widen, 1, widen);
      // A spreading panicle (oats) is not widened: it would splay out flat.
      if (earMesh.type === 'panicle') earMesh.group.scale.set(1, 1, 1);
      else earMesh.group.scale.set(widen, 1, widen);
      plantMesh.group.updateMatrixWorld(true);
      for (const [k, v] of Object.entries(plantMesh.anchors)) {
        if (v && v.isVector3) { v.x *= widen; v.z *= widen; }
        if (Array.isArray(v) && v[0]?.isVector3) v.forEach((p) => { p.x *= widen; p.z *= widen; });
      }
    } else {
      grainView.update(plant.K);
    }

    const rows = [];
    const items = [];
    const A = plantMesh.anchors;
    const E = earMesh.anchors;
    const ord = ['Base', '1st', '2nd', '3rd', '4th', '5th', '6th'];
    let goal;

    if (mode === 'plant') {
      const alive = plant.shoots.filter((s) => s.dead < 0.5).length;
      const dying = plant.shoots.filter((s) => s.dead >= 0.5).length;
      rows.push(['Shoots', `main + ${alive - 1} tiller${alive === 2 ? '' : 's'}${dying ? ` (${dying} dying)` : ''}`]);
      rows.push(['Leaves unfolded on main shoot', `${Math.max(0, Math.floor(Math.min(ms.H, ms.N) + 0.02))}`]);
      if (m.height > 0.5) rows.push(['Height (to highest ligule or ear tip)', `${m.height.toFixed(0)} cm`]);
      // Seedling stages: name the parts below ground.
      const SL = A.seedling;
      if (SL && t < tAt(24)) {
        if (SL.present.seed) items.push({ kind: 'label', p: SL.seed, text: plant.K.vH < 2.5 ? 'Seed' : 'Seed (reserves being used up)', side: 'left', dx: 70 });
        if (SL.present.coleo) items.push({ kind: 'label', p: SL.coleoTip, text: 'Coleoptile', side: 'right', dx: 70 });
        if (SL.present.subcrown) items.push({ kind: 'label', p: SL.subcrown, text: 'Sub-crown internode', tone: 'muted', side: 'right', dx: 80, dy: 10 });
        if (SL.present.crownRoots || t >= tAt(11)) items.push({ kind: 'label', p: SL.crown, text: SL.present.crownRoots ? 'Crown (crown roots starting)' : 'Crown forming', tone: 'muted', side: 'left', dx: 80, dy: -6 });
      }
      const box = new THREE.Box3();
      for (const mesh of [plantMesh.blades.mesh, plantMesh.sheaths.mesh]) {
        if (mesh.geometry.boundingBox) box.union(mesh.geometry.boundingBox);
      }
      if (E.top) box.expandByPoint(E.top);
      const below = belowGround({ soil, mesh: plantMesh, box, depth: plant.K.roots - plant.main.seedling.seedY });
      rows.push(...below.rows);
      items.push(...below.items);
      goal = below.goal;
    } else if (mode === 'stem') {
      const nodes = A.nodes;
      let lastShown = 0;
      for (let i = 1; i <= ms.ints.length; i++) {
        const len = ms.ints[i - 1];
        const need = i === 1 ? 1 : 2;
        const prevOk = i === 1 || ms.ints.slice(0, i - 1).every((x, j) => x >= (j === 0 ? 1 : 2));
        const ok = prevOk && len >= need;
        if (len < 0.12) break;
        lastShown = i;
        if (!ok && i > 1 && !(ms.ints[i - 2] >= (i === 2 ? 1 : 2))) break; // only the next forming node
        items.push({ kind: 'dim', p0: nodes[i - 1], p1: nodes[i], text: `${len.toFixed(1)} cm ${ok ? '✓' : `(< ${need})`}`, tone: ok ? 'ok' : 'muted', offset: 40 });
        items.push({ kind: 'label', p: nodes[i], text: ok ? `${ord[i]} node` : `Node ${i}`, tone: ok ? 'ok' : 'muted', side: 'left', dx: 60 });
      }
      items.push({ kind: 'label', p: nodes[0], text: 'Base node', tone: 'muted', side: 'left', dx: 60 });
      if (ms.earLen > 0.1) items.push({ kind: 'label', p: A.earMid, text: `Developing ${ear} · ${ms.earLen.toFixed(1)} cm`, tone: 'accent', side: 'right', dx: 90 });
      items.push({ kind: 'hline', p: new THREE.Vector3(0, 0, 0), text: 'Soil surface', half: 90 });
      rows.push(['Detectable nodes', `${m.detectable}`, m.detectable > 0 ? 'ok' : '']);
      rows.push(['Internodes (cm)', ms.ints.map((x) => x.toFixed(1)).join(' · ')]);
      if (t >= tAt(24) && t <= tAt(39) + 1) rows.push(['Node count suggests', m.detectable ? `GS3${m.detectable}` : 'GS30 or earlier']);
      const flagE = m.flagEmerge;
      rows.push(['Flag leaf', flagE <= 0 ? 'not yet visible' : flagE < 1 ? `emerging (${Math.round(flagE * 100)}%)` : 'fully emerged']);
      if (state.widen > 1.05) rows.push(['Drawing', `stem width exaggerated ×${state.widen.toFixed(1)}`]);
      const topY = Math.max(A.nodes[Math.max(lastShown, 1)].y, A.earTop.y) + 0.8;
      const botY = -CROWN_DEPTH - 1.2;
      goal = { target: new THREE.Vector3(0, (topY + botY) / 2, 0), height: (topY - botY) * 1.25 + 1.5, width: 9, dir: new THREE.Vector3(0, 0.08, 1) };
    } else if (mode === 'collar') {
      const L = A.visibleCollarLeaf;
      const name = L.flag ? 'Flag leaf' : `Leaf ${L.top}`;
      const p = A.visibleCollar;
      const r = A.collarRadius;
      const bd = A.flagBladeDir.clone();
      const ligP = p.clone().addScaledVector(bd, r * 0.9).add(new THREE.Vector3(0, 0.08, 0));
      items.push({ kind: 'label', p: ligP, text: `Ligule — ${name.toLowerCase()}`, tone: L.flag ? 'ok' : '', side: 'right', dx: 80, dy: -30 });
      const side = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), bd).normalize();
      items.push({ kind: 'label', p: p.clone().addScaledVector(side, r * 1.05).add(new THREE.Vector3(0, 0.06, 0)), text: crop.ui.auricleLabel, side: 'left', dx: 70, dy: -10 });
      const below = L.top + 1;
      items.push({ kind: 'label', p: A.prevCollar.clone().addScaledVector(side, -r * 1.1), text: `Collar of leaf ${below}`, tone: 'muted', side: 'left', dx: 70, dy: 30 });
      if (A.foldBlade) items.push({ kind: 'label', p: A.foldBlade, text: `${name} blade (bent back)`, tone: 'muted', side: 'right', dx: 60, dy: -20 });
      rows.push(['Youngest visible ligule', name]);
      rows.push(['Flag leaf', m.flagEmerge <= 0 ? 'not yet visible' : m.flagEmerge < 1 ? `emerging (${Math.round(m.flagEmerge * 100)}%)` : 'fully emerged', m.flagEmerge >= 1 ? 'ok' : '']);
      rows.push(['Flag leaf ligule visible', m.flagLiguleVisible ? 'yes' : 'no', m.flagLiguleVisible ? 'ok' : 'no']);
      // View from the side of the blade, a little above: the blade angles away
      // and the ligule sits in the angle between blade and stem.
      goal = { target: p.clone().add(new THREE.Vector3(0, 0.15, 0)), height: 2.2, width: 2.2, dir: side.clone().multiplyScalar(-0.6).addScaledVector(bd, 1).add(new THREE.Vector3(0, 0.75, 0)).normalize() };
    } else if (mode === 'ear') {
      const p = A.flagCollar;
      items.push({ kind: 'label', p, text: 'Flag leaf ligule', side: 'left', dx: 70 });
      const emerged = m.earEmerged;
      if (emerged <= 0.02) {
        items.push({ kind: 'label', p: A.earMid, text: m.bootSwelling > 1.25 ? `${Ear} inside swollen flag leaf sheath (boot)` : `${Ear} inside flag leaf sheath`, tone: 'accent', side: 'right', dx: 80 });
        rows.push([Ear, 'enclosed in flag leaf sheath']);
        rows.push([`${Ear} tip below flag ligule`, `${m.earTipBelowLigule.toFixed(1)} cm`]);
        rows.push(['Boot swelling', m.bootSwelling < 1.2 ? 'none' : m.bootSwelling < 1.7 ? 'slight' : 'obvious']);
      } else {
        items.push({ kind: 'dim', p0: p, p1: E.top || A.earTop, text: `${Math.round(emerged * 100)}% emerged`, tone: emerged >= 1 ? 'ok' : '', offset: 50 });
        rows.push([`${Ear} emerged above flag ligule`, `${Math.round(emerged * 100)}%`, emerged >= 1 ? 'ok' : '']);
      }
      // Awned crops (barley): awns show above the ligule before the ear (GS49).
      const awnUp = m.awnTipAboveLigule;
      if (awnUp !== null && ms.awnLen > 0.3) {
        rows.push(['Awn tips', awnUp > 0 ? `${awnUp.toFixed(1)} cm above flag ligule` : 'inside flag leaf sheath', awnUp > 0 ? 'ok' : '']);
        if (awnUp > 0 && emerged < 0.5 && E.awnTop) items.push({ kind: 'label', p: E.awnTop, text: 'Awn tips', tone: 'accent', side: 'right', dx: 70, dy: -10 });
      }
      const fl = plant.K.flower;
      if (crop.ui.flowering) {
        // Barley flowers mostly inside closed florets, so there are no anthers to label.
        if (fl > 0) rows.push(['Flowering', fl < 1 ? crop.ui.flowering.during : crop.ui.flowering.after]);
      } else {
        if (fl > 0.05 && fl < 1.1 && E.midFloret) items.push({ kind: 'label', p: E.midFloret, text: fl < 0.75 ? 'Anthers' : 'Spent anthers', side: 'right', dx: 80, dy: 20 });
        if (fl > 0) rows.push(['Flowering', fl < 0.1 ? 'starting' : fl < 0.75 ? `in progress` : 'complete']);
      }
      const lo = Math.min(p.y, (E.base || A.earBase).y) - 3;
      let hi = Math.max((E.top || A.earTop).y, p.y) + (state.variant ? 5 : 2);
      goal = { target: new THREE.Vector3(A.earMid.x, (lo + hi) / 2, A.earMid.z), height: (hi - lo) * 1.15, width: 8, dir: new THREE.Vector3(0.3, 0.15, 1) };
      if (E.awnTop) {
        // Awned ears (barley): frame the ligule, ear and awn tips together —
        // ripe ears hang over, so this can be wide as well as tall.
        const box = new THREE.Box3().setFromPoints([p, E.base, E.top, E.awnTop]);
        box.min.y = Math.min(box.min.y, lo); box.max.y += 1;
        const c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
        goal = { ...goal, target: c, height: sz.y * 1.15, width: Math.max(8, Math.max(sz.x, sz.z) * 1.15) };
      }
      if (E.box) {
        // Panicles (oats): frame the ligule and the whole spreading panicle.
        const box = E.box.clone().expandByPoint(p);
        box.min.y = Math.min(box.min.y, lo); box.max.y += 1;
        const c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
        goal = { ...goal, target: c, height: sz.y * 1.15, width: Math.max(8, Math.max(sz.x, sz.z) * 1.15) };
      }
    } else if (mode === 'grain') {
      const g = plant.K.grain;
      const gs = grainStateText(g);
      const G = grainView.anchors;
      items.push({ kind: 'label', p: G.whole, text: 'Whole grain', tone: 'muted', side: 'right', dx: 0, dy: 40, dot: false });
      items.push({ kind: 'label', p: G.cut, text: 'Cut across', tone: 'muted', side: 'right', dx: 0, dy: 95, dot: false });
      items.push({ kind: 'label', p: G.test, text: g < 3.3 ? 'Squeezed' : g < 3.85 ? 'Rolled' : 'Thumbnail test', tone: 'muted', side: 'right', dx: 0, dy: 40, dot: false });
      items.push({ kind: 'dim', p0: G.scale0, p1: G.scale1, text: '5 mm', offset: 0 });
      rows.push(['Grain', gs.title]);
      if (gs.test) rows.push(['Test', gs.test]);
      rows.push([`${Ear} colour`, plant.K.ripe < 0.2 ? 'green' : plant.K.ripe < 0.6 ? 'turning' : crop.ui.ripeColour || 'golden']);
      goal = { target: new THREE.Vector3(0, 0, 0), height: 1.4, width: 2.9, dir: new THREE.Vector3(0, 0.2, 1) };
    }
    return { rows, items, goal };
  }

  return {
    enabled,
    build,
    // The scene to draw: the grain close-up replaces the plant scene.
    sceneFor: (mode) => (mode === 'grain' ? grainView.scene : scene),
    // Section plane passes through this point (stem and ear views).
    clipPoint: (mode) => (mode === 'ear' ? plantMesh.anchors.earMid : plantMesh.anchors.crown),
    debug: { plantMesh, earMesh, grainView },
  };
}
