// Cereal ears built from instanced parts. The crop's EAR.type picks the
// builder: 'wheat' (buildEar) or 'barley' (buildBarleyEar, two-row).
//
// Structure of a wheat ear (spike), as modelled:
//   - ~20 spikelets, one per rachis node, alternating on opposite sides of a
//     zig-zag rachis. Spikelets sit flatwise against the rachis, so in face
//     view the ear shows two rows; in edge view one overlapping column.
//   - Each spikelet: two keeled glumes outside, then florets (lemma + palea)
//     alternating left/right on the rachilla. Typically 2–3 set grain.
//   - Basal spikelets are small/rudimentary, the terminal spikelet is turned
//     90° to the others.
//   - Flowering starts in the middle of the ear and spreads up and down;
//     three anthers per floret are pushed out and hang on filaments.
// Most UK winter wheats are awnless; awns are an option (opts.variant).
//
// Structure of a two-row barley ear, as modelled:
//   - ~24 rachis nodes alternating on opposite sides. Each node carries three
//     single-floret spikelets: the central one is fertile and forms one of
//     the two rows of grain; the two lateral ones are small and sterile.
//   - Each fertile floret's lemma carries a long awn (~12 cm). Awns grow
//     inside the boot, bundled up the flag leaf sheath, and appear above the
//     flag leaf ligule (GS49) before the ear does.
//   - Glumes are narrow and bristle-like. Flowering happens mostly inside the
//     closed florets, so no anthers are drawn.
//   - Ripe ears hang over: the neck bend is part of the shoot axis
//     (morphology `neck`), so the ear follows it.

import * as THREE from 'three';
import { clamp, lerp, smoothstep, hash } from '../model/interp.js';
import { PALETTE as P, mix, rgb } from './materials.js';

const DEG = Math.PI / 180;

// Ear colour: green, turning golden as it ripens.
function earColour(ripe) {
  const green = mix(P.ear, P.earPale, 0.15);
  return ripe < 0.6 ? mix(green, P.earGold, smoothstep(0.05, 0.6, ripe)) : mix(P.earGold, P.earRipe, smoothstep(0.6, 1, ripe));
}

