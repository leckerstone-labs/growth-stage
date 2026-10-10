// Inspection views for field beans: builds the plant geometry (or the seed
// close-up) for the current view and returns the readout rows, overlay items
// and camera goal. Labels and brackets are placed from the model's own
// numbers (nodes, leaves, racemes, pods).

import * as THREE from 'three';
import { clamp } from '../model/interp.js';
import { setSection, setGhost } from '../render/materials.js';
import { LegumeMesh } from '../render/legume-mesh.js';
import { BeanPodView, beanSeedText } from '../render/bean-pod-view.js';
import { belowGround, belowGroundOther } from './below-ground.js';

const V = (p) => new THREE.Vector3(p[0], p[1], p[2]);
const pct = (x) => `${Math.round(x * 100)}%`;

export function createLegumeView({ crop, model, M, scene, soil }) {
  const { measureMain, tAt } = model;
  const P = crop.params;
  const mesh = new LegumeMesh(M, crop);
  scene.add(mesh.group);
  const podView = new BeanPodView(P);
  const lastCode = crop.stages[crop.stages.length - 1].code;

  function enabled(mode, t) {
    if (mode === 'nodes') return t >= tAt(10) && t <= tAt(59);
    if (mode === 'flowers') return t >= tAt(50) - 1 && t <= tAt(71);
    if (mode === 'pods') return t >= tAt(67) && t <= tAt(lastCode);
    if (mode === 'seed') return t >= tAt(71) - 1;
    return true;
  }

  // Frame a set of world points with the given view direction.
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
    const axisPt = (s) => V(main.axis.at(s).p);

    setSection(M, false);
    setGhost(M, false);
    if (mode !== 'seed') {
      // Flowers and pods views: leaves at the nodes being inspected are cut
      // back to stubs so the racemes in their axils show.
      const lo = P.FLOWERING.first, hiPods = lo + P.PODS.perNode.length - 1;
      const trim = mode === 'flowers' ? (L) => L.n >= lo && main.racemes.some((r) => r.n === L.n && r.flowers.some((f) => f.state === 'open' || f.state === 'pod'))
        : mode === 'pods' ? (L) => L.n <= hiPods + 1 : null;
      mesh.build(plant, { mode, trim });
      soil.group.visible = true;
      if (mode !== 'plant') belowGroundOther({ soil, mesh });
    } else {
      podView.update(K.seed);
    }

    const leafRow = () => {
      const lost = m.leavesUnfolded - m.leavesGreen;
      return ['Leaves unfolded (main stem)', `${m.leavesUnfolded}${m.leavesUnfolded >= 9 ? ' (GS19: 9 or more)' : ''}${lost > 0 ? ` · ${lost} dying or lost` : ''}`];
    };
    const openRows = () => {
      rows.push(['Racemes with open flowers (main stem)', `${m.racemesOpen}`, m.racemesOpen >= 5 ? 'ok' : '']);
      rows.push(['Racemes flowered so far', `${m.racemesFlowered} of ${main.racemes.length ? P.FLOWERING.flowers.length : '–'}`]);
    };

    if (mode === 'plant') {
      const t = plant.t;
      const S = plant.seedling;
      if (t < tAt(10)) {
        rows.push(['Shoot', m.epiLen <= 0 ? 'not yet out of the seed' : m.hookTop < 0 ? 'hooked, below ground' : 'hook breaking the surface']);
      } else {
        rows.push(leafRow());
      }
      if (plant.branches.length || crop.variant === 'spring') rows.push(['Side shoots (GS2x)', `${m.sideShoots}`]);
      if (m.extended > 0 && t < tAt(65)) rows.push(['Extended internodes (GS3x)', `${m.extended}`]);
      if (m.height > 0.5) rows.push(['Height', `${m.height.toFixed(0)} cm`]);
      if (m.racemesFlowered > 0 && m.openNow > 0) rows.push(['Racemes with open flowers', `${m.racemesOpen}`]);
      if (m.podsPlant > 0) rows.push(['Pods on the plant', `${m.podsPlant}`]);
      if (K.seed >= 2) rows.push(['Pods black (main stem)', pct(m.podsBlack), m.podsBlack >= 0.9 ? 'ok' : '']);
      if (K.stemRipe > 0.02) rows.push(['Stems dark', pct(m.stemsDark)]);
      // Seedling stages: name the parts.
      const seedP = new THREE.Vector3(0.25, S.seedY, 0.3);
      if (t < tAt(14) && S.seedUsed < 0.9) items.push({ kind: 'label', p: seedP, text: t < tAt(9) ? 'Seed' : 'Seed: cotyledons stay below ground', side: 'left', dx: 70 });
      if (t >= tAt(7) - 0.5 && t < tAt(11)) {
        const tip = main.axis.at(main.tipS).p;
        items.push({ kind: 'label', p: V(tip), text: S.hook > 0.3 ? 'Shoot tip (hooked)' : 'Shoot', side: 'right', dx: 80 });
      }
      if (t >= tAt(10) - 0.3 && t < tAt(13)) {
        items.push({ kind: 'label', p: axisPt(main.scaleS[1]).add(new THREE.Vector3(-0.3, 0, 0)), text: 'Scale leaves (not counted)', tone: 'muted', side: 'left', dx: 70, dy: -10 });
      }
      if (S.rootLen > 0.3 && t < tAt(12)) items.push({ kind: 'label', p: new THREE.Vector3(0, S.seedY - Math.min(S.rootLen, 6) * 0.7, 0), text: K.vL < 0 ? 'Radicle → taproot' : 'Taproot', tone: 'muted', side: 'right', dx: 70 });
      for (const b of plant.branches) {
        if (b.visible && t < tAt(50)) items.push({ kind: 'label', p: V(b.axis.at(Math.min(b.tipS, 3)).p), text: 'Side shoot', tone: 'accent', side: b.axis.at(1).p[0] > 0 ? 'right' : 'left', dx: 70, dy: 6 });
      }
      if (t >= tAt(50) && t < tAt(60) && main.racemes.length) {
        const r = main.racemes[0];
        items.push({ kind: 'label', p: V(r.pedEnd), text: r.enclosed ? 'Buds (hidden)' : 'Flower buds', tone: 'accent', side: 'right', dx: 70 });
      }
      const box = mesh.bounds({ roots: false });
      const below = belowGround({ soil, mesh, box, depth: K.roots - S.seedY, minShown: clamp(P.SEED_DEPTH + 4 + 0.8 * S.rootLen, P.SEED_DEPTH + 10, 34) });
      rows.push(...below.rows);
      items.push(...below.items);
      // Nodules: label one near the top of the roots once they show.
      const nod = mesh.rootSystem.nodules;
      if (nod.length && t < tAt(80)) {
        const n0 = nod.reduce((a, b) => (Math.abs(b.p[0]) > Math.abs(a.p[0]) && b.p[1] > -P.SEED_DEPTH - 8 ? b : a), nod[0]);
        items.push({ kind: 'label', p: V(n0.p), text: 'Nodules (nitrogen fixing)', tone: 'accent', side: n0.p[0] > 0 ? 'right' : 'left', dx: 60, dy: 10 });
        rows.push(['Root nodules', 'on the upper roots', 'ok']);
      }
      goal = below.goal;
    } else if (mode === 'nodes') {
      rows.push(leafRow());
      rows.push(['Nodes with a leaf or scar', `${m.leavesUnfolded} + 2 scale-leaf nodes`]);
      rows.push(['Extended internodes (GS3x)', `${m.extended}`, m.extended ? 'ok' : '']);
      if (plant.branches.length) rows.push(['Side shoots (hidden here)', `${m.sideShoots}`]);
      main.scaleS.forEach((s, i) => items.push({ kind: 'tag', p: axisPt(s).add(new THREE.Vector3(i ? -0.5 : 0.5, 0, 0.3)), text: 'S', tone: 'muted' }));
      for (const L of main.leaves) {
        if (L.e < 0.15) continue;
        const p = V(L.rachis[Math.min(3, L.rachis.length - 1)]);
        items.push({ kind: 'tag', p, text: L.unfolded ? `${L.n}` : `${L.n}?`, tone: L.unfolded ? (L.sen > 0.5 ? 'muted' : 'ok') : 'muted' });
      }
      const nxt = main.leaves.find((L) => !L.unfolded && L.e > 0.15);
      if (nxt) rows.push(['Next leaf', `leaf ${nxt.n} unfolding`]);
      const L1 = main.leaves[0];
      if (L1 && L1.e > 0.6 && plant.t < tAt(14)) items.push({ kind: 'label', p: V(L1.leaflets[0].p).add(V(L1.leaflets[0].dir).multiplyScalar(L1.leaflets[0].len * 0.6)), text: 'Leaf 1: one pair of leaflets', tone: 'muted', side: 'left', dx: 60, dy: -16 });
      const box = mesh.bounds({ roots: false });
      box.min.y = Math.max(box.min.y, -1.5);
      const pts = [box.min, box.max];
      goal = frame(pts, new THREE.Vector3(0.12, 0.12, 1), 1.12, 6);
    } else if (mode === 'flowers') {
      openRows();
      rows.length = m.racemesFlowered ? rows.length : 0;
      if (!m.racemesFlowered) {
        let state;
        if (!m.budsVisible) state = 'enclosed by the young leaves';
        else if (!m.budsSeparate) state = 'visible, still clustered';
        else if (!m.petalsVisible) state = 'separate, closed';
        else state = 'white petals showing';
        rows.push(['Lowest flower buds', state, m.budsVisible ? 'ok' : '']);
      }
      rows.push(['First flowering node', `leaf ${P.FLOWERING.first}`]);
      if (m.openNow) rows.push(['Flowers open now (main stem)', `${m.openNow}`]);
      if (m.pods) rows.push(['Pods set so far', `${m.pods}`]);
      if (m.racemesFlowered || m.budsVisible) rows.push(['Drawing', 'leaves at flowering nodes trimmed to stubs; flowers a little larger than life']);
      // Labels.
      const fl = main.racemes.flatMap((r) => r.flowers.map((f) => ({ r, f })));
      const open = fl.filter(({ f }) => f.state === 'open' && f.wilt < 0.4);
      if (open.length) {
        const { f } = open[Math.floor(open.length / 2)];
        items.push({ kind: 'label', p: V(f.at).add(V(f.dir).multiplyScalar(1.6)), text: 'Open flower: black blotch on each wing petal', side: 'left', dx: 80, dy: -6 });
      }
      const buds = fl.filter(({ f }) => f.state === 'bud' && f.size > 0.3);
      if (buds.length) items.push({ kind: 'label', p: V(buds[buds.length - 1].f.at), text: buds[0].r.enclosed && !m.budsVisible ? 'Buds (inside the young leaves)' : 'Flower buds', tone: 'accent', side: 'right', dx: 80 });
      const wilt = fl.filter(({ f }) => f.state === 'open' && f.wilt >= 0.4);
      if (wilt.length) items.push({ kind: 'label', p: V(wilt[0].f.at), text: 'Fading flowers', tone: 'muted', side: 'right', dx: 80, dy: 16 });
      if (main.pods.length) items.push({ kind: 'label', p: V(main.pods[0].at).add(V(main.pods[0].dir).multiplyScalar(main.pods[0].len * 0.6)), text: 'Young pods', tone: 'muted', side: 'left', dx: 70, dy: 20 });
      const r0 = main.racemes[0];
      if (r0) items.push({ kind: 'tag', p: V(r0.base).add(new THREE.Vector3(0, -0.6, 0.4)), text: `${r0.n}`, tone: 'muted' });
      // Frame the flowering zone: the top two racemes in flower (or the
      // lowest bud cluster before and after flowering) and the next one up.
      const live = main.racemes.filter((r) => r.flowers.some((f) => f.state === 'open' && f.wilt < 0.5));
      let zone = live.length ? live.slice(-2) : main.racemes.slice(0, 1);
      const top = main.racemes.indexOf(zone[zone.length - 1]);
      zone = [...zone, ...main.racemes.slice(top + 1, top + 2)];
      const pts = [];
      for (const r of zone) {
        pts.push(V(r.base).add(new THREE.Vector3(0, -2, 0)), V(r.base).add(new THREE.Vector3(0, 2.5, 0)));
        for (const f of r.flowers) if (f.state === 'open' || f.state === 'bud') pts.push(V(f.at).add(V(f.dir).multiplyScalar(2.5)));
      }
      if (!pts.length) pts.push(axisPt(main.tipS), axisPt(Math.max(0, main.tipS - 8)));
      goal = frame(pts, new THREE.Vector3(0.25, 0.1, 1), 1.25, 10);
    } else if (mode === 'pods') {
      const pods = main.pods;
      rows.push(['Pods at final length (main stem)', pct(m.podsFinal), m.podsFinal >= 0.9 ? 'ok' : '']);
      rows.push(['Pods on main stem · whole plant', `${m.pods} · ${m.podsPlant}`]);
      if (pods.length) rows.push(['Lowest pod', `${pods[0].len.toFixed(1)} cm long`]);
      if (K.seed >= 2) rows.push(['Pods ripe and black (main stem)', pct(m.podsBlack), m.podsBlack >= 0.9 ? 'ok' : '']);
      if (m.podsPlant) rows.push(['Seeds per pod', `${(m.seedsPlant / m.podsPlant).toFixed(1)}`]);
      rows.push(['Drawing', 'main stem only; leaves at the pod nodes trimmed to stubs']);
      const black = pods.filter((p) => p.ripe);
      const green = pods.filter((p) => !p.ripe && p.size >= 0.99);
      const growing = pods.filter((p) => p.size < 0.99);
      const tip = (p) => V(p.at).add(V(p.dir).multiplyScalar(p.len * 0.55));
      if (black.length) items.push({ kind: 'label', p: tip(black[0]), text: 'Ripe pods: black, leathery', tone: 'ok', side: 'left', dx: 80 });
      if (green.length) items.push({ kind: 'label', p: tip(green[green.length - 1]), text: K.seed >= 2 ? 'Pods still green' : 'Full-length pods', tone: K.seed >= 2 ? 'muted' : 'ok', side: 'right', dx: 80 });
      if (growing.length) items.push({ kind: 'label', p: tip(growing[growing.length - 1]), text: 'Pods still lengthening', tone: 'muted', side: 'right', dx: 80, dy: -16 });
      const pts = [];
      for (const p of pods) { pts.push(V(p.at)); pts.push(V(p.at).add(V(p.dir).multiplyScalar(p.len + 0.5))); }
      if (main.racemes.length) {
        const r0 = main.racemes[0], rl = main.racemes[Math.min(main.racemes.length - 1, P.PODS.perNode.length)];
        pts.push(V(r0.base).add(new THREE.Vector3(0, -3, 0)), V(rl.base).add(new THREE.Vector3(0, 3, 0)));
      }
      if (!pts.length) pts.push(axisPt(main.tipS * 0.4), axisPt(main.tipS * 0.7));
      goal = frame(pts, new THREE.Vector3(0.3, 0.12, 1), 1.15, 12);
      goal.width = Math.max(goal.width, 16);
    } else if (mode === 'seed') {
      const A = podView.anchors;
      const s = clamp(K.seed, 0, 5);
      items.push({ kind: 'label', p: A.whole, text: 'Whole pod (middle of main stem)', tone: 'muted', side: 'right', dx: 60, dy: -24 });
      if (s >= 0.5) items.push({ kind: 'label', p: A.seed, text: 'Seeds in the pod', side: 'left', dx: 50, dy: -10 });
      items.push({ kind: 'label', p: A.lining, text: s >= 4 ? 'Lining: dry, papery' : 'White, spongy lining', tone: 'muted', side: 'right', dx: 60, dy: 14 });
      if (s >= 0.5) items.push({ kind: 'label', p: A.hilum, text: s >= 2.8 ? 'Hilum: black' : 'Hilum (seed scar)', tone: s >= 2.8 ? 'ok' : 'muted', side: 'right', dx: 50, dy: -6 });
      if (s >= 0.5) items.push({ kind: 'label', p: A.loose, text: 'Seeds, true size', tone: 'muted', side: 'left', dx: 40, dot: false });
      items.push({ kind: 'dim', p0: A.scale0, p1: A.scale1, text: '1 cm', offset: 0 });
      rows.push(['Seed (middle of main stem)', beanSeedText(s)]);
      rows.push(['Pods ripe and black (main stem)', pct(m.podsBlack), m.podsBlack >= 0.9 ? 'ok' : '']);
      if (s >= 1.5) rows.push(['Lowest · highest pod', [m.lowestPodSeed, m.topPodSeed].map((x) => beanSeedText(x).split(';')[0].split(',')[0].toLowerCase()).join(' · ')]);
      goal = { target: new THREE.Vector3(0, -0.2, 0), height: 7.6, width: 12.5, dir: new THREE.Vector3(0, 0.12, 1) };
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
