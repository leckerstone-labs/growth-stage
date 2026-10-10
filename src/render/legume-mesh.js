// Turns the field bean model (model/legume.js) into three.js geometry.
//
// Like the other plant meshes, everything of one kind is merged into one
// batch (all leaflets, all stems, all petals…) and rebuilt when the timeline
// moves. The model already gives world positions (stem axes, leaf rachises
// and leaflet attachments, flower and pod positions), so this file only adds
// surfaces: square stems, leaflet blades, stipules, flowers and pods.

import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../model/interp.js';
import { rgb, mix } from './materials.js';
import { Batch } from './plant-mesh.js';
import { frames, tube, ellipsoid } from './brassica-mesh.js';
import { redrawRoots } from './roots-mesh.js';

const TWO_PI = Math.PI * 2;
const UP = new THREE.Vector3(0, 1, 0);
const V = (p) => new THREE.Vector3(p[0], p[1], p[2]);

// Radius of a rounded square (superellipse) at angle a, for a half-width of 1.
const square = (a) => 1 / Math.pow(Math.pow(Math.abs(Math.cos(a)), 4) + Math.pow(Math.abs(Math.sin(a)), 4), 0.25);

export class LegumeMesh {
  constructor(M, crop) {
    this.M = M;
    this.crop = crop;
    this.P = crop.params;
    this.C = Object.fromEntries(Object.entries(this.P.COLOURS).map(([k, v]) => [k, rgb(v)]));
    this.seedCols = this.P.SEEDS.map((s) => ({ ...s, col: rgb(s.col), pod: rgb(s.pod), hilum: rgb(s.hilum) }));
    this.group = new THREE.Group();
    this.leaves = new Batch('leaves', M.netLeaf);
    this.stems = new Batch('stems', M.stem);
    this.roots = new Batch('roots', M.root, { shadow: false });
    this.petals = new Batch('petals', M.petal, { shadow: false });
    this.parts = new Batch('parts', M.pod);
    for (const b of this.batches()) this.group.add(b.mesh);
  }

  batches() { return [this.leaves, this.stems, this.roots, this.petals, this.parts]; }

  // Seed state → { col, pod, hilum } colours.
  seedColour(s) {
    const S = this.seedCols;
    let i = 0;
    while (i < S.length - 2 && s > S[i + 1].s) i++;
    const f = clamp((s - S[i].s) / (S[i + 1].s - S[i].s));
    return { col: mix(S[i].col, S[i + 1].col, f), pod: mix(S[i].pod, S[i + 1].pod, f), hilum: mix(S[i].hilum, S[i + 1].hilum, f) };
  }

  // opts.mode: 'plant' | 'nodes' | 'flowers' | 'pods'. Only the plant view
  // shows the side shoots, seed and roots; the close-ups show the main stem.
  // opts.trim(leaf): true to cut that leaf back to a short stub (the flowers
  // and pods views, so the racemes in the leaf axils can be seen).
  build(plant, opts) {
    for (const b of this.batches()) b.reset();
    const mode = opts.mode;
    const stems = mode === 'plant' ? plant.stems : [plant.main];
    if (mode === 'plant') this.buildSeed(plant);
    for (const st of stems) {
      this.buildStem(plant, st);
      for (const L of st.leaves) if (L.present) this.buildLeaf(L, st, !!opts.trim?.(L));
      for (const r of st.racemes) this.buildRaceme(r, st);
      for (const p of st.pods) this.buildPod(p, st);
    }
    for (const b of this.batches()) b.commit();
    const S = plant.seedling;
    this.rootArgs = mode === 'plant' ? {
      spec: this.P.ROOTS,
      st: { depth: S.rootLen, seed: [0, S.seedY - this.P.SEED.width * 0.3, 0], collarR: S.collarR },
      stub: 0,
      colours: { root: this.C.root, old: rgb('#cbb994'), collar: this.C.rootCollar, nodule: this.C.nodule },
    } : null;
    this.roots.mesh.visible = mode === 'plant';
  }

