// Turns the oilseed rape model (model/brassica.js) into three.js geometry.
//
// Like plant-mesh.js, everything of one kind is merged into one batch (all
// leaves, all stems, all petals…) and rebuilt when the timeline moves. The
// model already gives world positions (leaf midribs, raceme axes, flower
// positions), so this file only adds surfaces: tubes round axes, leaf blades
// either side of each midrib, buds, petals and pods.

import * as THREE from 'three';
import { clamp, lerp, smoothstep, hash } from '../model/interp.js';
import { rgb, mix } from './materials.js';
import { Batch } from './plant-mesh.js';
import { redrawRoots } from './roots-mesh.js';

const TWO_PI = Math.PI * 2;
const UP = new THREE.Vector3(0, 1, 0);
const V = (p) => new THREE.Vector3(p[0], p[1], p[2]);

// A unit vector perpendicular to t.
function perp(t) {
  const ref = Math.abs(t.y) < 0.9 ? UP : new THREE.Vector3(1, 0, 0);
  return new THREE.Vector3().crossVectors(t, ref).normalize();
}

// Frames along a polyline: tangent t and two normals e1, e2 (parallel
// transported so tubes don't twist), with cross(t, e2) = e1 so the tube
// faces point outwards.
function frames(pts) {
  const n = pts.length;
  const out = [];
  let e1 = null;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const t = b.clone().sub(a);
    if (t.lengthSq() < 1e-12) t.copy(out[i - 1]?.t ?? UP);
    t.normalize();
    if (!e1) e1 = perp(t);
    else e1 = e1.clone().addScaledVector(t, -e1.dot(t)).normalize();
    if (!isFinite(e1.x) || e1.lengthSq() < 0.5) e1 = perp(t);
    const e2 = new THREE.Vector3().crossVectors(e1, t);
    out.push({ t, e1, e2 });
  }
  return out;
}

// Tube along points. r(i) radius, c(i) colour.
function tube(batch, pts, r, c, RAD = 8) {
  if (pts.length < 2) return;
  const F = frames(pts);
  batch.grid(pts.length - 1, RAD, (i, j, o) => {
    const a = (TWO_PI * j) / RAD;
    const { e1, e2 } = F[i];
    const rr = r(i);
    o.p.copy(pts[i]).addScaledVector(e1, Math.cos(a) * rr).addScaledVector(e2, Math.sin(a) * rr);
    o.c = c(i); o.u = j / RAD; o.v = i / 4;
  });
}

// Ellipsoid of length L and radius R centred on c along unit axis d.
function ellipsoid(batch, c, d, L, R, col, NU = 6, NV = 8) {
  const e1 = perp(d), e2 = new THREE.Vector3().crossVectors(e1, d);
  batch.grid(NU, NV, (i, j, o) => {
    const th = (Math.PI * i) / NU;
    const a = (TWO_PI * j) / NV;
    const rr = R * Math.sin(th);
    o.p.copy(c).addScaledVector(d, -Math.cos(th) * L / 2).addScaledVector(e1, Math.cos(a) * rr).addScaledVector(e2, Math.sin(a) * rr);
    o.c = typeof col === 'function' ? col(i / NU) : col; o.u = 0; o.v = 0;
  });
}

