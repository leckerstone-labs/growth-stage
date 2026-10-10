// Turns the field bean model (model/legume.js) into three.js geometry.
//
// Like the other plant meshes, everything of one kind is merged into one
// batch (all live leaflets, all stems, all petals…) and rebuilt when the
// timeline moves. The model already gives world positions (stem axes, leaf
// rachises and leaflet attachments, flower and pod positions), so this file
// only adds surfaces: square stems, leaflet blades, stipules, flowers and
// pods, and their colours.
//
// Colours follow what a bean crop looks like in the field (reference photos
// of UK winter and spring beans): grey-green (glaucous) leaves, paler at the
// shoot tip; dying leaves going yellow, then brown, then dark brown-black,
// curling as they dry, the margins first and patchily; pods from downy green
// through yellow-green and brown patches to a dull black with a slight
// sheen; stems green, then yellowish, then brown and dark grey-brown, from
// the base up, streaky rather than uniform. Every part gets a little seeded
// variation so no two leaves or pods are the same colour.

import * as THREE from 'three';
import { clamp, lerp, smoothstep, hash } from '../model/interp.js';
import { rgb, mix } from './materials.js';
import { Batch } from './plant-mesh.js';
import { frames, tube, ellipsoid } from './brassica-mesh.js';
import { redrawRoots } from './roots-mesh.js';

const TWO_PI = Math.PI * 2;
const UP = new THREE.Vector3(0, 1, 0);
const V = (p) => new THREE.Vector3(p[0], p[1], p[2]);

// Radius of a rounded square at angle a, for a half-width of 1: flat sides
// with slightly raised corners (the angles of a bean stem).
const square = (a) => {
  const c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a));
  const r = 1 / Math.pow(Math.pow(c, 6) + Math.pow(s, 6), 1 / 6);
  return r * (1 + 0.05 * Math.pow(Math.abs(Math.sin(2 * a)), 8));
};

// Cheap smooth pseudo-noise in [0, 1] for patchy colour.
const noise = (a, b) => 0.5 + 0.25 * Math.sin(a * 1.7 + b * 2.3 + 0.4) + 0.25 * Math.sin(a * 3.1 - b * 1.3 + 1.7) * Math.sin(b * 0.7 + a * 0.4);

// Colour ramp: stops [[x, rgb]…] with x increasing.
function ramp(stops, x) {
  if (x <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    if (x <= stops[i][0]) return mix(stops[i - 1][1], stops[i][1], (x - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]));
  }
  return stops[stops.length - 1][1];
}