  // Roots, drawn after build() once the view has chosen the soil depth and
  // framing (opts: views/below-ground.js rootOptions).
  setRoots(opts) {
    this.rootSystem = redrawRoots(this.roots, this.rootArgs, opts);
  }

  // Bounding box of what is drawn (for camera framing).
  bounds({ roots = true } = {}) {
    const box = new THREE.Box3();
    for (const b of this.batches()) {
      if (b === this.roots && !roots) continue;
      if (b.mesh.visible && b.geometry.boundingBox && b.pos.length) box.union(b.geometry.boundingBox);
    }
    return box;
  }

  // ---- Seed: stays below ground (hypogeal) ----------------------------------
  buildSeed(plant) {
    const S = plant.seedling;
    if (S.seedUsed > 0.97) return;
    const P = this.P;
    const C = this.C;
    const used = S.seedUsed;
    // A flattened bean lying on its edge, hilum (dark scar) uppermost where
    // the shoot and root come out. It shrivels and darkens as the
    // cotyledons' reserves are used.
    const c = new THREE.Vector3(0.25, S.seedY, 0);
    const L = P.SEED.len * (1 - 0.25 * used), W = P.SEED.width * (1 - 0.3 * used), T = P.SEED.thick * (1 - 0.35 * used);
    const coat = mix(C.seedCoat, rgb('#7a6243'), smoothstep(0.2, 0.9, used));
    this.parts.grid(10, 14, (i, j, o) => {
      const th = (Math.PI * i) / 10, ph = (TWO_PI * j) / 14;
      const x = Math.cos(th), r = Math.sin(th);
      const y = r * Math.cos(ph), z = r * Math.sin(ph);
      // Kidney shape: a slight notch on the hilum side.
      const notch = 1 - 0.12 * Math.max(0, y) * Math.exp(-x * x * 6);
      o.p.set(c.x + x * L / 2, c.y + y * W / 2 * notch, c.z + z * T / 2);
      const hil = y > 0.8 && Math.abs(x) < 0.32;
      o.c = hil ? C.seedHilum : coat; o.u = 0; o.v = 0;
    });
  }

  // ---- Stems: square, pale below ground, darkening from the base ------------
  buildStem(plant, st) {
    const C = this.C;
    const top = st.tipS;
    const n = Math.max(3, Math.ceil(top / 0.7));
    const pts = [], rs = [], cs = [];
    for (let i = 0; i <= n; i++) {
      const s = (top * i) / n;
      const p = st.axis.at(s).p;
      pts.push(V(p));
      rs.push(Math.max(0.06, st.radius(s)) * (i === n ? 0.6 : 1));
      const h = s / Math.max(top, 1);
      const dark = smoothstep(h - 0.12, h + 0.02, st.ripe * 1.12);
      const green = mix(C.epicotyl, C.stem, smoothstep(-0.6, 0.6, p[1]));
      cs.push(mix(green, C.stemDark, dark));
    }
    const F = frames(pts);
    const RAD = 12;
    this.stems.grid(n, RAD, (i, j, o) => {
      const a = (TWO_PI * j) / RAD;
      const k = square(a + Math.PI / 4) * rs[i];
      o.p.copy(pts[i]).addScaledVector(F[i].e1, Math.cos(a) * k).addScaledVector(F[i].e2, Math.sin(a) * k);
      o.c = cs[i]; o.u = j / RAD; o.v = i / 3;
    });
    // Scale leaves at the first two nodes (main stem).
    if (st.scaleS) {
      st.scaleS.forEach((s, i) => {
        const a = st.axis.at(s);
        const out = new THREE.Vector3(i ? -1 : 1, 0, 0.2).normalize();
        const base = V(a.p).addScaledVector(out, st.radius(s));
        const d = V(a.t).multiplyScalar(0.8).addScaledVector(out, 0.6).normalize();
        this.flatBlade(this.parts, base, d, out, 0.55, 0.32, () => C.scale, 0.15);
      });
    }
  }