export class BrassicaMesh {
  constructor(M, crop) {
    this.M = M;
    this.crop = crop;
    this.P = crop.params;
    this.C = Object.fromEntries(Object.entries(this.P.COLOURS).map(([k, v]) => [k, rgb(v)]));
    this.seedCols = this.P.SEEDS.map((s) => ({ ...s, col: rgb(s.col), pod: rgb(s.pod) }));
    this.group = new THREE.Group();
    this.leaves = new Batch('leaves', M.netLeaf);
    this.stems = new Batch('stems', M.stem);
    this.roots = new Batch('roots', M.root, { shadow: false });
    this.petals = new Batch('petals', M.petal, { shadow: false });
    this.parts = new Batch('parts', M.pod);
    for (const b of this.batches()) this.group.add(b.mesh);
    this.seed = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshStandardMaterial({ color: new THREE.Color(this.P.COLOURS.seedCoat), roughness: 0.4 }));
    this.group.add(this.seed);
  }

  batches() { return [this.leaves, this.stems, this.roots, this.petals, this.parts]; }

  // Seed colour state → { col, pod } colours.
  seedColour(s) {
    const S = this.seedCols;
    let i = 0;
    while (i < S.length - 2 && s > S[i + 1].s) i++;
    const f = clamp((s - S[i].s) / (S[i + 1].s - S[i].s));
    return { col: mix(S[i].col, S[i + 1].col, f), pod: mix(S[i].pod, S[i + 1].pod, f) };
  }

  // opts.mode: 'plant' | 'leaves' | 'stem' | 'buds' | 'pods'
  build(plant, opts) {
    for (const b of this.batches()) b.reset();
    const mode = opts.mode;
    this.stub = mode === 'stem'; // leaves and branches trimmed to stubs
    this.buildSeedling(plant, mode);
    this.buildStem(plant);
    if (!this.stub) {
      for (const c of plant.cotyledons) if (c.present) this.buildCotyledon(c);
    }
    for (const L of plant.leaves) if (L.present) this.buildLeaf(plant, L);
    for (const r of plant.racemes) this.buildRaceme(plant, r);
    for (const b of this.batches()) b.commit();
    this.roots.mesh.visible = mode === 'stem' || mode === 'plant';
  }

  // Bounding box of what is drawn (for camera framing). The plant view leaves
  // the roots out: it frames the soil block instead.
  bounds({ roots = true } = {}) {
    const box = new THREE.Box3();
    for (const b of this.batches()) {
      if (b === this.roots && !roots) continue;
      if (b.mesh.visible && b.geometry.boundingBox && b.pos.length) box.union(b.geometry.boundingBox);
    }
    return box;
  }

  // ---- Below ground and the hypocotyl ----------------------------------------
  buildSeedling(plant, mode) {
    const S = plant.seedling;
    const C = this.C;
    const ripe = plant.K.stemRipe;
    // Seed coat: a small dark sphere (seed ~2 mm across), left behind once the
    // cotyledons are out.
    this.seed.visible = (mode === 'plant' || mode === 'stem') && S.seedUsed < 0.95;
    const sr = 0.1 * (1 - 0.35 * S.seedUsed);
    this.seed.scale.set(sr, sr * (1 - 0.3 * S.seedUsed), sr);
    this.seed.position.set(-0.09, S.seedY, 0);

    // Hypocotyl: thin and pale below ground, green above; it thickens into
    // the root collar as the plant establishes.
    const hy = S.hypo;
    if (hy.len > 0.02) {
      const n = Math.max(2, Math.ceil(hy.len / 0.1));
      const pts = [], ys = [];
      for (let i = 0; i <= n; i++) { const p = hy.at((hy.len * i) / n).p; pts.push(V(p)); ys.push(p[1]); }
      const thick = Math.max(0.035, S.collarR);
      tube(this.stems, pts, (i) => lerp(0.035, thick, smoothstep(0, 0.6, i / n)) * (i === n ? 0.95 : 1), (i) => {
        const above = smoothstep(-0.1, 0.3, ys[i]);
        return mix(mix(C.hypocotyl, C.rootCollar, smoothstep(0.06, 0.25, S.collarR)), mix(C.stem, C.stemRipe, ripe), above * 0.8);
      }, 10);
    }

    // Taproot and laterals (model/roots.js), drawn by setRoots once the view
    // knows the framing. In the stem view only the top of the taproot.
    this.rootArgs = mode === 'plant' || mode === 'stem' ? {
      spec: this.P.ROOTS,
      st: { depth: S.rootLen, seed: [0, S.seedY, 0], collarR: S.collarR },
      stub: mode === 'stem' ? 3 : 0,
      colours: { root: C.root, old: rgb('#cbb994'), collar: C.rootCollar },
    } : null;
  }

  // Roots, drawn after build() once the view has chosen the soil depth and
  // framing (opts: views/below-ground.js rootOptions).
  setRoots(opts) {
    this.rootSystem = redrawRoots(this.roots, this.rootArgs, opts);
  }

  // ---- Stem and racemes ---------------------------------------------------
  buildStem(plant) {
    const C = this.C;
    const K = plant.K;
    const ax = plant.mainAxis;
    const main = plant.main;
    const top = main.tipS;
    // Nothing above the cotyledons until the first true leaf is forming.
    if (K.vL < 0) return;
    const n = Math.max(3, Math.ceil(top / 0.4));
    const pts = [], rs = [], cs = [];
    for (let i = 0; i <= n; i++) {
      const s = (top * i) / n;
      pts.push(V(ax.at(s).p));
      // Above the last node the raceme's rachis tapers to the tip.
      let r = s <= plant.racemeBaseS ? plant.stemRadius(s) : lerp(plant.stemRadius(plant.racemeBaseS) * 0.85, 0.05, clamp((s - plant.racemeBaseS) / Math.max(1, main.len)));
      rs.push(Math.max(0.04, r));
      cs.push(mix(mix(C.stem, C.stemRipe, smoothstep(0, 0.7, K.stemRipe)), C.stemDry, smoothstep(0.6, 1, K.stemRipe) * (1 - s / (top + 1))));
    }
    tube(this.stems, pts, (i) => rs[i], (i) => cs[i], 12);
    // Branch stalks and their rachises.
    for (const b of plant.branches) {
      const len = this.stub ? Math.min(2.5, b.tipS) : b.tipS;
      if (len < 0.1) continue;
      const m = Math.max(2, Math.ceil(len / 0.5));
      const bp = [];
      for (let i = 0; i <= m; i++) bp.push(V(b.axis.at((len * i) / m).p));
      const r0 = 0.32 * b.def.scale * smoothstep(0, 4, b.stalk) + 0.06;
      tube(this.stems, bp, (i) => lerp(r0, 0.05, (i / m) * (len / Math.max(len, b.tipS))), (i) => mix(mix(C.stem, C.stemRipe, smoothstep(0, 0.7, b.K.stemRipe)), C.stemDry, smoothstep(0.6, 1, b.K.stemRipe) * 0.5), 8);
    }
  }

  buildRaceme(plant, r) {
    if (this.stub && r.id !== 'main') return;
    const C = this.C;
    const P = this.P;
    const sc = r.def.scale;
    const fr = (s) => r.axis.at(s);
    for (const f of r.flowers) {
      if (f.state === 'bud' && f.budSize < 0.02) continue;
      const a = fr(f.s);
      const B = V(a.p);
      const t = V(a.t);
      const e1 = perp(t), e2 = new THREE.Vector3().crossVectors(e1, t);
      const rad = e1.clone().multiplyScalar(Math.cos(f.az)).addScaledVector(e2, Math.sin(f.az));
      const d = t.clone().multiplyScalar(Math.cos(f.pedAngle)).addScaledVector(rad, Math.sin(f.pedAngle)).normalize();
      const E = B.clone().addScaledVector(d, f.pedLen);
      // Pedicel.
      const pedCol = f.state === 'pod' ? this.seedColour(f.seed).pod : C.sepal;
      if (f.pedLen > 0.05) tube(this.parts, [B, B.clone().lerp(E, 0.5), E], () => 0.028 * sc, () => pedCol, 4);

      if (f.state === 'bud') {
        const bd = t.clone().lerp(d, 0.35).normalize(); // buds point up out of the cluster
        const L = 0.42 * f.budSize + 0.04, R = 0.15 * f.budSize + 0.02;
        const yel = f.yellow;
        ellipsoid(this.parts, E.clone().addScaledVector(bd, L * 0.45), bd, L, R, (u) => mix(C.bud, C.budYellow, yel * smoothstep(0.35, 0.9, u)));
      } else if (f.state === 'flower') {
        this.buildFlower(E, t.clone().lerp(d, 0.6).normalize(), f, sc);
      } else {
        this.buildPod(E, d, t, f, sc);
      }
    }
  }

  buildFlower(E, fd, f, sc) {
    const C = this.C;
    const e1 = perp(fd), e2 = new THREE.Vector3().crossVectors(e1, fd);
    const open = f.openness;
    // Pistil (the future pod) and six stamens in the centre.
    tube(this.parts, [E, E.clone().addScaledVector(fd, 0.55 * sc)], () => 0.05 * sc, () => C.bud, 5);
    for (let k = 0; k < 6; k++) {
      const a = (TWO_PI * k) / 6 + 0.3;
      const sd = fd.clone().multiplyScalar(0.9).addScaledVector(e1, Math.cos(a) * 0.35).addScaledVector(e2, Math.sin(a) * 0.35).normalize();
      tube(this.parts, [E, E.clone().addScaledVector(sd, 0.45 * sc)], (i) => (i ? 0.035 : 0.015) * sc, (i) => (i ? C.stamen : C.sepal), 4);
    }
    // Four sepals, then four petals in a cross, opening out.
    const fade = f.petalFade;
    const petCol = mix(C.petal, C.petalOld, fade * 0.8);
    for (let k = 0; k < 8; k++) {
      const sepal = k >= 4;
      const a = (TWO_PI * (k % 4)) / 4 + (sepal ? Math.PI / 4 : 0);
      const spread = (sepal ? lerp(10, 30, open) : lerp(12, 72, open) + 8 * fade) * Math.PI / 180;
      const len = (sepal ? 0.55 : 1.15) * sc * (sepal ? 1 : lerp(0.75, 1, open));
      const wid = (sepal ? 0.18 : 0.72) * sc;
      const out = e1.clone().multiplyScalar(Math.cos(a)).addScaledVector(e2, Math.sin(a));
      const side = new THREE.Vector3().crossVectors(fd, out).normalize();
      const batch = sepal ? this.parts : this.petals;
      batch.grid(4, 4, (i, j, o) => {
        const u = i / 4, v = (j / 4) * 2 - 1;
        // Clawed petal: narrow stalk, broad rounded blade.
        const w = sepal ? Math.sin(Math.PI * clamp(u * 0.9 + 0.1)) : smoothstep(0.15, 0.55, u) * Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.68) / 0.36, 2))) * 0.94 + 0.06;
        const ang = spread * (0.55 + 0.45 * u); // curving outwards
        const dir = fd.clone().multiplyScalar(Math.cos(ang)).addScaledVector(out, Math.sin(ang));
        o.p.copy(E).addScaledVector(dir, len * u).addScaledVector(side, v * w * wid / 2).addScaledVector(fd, Math.abs(v) * 0.05 * sc * u);
        o.c = sepal ? C.sepal : petCol; o.u = 0; o.v = 0;
      });
    }
  }

  buildPod(E, d, t, f, sc) {
    const P = this.P;
    const size = f.podSize;
    // Pods angle up more than their stalks as they grow.
    const grow = smoothstep(0.08, 0.6, size);
    const rad = d.clone().addScaledVector(t, -d.dot(t)).normalize();
    const pd0 = t.clone().multiplyScalar(Math.cos(0.5)).addScaledVector(rad, Math.sin(0.5)).normalize();
    const dir = d.clone().lerp(pd0, grow).normalize();
    const L = Math.max(0.12, f.podLen);
    const beak = P.POD.beak * sc * clamp(size * 1.5);
    const R = P.POD.r * sc * lerp(0.3, 1, smoothstep(0.06, 0.9, size));
    const n = 16;
    const pts = [];
    const p = E.clone();
    const dd = dir.clone();
    const total = L + beak;
    for (let i = 0; i <= n; i++) {
      pts.push(p.clone());
      // A gentle upward curve along the pod.
      dd.lerp(t, 0.012).normalize();
      p.addScaledVector(dd, total / n);
    }
    const col = this.seedColour(f.seed).pod;
    const seeds = f.seed >= 1 ? P.POD.seeds : 0;
    tube(this.parts, pts, (i) => {
      const s = (total * i) / n;
      if (s > L) return 0.035 * sc * (1 - 0.6 * (s - L) / Math.max(0.01, beak)); // beak
      const u = s / L;
      const body = Math.pow(Math.sin(Math.PI * clamp(0.04 + u * 0.96)), 0.35);
      // Seeds show as faint bulges along the pod once they swell.
      const bulge = seeds ? 1 + 0.07 * Math.max(0, Math.sin(u * Math.PI * seeds / 2)) : 1;
      return Math.max(0.02, R * body * bulge * (i === 0 ? 0.5 : 1));
    }, (i) => mix(col, this.C.stemDry, 0.15 * (i / n) * smoothstep(4, 5, f.seed)), 7);
  }

  // ---- Leaves -------------------------------------------------------------
  buildCotyledon(c) {
    const C = this.C;
    const base = V(c.base);
    const d = V(c.dir);
    const side = new THREE.Vector3(-Math.sin(c.az), 0, Math.cos(c.az));
    const nrm = new THREE.Vector3().crossVectors(d, side).normalize();
    const green = mix(C.cotyledonPale, C.cotyledon, c.light);
    const col = c.sen < 0.5 ? mix(green, C.leafYellow, c.sen * 2) : mix(C.leafYellow, C.leafDead, (c.sen - 0.5) * 2);
    const pet = c.petiole;
    const pe = base.clone().addScaledVector(d, pet);
    tube(this.stems, [base, pe], () => 0.03, () => mix(C.petiole, col, 0.5), 5);
    const Lb = c.len - pet, W = c.width;
    this.leaves.grid(10, 8, (i, j, o) => {
      const u = i / 10, a = (j / 8) * 2 - 1;
      // Kidney-shaped blade, broader than long, notched at the tip.
      const hw = (W / 2) * Math.pow(Math.sin(Math.PI * clamp(0.12 + u * 0.88)), 0.55);
      const along = u * Lb * (1 - 0.2 * Math.pow(1 - Math.abs(a), 2) * smoothstep(0.55, 1, u));
      o.p.copy(pe).addScaledVector(d, along).addScaledVector(side, a * hw).addScaledVector(nrm, a * a * hw * 0.25 * (1 - c.open * 0.5) - 0.04 * u);
      o.c = col; o.u = (a + 1) / 2; o.v = u * 0.3;
    });
  }

  buildLeaf(plant, L) {
    const C = this.C;
    // Resample the model's midrib to a finer curve.
    const mr = L.midrib.map(V);
    const SEG = 24, ACROSS = 8;
    const cut = this.stub ? clamp(1.2 / Math.max(L.len, 0.01)) : 1;
    const at = (u) => {
      const x = clamp(u, 0, 1) * (mr.length - 1);
      const i = Math.min(mr.length - 2, Math.floor(x));
      return { p: mr[i].clone().lerp(mr[i + 1], x - i), t: mr[i + 1].clone().sub(mr[i]).normalize() };
    };
    const side = new THREE.Vector3(-Math.sin(L.az), 0, Math.cos(L.az));
    const radial = new THREE.Vector3(Math.cos(L.az), 0, Math.sin(L.az));
    const W = L.width;
    const pf = L.petiole;
    const lobes = L.lobes;
    // Leaf outline: half-width at u along the midrib (0 base … 1 tip).
    const halfW = (u) => {
      if (L.stemLeaf && pf === 0) {
        // Stalkless upper stem leaf: clasping lobes at the base, then a
        // long-pointed lance shape.
        const clasp = 0.55 * Math.exp(-Math.pow(u / 0.07, 2));
        return (W / 2) * Math.max(clasp, Math.pow(Math.sin(Math.PI * Math.pow(clamp(u), 0.62)), 0.85));
      }
      let w = 0.06 + 0.02 * L.fullLen / 10;
      for (let k = 1; k <= lobes; k++) {
        const c = pf * (0.3 + (0.62 * k) / (lobes + 0.4));
        w = Math.max(w, 0.27 * W * (0.55 + 0.45 * k / lobes) * Math.exp(-Math.pow((u - c) / 0.06, 2)));
      }
      if (u >= pf * 0.85) {
        const v = clamp((u - pf * 0.85) / (1 - pf * 0.85));
        // Large rounded end lobe with a wavy, toothed edge.
        const lobe = (W / 2) * Math.pow(Math.sin(Math.PI * Math.pow(v, 0.7)), 0.65) * (1 + 0.045 * Math.sin(v * 38 + L.n));
        w = Math.max(w, lobe);
      }
      return w;
    };
    const green = mix(C.leafYoung, C.leaf, smoothstep(0.3, 2.2, L.emerge));
    const sen = L.sen;
    const col = sen < 0.5 ? mix(green, C.leafYellow, sen * 2) : mix(C.leafYellow, C.leafDead, (sen - 0.5) * 2);
    const fold = clamp(L.curl);
    this.leaves.grid(SEG, ACROSS, (i, j, o) => {
      const u = (i / SEG) * cut;
      const a = (j / ACROSS) * 2 - 1;
      const { p, t } = at(u);
      const nrm = new THREE.Vector3().crossVectors(t, side).normalize();
      if (nrm.dot(UP) < 0 && t.y > -0.2) nrm.negate();
      const w = halfW(u) * lerp(1, 0.55, fold);
      const x = a * w;
      // Young leaves are folded up along the midrib; grown ones are gently
      // cupped with a wavy margin.
      let y = Math.abs(a) * w * fold * 1.1 + a * a * w * 0.12 + a * a * W * 0.035 * Math.sin(u * 26 + L.n * 1.7);
      o.p.copy(p).addScaledVector(side, x).addScaledVector(nrm, y);
      // Clasping stem-leaf bases wrap back round the stem.
      if (L.stemLeaf && pf === 0) o.p.addScaledVector(radial, -Math.abs(x) * 0.9 * (1 - smoothstep(0, 0.14, u)));
      if (o.p.y < 0.08) o.p.y = 0.08;
      o.c = u < pf * 0.9 && !lobes ? mix(col, C.petiole, 0.4) : col;
      o.u = (a + 1) / 2; o.v = (u * L.len) / 12;
    });
  }
}
