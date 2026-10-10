// Turns the numbers from morphology.js into three.js geometry.
//
// Geometry is rebuilt whenever the timeline moves. Every part of the plant of
// the same kind (all blades, all sheaths…) is merged into one mesh, so the
// whole plant is a handful of draw calls.

import * as THREE from 'three';
import { clamp, lerp, smoothstep, hash } from '../model/interp.js';
import { PALETTE as P, mix, rgb } from './materials.js';
import { grainGeometry, stateAt as grainState } from './grain-view.js';
import { SEED_DEPTH } from '../model/morphology.js';
import { redrawRoots } from './roots-mesh.js';

const UP = new THREE.Vector3(0, 1, 0);
const TWO_PI = Math.PI * 2;

// ---------------------------------------------------------------------------
// Merged-geometry batch
// ---------------------------------------------------------------------------
export class Batch {
  constructor(name, material, { cut = null, shadow = true } = {}) {
    this.geometry = new THREE.BufferGeometry();
    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.name = name;
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = shadow;
    this.mesh.receiveShadow = true;
    if (cut) {
      this.cutMesh = new THREE.Mesh(this.geometry, cut);
      this.cutMesh.frustumCulled = false;
      this.cutMesh.visible = false;
    }
    this.reset();
  }
  reset() {
    this.pos = []; this.col = []; this.uv = []; this.idx = []; this.n = 0;
  }
  vert(p, c, u, v) {
    this.pos.push(p.x, p.y, p.z);
    this.col.push(c[0], c[1], c[2]);
    this.uv.push(u, v);
    return this.n++;
  }
  // (nu+1) x (nv+1) vertex grid. fn(i, j, o) fills o.p (Vector3), o.c, o.u, o.v.
  grid(nu, nv, fn, flip = false) {
    const base = this.n;
    const o = { p: new THREE.Vector3(), c: P.leaf, u: 0, v: 0 };
    for (let i = 0; i <= nu; i++) {
      for (let j = 0; j <= nv; j++) {
        fn(i, j, o);
        this.vert(o.p, o.c, o.u, o.v);
      }
    }
    for (let i = 0; i < nu; i++) {
      for (let j = 0; j < nv; j++) {
        const a = base + i * (nv + 1) + j;
        const b = a + nv + 1;
        if (flip) this.idx.push(a, a + 1, b, b, a + 1, b + 1);
        else this.idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  commit() {
    // A fresh geometry each rebuild: buffer sizes change as the plant grows.
    this.geometry.dispose();
    const g = this.geometry = new THREE.BufferGeometry();
    this.mesh.geometry = g;
    if (this.cutMesh) this.cutMesh.geometry = g;
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setIndex(this.idx);
    g.computeVertexNormals();
    g.computeBoundingSphere();
    g.computeBoundingBox();
  }
}

export class Lines {
  constructor(name, material) {
    this.geometry = new THREE.BufferGeometry();
    this.mesh = new THREE.LineSegments(this.geometry, material);
    this.mesh.name = name;
    this.mesh.frustumCulled = false;
    this.pos = [];
  }
  reset() { this.pos = []; }
  seg(a, b) { this.pos.push(a.x, a.y, a.z, b.x, b.y, b.z); }
  commit() {
    this.geometry.dispose();
    this.geometry = this.mesh.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    this.geometry.computeBoundingSphere();
  }
}

// ---------------------------------------------------------------------------
// Shoot axis: a gently curving line. Tillers lean out at the base and turn
// upwards (gravitropism), so most of the lean is near the crown.
// ---------------------------------------------------------------------------
export function makeAxis(sh, sMax) {
  const step = 0.4;
  const n = Math.ceil(sMax / step) + 2;
  const pts = [], tans = [], quats = [];
  const leanTop = sh.lean * 0.4;
  const p = new THREE.Vector3(...sh.base);
  for (let i = 0; i < n; i++) {
    const s = i * step;
    let phi = leanTop + (sh.lean - leanTop) * Math.exp(-s / 6);
    if (sh.neck) phi += sh.neck.angle * smoothstep(sh.neck.s0, sh.neck.s1, s);
    const t = new THREE.Vector3(Math.sin(phi) * Math.cos(sh.az), Math.cos(phi), Math.sin(phi) * Math.sin(sh.az));
    pts.push(p.clone());
    tans.push(t);
    quats.push(new THREE.Quaternion().setFromUnitVectors(UP, t));
    p.addScaledVector(t, step);
  }
  const tmpQ = new THREE.Quaternion();
  return {
    at(s, out = {}) {
      const x = clamp(s / step, 0, n - 1.001);
      const i = Math.floor(x), f = x - i;
      out.p = (out.p || new THREE.Vector3()).lerpVectors(pts[i], pts[i + 1], f);
      out.t = (out.t || new THREE.Vector3()).lerpVectors(tans[i], tans[i + 1], f).normalize();
      out.q = (out.q || tmpQ.clone()).slerpQuaternions(quats[i], quats[i + 1], f);
      return out;
    },
    // Unit vector pointing out from the axis at azimuth a (radians).
    radial(q, a, out = new THREE.Vector3()) {
      return out.set(Math.cos(a), 0, Math.sin(a)).applyQuaternion(q);
    },
  };
}

// Collar shape defaults (wheat). A crop's params.COLLAR overrides these.
//   ligule: ligule height (cm), sweep: how far each auricle wraps round the
//   stem (radians), rise/width: auricle claw size (cm), flare: how far the
//   upper edge stands out from the stem (× width), overlap: extra radius
//   for the outer auricle where they cross, hairs: hairy auricle margins.
const WHEAT_COLLAR = { ligule: 0.2, sweep: 1.25, rise: 0.12, width: 0.14, flare: 0.4, overlap: 0, hairs: true };

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------
export class PlantMesh {
  // crop: from src/crops — supplies the collar (ligule/auricle) shape and the
  // grain used for the seed.
  constructor(M, crop) {
    this.M = M;
    this.crop = crop;
    this.group = new THREE.Group();
    this.blades = new Batch('blades', M.blade);
    this.sheaths = new Batch('sheaths', M.sheath, { cut: M.cut });
    this.stems = new Batch('stems', M.stem, { cut: M.cut });
    this.ligules = new Batch('ligules', M.ligule, { shadow: false });
    this.auricles = new Batch('auricles', M.auricle, { shadow: false });
    this.hairs = new Lines('hairs', M.hair);
    this.roots = new Batch('roots', M.root, { shadow: false });
    this.seed = new THREE.Mesh(new THREE.BufferGeometry(), M.seed);
    this.seed.castShadow = false;
    for (const b of [this.blades, this.sheaths, this.stems, this.ligules, this.auricles, this.roots]) {
      this.group.add(b.mesh);
      if (b.cutMesh) this.group.add(b.cutMesh);
    }
    this.group.add(this.hairs.mesh, this.seed);
    this.seedKey = null;
    this.axes = new Map();
    this.anchors = {}; // world points used by overlays and the camera
  }

  // opts.mode: 'plant' | 'stem' | 'collar' | 'ear' | 'grain'
  build(plant, opts) {
    const section = opts.mode === 'stem';
    for (const b of [this.blades, this.sheaths, this.stems, this.ligules, this.auricles, this.hairs, this.roots]) b.reset();
    this.anchors = {};
    this.rootArgs = null; // set by buildSeedling (plant and stem views)
    this.rootSystem = null;
    this.axes.clear();
    const shoots = opts.mode === 'plant' ? plant.shoots : [plant.main];
    // Stem view: leaves are trimmed off just above the ear/top node, like the
    // split shoot in the AHDB node-counting diagram.
    const ms = plant.main;
    const trimS = opts.mode === 'stem' ? Math.max(ms.earTop, ms.nodeS[4]) + 2.5 : Infinity;
    const foldN = opts.mode === 'collar' ? ([...ms.leaves].reverse().find((l) => l.emerge >= 1) || {}).n : -1;
    for (const sh of shoots) this.buildShoot(sh, plant, { ...opts, section, trimS, foldN, isMain: sh === plant.main });
    for (const b of [this.blades, this.sheaths, this.stems, this.ligules, this.auricles, this.hairs, this.roots]) b.commit();
    this.sheaths.cutMesh.visible = section;
    this.stems.cutMesh.visible = section;
    this.blades.mesh.visible = opts.mode !== 'stem';
    this.roots.mesh.visible = opts.mode === 'stem' || opts.mode === 'plant';
    this.seed.visible = this.roots.mesh.visible && this.seed.visible;
  }

  // Roots, drawn after build() once the view has chosen the soil depth and
  // framing (opts: views/below-ground.js rootOptions).
  setRoots(opts) {
    this.rootSystem = redrawRoots(this.roots, this.rootArgs, opts);
  }

  buildShoot(sh, plant, opts) {
    // Room above the ear for awns bundled in the boot (barley).
    let sMax = Math.max(sh.earTop + sh.awnLen, ...sh.leaves.map((l) => l.collarS)) + 1;
    const axis = makeAxis(sh, sMax);
    this.axes.set(sh.id, axis);
    const K = sh.K;
    const ripe = K.ripe;
    const sc = sh.scale;
    const fr = {};

    // ---- Stem (culm) ------------------------------------------------------
    // Visible only where sheaths don't cover it: between collars, the
    // peduncle, and in section views.
    const nodes = sh.nodeS;
    const stemTop = sh.earBase + 0.05;
    // Nodes only show as swollen bands once the internodes either side of
    // them have started to extend; before that they are packed in the crown.
    const lens = [...sh.ints, sh.ped];
    const nodeBulge = (s) => {
      let b = 0;
      for (let m = 0; m < nodes.length; m++) {
        const formed = smoothstep(0.2, 1, Math.max(lens[m] ?? 0, m > 0 ? lens[m - 1] : 0));
        b = Math.max(b, formed * (1 - Math.abs(s - nodes[m]) / 0.16));
      }
      return clamp(b);
    };
    const stemR = (s) => sh.stemRadius(s) * (1 + 0.14 * nodeBulge(s));
    const stemCol = (s) => {
      const base = mix(P.stem, P.stemRipe, smoothstep(0.35, 0.95, ripe + 0.1 * (1 - s / stemTop)));
      const nodeC = mix(P.node, P.nodeRipe, smoothstep(0.4, 1, ripe));
      return mix(base, nodeC, nodeBulge(s) * 0.85);
    };
    const stemRings = Math.max(6, Math.min(260, Math.ceil(stemTop / 0.18)));
    const RAD = 12;
    this.stems.grid(stemRings, RAD, (i, j, o) => {
      const s = (stemTop * i) / stemRings;
      axis.at(s, fr);
      const a = (TWO_PI * j) / RAD;
      o.p.copy(fr.p).addScaledVector(axis.radial(fr.q, a), stemR(s));
      o.c = stemCol(s);
      o.u = j / RAD; o.v = s / 3;
    });
    if (opts.section) {
      // Hollow internodes: a cavity (inward-facing tube with end caps) inside
      // each elongated internode. Nodes stay solid, as in a real stem.
      const segs = [];
      for (let m = 0; m < 4; m++) segs.push([nodes[m], nodes[m + 1]]);
      segs.push([nodes[4], stemTop]);
      for (const [a0, a1] of segs) {
        const s0 = a0 + 0.14, s1 = a1 - (a1 === stemTop ? 0.05 : 0.14);
        if (s1 - s0 < 0.12) continue;
        const rings = Math.max(2, Math.ceil((s1 - s0) / 0.4));
        const ir = (s) => stemR(s) * 0.62;
        this.stems.grid(rings, RAD, (i, j, o) => {
          const s = s0 + ((s1 - s0) * i) / rings;
          axis.at(s, fr);
          o.p.copy(fr.p).addScaledVector(axis.radial(fr.q, (TWO_PI * j) / RAD), ir(s));
          o.c = P.cut; o.u = 0; o.v = 0;
        }, true);
        // End caps (diaphragms of the nodes), facing into the cavity.
        for (const [s, dir] of [[s0, 1], [s1, -1]]) {
          axis.at(s, fr);
          const center = fr.p.clone();
          this.stems.grid(1, RAD, (i, j, o) => {
            const r = i === 0 ? 0 : ir(s);
            o.p.copy(center).addScaledVector(axis.radial(fr.q, (TWO_PI * j) / RAD), r);
            o.c = mix(P.node, P.cut, 0.3); o.u = 0; o.v = 0;
          }, dir < 0);
        }
      }
    }

    if (sh.seedling && (opts.mode === 'plant' || opts.mode === 'stem')) this.buildSeedling(sh, axis, opts);

    // ---- Leaves -----------------------------------------------------------
    for (const L of sh.leaves) {
      // Only leaves that exist at this stage: primordia inside the shoot, not
      // future leaves, and not lower leaves that have rotted away.
      if (!L.present || !L.sheath) continue;
      this.buildSheath(sh, L, axis, opts, ripe);
      if (L.emerge > 0.001 && opts.mode !== 'stem') this.buildBlade(sh, L, axis, opts);
      if (L.emerge >= 0.98 && L.collarS < opts.trimS) this.buildCollar(sh, L, axis, opts);
    }

    // Anchors for overlays (main shoot only).
    if (opts.isMain) {
      const w = (s) => axis.at(s, {}).p.clone();
      const flag = sh.leaves[sh.leaves.length - 1];
      const leaf2 = sh.leaves[sh.leaves.length - 2];
      const visibleCollar = [...sh.leaves].reverse().find((l) => l.emerge >= 1) || flag;
      this.anchors = {
        ...this.anchors,
        nodes: nodes.map(w),
        nodeS: nodes.slice(),
        crown: w(0),
        earBase: w(sh.earBase),
        earTop: w(sh.earTop),
        earMid: w(sh.earBase + sh.earLen / 2),
        flagCollar: w(flag.collarS),
        leaf2Collar: w(leaf2.collarS),
        visibleCollar: w(visibleCollar.collarS),
        visibleCollarLeaf: visibleCollar,
        prevCollar: w(visibleCollar.prevCollarS),
        foldBlade: this.foldBladePoint ? this.foldBladePoint.clone() : null,
        collarRadius: visibleCollar.collarR,
        flagBladeDir: axis.radial(axis.at(flag.collarS, {}).q, flag.az),
        axisTop: w(sMax - 1),
        stemRadius: sh.stemR,
      };
    }
  }

  // Below ground: seed, coleoptile, sub-crown internode, seminal and crown
  // roots. Positions follow AHDB's seedling drawings (seed at drilling depth,
  // coleoptile up to the surface, crown forming just below it).
  buildSeedling(sh, axis, opts) {
    const S = sh.seedling;
    const x0 = sh.base[0], z0 = sh.base[2];
    const seedTop = S.seedY + 0.1;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);

    // Seed (caryopsis): swells slightly when it takes up water, then shrivels
    // and darkens as its reserves feed the seedling.
    const used = S.seedUsed;
    this.seed.visible = used < 0.97;
    if (this.seed.visible) {
      const key = Math.round(used * 20);
      if (key !== this.seedKey) {
        this.seedKey = key;
        const st = grainState(5, this.crop.params.GRAIN?.states);
        st.coat = mix(st.coat, rgb('#7d6244'), used * 0.85);
        this.seed.geometry.dispose();
        this.seed.geometry = grainGeometry(st, { shape: this.crop.params.GRAIN?.shape });
      }
      const k = 1.05 - 0.45 * used;
      this.seed.scale.set(k, k, k * (1 - 0.35 * used));
      // Lying on its side, embryo end towards the shoot.
      this.seed.rotation.set(0, 0.5, Math.PI / 2 * 0.92);
      this.seed.position.set(x0 - 0.3 * k, S.seedY, z0 - 0.05);
    }

    // Sub-crown internode: thin white stalk from the seed up to the crown.
    const baseY = sh.base[1];
    if (baseY - seedTop > 0.05) {
      this.stems.grid(Math.max(2, Math.ceil((baseY - seedTop) / 0.3)), 8, (i, j, o) => {
        const y = lerp(seedTop, baseY, i / Math.max(2, Math.ceil((baseY - seedTop) / 0.3)));
        const a = (TWO_PI * j) / 8;
        o.p.set(x0 + Math.cos(a) * 0.028, y, z0 + Math.sin(a) * 0.028);
        o.c = rgb('#ece6d2'); o.u = 0; o.v = 0;
      });
    }

    // Coleoptile: pale, pointed sheath from the seed to the surface. The
    // first leaf grows out through its tip; afterwards it withers away.
    const len = S.coleoLen * (1 - 0.7 * S.coleoGone);
    if (len > 0.05 && S.coleoGone < 0.98) {
      const inner = sh.leaves[0]?.sheath?.[0]?.r ?? 0.04;
      const R = Math.max(0.065, inner + 0.014);
      const col = mix(rgb('#e3e6c4'), rgb('#b49c70'), S.coleoSen);
      const rings = Math.max(4, Math.ceil(len / 0.25));
      this.sheaths.grid(rings, 10, (i, j, o) => {
        const f = i / rings;
        const y = seedTop + len * f;
        // Rounded base, parallel sides, pointed tip (open once a leaf is through).
        const tipLen = Math.min(0.35, len * 0.3);
        const tip = clamp((len * (1 - f)) / tipLen);
        const r = R * Math.sqrt(tip) * (0.75 + 0.25 * smoothstep(0, 0.15, f)) * (1 - 0.3 * S.coleoSen);
        const a = (TWO_PI * j) / 10;
        o.p.set(x0 + Math.cos(a) * r, y, z0 + Math.sin(a) * r);
        o.c = col; o.u = j / 10; o.v = y / 3;
      });
    }

    // Roots (model/roots.js): seminal roots from the seed, nodal roots from
    // the crown. Drawn by setRoots once the view knows the framing. In the
    // stem view they are just short stubs (the stem-width exaggeration
    // would stretch them sideways).
    const R = this.crop.params.ROOTS;
    this.rootArgs = {
      spec: R,
      st: { depth: S.rootDepth, leafClock: S.leafClock, seed: [x0 + 0.03, S.seedY - 0.08, z0], crown: [x0, baseY, z0] },
      stub: opts.mode === 'stem' ? 1.8 : 0,
      colours: { root: P.root, old: rgb('#cbb994') },
    };
    this.anchors.seedling = {
      seed: V(x0 - 0.35, S.seedY, z0),
      coleoTip: V(x0, seedTop + S.coleoLen * 0.85, z0),
      subcrown: V(x0, (seedTop + baseY) / 2, z0),
      crown: V(x0, baseY, z0),
      present: { coleo: len > 0.05 && S.coleoGone < 0.5, seed: used < 0.9, subcrown: baseY - seedTop > 0.5, crownRoots: S.rootDepth > 0 && S.leafClock >= R.nodal.start + 1 / R.nodal.perLeaf },
    };
  }

  buildSheath(sh, L, axis, opts, ripe) {
    let prof = L.sheath;
    if (L.nodeS >= opts.trimS) return;
    if (prof[prof.length - 1].s > opts.trimS) {
      prof = prof.filter((q) => q.s < opts.trimS);
      const last = prof[prof.length - 1];
      prof.push({ s: opts.trimS, r: last.r, inner: last.inner });
    }
    if (prof.length < 2) return;
    const rings = prof.length - 1;
    const RAD = 14;
    const fr = {};
    const senS = Math.max(Math.pow(L.sen, 1.6) * 0.9, smoothstep(0.2, 0.9, ripe));
    const baseC = mix(L.top <= 2 ? P.sheath : P.sheathPale, P.sheath, 0.5);
    const col = senS < 0.5 ? mix(baseC, P.leafYellow, senS * 2) : mix(P.leafYellow, P.leafDead, (senS - 0.5) * 2);
    // Sheath margins overlap on the side opposite the blade. When the flag
    // leaf sheath opens (GS47) a gap appears there towards the top.
    const gapCenter = L.az + Math.PI;
    const gapAt = (f) => L.sheathOpen * 1.5 * smoothstep(0.55, 1, f);
    // At the collar the sheath flares slightly on the blade side, running
    // smoothly into the blade base instead of ending as a hard rim.
    const sTop = prof[rings].s;
    const flareAt = (s, a) => smoothstep(sTop - 0.5, sTop, s) * Math.pow(Math.max(0, Math.cos(a - L.az)), 2) * 0.03 * sh.scale;
    const build = (inner, flip, c) => this.sheaths.grid(rings, RAD, (i, j, o) => {
      const q = prof[i];
      axis.at(q.s, fr);
      const gap = gapAt(i / rings);
      const a = gapCenter + gap / 2 + ((TWO_PI - gap) * j) / RAD;
      const r = inner ? Math.max((q.inner ?? q.r * 0.9) + 0.004, q.r - 0.012) : q.r + flareAt(q.s, a);
      o.p.copy(fr.p).addScaledVector(axis.radial(fr.q, a), r);
      o.c = c; o.u = j / RAD; o.v = q.s / 4;
    }, flip);
    build(false, false, col);
    if (opts.section) build(true, true, mix(col, P.cut, 0.6));
  }

  buildBlade(sh, L, axis, opts) {
    const len = L.bladeLen;
    if (len < 0.05) return;
    const fr = {};
    axis.at(L.bladeBaseS, fr);
    const radial = axis.radial(fr.q, L.az);
    // Emerging blades come out of the centre of the whorl; once fully out the
    // blade base sits on the edge of its own sheath at the collar.
    const offR = lerp(0, L.collarR ?? 0.2, smoothstep(0.88, 1, L.emerge));
    const p0 = fr.p.clone().addScaledVector(radial, offR);
    // Collar view: the inspected blade is bent back, as you would in the
    // field, to expose the ligule.
    const tilt = opts.isMain && opts.foldN === L.n ? Math.min(L.tilt + 0.6, 1.25) : L.tilt;
    const d0 = fr.t.clone().multiplyScalar(Math.cos(tilt)).addScaledVector(radial, Math.sin(tilt)).normalize();
    const phi0 = Math.acos(clamp(d0.dot(UP), -1, 1));
    const horiz = new THREE.Vector3(d0.x, 0, d0.z);
    if (horiz.lengthSq() < 1e-6) horiz.set(radial.x, 0, radial.z);
    horiz.normalize();

    const SEG = Math.max(8, Math.min(34, Math.ceil(len / 0.8)));
    const ACROSS = 6;
    // Integrate the midrib path.
    const pts = [], tans = [], sides = [];
    const p = p0.clone();
    const ds = len / SEG;
    for (let i = 0; i <= SEG; i++) {
      const u = i / SEG;
      const phi = Math.min(phi0 + L.droop * Math.pow(u, 1.5), Math.PI * 0.92);
      const swayA = L.sway * u * u;
      const h = horiz.clone().applyAxisAngle(UP, swayA);
      const t = UP.clone().multiplyScalar(Math.cos(phi)).addScaledVector(h, Math.sin(phi)).normalize();
      // Width direction: horizontal and perpendicular to the bending plane,
      // then twisted about the midrib.
      const side = new THREE.Vector3().crossVectors(UP, h).normalize();
      side.applyAxisAngle(t, L.twist * u);
      pts.push(p.clone());
      tans.push(t);
      sides.push(side);
      p.addScaledVector(t, ds);
      // Leaves resting on the soil.
      if (p.y < 0.15 && t.y < 0) p.y = 0.15;
    }

    if (opts.isMain && opts.foldN === L.n) this.foldBladePoint = pts[Math.round(SEG * 0.2)].clone();
    const w0 = L.width;
    const sen = L.sen;
    const top = L.top;
    const green = L.flag ? P.flag : top <= 3 ? P.leafDeep : P.leaf;
    const baseGreen = mix(P.leafYoung, green, smoothstep(0.3, 1, L.emerge));
    const n = new THREE.Vector3();
    this.blades.grid(SEG, ACROSS, (i, j, o) => {
      const u = i / SEG;
      const v = (j / ACROSS) * 2 - 1;
      // Wheat blade outline: slightly narrowed at the collar, parallel-sided,
      // tapering gradually to an acute tip over the last ~40%.
      let wf = (0.42 + 0.58 * smoothstep(0, 0.16, u)) * (u < 0.58 ? 1 : 1 - Math.pow((u - 0.58) / 0.42, 1.5));
      wf = Math.max(wf, 0.0);
      // Cross-section: rolled while emerging, a shallow V (midrib keel) when flat.
      const c = clamp(L.curl * lerp(1, 0.85, u), 0, 0.96);
      // Emerging leaves are convolute (rolled over on themselves), so the
      // rolled spike is slimmer than one turn of the blade would be.
      const hw = ((w0 * wf) / 2) * lerp(1, 0.5, c);
      const a = v * hw;
      let x, y;
      if (c > 0.01 && hw > 1e-4) {
        const k = (c * Math.PI) / hw;
        x = Math.sin(k * a) / k;
        // Subtract the mean offset so a rolled blade is centred on its
        // midrib line (and so on the shoot axis while it emerges), rather
        // than curling off to one side.
        y = (1 - Math.cos(k * a)) / k - (1 - Math.sin(k * hw) / (k * hw)) / k;
      } else { x = a; y = 0; }
      y += Math.abs(v) * hw * 0.22;
      n.crossVectors(tans[i], sides[i]).normalize(); // blade "up" (adaxial)
      o.p.copy(pts[i]).addScaledVector(sides[i], x).addScaledVector(n, y);
      // Senescence starts at the tip and moves down the blade.
      const local = smoothstep(0, 0.6, sen * 1.7 - (1 - u) * 0.9);
      let col = local < 0.5 ? mix(baseGreen, P.leafYellow, local * 2) : mix(P.leafYellow, P.leafDead, (local - 0.5) * 2);
      if (local > 0.85) col = mix(col, P.leafDeadDark, hash('dd', sh.k, L.n, i) * 0.5);
      o.c = col;
      o.u = (v + 1) / 2;
      o.v = (u * L.fullLen) / 20;
    });
  }

  buildCollar(sh, L, axis, opts) {
    const fr = {};
    axis.at(L.collarS, fr);
    const r = L.collarR ?? 0.25;
    const RAD = 14;
    const sc = sh.scale;
    const C = { ...WHEAT_COLLAR, ...this.crop.params.COLLAR };
    // Ligule: a short, membranous, whitish fringe rising from the inside of
    // the collar against the stem. Short in wheat (~1 mm in life; exaggerated
    // slightly here so it can be seen).
    const ligH = C.ligule * sc; // ~1–2 mm in life, slightly exaggerated
    const ligCol = mix(P.ligule, P.leafDead, L.sen * 0.6);
    this.ligules.grid(2, RAD, (i, j, o) => {
      const a = L.az - 1.2 + (2.4 * j) / RAD; // on the blade side
      const f = i / 2;
      const edge = 1 - 0.35 * Math.pow(Math.abs(j / RAD - 0.5) * 2, 2);
      axis.at(L.collarS + ligH * f * edge, fr);
      o.p.copy(fr.p).addScaledVector(axis.radial(fr.q, a), r * (0.93 - 0.05 * f));
      o.c = ligCol; o.u = 0; o.v = 0;
    });
    // Auricles: two claw-like lobes at the base of the blade that wrap round
    // the stem. Wheat auricles are small and hairy, wrapping part way round;
    // barley's are large and hairless and cross over on the far side.
    const aurCol = mix(P.auricle, P.leafDead, L.sen);
    const halfSpan = Math.min(1.3, (L.width * 0.5) / Math.max(r, 0.05));
    for (const side of [-1, 1]) {
      const a0 = L.az + side * halfSpan * 0.9;
      const sweep = C.sweep * side; // wraps round towards the back of the stem
      const SEG = 6;
      const pts = [];
      this.auricles.grid(SEG, 1, (i, j, o) => {
        const f = i / SEG;
        const a = a0 + sweep * f;
        const h = (0.03 + C.rise * Math.sin(f * Math.PI * 0.9)) * sc; // claw curves up then in
        const width = C.width * sc * (1 - f * 0.85);
        axis.at(L.collarS + h + (j ? width : 0) * 0.5, fr);
        // Where the tips cross over, one auricle lies outside the other.
        const rr = r * (1.02 + 0.04 * f) + (j ? width * C.flare : 0) + (side > 0 ? C.overlap * f : 0);
        o.p.copy(fr.p).addScaledVector(axis.radial(fr.q, a), rr);
        if (j === 1) pts.push(o.p.clone());
        o.c = aurCol; o.u = 0; o.v = 0;
      });
      // Hairs on the auricle margin.
      if (C.hairs) for (let q = 0; q < pts.length; q++) {
        const a = a0 + sweep * (q / SEG);
        axis.at(L.collarS, fr);
        const out = axis.radial(fr.q, a).multiplyScalar(0.09 * sc).addScaledVector(fr.t, 0.05 * sc);
        this.hairs.seg(pts[q], pts[q].clone().add(out));
      }
    }
  }
}