  // A small flat blade (stipule, scale leaf) from base along d, width w.
  flatBlade(batch, base, d, out, len, w, col, cup = 0.1) {
    const side = new THREE.Vector3().crossVectors(d, out).normalize();
    batch.grid(4, 4, (i, j, o) => {
      const u = i / 4, v = (j / 4) * 2 - 1;
      const hw = (w / 2) * Math.sin(Math.PI * clamp(0.15 + u * 0.85)) * (1 - 0.5 * u);
      o.p.copy(base).addScaledVector(d, len * u).addScaledVector(side, v * hw).addScaledVector(out, v * v * hw * cup * 4);
      o.c = col(u, v); o.u = 0; o.v = 0;
    });
  }

  // ---- Leaves: rachis, leaflets, stipules ----------------------------------
  leafColour(L) {
    const C = this.C;
    const green = mix(C.leafYoung, C.leaf, smoothstep(0.3, 2.2, L.e));
    const s = L.sen;
    return s < 0.45 ? mix(green, C.leafYellow, s / 0.45) : mix(C.leafYellow, L.black ? C.leafDead : C.leafDry, smoothstep(0.45, 0.8, s));
  }

  buildLeaf(L, st, trimmed = false) {
    const C = this.C;
    const col = this.leafColour(L);
    const stalkCol = mix(col, C.petiole, 0.45 * (1 - L.sen));
    let rach = L.rachis.map(V);
    if (trimmed) rach = rach.slice(0, 3);
    const r0 = 0.06 * lerp(0.4, 1, L.grow) * st.spec.scale;
    tube(this.stems, rach, (i) => r0 * lerp(1, 0.45, i / (rach.length - 1)), () => stalkCol, 5);
    // Stipules: a pair clasping the stem either side of the leaf stalk, with
    // a dark nectary spot.
    const base = rach[0];
    const d = V(L.dir);
    const out = V(L.out);
    const side = new THREE.Vector3().crossVectors(d, UP).normalize();
    if (L.stipule > 0.1 && L.sen < 0.9) {
      for (const sg of [-1, 1]) {
        const sd = d.clone().multiplyScalar(0.5).add(UP.clone().multiplyScalar(0.6)).addScaledVector(side, sg * 0.55).normalize();
        this.flatBlade(this.parts, base.clone().addScaledVector(side, sg * 0.08), sd, out, L.stipule, L.stipule * 0.5,
          (u, v) => (Math.abs(u - 0.35) < 0.15 && Math.abs(v) < 0.45 && L.sen < 0.4 ? C.nectary : mix(C.stipule, col, L.sen)));
      }
    }
    if (!trimmed) for (const f of L.leaflets) this.buildLeaflet(f, col, L);
  }

  buildLeaflet(f, col, L) {
    const p0 = V(f.p);
    const d = V(f.dir);
    const n = V(f.n);
    const sideL = new THREE.Vector3().crossVectors(n, d).normalize();
    const len = f.len, W = f.width * lerp(1, 0.6, clamp(f.fold) * (1 - L.shrivel));
    const fold = clamp(f.fold) * 1.25; // radians each half turns up
    const shriv = L.shrivel;
    const NU = 8, NV = 6;
    this.leaves.grid(NU, NV, (i, j, o) => {
      const u = i / NU, a = (j / NV) * 2 - 1;
      // Elliptic leaflet, broadest a little beyond the middle, with a short
      // point at the tip.
      const hw = (W / 2) * Math.pow(Math.sin(Math.PI * Math.pow(clamp(0.04 + u * 0.96), 0.85)), 0.75);
      const x = a * hw;
      const ang = fold * Math.sign(a);
      const crumple = shriv * 0.25 * W * Math.sin(u * 11 + a * 3 + L.n);
      o.p.copy(p0).addScaledVector(d, u * len)
        .addScaledVector(sideL, x * Math.cos(ang))
        .addScaledVector(n, Math.abs(x) * Math.sin(ang) + a * a * hw * 0.12 - 0.06 * len * u * u + crumple);
      o.c = col; o.u = (a + 1) / 2; o.v = u * len / 8;
    });
  }