// Light passing through a thin leaf makes its shaded side glow rather than
// go black (as in materials.js translucentLeaf); dead leaves are opaque.
function translucent(m, front = 0.1, back = 0.32) {
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * (gl_FrontFacing ? ${front.toFixed(2)} : ${back.toFixed(2)});`,
    );
  };
  return m;
}

// Materials for beans. Leaves are matt and waxy (glaucous); dead leaves dull
// and rough; green pods downy (rough); ripe pods leathery with a slight
// sheen; stems a little glossy when green, dull when dead.
function beanMaterials(M) {
  const std = (o) => new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0, ...o });
  return {
    leaf: translucent(std({ map: M.netLeaf.map, side: THREE.DoubleSide, shadowSide: THREE.DoubleSide, roughness: 0.62 })),
    deadLeaf: translucent(std({ map: M.netLeaf.map, side: THREE.DoubleSide, shadowSide: THREE.DoubleSide, roughness: 0.92 }), 0.02, 0.08),
    ghost: std({ side: THREE.DoubleSide, roughness: 0.8, transparent: true, opacity: 0.2, depthWrite: false }),
    stem: std({ map: M.stem.map, roughness: 0.58 }),
    podGreen: std({ side: THREE.DoubleSide, roughness: 0.82 }),
    podRipe: std({ side: THREE.DoubleSide, roughness: 0.52 }),
  };
}

export class LegumeMesh {
  constructor(M, crop) {
    this.M = M;
    this.crop = crop;
    this.P = crop.params;
    this.C = Object.fromEntries(Object.entries(this.P.COLOURS).map(([k, v]) => [k, rgb(v)]));
    this.seedCols = this.P.SEEDS.map((s) => ({ ...s, col: rgb(s.col), pod: rgb(s.pod), hilum: rgb(s.hilum) }));
    const C = this.C;
    // Ramps. Leaf: green → yellow-green → yellow → tan → brown → black-brown.
    // Each leaf ends its own shade, from brown-black to dark brown (tint).
    this.leafRamp = (green, black, tint = 0) => [
      [0, green], [0.22, mix(green, C.leafYellow, 0.55)], [0.38, C.leafYellow], [0.55, C.leafBrown],
      [0.75, C.leafDead], [1, black ? mix(C.leafBlack, C.leafDead, 0.35 + 0.35 * tint) : mix(C.leafDead, C.leafBrown, 0.2 + 0.15 * tint)],
    ];
    // Stem (by local ripeness): green → yellowish → brown → dark grey-brown.
    this.stemRamp = [[0, C.stem], [0.25, C.stemYellow], [0.5, C.stemBrown], [0.8, C.stemDark], [1, C.stemDarkest]];
    this.mats = beanMaterials(M);
    this.group = new THREE.Group();
    this.leaves = new Batch('leaves', this.mats.leaf);
    this.deadLeaves = new Batch('deadLeaves', this.mats.deadLeaf);
    this.ghost = new Batch('ghostLeaves', this.mats.ghost, { shadow: false });
    this.stems = new Batch('stems', this.mats.stem);
    this.roots = new Batch('roots', M.root, { shadow: false });
    this.petals = new Batch('petals', M.petal, { shadow: false });
    this.parts = new Batch('parts', M.pod);
    this.podsGreen = new Batch('podsGreen', this.mats.podGreen);
    this.podsRipe = new Batch('podsRipe', this.mats.podRipe);
    for (const b of this.batches()) this.group.add(b.mesh);
  }

  batches() { return [this.leaves, this.deadLeaves, this.ghost, this.stems, this.roots, this.petals, this.parts, this.podsGreen, this.podsRipe]; }

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
  // opts.ghost(leaf): true to draw that leaf see-through (the flowers and
  // pods views, so the racemes and pods in the leaf axils can be seen).
  build(plant, opts) {
    for (const b of this.batches()) b.reset();
    const mode = opts.mode;
    const stems = mode === 'plant' ? plant.stems : [plant.main];
    if (mode === 'plant') this.buildSeed(plant);
    for (const st of stems) {
      this.buildStem(plant, st);
      for (const L of st.leaves) this.buildLeaf(L, st, !!opts.ghost?.(L));
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

  // ---- Stems: square, pale below ground, ripening from the base ----------------
  buildStem(plant, st) {
    const C = this.C;
    const top = st.tipS;
    const n = Math.max(3, Math.ceil(top / 0.7));
    const pts = [], rs = [], ss = [], ys = [];
    const sv = hash(st.id, 'stem') * 10;
    // While the pods ripen the still-green stem loses its gloss and yellows.
    const dull = 0.45 * smoothstep(0.3, 1, st.K.leafLoss);
    const stemGreen = mix(C.stem, C.stemYellow, dull);
    for (let i = 0; i <= n; i++) {
      const s = (top * i) / n;
      const p = st.axis.at(s).p;
      pts.push(V(p));
      // The growing tip tapers to a point among the youngest folded leaves.
      rs.push(Math.max(0.03, st.radius(s) * lerp(0.25, 1, smoothstep(0, 1.8, top - s))));
      ss.push(s / Math.max(top, 1));
      ys.push(p[1]);
    }
    // Nodes: a slightly darker band where each leaf joins.
    const nodeS = (st.nodeS || []).filter((q) => q < top);
    const F = frames(pts);
    const RAD = 16;
    this.stems.grid(n, RAD, (i, j, o) => {
      const a = (TWO_PI * j) / RAD;
      const k = square(a + Math.PI / 4) * rs[i];
      o.p.copy(pts[i]).addScaledVector(F[i].e1, Math.cos(a) * k).addScaledVector(F[i].e2, Math.sin(a) * k);
      // Ripening runs up the stem from the base (st.ripe 0 → 1), streaky:
      // each face and corner ripens a little out of step.
      const h = ss[i];
      const streak = noise(j * 1.9 + sv, h * 9) - 0.5;
      const local = clamp((st.ripe * 1.25 - h) * 3 + 0.35 * streak + 0.2 * st.ripe);
      const green = mix(C.epicotyl, mix(stemGreen, C.stemPale, 0.25 + 0.25 * streak), smoothstep(-0.6, 0.6, ys[i]));
      let col = st.ripe > 0 ? mix(green, ramp(this.stemRamp, local), smoothstep(0, 0.08, local)) : green;
      // Dead stems weather to a dull grey-brown in places.
      col = mix(col, C.stemGrey, 0.5 * smoothstep(0.7, 1, local) * smoothstep(0.4, 0.8, noise(j * 0.7 + sv, h * 4)));
      let nodeBand = 0;
      for (const q of nodeS) nodeBand = Math.max(nodeBand, 1 - Math.abs(h * top - q) / 0.35);
      o.c = mix(col, mix(col, C.stemDarkest, 0.6), 0.25 * clamp(nodeBand)); o.u = j / RAD; o.v = i / 3;
    });
    // Scale leaves at the first two nodes (main stem).
    if (st.scaleS) {
      st.scaleS.forEach((s, i) => {
        const a = st.axis.at(s);
        const out = new THREE.Vector3(i ? -1 : 1, 0, 0.2).normalize();
        const base = V(a.p).addScaledVector(out, st.radius(s));
        const d = V(a.t).multiplyScalar(0.8).addScaledVector(out, 0.6).normalize();
        const col = mix(C.scale, C.leafBrown, smoothstep(0.1, 0.6, st.ripe));
        this.flatBlade(this.parts, base, d, out, 0.55, 0.32, () => col, 0.15);
      });
    }
  }

  // A small flat blade (stipule, scale leaf) from base along d, width w.
  // teeth: number of teeth on the outer margin (stipules are toothed).
  flatBlade(batch, base, d, out, len, w, col, cup = 0.1, teeth = 0) {
    const side = new THREE.Vector3().crossVectors(d, out).normalize();
    const NU = teeth ? 6 : 4;
    batch.grid(NU, 4, (i, j, o) => {
      const u = i / NU, v = (j / 4) * 2 - 1;
      let hw = (w / 2) * Math.sin(Math.PI * clamp(0.15 + u * 0.85)) * (1 - 0.5 * u);
      if (teeth && v > 0.9) hw *= 1 + 0.25 * Math.abs(Math.sin(u * Math.PI * teeth));
      o.p.copy(base).addScaledVector(d, len * u).addScaledVector(side, v * hw).addScaledVector(out, v * v * hw * cup * 4);
      o.c = col(u, v); o.u = 0; o.v = 0;
    });
  }

  // ---- Leaves: rachis, leaflets, stipules ----------------------------------
  // Live colour of a leaf before senescence: paler and yellower while young
  // at the shoot tip, darker as it ages, with a seeded tint of its own.
  greenOf(L) {
    const C = this.C;
    let g = mix(C.leafYoung, C.leaf, smoothstep(0.2, 2.4, L.e));
    g = mix(g, C.leafOld, 0.5 * smoothstep(4, 12, L.e));
    return mix(g, L.tint > 0 ? C.leafYoung : C.leafOld, Math.abs(L.tint) * 0.22);
  }

  buildLeaf(L, st, ghost = false) {
    const C = this.C;
    const green = this.greenOf(L);
    const lr = this.leafRamp(green, L.black, L.tint);
    const col = ramp(lr, L.sen);
    const stalkCol = mix(col, C.petiole, 0.4 * (1 - L.sen));
    const rach = L.rachis.map(V);
    const r0 = 0.065 * lerp(0.35, 1, L.grow) * st.spec.scale * (1 - (L.rot || 0));
    const dead = L.sen > 0.62;
    const stalkBatch = ghost ? this.ghost : this.stems;
    if (L.present) tube(stalkBatch, rach, (i) => r0 * lerp(1, 0.4, i / (rach.length - 1)), () => (ghost ? mix(stalkCol, rgb('#ffffff'), 0.3) : stalkCol), 5);
    // Stipules: a pair clasping the stem either side of the leaf stalk,
    // toothed, with a dark nectary spot. They stay on the stem when the leaf
    // falls, dry and brown.
    const base = V(L.node);
    const d = V(L.dir);
    const out = V(L.out);
    const side = new THREE.Vector3().crossVectors(d, UP).normalize();
    if (L.stipule > 0.1) {
      const sz = L.stipule * (1 - 0.3 * smoothstep(0.5, 1, L.sen));
      const sc = ramp(lr, Math.min(1, L.sen + 0.1));
      const stipCol = mix(mix(C.stipule, green, 0.3), sc, smoothstep(0, 0.4, L.sen));
      for (const sg of [-1, 1]) {
        const sd = d.clone().multiplyScalar(0.5).add(UP.clone().multiplyScalar(0.6)).addScaledVector(side, sg * 0.55).normalize();
        this.flatBlade(this.parts, base.clone().addScaledVector(side, sg * 0.08), sd, out, sz, sz * 0.5,
          (u, v) => (Math.abs(u - 0.35) < 0.15 && Math.abs(v) < 0.45 && L.sen < 0.4 ? C.nectary : stipCol), 0.1, 3);
      }
    }
    const batch = ghost ? this.ghost : dead ? this.deadLeaves : this.leaves;
    if (L.present) for (let j = 0; j < L.leaflets.length; j++) this.buildLeaflet(L.leaflets[j], lr, L, j, batch, ghost);
  }

  // One leaflet: oval, broadest just beyond the middle, a wedge-shaped base
  // and a rounded tip with a tiny point. Young leaflets are folded shut
  // along the midrib; grown ones open to a shallow V; dying ones droop,
  // their margins roll in and the blade crumples.
  buildLeaflet(f, lr, L, j, batch, ghost) {
    const p0 = V(f.p);
    const d = V(f.dir);
    const n = V(f.n);
    const sideL = new THREE.Vector3().crossVectors(n, d).normalize();
    const curl = f.curl;
    const len = f.len * (1 - 0.15 * curl), W = f.width * (1 - 0.15 * curl);
    // Half-angle of each half above the blade plane: folded shut while young.
    const phi = lerp(f.vfold * 0.6, 1.4, clamp(f.fold));
    const NU = 10, NV = 6, H = NV / 2;
    const seedJ = L.patch + j * 1.37;
    // Cross-section (unit half-width): points along each half, rolling in
    // further towards the margin as the leaflet dries.
    const xs = [], zs = [];
    for (let k = 0; k <= NV; k++) {
      const a = (k - H) / H; // -1 … 1
      const sgn = Math.sign(a), m = Math.abs(a);
      let x = 0, z = 0;
      const steps = Math.round(m * H);
      for (let q = 0; q < steps; q++) {
        const ang = phi + curl * 2.5 * ((q + 0.5) / H);
        x += Math.cos(ang) / H;
        z += Math.sin(ang) / H;
      }
      xs.push(sgn * x); zs.push(z);
    }
    const leafCol = ghost ? null : (u, a) => {
      // Margins and tip die first; patches die out of step.
      const edge = Math.abs(a) * 0.6 + u * 0.4;
      const local = clamp(f.sen + smoothstep(0.03, 0.5, f.sen) * (1 - smoothstep(0.8, 1, f.sen)) * (0.28 * edge - 0.1 + 0.3 * (noise(u * 5 + seedJ, a * 3) - 0.5)));
      return ramp(lr, local);
    };
    const ghostCol = ghost ? mix(ramp(lr, f.sen), rgb('#ffffff'), 0.25) : null;
    batch.grid(NU, NV, (i, k, o) => {
      // Rows bunched towards the base and tip so the rounded ends stay round.
      const u = 0.5 - 0.5 * Math.cos((Math.PI * i) / NU);
      // Outline: wedge base, broadest at 0.55, rounded tip.
      const c = 0.55;
      const e = u < c ? (c - u) / c : (u - c) / (1 - c);
      let hw = (W / 2) * Math.sqrt(Math.max(0, 1 - Math.pow(e, u < c ? 2 : 2.6))) * (u < c ? lerp(0.35, 1, smoothstep(0, 0.7, u / c)) : 1);
      if (u >= 1) hw = 0;
      const a = (k - H) / H;
      const crumple = curl * 0.12 * W * Math.sin(u * 13 + a * 4 + seedJ) * Math.abs(a);
      // Midrib bends down along the length (more as it dies).
      const sag = -(0.05 + 0.12 * curl) * len * u * u;
      o.p.copy(p0).addScaledVector(d, u * len)
        .addScaledVector(sideL, xs[k] * hw)
        .addScaledVector(n, zs[k] * hw + sag + crumple);
      o.c = ghost ? ghostCol : leafCol(u, a); o.u = (a + 1) / 2; o.v = (u * len) / 8;
    });
  }

  // ---- Racemes: buds, flowers ------------------------------------------------
  buildRaceme(r, st) {
    const C = this.C;
    const sc = st.spec.scale;
    const base = V(r.base), end = V(r.pedEnd);
    const pedCol = mix(C.calyx, ramp(this.stemRamp, st.ripe), smoothstep(0.05, 0.4, st.ripe));
    // Raceme stalk out to the furthest flower still on it (or pod).
    let reach = -1, keep = 0;
    r.flowers.forEach((f, j) => {
      if (f.state === 'bud' || f.state === 'pod') { reach = j; keep = 1; } else if (f.state === 'open') { reach = j; keep = f.shrink; }
    });
    const pts = [base, end];
    if (reach >= 0) pts.push(end.clone().lerp(V(r.flowers[reach].at), clamp(keep)));
    tube(this.parts, pts, () => 0.05 * sc, () => pedCol, 5);
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
    // A little larger than life (2.5–3 cm); fading flowers shrivel and drop.
    const s = sc * 1.15 * (1 - 0.4 * wilt) * Math.pow(clamp(f.shrink ?? 1), 0.6);
    if (s < 0.02) return;
    const dd = dir.clone();
    // Frame: dd along the flower, up = world up made perpendicular to it.
    const up = UP.clone().addScaledVector(dd, -UP.dot(dd)).normalize();
    const side = new THREE.Vector3().crossVectors(dd, up).normalize();
    const brown = smoothstep(0.3, 1, wilt);
    // Calyx: a green tube with the petals coming out of it.
    const calL = 0.75 * s;
    const ce = at.clone().addScaledVector(dd, calL);
    tube(this.parts, [at, at.clone().addScaledVector(dd, calL * 0.5), ce], (i) => [0.1, 0.2, 0.24][i] * s, () => C.calyx, 7);
    // Petals: white with a faint cream-pink flush; fading flowers go brown.
    const petal = mix(mix(C.petal, C.petalFlush, 0.3 * open), C.petalWilt, brown);
    // Standard: the large upper petal. Its lower part forms a hood over the
    // wings; its tip flares and turns up as the flower opens. White with
    // dark purplish-brown veins.
    const SL = 1.9 * s, SW = 1.35 * s;
    const lift = (10 + 70 * open * (1 - 0.6 * wilt)) * Math.PI / 180;
    this.petals.grid(10, 8, (i, j, o) => {
      const u = i / 10, v = (j / 8) * 2 - 1;
      const ang = 0.12 + lift * smoothstep(0.45, 1, u);
      const along = dd.clone().multiplyScalar(Math.cos(ang)).addScaledVector(up, Math.sin(ang));
      const flare = lerp(0.42, 1, smoothstep(0.35, 0.85, u) * open * (1 - 0.5 * wilt));
      const w = (SW / 2) * Math.pow(Math.sin(Math.PI * clamp(0.1 + u * 0.9)), 0.5) * flare;
      // Sides curl down round the wings, less so in the flared tip.
      const curl = (1 - smoothstep(0.5, 0.9, u) * open) * 0.75;
      o.p.copy(ce).addScaledVector(dd, SL * 0.55 * u).addScaledVector(along, SL * 0.45 * smoothstep(0.4, 1, u) * u)
        .addScaledVector(side, v * w * (1 - 0.35 * curl * v * v))
        .addScaledVector(up, 0.18 * s - v * v * w * curl);
      const vein = Math.pow(0.5 + 0.5 * Math.cos(v * Math.PI * 7), 6) * (1 - u) * smoothstep(0.1, 0.4, u);
      o.c = mix(petal, C.vein, 0.75 * vein * (1 - brown)); o.u = 0; o.v = 0;
    });
    // Wings: a pair of petals under the hood, sticking out beyond it, each
    // with a large black-brown blotch (the field mark of a bean flower).
    for (const sg of [-1, 1]) {
      const wd = dd.clone().addScaledVector(side, sg * 0.22 * open).addScaledVector(up, -0.2).normalize();
      const wb = ce.clone().addScaledVector(side, sg * 0.1 * s).addScaledVector(up, -0.02 * s);
      const WL = 1.55 * s, WW = 0.7 * s;
      const wside = new THREE.Vector3().crossVectors(wd, side).normalize(); // roughly up/down
      this.petals.grid(10, 8, (i, j, o) => {
        const u = i / 10, v = (j / 8) * 2 - 1;
        const w = (WW / 2) * Math.pow(Math.sin(Math.PI * clamp(0.12 + u * 0.88)), 0.6) * lerp(0.6, 1, open);
        o.p.copy(wb).addScaledVector(wd, WL * u).addScaledVector(wside, v * w).addScaledVector(side, sg * (0.06 * s + v * v * 0.06 * s));
        const blot = 1 - smoothstep(0.75, 1.05, Math.hypot((u - 0.64) / 0.27, (v + 0.05) / 0.72));
        o.c = mix(petal, mix(C.blotch, C.petalWilt, brown * 0.5), blot); o.u = 0; o.v = 0;
      });
    }
    // Keel: small, pale greenish, between the wings.
    const kd = dd.clone().addScaledVector(up, -0.25).normalize();
    ellipsoid(this.parts, ce.clone().addScaledVector(kd, 0.45 * s), kd, 0.9 * s, 0.16 * s, () => mix(rgb('#e8ecd8'), C.petalWilt, brown), 5, 6);
  }

  // ---- Pods ----------------------------------------------------------------
  // Thick, a little flattened, bulging over each seed, held up when young and
  // swinging out and down as they fill. Green and downy, then yellowing, then
  // blackening in patches from the tip, ending dull black with a slight
  // sheen, shrunk round the seeds.
  buildPod(p, st) {
    const C = this.C;
    const P = this.P;
    const at = V(p.at);
    const dir = V(p.dir);
    const L = Math.max(0.05, p.len);
    const beak = P.PODS.beak * st.spec.scale * clamp(p.size * 1.5) * p.setAge;
    const ripeDry = smoothstep(4, 5.2, p.seed);
    const R = p.r * (1 - 0.12 * ripeDry);
    const fill = smoothstep(0.6, 2, p.seed);
    const n = 18;
    // Centre line: out along dir, curving gently (each pod its own way) and
    // turning up a little into the beak.
    const pts = [];
    const q = at.clone();
    const dd = dir.clone();
    const hor = new THREE.Vector3().crossVectors(dir, UP);
    if (hor.lengthSq() < 1e-6) hor.set(1, 0, 0);
    hor.normalize();
    const bendAxis = new THREE.Vector3().crossVectors(hor, dir).normalize();
    const total = L + beak;
    for (let i = 0; i <= n; i++) {
      pts.push(q.clone());
      dd.addScaledVector(bendAxis, (p.bend * 0.6) / n).normalize();
      if (i > n * 0.75) dd.lerp(UP, 0.04).normalize();
      q.addScaledVector(dd, total / n);
    }
    const F = frames(pts);
    // Colour: base colour from the seed state, ripening ahead in patches and
    // towards the tip; each pod a little different.
    const pv = p.v * 10;
    const colAt = (u, a) => {
      const local = p.seed + (0.55 * (noise(u * 4 + pv, a * 1.3 + pv) - 0.5) + 0.35 * (u - 0.4)) * smoothstep(2.4, 3.4, p.seed) * (1 - 0.6 * smoothstep(5, 5.6, p.seed));
      let c = this.seedColour(local).pod;
      // Black pods: dull grey-black to brown-black.
      c = mix(c, mix(C.podBlack, C.podBrownBlack, p.v), smoothstep(4.6, 5.4, local) * 0.6);
      return c;
    };
    const batch = p.seed >= 4.2 ? this.podsRipe : this.podsGreen;
    const RAD = 12;
    batch.grid(n, RAD, (i, j, o) => {
      const s = (total * i) / n;
      const u = s / L;
      let r;
      if (s > L) r = Math.max(0.02, 0.06 * (1 - (s - L) / Math.max(0.01, beak)));
      else {
        // Blunt, rounded ends: a short taper into the stalk and the beak.
        const body = Math.pow(Math.sin(Math.PI * clamp(0.04 + u * 0.92)), 0.22) * lerp(0.82, 1, smoothstep(0, 0.35, u));
        const bump = Math.max(0, Math.sin(u * Math.PI * p.seeds));
        const bulge = 1 + (0.14 * fill + 0.12 * ripeDry) * bump - 0.1 * ripeDry * (1 - bump);
        r = Math.max(0.02, R * body * bulge);
      }
      const a = (TWO_PI * j) / RAD;
      // Orient the ellipse: wide along `hor`, narrower (flattened) across.
      const e1 = F[i].e1, e2 = F[i].e2;
      const c1 = e1.dot(hor), c2 = e2.dot(hor);
      const ang0 = Math.atan2(c2, c1);
      const ca = Math.cos(a), sa = Math.sin(a);
      // Dry pods wrinkle a little.
      const wr = 1 + 0.04 * ripeDry * Math.sin(a * 5 + u * 17 + pv);
      const x = ca * r * 0.8 * wr, y = sa * r * wr;
      o.p.copy(pts[i])
        .addScaledVector(e1, x * Math.cos(ang0) - y * Math.sin(ang0))
        .addScaledVector(e2, x * Math.sin(ang0) + y * Math.cos(ang0));
      o.c = colAt(Math.min(u, 1.05), a); o.u = 0; o.v = 0;
    });
    // Short stalk.
    tube(this.parts, [at.clone().addScaledVector(dir, -0.3), at], () => 0.06, () => colAt(0, 0), 5);
  }
}
