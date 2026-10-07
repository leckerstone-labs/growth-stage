// Inspection views for oilseed rape: builds the plant geometry (or the seed
// close-up) for the current view and returns the readout rows, overlay items
// and camera goal. Labels and brackets are placed from the model's own
// numbers (leaf midribs, internodes, flower positions).

import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../model/interp.js';
import { VISIBLE_INTERNODE } from '../model/brassica.js';
import { setSection, setGhost } from '../render/materials.js';
import { BrassicaMesh } from '../render/brassica-mesh.js';
import { PodView, seedStateText } from '../render/pod-view.js';

const V = (p) => new THREE.Vector3(p[0], p[1], p[2]);
const pct = (x) => `${Math.round(x * 100)}%`;

export function createBrassicaView({ crop, model, M, scene, soil }) {
  const { measureMain, tAt } = model;
  const mesh = new BrassicaMesh(M, crop);
  scene.add(mesh.group);
  const podView = new PodView(crop.params);

  function enabled(mode, t) {
    if (mode === 'leaves') return t >= tAt(10) && t <= tAt(53);
    if (mode === 'stem') return t >= tAt(30);
    if (mode === 'buds') return t >= tAt(50) - 1 && t <= tAt(71);
    if (mode === 'pods') return t >= tAt(65);
    if (mode === 'seed') return t >= tAt(71) - 1;
    return true;
  }

  // Frame a box of world points with the given view direction.
  const frame = (pts, dir, pad = 1.15, min = 3) => {
    const box = new THREE.Box3().setFromPoints(pts);
    const c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
    return { target: c, height: Math.max(min, sz.y * pad + 0.5), width: Math.max(min, Math.max(sz.x, sz.z) * pad + 0.5), dir };
  };

  function build(plant, mode) {
    const m = measureMain(plant);
    const K = plant.K;
    const main = plant.main;
    const rows = [];
    const items = [];
    let goal;
    const axisPt = (s) => V(plant.mainAxis.at(s).p);
    const flowerPt = (r, f) => V(r.axis.at(f.s).p);

    setSection(M, false);
    setGhost(M, false);
    if (mode !== 'seed') {
      mesh.build(plant, { mode });
      soil.group.visible = true;
      // Rosette leaves lie on the soil, so from GS14 the plant view shows the
      // whole surface; the cut-away is kept while the seedling and roots are
      // the point of interest (and in the stem view).
      soil.setFull(mode === 'leaves' || (mode !== 'stem' && plant.t >= tAt(14)));
    } else {
      podView.update(K.seed);
    }

    const leafRow = () => {
      const lost = m.leavesUnfolded - m.leavesGreen;
      return ['True leaves unfolded (main stem)', `${m.leavesUnfolded}${m.leavesUnfolded >= 9 ? ' (GS19: 9 or more)' : ''}${lost > 0 && m.leavesUnfolded ? ` · ${lost} lost or dying` : ''}`];
    };

    if (mode === 'plant') {
      const t = plant.t;
      if (t < tAt(10)) {
        rows.push(['Taproot', `${m.rootLen.toFixed(1)} cm`]);
        rows.push(['Hypocotyl', m.hypoLen <= 0 ? 'not yet out of the seed' : m.hookTop < 0 ? 'hooked, below ground' : 'hook breaking the surface']);
      } else {
        rows.push(leafRow());
      }
      if (m.height > 0.5) rows.push(['Height', `${m.height.toFixed(0)} cm`]);
      if (t >= tAt(13) && t < tAt(50)) rows.push(['Root collar diameter', `${m.collarDiam.toFixed(0)} mm`]);
      if (m.extended > 0) rows.push(['Extended internodes', `${m.extended} (GS3${Math.min(9, m.extended)})`]);
      if (m.opened > 0 && m.opened < 1) rows.push(['Flowers opened (main raceme)', pct(m.opened)]);
      if (m.pods > 0) rows.push(['Pods on the plant', `${m.pods}`]);
      if (K.seed >= 2) rows.push(['Pods ripe (main raceme)', pct(m.podsRipe), m.podsRipe >= 0.9 ? 'ok' : '']);
      // Seedling stages: name the parts.
      const S = plant.seedling;
      if (t < tAt(14)) {
        if (S.seedUsed < 0.9) items.push({ kind: 'label', p: new THREE.Vector3(-0.15, S.seedY, 0), text: 'Seed', side: 'left', dx: 70 });
        if (K.hypo > 0.2) items.push({ kind: 'label', p: V(S.hypo.at(S.hypo.len * 0.5).p), text: K.hook > 0.3 ? 'Hypocotyl (hooked)' : 'Hypocotyl', side: 'right', dx: 80 });
        if (K.coty > 0.5) items.push({ kind: 'label', p: V(plant.cotyledons[0].base).add(V(plant.cotyledons[0].dir).multiplyScalar(1.1)), text: 'Cotyledons (seed leaves)', side: 'left', dx: 70, dy: -20 });
        if (S.rootLen > 0.3) items.push({ kind: 'label', p: new THREE.Vector3(0, S.seedY - Math.min(S.rootLen, 7) * 0.7, 0), text: K.vL < 1 ? 'Radicle → taproot' : 'Taproot', tone: 'muted', side: 'right', dx: 70 });
      }
      if (t >= tAt(50) && t < tAt(60) && m.budPresent) items.push({ kind: 'label', p: new THREE.Vector3(0, m.budTop, 0), text: m.budsEnclosed ? 'Buds (hidden)' : 'Flower buds', tone: 'accent', side: 'right', dx: 70 });
      const box = mesh.bounds({ roots: false });
      box.expandByPoint(new THREE.Vector3(0, plant.seedling.seedY - 1, 0));
      // The roots are hidden from GS14 (vL 4): ease them out of the frame
      // over the leaf before, so the camera doesn't jump when they go.
      const rb = mesh.roots.mesh.visible && mesh.roots.pos.length ? mesh.roots.geometry.boundingBox : null;
      if (rb) box.min.y = Math.min(box.min.y, lerp(rb.min.y, box.min.y, smoothstep(3.2, 4, K.vL)));
      box.min.y = Math.max(box.min.y, -7);
      box.max.y = Math.max(box.max.y, 1);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      // Look down more on a low rosette, so leaves lying on the soil read as flat.
      const low = 1 - clamp((m.height - 10) / 30);
      goal = { target: new THREE.Vector3(0, center.y, 0), height: Math.max(size.y * 1.08 + 1, 4.5), width: Math.max(Math.max(size.x, size.z) * 1.05 + 1, 4.5), dir: new THREE.Vector3(0.3, 0.2 + 0.35 * low * (t >= tAt(11) ? 1 : 0), 1) };
    } else if (mode === 'leaves') {
      rows.push(leafRow());
      const coty = plant.cotyledons[0];
      rows.push(['Cotyledons', !coty.present ? 'gone' : coty.sen > 0.3 ? 'yellowing' : 'green']);
      for (const c of plant.cotyledons) {
        if (c.present && c.sen < 0.9) items.push({ kind: 'tag', p: V(c.base).add(V(c.dir).multiplyScalar(c.len * 0.75)), text: 'C', tone: 'muted' });
      }
      for (const L of plant.leaves) {
        if (!L.present || L.emerge < 0.2) continue;
        const p = V(L.midrib[Math.round(L.midrib.length * 0.7)]);
        items.push({ kind: 'tag', p, text: L.unfolded ? `${L.n}` : `${L.n}?`, tone: L.unfolded ? (L.sen > 0.5 ? 'muted' : 'ok') : 'muted' });
      }
      const nxt = plant.leaves.find((L) => !L.unfolded && L.emerge > 0.2);
      if (nxt) rows.push(['Next leaf', `leaf ${nxt.n} unfolding`]);
      const box = mesh.bounds();
      box.min.y = Math.max(box.min.y, -0.5);
      const size = box.getSize(new THREE.Vector3());
      goal = { target: new THREE.Vector3(0, 0.3, 0), height: Math.max(4, Math.max(size.x, size.z) * 1.1), width: Math.max(4, Math.max(size.x, size.z) * 1.1), dir: new THREE.Vector3(0.05, 1, 0.42) };
    } else if (mode === 'stem') {
      const crownY = plant.crownY;
      items.push({ kind: 'label', p: axisPt(0.2).add(new THREE.Vector3(-0.3, 0, 0)), text: 'Crown — rosette leaves (no internodes)', tone: 'muted', side: 'left', dx: 60, dy: 12 });
      let lastShown = 0;
      for (let i = 0; i < plant.ints.length; i++) {
        const len = plant.ints[i];
        if (len < 0.15) break;
        lastShown = i + 1;
        const ok = len >= VISIBLE_INTERNODE;
        const r = plant.stemRadius(plant.nodeS[i]);
        items.push({ kind: 'dim', p0: axisPt(plant.nodeS[i]).add(new THREE.Vector3(r, 0, 0)), p1: axisPt(plant.nodeS[i + 1]).add(new THREE.Vector3(r, 0, 0)), text: `${len.toFixed(1)} cm ${ok ? '✓' : ''}`, tone: ok ? 'ok' : 'muted', offset: 30 });
      }
      if (plant.t >= tAt(50)) items.push({ kind: 'label', p: new THREE.Vector3(0, m.budTop, 0), text: 'Main raceme', tone: 'accent', side: 'right', dx: 80 });
      rows.push(['Extended internodes (≥ 1 cm)', `${m.extended}`, m.extended ? 'ok' : '']);
      rows.push(['Stem stage', m.extended ? `GS3${Math.min(9, m.extended)}` : 'GS30 (rosette)']);
      rows.push(['Stem to base of main raceme', `${(plant.racemeBaseS - 0.4).toFixed(0)} cm`]);
      rows.push(['Note', 'leaves trimmed to stubs; record the most advanced stage (often GS5x or later)']);
      // Frame up to the top extended node, easing each internode in as it
      // starts to extend (a hard cut-off made the frame jump).
      let topS = 0.4, shown = 1;
      for (let i = 0; i < plant.ints.length && plant.nodeS[i + 1] !== undefined; i++) {
        shown *= smoothstep(0.05, VISIBLE_INTERNODE, plant.ints[i]);
        if (shown <= 0) break;
        topS = Math.max(topS, lerp(topS, plant.nodeS[i + 1], shown));
      }
      const topY = crownY + topS + 2;
      goal = { target: new THREE.Vector3(0, (topY - 1.5) / 2, 0), height: Math.max(5, (topY + 1.5) * 1.15), width: 9, dir: new THREE.Vector3(0.15, 0.08, 1) };
    } else if (mode === 'buds') {
      const budP = new THREE.Vector3(0, m.budTop - main.budR, 0);
      const fl = main.flowers;
      let state;
      if (m.budsEnclosed) state = 'enclosed by the youngest leaves';
      else if (m.budAboveLeaves < 0) state = 'visible from above (green bud)';
      else if (!m.mainBudsSeparate) state = 'raised above the youngest leaves';
      else state = 'separate (individual buds visible)';
      rows.push(['Main raceme', m.opened > 0 ? 'flowering' : `buds ${state}`, m.budPresent && !m.budsEnclosed ? 'ok' : '']);
      if (plant.t >= tAt(55)) rows.push(['Side racemes with separate buds', `${plant.branches.filter((b) => b.K.spread >= 0.5 && b.stalk >= 1).length}`]);
      if (m.yellowBuds > 0 && m.opened === 0) rows.push(['Yellow buds', `${m.yellowBuds} (petals showing)`, 'ok']);
      if (m.opened > 0) {
        rows.push(['Flowers opened (main raceme)', pct(m.opened), m.opened >= 0.5 ? 'ok' : '']);
        rows.push(['Open now', `${m.openNow}`]);
        rows.push(['Petals fallen', pct(m.petalsFallen)]);
      }
      if (m.budsEnclosed) items.push({ kind: 'label', p: budP, text: 'Buds hidden under youngest leaves', tone: 'accent', side: 'right', dx: 90 });
      else if (m.opened < 0.95) items.push({ kind: 'label', p: budP, text: m.opened > 0 ? 'Buds still to open' : m.yellowBuds ? 'Bud cluster' : 'Green bud cluster', tone: 'accent', side: 'right', dx: 90 });
      const yb = fl.find((f) => f.state === 'bud' && f.yellow > 0.5);
      if (yb && m.opened < 0.3) items.push({ kind: 'label', p: flowerPt(main, yb), text: 'Yellow bud', tone: 'accent', side: 'left', dx: 80 });
      const open = fl.filter((f) => f.state === 'flower');
      if (open.length) items.push({ kind: 'label', p: flowerPt(main, open[Math.floor(open.length / 2)]), text: 'Open flowers', side: 'left', dx: 80, dy: -10 });
      const pods = fl.filter((f) => f.state === 'pod');
      if (pods.length) items.push({ kind: 'label', p: flowerPt(main, pods[Math.floor(pods.length * 0.6)]), text: 'Petals fallen — young pods', tone: 'muted', side: 'left', dx: 80, dy: 20 });
      const young = plant.leaves.filter((l) => l.present && l.emerge > 0.2 && l.emerge < 1.8);
      const early = plant.t < tAt(55);
      if (young.length && early) items.push({ kind: 'label', p: V(young[0].tip), text: 'Youngest leaf', tone: 'muted', side: 'left', dx: 70 });
      const sideB = plant.branches[0];
      if (sideB && sideB.stalk > 1 && sideB.K.bud > 0.2) items.push({ kind: 'label', p: V(sideB.tip), text: 'Side raceme', tone: 'muted', side: 'right', dx: 70, dy: 20 });
      // Frame the bud cluster with the open flowers and the youngest leaves.
      // The youngest leaves drop out of the frame between GS53 and GS55, eased
      // so the camera doesn't jump.
      const pts = [budP.clone().add(new THREE.Vector3(0, 1.2, 0)), budP.clone().add(new THREE.Vector3(0, -2.5, 0))];
      for (const f of fl) if (f.state !== 'pod' || f.podSize < 0.3) pts.push(flowerPt(main, f));
      const withLeaves = 1 - smoothstep(tAt(53), tAt(55), plant.t);
      const dir = new THREE.Vector3(0.3, early ? 0.9 : 0.35, 1);
      goal = frame(pts, dir, 1.3, lerp(5, 8, withLeaves));
      if (withLeaves > 0 && young.length) {
        const g2 = frame([...pts, ...young.map((l) => V(l.tip))], dir, 1.3, 8);
        goal.target.lerp(g2.target, withLeaves);
        goal.height = lerp(goal.height, g2.height, withLeaves);
        goal.width = lerp(goal.width, g2.width, withLeaves);
      }
    } else if (mode === 'pods') {
      const fl = main.flowers;
      const pods = fl.filter((f) => f.state === 'pod');
      rows.push(['Pods at final size (main raceme)', pct(m.podsFinal), m.podsFinal >= 0.9 ? 'ok' : '']);
      if (pods.length) rows.push(['Lowest pod', `${pods[0].podLen.toFixed(1)} cm long`]);
      rows.push(['Pods on the plant', `${m.pods}`]);
      if (K.seed >= 2) rows.push(['Pods ripe (main raceme)', pct(m.podsRipe)]);
      const full = pods.filter((f) => f.podSize >= 0.99);
      const growing = pods.filter((f) => f.podSize < 0.99 && f.podSize > 0.2);
      if (full.length) items.push({ kind: 'label', p: flowerPt(main, full[Math.floor(full.length * 0.3)]), text: 'Full-size pods', tone: 'ok', side: 'left', dx: 80 });
      if (growing.length) items.push({ kind: 'label', p: flowerPt(main, growing[Math.floor(growing.length * 0.5)]), text: 'Pods still growing', tone: 'muted', side: 'right', dx: 80 });
      const open = fl.filter((f) => f.state === 'flower');
      if (open.length) items.push({ kind: 'label', p: flowerPt(main, open[0]), text: 'Still flowering', tone: 'accent', side: 'right', dx: 80, dy: -20 });
      const pts = [axisPt(plant.racemeBaseS - 2), V(main.tip).add(new THREE.Vector3(0, 3, 0))];
      for (const f of fl) {
        const a = main.axis.at(f.s);
        pts.push(V(a.p).add(new THREE.Vector3(0, f.pedLen + f.podLen * 0.8, 0)));
      }
      goal = frame(pts, new THREE.Vector3(0.3, 0.12, 1), 1.12, 8);
      goal.width = Math.max(goal.width, 22);
    } else if (mode === 'seed') {
      const A = podView.anchors;
      const s = clamp(K.seed, 0, 5);
      items.push({ kind: 'label', p: A.whole, text: 'Whole pod (middle of main raceme)', tone: 'muted', side: 'left', dx: 60, dy: -30 });
      items.push({ kind: 'label', p: A.septum, text: 'Central wall (septum)', tone: 'muted', side: 'left', dx: 50, dy: -14 });
      if (s >= 0.5) items.push({ kind: 'label', p: A.seed, text: 'Seeds: a row each side of the wall', side: 'left', dx: 60, dy: 18 });
      items.push({ kind: 'label', p: A.valve, text: 'Pod wall (valve), opened', tone: 'muted', side: 'left', dx: 60, dy: 22 });
      if (s >= 0.5) items.push({ kind: 'label', p: A.loose, text: 'Seeds ×4', tone: 'muted', side: 'left', dx: 40, dot: false });
      items.push({ kind: 'dim', p0: A.scale0, p1: A.scale1, text: '1 cm', offset: 0 });
      rows.push(['Seed (middle of main raceme)', seedStateText(s)]);
      rows.push(['Pods ripe (main raceme)', pct(m.podsRipe), m.podsRipe >= 0.9 ? 'ok' : '']);
      if (s >= 1.5) {
        const T = m.seedThirds;
        rows.push(['Seed colour: top · middle · bottom', [T.top, T.middle, T.bottom].map((x) => seedStateText(x).split(' (')[0].split(',')[0].toLowerCase()).join(' · ')]);
      }
      if (plant.t >= tAt(81) && plant.t <= tAt(85)) rows.push(['Swathing guide (AHDB)', 'top third green to green-brown, middle green-brown, bottom dark brown to black']);
      // Wide framing so the specimen card clears the info panel.
      goal = { target: new THREE.Vector3(0, 0.1, 0), height: 5, width: 10, dir: new THREE.Vector3(0, 0.15, 1) };
    }
    return { rows, items, goal };
  }

  return {
    enabled,
    build,
    sceneFor: (mode) => (mode === 'seed' ? podView.scene : scene),
    clipPoint: () => null,
    debug: { plantMesh: mesh, podView },
  };
}