  // ---- Racemes: buds, flowers ------------------------------------------------
  buildRaceme(r, st) {
    const C = this.C;
    const sc = st.spec.scale;
    const base = V(r.base), end = V(r.pedEnd), pd = V(r.pd);
    const pedCol = mix(C.calyx, C.stemDark, smoothstep(0.2, 0.8, st.ripe));
    const live = r.flowers.some((f) => f.state !== 'gone');
    if (!live) return;
    const last = r.flowers[r.flowers.length - 1];
    tube(this.parts, [base, end, V(last.at)], () => 0.05 * sc, () => pedCol, 5);
    for (const f of r.flowers) {
      const at = V(f.at);
      if (f.state === 'bud') {
        const dd = V(f.dir);
        const Lb = lerp(0.25, 1.35, f.size) * sc, Rb = lerp(0.1, 0.27, f.size) * sc;
        ellipsoid(this.parts, at.clone().addScaledVector(dd, Lb * 0.5), dd, Lb, Rb,
          (u) => mix(C.bud, C.petal, f.petals * smoothstep(0.55, 0.9, u)), 6, 8);
      } else if (f.state === 'open') {
        this.buildFlower(at, V(f.dir), f, sc);
      }
    }
  }

  buildFlower(at, dir, f, sc) {
    const C = this.C;
    const open = f.open, wilt = f.wilt;
    const s = sc * 1.15 * (1 - 0.35 * wilt); // a little larger than life (2.5–3 cm)
    const dd = dir.clone();
    // Frame: dd along the flower, up = world up made perpendicular to it.
    const up = UP.clone().addScaledVector(dd, -UP.dot(dd)).normalize();
    const side = new THREE.Vector3().crossVectors(dd, up).normalize();
    // Calyx: a green tube with the petals coming out of it.
    const calL = 0.75 * s;
    const ce = at.clone().addScaledVector(dd, calL);
    tube(this.parts, [at, at.clone().addScaledVector(dd, calL * 0.5), ce], (i) => [0.1, 0.2, 0.24][i] * s, () => C.calyx, 7);
    const petal = mix(C.petal, C.petalWilt, wilt);
    // Standard: the large upper petal. Its lower part forms a hood over the
    // wings; its tip flares and turns up as the flower opens. White with
    // dark purplish veins.
    const SL = 1.9 * s, SW = 1.35 * s;
    const lift = (10 + 70 * open) * Math.PI / 180;
    this.petals.grid(10, 8, (i, j, o) => {
      const u = i / 10, v = (j / 8) * 2 - 1;
      const ang = 0.12 + lift * smoothstep(0.45, 1, u);
      const along = dd.clone().multiplyScalar(Math.cos(ang)).addScaledVector(up, Math.sin(ang));
      const flare = lerp(0.42, 1, smoothstep(0.35, 0.85, u) * open);
      const w = (SW / 2) * Math.pow(Math.sin(Math.PI * clamp(0.1 + u * 0.9)), 0.5) * flare;
      // Sides curl down round the wings, less so in the flared tip.
      const curl = (1 - smoothstep(0.5, 0.9, u) * open) * 0.75;
      o.p.copy(ce).addScaledVector(dd, SL * 0.55 * u).addScaledVector(along, SL * 0.45 * smoothstep(0.4, 1, u) * u)
        .addScaledVector(side, v * w * (1 - 0.35 * curl * v * v))
        .addScaledVector(up, 0.18 * s - v * v * w * curl);
      const vein = Math.pow(0.5 + 0.5 * Math.cos(v * Math.PI * 7), 6) * (1 - u) * smoothstep(0.1, 0.4, u);
      o.c = mix(petal, C.vein, 0.7 * vein * (1 - wilt)); o.u = 0; o.v = 0;
    });
    // Wings: a pair of petals under the hood, sticking out beyond it, each
    // with a large black blotch (the field mark of a bean flower).
    for (const sg of [-1, 1]) {
      const wd = dd.clone().addScaledVector(side, sg * 0.22 * open).addScaledVector(up, -0.2).normalize();
      const wb = ce.clone().addScaledVector(side, sg * 0.1 * s).addScaledVector(up, -0.02 * s);
      const WL = 1.55 * s, WW = 0.7 * s;
      const wside = new THREE.Vector3().crossVectors(wd, side).normalize(); // roughly up/down
      this.petals.grid(6, 4, (i, j, o) => {
        const u = i / 6, v = (j / 4) * 2 - 1;
        const w = (WW / 2) * Math.pow(Math.sin(Math.PI * clamp(0.12 + u * 0.88)), 0.6) * lerp(0.6, 1, open);
        o.p.copy(wb).addScaledVector(wd, WL * u).addScaledVector(wside, v * w).addScaledVector(side, sg * (0.06 * s + v * v * 0.06 * s));
        const blot = Math.hypot((u - 0.66) / 0.24, (v + 0.1) / 0.7) < 1;
        o.c = blot ? mix(C.blotch, C.petalWilt, wilt * 0.5) : petal; o.u = 0; o.v = 0;
      });
    }
    // Keel: small, pale, between the wings.
    const kd = dd.clone().addScaledVector(up, -0.25).normalize();
    ellipsoid(this.parts, ce.clone().addScaledVector(kd, 0.45 * s), kd, 0.9 * s, 0.16 * s, () => mix(rgb('#e8ecd8'), C.petalWilt, wilt), 5, 6);
  }