// Boat-shaped part (glume, lemma): origin at the base, length along +y,
// width along x, depth along z. Rounded base, pointed tip, keel on +z.
function boatGeometry(len, width, depth, { keel = 0.25, beak = 0 } = {}) {
  const U = 14, V = 12;
  const pos = [], idx = [], uv = [];
  const prof = (u) => {
    const a = 0.5, b = 0.95;
    const m = Math.pow(a / (a + b), a) * Math.pow(b / (a + b), b);
    return (Math.pow(u, a) * Math.pow(1 - u, b)) / m;
  };
  for (let i = 0; i <= U; i++) {
    const u = i / U;
    const f = prof(u);
    for (let j = 0; j <= V; j++) {
      const v = (j / V) * Math.PI * 2;
      const sx = Math.cos(v), sz = Math.sin(v);
      const k = sz > 0 ? 1 + keel * Math.pow(sz, 6) : 1 - 0.35 * Math.pow(-sz, 2); // keeled back, flatter front
      const x = (width / 2) * f * sx;
      const z = (depth / 2) * f * sz * k;
      const y = len * u + (beak * Math.pow(u, 6) * (sz > 0 ? sz : 0));
      pos.push(x, y, z);
      uv.push(j / V, u);
    }
  }
  for (let i = 0; i < U; i++) {
    for (let j = 0; j < V; j++) {
      const a = i * (V + 1) + j, b = a + V + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1); // outward-facing
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

const MAX_EARS = 3;
const SPIKELETS = 21;
const FLORETS = 3;
// Two-row barley: rachis nodes per main-shoot ear (≈ grains per ear; AHDB
// benchmark 24 for winter barley). A crop can set EAR.nodes instead.
const BARLEY_NODES = 24;
// Barley awns: segments per awn and their widths (× the 0.1 mm radius of
// the segment geometry): ~0.6 mm across at the base, tapering to the tip.
const AWN_SEGS = 5;
const AWN_WIDTH = [3, 2.5, 2, 1.5, 0.9];
const AWN_TIP = rgb('#7d6a52');

export class EarMesh {
  // model: from createModel(crop) — supplies the crop's ear profile and size.
  constructor(M, model) {
    this.M = M;
    this.model = model;
    this.group = new THREE.Group();
    const inst = (geo, mat, count) => {
      const m = new THREE.InstancedMesh(geo, mat, count);
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      // Create per-instance colours up front (adding them after the first
      // render leaves a stale vertex layout).
      m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3).fill(1), 3);
      m.instanceColor.setUsage(THREE.DynamicDrawUsage);
      m.castShadow = true;
      m.receiveShadow = true;
      m.frustumCulled = false;
      m.count = 0;
      this.group.add(m);
      return m;
    };
    // Instances per ear: enough for a wheat ear or a two-row barley ear.
    const per = {
      glumes: Math.max(SPIKELETS * 2, BARLEY_NODES * 2),
      lemmas: Math.max(SPIKELETS * FLORETS, BARLEY_NODES * 3),
      awns: SPIKELETS * FLORETS,
      rachis: Math.max(SPIKELETS, BARLEY_NODES),
    };
    this.glumes = inst(boatGeometry(0.8, 0.46, 0.3, { keel: 0.6, beak: 0.06 }), M.ear, MAX_EARS * per.glumes);
    this.lemmas = inst(boatGeometry(0.95, 0.52, 0.36, { keel: 0.3, beak: 0.03 }), M.ear, MAX_EARS * per.lemmas);
    // Anthers are ~3–4 mm long and under 1 mm wide in life; drawn ~1.6× thicker
    // so they read at plant scale (they are the flowering diagnostic).
    const anther = new THREE.CapsuleGeometry(0.055, 0.34, 3, 8);
    anther.translate(0, -0.22, 0); // hang from the top
    this.anthers = inst(anther, M.anther, MAX_EARS * SPIKELETS * FLORETS * 3);
    const fil = new THREE.CylinderGeometry(0.006, 0.006, 1, 3, 1, true);
    fil.translate(0, -0.5, 0);
    this.filaments = inst(fil, M.anther, MAX_EARS * SPIKELETS * FLORETS * 3);
    this.filaments.castShadow = false;
    const awn = new THREE.CylinderGeometry(0.004, 0.014, 1, 4, 1, true);
    awn.translate(0, 0.5, 0);
    this.awns = inst(awn, M.awn, MAX_EARS * per.awns);
    // Barley awns: chains of short, even-width segments (they curve).
    const awnSeg = new THREE.CylinderGeometry(0.01, 0.01, 1, 4, 1, true);
    awnSeg.translate(0, 0.5, 0);
    this.awnSegs = inst(awnSeg, M.awn, MAX_EARS * BARLEY_NODES * AWN_SEGS);
    const rach = new THREE.CylinderGeometry(0.05, 0.07, 1, 6, 1);
    rach.translate(0, 0.5, 0);
    this.rachis = inst(rach, M.ear, MAX_EARS * per.rachis);
    this.tmp = { m: new THREE.Matrix4(), m2: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), v: new THREE.Vector3(), s: new THREE.Vector3(), c: new THREE.Color() };
    this.anchors = {};
  }

  // shoots: [{ sh, axis }]
  build(plant, items, opts) {
    const counts = { glumes: 0, lemmas: 0, anthers: 0, filaments: 0, awns: 0, awnSegs: 0, rachis: 0 };
    // Cleared each build: with no main ear yet (going back to a seedling
    // stage), stale anchors from a later stage would stretch the framing.
    this.anchors = {};
    const builder = this.model.crop.params.EAR.type === 'barley' ? this.buildBarleyEar : this.buildEar;
    for (const it of items.slice(0, MAX_EARS)) builder.call(this, it.sh, it.axis, opts, counts, it.sh === plant.main);
    for (const k of Object.keys(counts)) {
      this[k].count = counts[k];
      this[k].instanceMatrix.needsUpdate = true;
      if (this[k].instanceColor) this[k].instanceColor.needsUpdate = true;
    }
  }

  put(mesh, counts, key, matrix, color) {
    const i = counts[key]++;
    mesh.setMatrixAt(i, matrix);
    this.tmp.c.setRGB(color[0], color[1], color[2]);
    mesh.setColorAt(i, this.tmp.c);
  }

  // Ear placement shared by the builders. topCollar: the youngest visible
  // collar, i.e. the top of whatever encloses the ear. frameAt(y): position
  // and rotation at height y up the ear. It follows the curve of the shoot
  // axis (so an enclosed ear stays inside its sheath on a leaning tiller),
  // then the nod is applied about the ear base.
  earFrame(sh, axis) {
    const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0);
    const topCollar = Math.max(...sh.leaves.filter((l) => l.sheath).map((l) => l.collarS));
    const emerged = clamp((sh.earTop - topCollar) / sh.earLen);
    // Ear orientation: fixed face direction per shoot. Ripe ears bow over
    // (EAR.nod degrees) and tiller ears lean out slightly — only once they're
    // free of the sheath.
    const twist = new THREE.Quaternion().setFromAxisAngle(Y, sh.earTwist ?? (sh.k ? hash('earAz', sh.k) * Math.PI : 0));
    const base = axis.at(sh.earBase, {});
    const nod = (sh.K.ripe * this.model.crop.params.EAR.nod + (sh.earNod ?? (sh.k ? 4 : 0))) * DEG * emerged;
    const nodAxis = X.clone().applyQuaternion(base.q.clone().multiply(twist));
    const nodQ = new THREE.Quaternion().setFromAxisAngle(nodAxis, nod);
    const frameAt = (y) => {
      const f = axis.at(sh.earBase + y, {});
      const pos = f.p.clone().sub(base.p).applyQuaternion(nodQ).add(base.p);
      const rot = nodQ.clone().multiply(f.q).multiply(twist);
      return { pos, rot };
    };
    return { topCollar, emerged, frameAt };
  }

  // Inside a sheath the spikelets are pressed together: squeeze one sideways
  // (premultiplying its ear-local matrix) so it fits within the space the
  // model leaves for the ear (what the sheaths are fitted around). It relaxes
  // as it passes the ligule. Returns how enclosed it is (0..1).
  fitInside(sh, local, parts, y, topCollar) {
    const E = sh.earLen;
    const earProfile = this.model.earProfile;
    if (!this.corners) {
      const corners = (g) => {
        if (!g.boundingBox) g.computeBoundingBox();
        const b = g.boundingBox;
        return [0, 1, 2, 3, 4, 5, 6, 7].map((i) => new THREE.Vector3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z));
      };
      this.corners = { glume: corners(this.glumes.geometry), lemma: corners(this.lemmas.geometry) };
    }
    let radial = 0, yLo = 1e9, yHi = -1e9;
    for (const pt of parts) {
      const mm = new THREE.Matrix4().multiplyMatrices(local, pt.m);
      for (const c of this.corners[pt.kind]) {
        const w = c.clone().applyMatrix4(mm);
        radial = Math.max(radial, Math.hypot(w.x, w.z));
        yLo = Math.min(yLo, w.y); yHi = Math.max(yHi, w.y);
      }
    }
    const lo = clamp((y + Math.max(0, yLo)) / E), hi = clamp((y + yHi) / E);
    const allowed = sh.earR * Math.min(earProfile(lo), earProfile(hi), earProfile((lo + hi) / 2)) + 0.012;
    const squeeze = Math.min(1, allowed / Math.max(radial, 1e-4));
    const enclosed = 1 - smoothstep(-0.1, 0.5, sh.earBase + y + (yLo + yHi) / 2 - topCollar);
    const sq = lerp(1, squeeze, enclosed);
    local.premultiply(new THREE.Matrix4().makeScale(sq, 1, sq));
    return enclosed;
  }

  buildEar(sh, axis, opts, counts, isMain) {
    const K = sh.K;
    const E = sh.earLen;
    if (E < 0.05) return;
    const earProfile = this.model.earProfile;
    const finalLen = this.model.crop.params.MAIN.earLen * sh.scale * (sh.k ? 0.96 : 1);
    const ly = E / finalLen; // ear grows in length…
    const lw = clamp(sh.earW, 0.08, 1) * sh.scale; // …and in width
    const ripe = K.ripe;
    const fill = K.fill;
    const { m, m2, q, e, v, s } = this.tmp;
    const { topCollar, frameAt } = this.earFrame(sh, axis);
    const earCol = earColour(ripe);

    // ---- Lay out spikelets in ear-local units (before fitting) ------------
    const nS = sh.k ? SPIKELETS - 1 - sh.k : SPIKELETS;
    const sy = Math.max(ly, 0.3);
    const spikes = [];
    for (let j = 0; j < nS; j++) {
      const terminal = j === nS - 1;
      const u = (j + 0.5) / nS;
      const side = terminal ? 0 : j % 2 === 0 ? -1 : 1;
      // Size: rudimentary basal spikelets, smaller towards the tip.
      const size = (j === 0 ? 0.5 : j === 1 ? 0.72 : j === 2 ? 0.88 : 1) * (0.78 + 0.22 * earProfile(Math.min(u, 0.85))) * (terminal ? 0.85 : 1);
      const y = finalLen * (0.02 + 0.9 * u) * ly;
      spikes.push({ j, u, side, terminal, size, y, top: y + 1.12 * size * sy });
    }
    // Fit the length: the tip of the top spikelet is the tip of the ear.
    const lenFit = Math.min(1, E / Math.max(...spikes.map((p) => p.top)));

    // Part transforms within a spikelet (spikelet-local units).
    const gape = (6 + 10 * fill + 4 * ripe) * DEG; // glumes open as grains swell
    const parts = (sp) => {
      const out = [];
      for (const gz of [-1, 1]) {
        q.setFromEuler(e.set(gz * gape, 0, 0));
        out.push({ kind: 'glume', m: new THREE.Matrix4().compose(v.set(0, 0, gz * 0.15), q, s.set(1, 1, gz)) }); // mirrored: keel faces out
      }
      const nF = sp.j < 2 || sp.terminal ? 2 : 3;
      for (let f = 0; f < nF; f++) {
        const fz = f === 2 ? 0 : f === 0 ? -1 : 1;
        const swell = 1 + 0.35 * fill * (f === 2 ? 0.6 : 1);
        q.setFromEuler(e.set(fz * (14 + 8 * fill) * DEG, 0, 0));
        const fy = f === 2 ? 0.2 : 0.06 + 0.06 * f;
        const fs = f === 2 ? 0.82 : 1;
        out.push({ kind: 'lemma', f, fz, m: new THREE.Matrix4().compose(v.set(0, fy, fz * 0.09), q, s.set(fs * (1 + 0.12 * fill), fs, fs * swell * (fz < 0 ? -1 : 1))) });
      }
      return out;
    };

    // Rachis: short segments between spikelets, following the axis.
    const rachCol = mix(earCol, P.stem, 0.3);
    for (let j = 0; j < nS; j++) {
      const y0 = j === 0 ? 0 : spikes[j - 1].y * lenFit, y1 = spikes[j].y * lenFit;
      if (y1 - y0 < 1e-3) continue;
      const F = frameAt(y0);
      m.compose(F.pos, F.rot, s.set(lw, y1 - y0, lw));
      this.put(this.rachis, counts, 'rachis', m, rachCol);
    }

    for (const sp of spikes) {
      const { j, u, side, terminal, size } = sp;
      const y = sp.y * lenFit;
      const tilt = lerp(12, 30, smoothstep(0.62, 0.9, sh.earW)) + 6 * fill;
      const spQ = new THREE.Quaternion().setFromEuler(e.set(0, terminal ? Math.PI / 2 : 0, -side * tilt * DEG));
      const local = new THREE.Matrix4().compose(v.set(side * 0.17 * lw, 0, 0), spQ, s.set(size * lw, size * sy * lenFit, size * lw));
      const P_ = parts(sp);
      this.fitInside(sh, local, P_, y, topCollar);

      const F = frameAt(y);
      const spM = new THREE.Matrix4().compose(F.pos, F.rot, s.set(1, 1, 1)).multiply(local);
      const varC = (hash('sc', sh.k, j) - 0.5) * 0.06;
      const sc = earCol.map((x) => x * (1 + varC));

      for (const pt of P_) {
        m.multiplyMatrices(spM, pt.m);
        if (pt.kind === 'glume') { this.put(this.glumes, counts, 'glumes', m, mix(sc, P.earPale, 0.12)); continue; }
        this.put(this.lemmas, counts, 'lemmas', m, mix(sc, P.earPale, 0.05));
        const lemmaM = m.clone();
        const { f, fz } = pt;

        // Awns (optional) from the lemma tip.
        if (opts.variant && (f < 2 || j > 3)) {
          const awnLen = (3 + 4 * u) * (f === 2 ? 0.8 : 1) * Math.max(0, (ly - 0.3) / 0.7);
          if (awnLen > 0.05) {
            q.setFromEuler(e.set(fz * 6 * DEG, 0, side * -8 * DEG));
            m2.compose(v.set(0, 0.9, 0), q, s.set(1, awnLen / size, 1));
            m.multiplyMatrices(lemmaM, m2);
            this.put(this.awns, counts, 'awns', m, mix(sc, P.earPale, 0.2));
          }
        }

        // Anthers. Flowering order: rank 0 at ~55% up the ear, rising to 1 at
        // the tip and base; the third floret flowers a little later.
        const rank = Math.abs(u - 0.55) / 0.55;
        const tau = 0.08 + 0.5 * rank + (f === 2 ? 0.1 : 0) + hash('ft', sh.k, j, f) * 0.04;
        const dt = K.flower - tau;
        if (dt > 0 && K.flower > 0) {
          const extrude = smoothstep(0, 0.05, dt);
          const fade = smoothstep(0.12, 0.32, dt);
          const remain = hash('rem', sh.k, j, f) < 0.3; // some spent anthers stay trapped
          const gone = (dt > 0.4 && !remain) || K.fill > 0.75;
          if (!gone) {
            const ac = mix(P.anther, P.antherSpent, fade);
            const wither = 1 - 0.4 * fade;
            for (let a = 0; a < 3; a++) {
              // Hang from the floret tip on a filament, swinging outwards.
              const ang = (a - 1) * 0.5 + fz * 0.6 + hash('aa', sh.k, j, f, a) * 0.3;
              const filLen = 0.12 + 0.28 * extrude;
              const tipWorld = new THREE.Vector3(0, 0.82, 0.1).applyMatrix4(lemmaM);
              const outDir = new THREE.Vector3(Math.sin(ang) * 0.6, 0, Math.cos(ang)).applyQuaternion(F.rot);
              const hang = new THREE.Vector3(0, -1, 0).addScaledVector(outDir, 1.1).normalize();
              q.setFromUnitVectors(new THREE.Vector3(0, -1, 0), hang);
              const filEnd = tipWorld.clone().addScaledVector(hang, filLen * sh.scale);
              m.compose(tipWorld, q, s.set(sh.scale, filLen * sh.scale, sh.scale));
              this.put(this.filaments, counts, 'filaments', m, mix(P.antherSpent, ac, 0.3));
              m.compose(filEnd, q, s.set(sh.scale * wither, sh.scale * (0.9 + 0.1 * extrude) * wither, sh.scale * wither));
              this.put(this.anthers, counts, 'anthers', m, ac);
            }
          }
        }
      }
    }

    if (isMain) {
      const w = (yy) => frameAt(yy).pos;
      this.anchors = { base: w(0), mid: w(E * 0.5), top: w(E), midFloret: w(E * 0.55) };
    }
  }

  // Two-row barley ear (see the structure notes at the top of the file).
  buildBarleyEar(sh, axis, opts, counts, isMain) {
    const K = sh.K;
    const E = sh.earLen;
    if (E < 0.05) return;
    const earProfile = this.model.earProfile;
    const finalLen = this.model.crop.params.MAIN.earLen * sh.scale * (sh.k ? 0.96 : 1);
    const ly = E / finalLen; // ear grows in length…
    const lw = clamp(sh.earW, 0.08, 1) * sh.scale; // …and in width
    const { ripe, fill } = K;
    const { m, q, e, v, s } = this.tmp;
    const UP = new THREE.Vector3(0, 1, 0);
    const { topCollar, frameAt } = this.earFrame(sh, axis);
    const earCol = earColour(ripe);
    const sy = Math.max(ly, 0.3);
    const tAt = this.model.tAt;

    // ---- Lay out rachis nodes in ear-local units (before fitting) ---------
    // Alternate nodes face opposite ways: these are the two rows of grain.
    const nN = (this.model.crop.params.EAR.nodes ?? BARLEY_NODES) - (sh.k ? 1 + sh.k : 0);
    const nodes = [];
    for (let j = 0; j < nN; j++) {
      const u = (j + 0.5) / nN;
      const size = (j === 0 ? 0.6 : j === 1 ? 0.82 : 1) * (0.8 + 0.2 * earProfile(Math.min(u, 0.85)));
      const y = finalLen * (0.02 + 0.86 * u) * ly;
      nodes.push({ j, u, az: j % 2 === 0 ? 0 : Math.PI, size, y, top: y + size * sy });
    }
    // Fit the length: the tip of the top spikelet is the tip of the ear.
    const lenFit = Math.min(1, E / Math.max(...nodes.map((n) => n.top)));

    const rachCol = mix(earCol, P.stem, 0.3);
    for (let j = 0; j < nN; j++) {
      const y0 = j === 0 ? 0 : nodes[j - 1].y * lenFit, y1 = nodes[j].y * lenFit;
      if (y1 - y0 < 1e-3) continue;
      const F = frameAt(y0);
      m.compose(F.pos, F.rot, s.set(lw * 0.8, y1 - y0, lw * 0.8));
      this.put(this.rachis, counts, 'rachis', m, rachCol);
    }

    // Parts within a spikelet (spikelet-local: +y along it, +z its back).
    // Fertile: a long narrow lemma (the hull of the grain) between two
    // bristle-like glumes. Sterile laterals: just a small lemma.
    const fertileParts = [
      { kind: 'lemma', m: new THREE.Matrix4().compose(v.set(0, 0.02, 0), q.identity(), s.set(0.66 * (1 + 0.1 * fill), 1.05, 0.85 * (1 + 0.35 * fill))) },
    ];
    for (const gx of [-1, 1]) {
      q.setFromEuler(e.set(0, 0, -gx * 8 * DEG));
      fertileParts.push({ kind: 'glume', m: new THREE.Matrix4().compose(v.set(gx * 0.13, 0, -0.03), q, s.set(0.2, 0.6, 0.25)) });
    }
    const sterileParts = [{ kind: 'lemma', m: new THREE.Matrix4().compose(v.set(0, 0, 0), q.identity(), s.set(0.42, 0.5, 0.45)) }];

    let awnTop = null;
    for (const nd of nodes) {
      const y = nd.y * lenFit;
      const F = frameAt(y);
      const frameM = new THREE.Matrix4().compose(F.pos, F.rot, s.set(1, 1, 1));
      const tilt = lerp(8, 18, smoothstep(0.6, 0.9, sh.earW)) + 4 * fill;
      const varC = (hash('sc', sh.k, nd.j) - 0.5) * 0.06;
      const sc = earCol.map((x) => x * (1 + varC));
      // Central (fertile) spikelet, then the two sterile laterals beside it.
      for (const [daz, fertile] of [[0, true], [-70 * DEG, false], [70 * DEG, false]]) {
        const az = nd.az + daz;
        const sz = nd.size * (fertile ? 1 : 0.9);
        q.setFromEuler(e.set((tilt + (fertile ? 0 : 12)) * DEG, Math.PI / 2 - az, 0, 'YXZ'));
        const local = new THREE.Matrix4().compose(
          v.set(Math.cos(az) * 0.1 * lw, 0, Math.sin(az) * 0.1 * lw), q, s.set(sz * lw, sz * sy * lenFit, sz * lw));
        const parts = fertile ? fertileParts : sterileParts;
        const enclosed = this.fitInside(sh, local, parts, y, topCollar);
        const spM = frameM.clone().multiply(local);
        let lemmaM = null;
        for (const pt of parts) {
          m.multiplyMatrices(spM, pt.m);
          if (pt.kind === 'glume') { this.put(this.glumes, counts, 'glumes', m, mix(sc, P.earPale, 0.2)); continue; }
          this.put(this.lemmas, counts, 'lemmas', m, mix(sc, P.earPale, fertile ? 0.05 : 0.3));
          lemmaM = m.clone();
        }
        if (!fertile) continue;

        // Awn from the lemma tip, drawn as a chain of short segments so it
        // can curve. Free: each awn has its own length, spread, sideways
        // lean and gentle bend, so once the ear is out they fan out unevenly
        // and cross each other (lower awns spread more), as on a real ear. Enclosed: they are
        // bundled up the middle of the flag leaf sheath, so the tips reach
        // about (ear tip + awn length), as the model measures.
        const L = sh.awnLen * (0.8 + 0.2 * nd.u);
        if (L < 0.05) continue;
        const rnd = (tag) => hash('awn', tag, sh.k, nd.j);
        const tip = new THREE.Vector3(0, 0.92, 0.02).applyMatrix4(lemmaM);
        const radW = new THREE.Vector3(Math.cos(nd.az), 0, Math.sin(nd.az)).applyQuaternion(F.rot);
        const earDir = UP.clone().applyQuaternion(F.rot);
        const tanW = new THREE.Vector3().crossVectors(earDir, radW).normalize();

        // Free path. Awns come out of the boot aligned and bunched, parallel
        // to the ear, then slowly open out: `open` eases from 0 when the ear
        // tip appears (GS51) to 1 at harvest ripe (GS92), on this shoot's own
        // clock, each awn a little ahead of or behind the others.
        const open = clamp((smoothstep(tAt(51), tAt(92), sh.ts) - 0.3 * rnd('op')) / 0.7);
        const Lf = L * (0.85 + 0.25 * rnd('len'));
        const spread = lerp(0.3, 0.05, nd.u) * (0.4 + 1.2 * rnd('sp')) * (1 + 0.6 * ripe) * open;
        const lean = (rnd('sd') - 0.5) * 0.4 * open;
        const d = UP.clone().transformDirection(lemmaM).lerp(earDir, lerp(1, 0.65, open))
          .addScaledVector(radW, spread - 0.015 * (1 - open)).addScaledVector(tanW, lean).normalize();
        const ba = rnd('ba') * Math.PI * 2;
        const bendAxis = tanW.clone().multiplyScalar(Math.cos(ba)).addScaledVector(radW, Math.sin(ba));
        const bend = (rnd('bd') - 0.35) * 0.14 * open; // radians per segment, mostly outwards
        const free = [tip.clone()];
        for (let i = 1; i <= AWN_SEGS; i++) {
          d.applyAxisAngle(bendAxis, bend * (0.6 + 0.8 * hash('aw', sh.k, nd.j, i))).normalize();
          free.push(free[i - 1].clone().addScaledVector(d, Lf / AWN_SEGS));
        }

        // Bundled path: from the lemma tip in to the axis just above the ear,
        // then straight up it. Never longer than the model's awn length.
        const Le = Math.min(L, Lf);
        const head = frameAt(E + 0.6).pos.addScaledVector(radW, 0.03 * sh.scale);
        const dA = head.distanceTo(tip);
        const bundled = (dist) => dist <= dA
          ? tip.clone().lerp(head, dist / dA)
          : frameAt(E + 0.6 + (dist - dA)).pos.addScaledVector(radW, 0.03 * sh.scale);

        // Blend the two, segment by segment. Tips darken (photo: purplish-
        // brown tips on green awns) until the whole ear ripens to straw.
        const awnCol = mix(sc, P.earPale, 0.15);
        const tipCol = mix(awnCol, AWN_TIP, 0.45 * (1 - ripe));
        let prev = tip;
        for (let i = 1; i <= AWN_SEGS; i++) {
          const pt = free[i].lerp(bundled((Le * i) / AWN_SEGS), enclosed);
          const seg = pt.clone().sub(prev);
          const len = seg.length();
          if (len > 1e-4) {
            q.setFromUnitVectors(UP, seg.normalize());
            // Packed tight (and drawn slimmer) while bundled in the boot.
            const w = AWN_WIDTH[i - 1] * sh.scale * lerp(1, 0.6, enclosed);
            m.compose(prev, q, s.set(w, len, w));
            this.put(this.awnSegs, counts, 'awnSegs', m, mix(awnCol, tipCol, Math.pow(i / AWN_SEGS, 1.5)));
          }
          prev = pt;
        }
        const p2 = prev;
        if (nd.j === nN - 1 || (nd.j === nN - 2)) awnTop = awnTop && awnTop.y > p2.y ? awnTop : p2.clone();
      }
    }

    if (isMain) {
      const w = (yy) => frameAt(yy).pos;
      this.anchors = { base: w(0), mid: w(E * 0.5), top: w(E), midFloret: w(E * 0.55), awnTop };
    }
  }
}