  // ---- Pods ----------------------------------------------------------------
  buildPod(p, st) {
    const C = this.C;
    const P = this.P;
    const at = V(p.at);
    const dir = V(p.dir);
    const L = Math.max(0.25, p.len);
    const beak = P.PODS.beak * st.spec.scale * clamp(p.size * 1.5);
    const R = p.r;
    const cols = this.seedColour(p.seed);
    const fill = smoothstep(0.6, 2, p.seed);
    const n = 18;
    // Centre line: out along dir, the tip curving up a little into the beak.
    const pts = [];
    const q = at.clone();
    const dd = dir.clone();
    const total = L + beak;
    for (let i = 0; i <= n; i++) {
      pts.push(q.clone());
      if (i > n * 0.6) dd.lerp(UP, 0.05).normalize();
      q.addScaledVector(dd, total / n);
    }
    const F = frames(pts);
    // Cross-section a little flattened side to side; the pod bulges over
    // each seed once the seeds swell.
    const RAD = 10;
    const hor = new THREE.Vector3().crossVectors(dir, UP).normalize();
    this.parts.grid(n, RAD, (i, j, o) => {
      const s = (total * i) / n;
      const u = s / L;
      let r;
      if (s > L) r = Math.max(0.02, 0.06 * (1 - (s - L) / Math.max(0.01, beak)));
      else {
        const body = Math.pow(Math.sin(Math.PI * clamp(0.05 + u * 0.95)), 0.4);
        const bulge = 1 + 0.16 * fill * Math.max(0, Math.sin(u * Math.PI * p.seeds));
        r = Math.max(0.03, R * body * bulge);
      }
      const a = (TWO_PI * j) / RAD;
      // Orient the ellipse: wide along `hor`.
      const e1 = F[i].e1, e2 = F[i].e2;
      const c1 = e1.dot(hor), c2 = e2.dot(hor);
      const ang0 = Math.atan2(c2, c1);
      const ca = Math.cos(a), sa = Math.sin(a);
      const x = ca * r * 0.88, y = sa * r; // a little narrower side to side
      o.p.copy(pts[i])
        .addScaledVector(e1, x * Math.cos(ang0) - y * Math.sin(ang0))
        .addScaledVector(e2, x * Math.sin(ang0) + y * Math.cos(ang0));
      o.c = mix(cols.pod, C.stemDark, 0.08 * (i / n) * smoothstep(4, 5, p.seed)); o.u = 0; o.v = 0;
    });
    // Short stalk, and the withered flower round the base of a young pod.
    tube(this.parts, [at.clone().addScaledVector(dir, -0.3), at], () => 0.06, () => cols.pod, 5);
    if (p.cap > 0.05) {
      ellipsoid(this.parts, at.clone().addScaledVector(dir, 0.25), dir, 0.9 * p.cap + 0.1, (R * 0.6 + 0.12) * p.cap + 0.05, () => mix(C.petalWilt, rgb('#5a4630'), 0.4), 5, 7);
    }
  }
}
