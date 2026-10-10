// Oat panicle, built from instanced parts by EarMesh (EAR.type 'panicle').
//
// Structure, as modelled (Opti-Oat Oat Growth Guide, 2019):
//   - A central rachis with 5–7 nodes. At each node a whorl of branches
//     (often about four) radiates out; the lowest whorl has the most and the
//     longest branches, and the number of spikelets per whorl falls towards
//     the top (about 75% of the spikelets are on the bottom three whorls).
//     A terminal spikelet tips the rachis.
//   - Spikelets hang at the ends of small branches (pedicels). Each has two
//     large, papery glumes round two (sometimes three) florets; most set two
//     grains of unequal size. The lemma and palea stay on the grain as the
//     husk.
//   - Inside the boot the branches are pressed against the rachis and the
//     spikelets point upwards, squeezed into the space the model leaves for
//     the panicle (what the sheaths are fitted around). Each whorl spreads
//     once it is clear of the flag leaf ligule; the spikelets then hang down
//     on their pedicels and the branch tips droop, more so as the grain fills.
//   - Flowering runs from the top of the panicle downwards, the lower floret
//     of each spikelet first. Only some florets push their anthers out.
//
// The crop's params.PANICLE gives the counts and proportions (see
// src/crops/spring-oats/params.js). Everything is laid out in panicle-local
// coordinates (y up the rachis from its base, x/z across it, cm) and mapped
// through the shoot axis, so the panicle follows the bend of the neck.

import * as THREE from 'three';
import { clamp, lerp, smoothstep, hash } from '../model/interp.js';
import { PALETTE as P, mix } from './materials.js';

const DEG = Math.PI / 180;
const UP = new THREE.Vector3(0, 1, 0);
const BRANCH_SEGS = 6;
const MAX_SPIKELETS = 32; // per panicle (instance capacity)
const MAX_SEGMENTS = 220; // rachis, branch and pedicel segments per panicle

// Spikelet parts, spikelet-local (cm at full size): origin where the
// pedicel joins, +y towards the glume tips, glumes facing ±z.
const GLUME = { len: 2.2, width: 0.72, depth: 0.2 };
const FLORETS = [
  { y: 0.12, z: 0.03, len: 1.55, width: 0.32, depth: 0.26 }, // lower (larger) grain
  { y: 0.4, z: -0.03, len: 1.3, width: 0.27, depth: 0.22 }, // upper (smaller) grain
];
const HALF_WIDTH = GLUME.width / 2; // widest point of a spikelet from its axis

// Instanced meshes for panicles, added to an EarMesh. `inst(geo, mat, n)`
// is EarMesh's helper; boatGeometry its glume/lemma shape.
export function initPanicle(ear, inst, boatGeometry, maxEars) {
  const seg = new THREE.CylinderGeometry(1, 1, 1, 5, 1, true);
  seg.translate(0, 0.5, 0);
  ear.pBranch = inst(seg, ear.M.ear, maxEars * MAX_SEGMENTS);
  ear.pBranch.castShadow = false;
  ear.pGlumes = inst(boatGeometry(1, 1, 1, { keel: 0.15, beak: 0.02 }), ear.M.ear, maxEars * MAX_SPIKELETS * 2);
  ear.pLemmas = inst(boatGeometry(1, 1, 1, { keel: 0.3 }), ear.M.ear, maxEars * MAX_SPIKELETS * 2);
  return { pBranch: 0, pGlumes: 0, pLemmas: 0 };
}

// Spikelet and husk colours: green, ripening to a pale straw cream.
function spikeletColour(ripe) {
  const green = mix(P.ear, P.earPale, 0.25);
  return ripe < 0.6 ? mix(green, P.earGold, smoothstep(0.05, 0.6, ripe)) : mix(P.earGold, P.earRipe, smoothstep(0.6, 1, ripe));
}

// Called as a method of EarMesh (this = the EarMesh).
export function buildPanicle(sh, axis, opts, counts, isMain) {
  const K = sh.K;
  const E = sh.earLen;
  if (E < 0.05) return;
  const { MAIN, PANICLE: PN } = this.model.crop.params;
  const earProfile = this.model.earProfile;
  const tAt = this.model.tAt;
  const finalLen = MAIN.earLen * sh.scale * (sh.k ? 0.96 : 1);
  const ly = clamp(E / finalLen, 0.02, 1); // the panicle grows in length…
  const lw = clamp(sh.earW, 0.08, 1); // …and its spikelets fill out
  const { ripe, fill } = K;
  const { m, q, v, s } = this.tmp;
  // A tiller's panicle only leans out once it is fully clear of the sheath:
  // leaning while half out would push its folded lower part through the
  // sheath wall.
  const top0 = Math.max(...sh.leaves.filter((l) => l.sheath).map((l) => l.collarS));
  const clear = smoothstep(0.85, 1, clamp((sh.earTop - top0) / E));
  const { topCollar, frameAt } = this.earFrame({ ...sh, earNod: (sh.earNod ?? 0) * clear }, axis);
  const rnd = (...p) => hash('pan', sh.k, ...p);

  // Panicle-local point → world, following the shoot axis.
  const fr = new Map();
  const frame = (y) => {
    const key = Math.round(y * 50);
    let F = fr.get(key);
    if (!F) { F = frameAt(y); fr.set(key, F); }
    return F;
  };
  const W = (p) => {
    const F = frame(p.y);
    return new THREE.Vector3(p.x, 0, p.z).applyQuaternion(F.rot).add(F.pos);
  };
  const box = new THREE.Box3();
  const seg = (a, b, r, col) => {
    const wa = W(a), wb = W(b);
    const d = wb.clone().sub(wa);
    const len = d.length();
    if (len < 1e-4) return;
    q.setFromUnitVectors(UP, d.multiplyScalar(1 / len));
    m.compose(wa, q, s.set(r, len, r));
    this.put(this.pBranch, counts, 'pBranch', m, col);
    if (isMain) box.expandByPoint(wa).expandByPoint(wb);
  };
  // Room inside the boot at height y (what the sheaths are fitted around).
  const allowed = (y) => sh.earR * earProfile(clamp(y / E));

  const g = sh.scale * ly; // spikelet size now (cm per full-size cm)
  const SL = GLUME.len * g;
  const earCol = spikeletColour(ripe);
  const stalkCol = mix(earCol, P.stem, 0.35);

  // ---- Whorls, branches and where each spikelet sits ----------------------
  // Tillers' panicles are smaller: fewer spikelets on the lower whorls.
  const nW = PN.whorls.length;
  const spikes = [];
  const branches = [];
  for (let w = 0; w < nW; w++) {
    const yW = PN.whorls[w] * E;
    const nS = Math.max(1, PN.spikelets[w] - (w < 2 ? sh.k : 0));
    const nB = Math.min(PN.branches[w], nS);
    // Above the ligule the whorl spreads; fully open by flowering.
    const above = sh.earBase + yW - topCollar;
    const open = smoothstep(1, 3.5, above) * lerp(0.55, 1, smoothstep(tAt(55), tAt(61), sh.ts));
    const az0 = w * 2.4 + rnd('wa', w) * 0.8 + (sh.earTwist ?? 0);
    let left = nS;
    for (let b = 0; b < nB; b++) {
      const c = Math.ceil(left / (nB - b));
      left -= c;
      const az = az0 + (b * Math.PI * 2) / nB + (rnd('ba', w, b) - 0.5) * 0.6;
      const Lb = E * PN.branchLen[w] * (b === 0 ? 1 : lerp(0.6, 0.9, rnd('bl', w, b)));
      const theta = (PN.spread[w] + (rnd('bs', w, b) - 0.5) * 14) * DEG;
      const bend = (PN.droop + 0.5 * fill + 0.3 * ripe) * (0.7 + 0.6 * rnd('bd', w, b)) * Math.min(1, Lb / (0.3 * finalLen));
      // Open path: out and up from the node, bending down towards the tip.
      const pOpen = [new THREE.Vector3(0, yW, 0)];
      for (let i = 1; i <= BRANCH_SEGS; i++) {
        const th = theta + bend * Math.pow((i - 0.5) / BRANCH_SEGS, 1.4);
        pOpen.push(pOpen[i - 1].clone().add(new THREE.Vector3(Math.sin(th) * Math.cos(az), Math.cos(th), Math.sin(th) * Math.sin(az)).multiplyScalar(Lb / BRANCH_SEGS)));
      }
      // Packed path: straight up beside the rachis, short enough that its
      // spikelets stay below the panicle tip.
      const Lp = Math.max(0, Math.min(Lb, E - SL - yW));
      const rho = (y) => 0.3 * allowed(y);
      const pPacked = pOpen.map((_, i) => {
        const y = yW + (Lp * i) / BRANCH_SEGS;
        return new THREE.Vector3(rho(y) * Math.cos(az), y, rho(y) * Math.sin(az));
      });
      const pts = pOpen.map((p, i) => pPacked[i].clone().lerp(p, open));
      branches.push({ pts, Lb });
      // Spikelets: one at the branch tip, the rest on side pedicels further in.
      for (let i = 0; i < c; i++) {
        const vb = c === 1 ? 1 : 1 - (i / (c - 1)) * 0.5;
        spikes.push({ w, b, i, az, vb, pts, pPacked, open, yW, Lp, tip: i === 0 });
      }
    }
  }

  // ---- Rachis: up to the terminal spikelet --------------------------------
  const rTop = Math.max(0.01, E - SL);
  const rachR = (y) => lerp(0.055, 0.03, y / E) * sh.scale * lerp(0.4, 1, ly);
  const rSegs = 8;
  for (let i = 0; i < rSegs; i++) {
    const y0 = (rTop * i) / rSegs, y1 = (rTop * (i + 1)) / rSegs;
    seg(new THREE.Vector3(0, y0, 0), new THREE.Vector3(0, y1, 0), rachR(y0), stalkCol);
  }
  // Terminal spikelet on the rachis tip.
  const tAbove = sh.earBase + rTop - topCollar;
  const tOpen = smoothstep(1, 3.5, tAbove) * lerp(0.55, 1, smoothstep(tAt(55), tAt(61), sh.ts));
  spikes.push({ w: nW, terminal: true, az: (sh.earTwist ?? 0) + 0.5, open: tOpen, yW: rTop, at: new THREE.Vector3(0, rTop, 0) });

  // ---- Branches -------------------------------------------------------------
  const branchR = 0.022 * sh.scale * lerp(0.4, 1, ly);
  for (const br of branches) {
    for (let i = 0; i < BRANCH_SEGS; i++) seg(br.pts[i], br.pts[i + 1], branchR * (1 - 0.4 * (i / BRANCH_SEGS)), stalkCol);
  }

  // ---- Spikelets --------------------------------------------------------------
  const gape = (3 + 7 * fill + 2 * ripe) * DEG; // glumes part as the grains swell
  const anchors = { spikelets: [] };
  for (const sp of spikes) {
    const o = sp.open;
    // Where it joins its pedicel, packed and open.
    let base, packedAt, outward;
    const az = sp.az;
    outward = new THREE.Vector3(Math.cos(az), 0, Math.sin(az));
    if (sp.terminal) {
      base = sp.at.clone();
      packedAt = sp.at.clone();
    } else {
      const f = sp.vb * BRANCH_SEGS;
      const i0 = Math.min(BRANCH_SEGS - 1, Math.floor(f));
      base = sp.pts[i0].clone().lerp(sp.pts[i0 + 1], f - i0);
      packedAt = sp.pPacked[i0].clone().lerp(sp.pPacked[i0 + 1], f - i0);
    }
    // Pedicel: short at the branch tip, longer (a little side branch) further in.
    const lp = (sp.tip || sp.terminal ? PN.pedicel[0] : PN.pedicel[1] * lerp(0.7, 1.2, rnd('pl', sp.w, sp.b, sp.i))) * g;
    const side = (rnd('ps', sp.w, sp.b, sp.i) - 0.5) * 1.6;
    const tang = new THREE.Vector3(-Math.sin(az), 0, Math.cos(az));
    const pedDir = new THREE.Vector3(0, -0.55, 0).addScaledVector(outward, 0.75).addScaledVector(tang, side).normalize();
    const openAt = base.clone().addScaledVector(pedDir, lp);
    if (!sp.terminal && o > 0.01) {
      const mid = base.clone().addScaledVector(pedDir, lp * 0.5).add(new THREE.Vector3(0, 0.12 * lp, 0));
      seg(base, mid, branchR * 0.7, stalkCol);
      seg(mid, openAt, branchR * 0.6, stalkCol);
    }
    // Packed: pointing up beside the rachis, squeezed to fit the boot.
    const room = Math.min(allowed(packedAt.y + SL * 0.5), allowed(packedAt.y + SL), allowed(Math.max(0, packedAt.y)));
    const squeeze = Math.min(1, (0.55 * room) / Math.max(1e-4, HALF_WIDTH * g));
    const packR = 0.4 * room;
    const pk = new THREE.Vector3(packR * Math.cos(az), packedAt.y, packR * Math.sin(az));
    const at = pk.lerp(sp.terminal ? openAt.set(0, rTop, 0) : openAt, o);
    // Spikelet axis: up while packed, hanging once open (it swings down as
    // the whorl spreads, so nothing hangs back into the sheath).
    const hang = new THREE.Vector3(0, -1, 0).addScaledVector(outward, sp.terminal ? 0.2 : 0.35).addScaledVector(tang, side * 0.3).normalize();
    const D = UP.clone().lerp(hang, smoothstep(0.4, 0.95, o)).normalize();
    if (D.lengthSq() < 1e-6) D.copy(outward);
    // Glumes face across the spikelet's swing.
    const Z = new THREE.Vector3().crossVectors(D, tang).normalize();
    if (Z.lengthSq() < 1e-6) Z.copy(outward);
    const X = new THREE.Vector3().crossVectors(D, Z).normalize();
    const basis = new THREE.Matrix4().makeBasis(X, D, Z);
    const F = frame(at.y);
    const rot = new THREE.Quaternion().setFromRotationMatrix(basis).premultiply(F.rot);
    const pos = W(at);
    const sq = lerp(squeeze, 1, o);
    const spM = new THREE.Matrix4().compose(pos, rot, new THREE.Vector3(g * sq, g, g * sq));
    const varC = (rnd('c', sp.w, sp.b ?? 0, sp.i ?? 0) - 0.5) * 0.06;
    const sc = earCol.map((x) => x * (1 + varC));

    // Glumes: two large boat-shaped bracts facing each other (the second
    // turned half round, not mirrored, so its normals still face out).
    for (const gz of [-1, 1]) {
      q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), gape);
      if (gz < 0) q.premultiply(new THREE.Quaternion().setFromAxisAngle(UP, Math.PI));
      m.compose(v.set(0, 0, gz * 0.02), q, s.set(GLUME.width, GLUME.len, GLUME.depth));
      const gm = spM.clone().multiply(m);
      this.put(this.pGlumes, counts, 'pGlumes', gm, mix(sc, P.earPale, 0.4));
    }
    // Florets: the hulled grains (lemma and palea) inside the glumes.
    const nF = sp.terminal || (sp.w >= nW - 2 && rnd('f3', sp.w, sp.b) < 0.5) ? 1 : 2;
    const huskCol = mix(sc, mix(P.earGold, P.earRipe, 0.5), 0.25 * fill + 0.2 * ripe);
    const u = clamp(packedAt.y / E); // height up the panicle, for flowering order
    for (let f = 0; f < nF; f++) {
      const FL = FLORETS[f];
      const swell = 1 + 0.3 * fill * (f ? 0.7 : 1);
      q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), (f ? -1 : 1) * (4 + 6 * fill) * DEG);
      m.compose(v.set(0, FL.y, FL.z), q, s.set(FL.width * swell, FL.len, FL.depth * swell));
      const lm = spM.clone().multiply(m);
      this.put(this.pLemmas, counts, 'pLemmas', lm, huskCol);

      // Anthers: top of the panicle first, the lower floret before the upper.
      const tau = 0.06 + 0.55 * (1 - u) + 0.12 * f + rnd('ft', sp.w, sp.b ?? 0, sp.i ?? 0, f) * 0.05;
      const dt = K.flower - tau;
      if (!(dt > 0 && K.flower > 0) || rnd('ex', sp.w, sp.b ?? 0, sp.i ?? 0, f) > PN.anthers) continue;
      const extrude = smoothstep(0, 0.05, dt);
      const fade = smoothstep(0.12, 0.32, dt);
      if ((dt > 0.4 && rnd('rem', sp.w, sp.b ?? 0, sp.i ?? 0, f) > 0.3) || fill > 0.75) continue;
      const ac = mix(P.anther, P.antherSpent, fade);
      const wither = 1 - 0.4 * fade;
      const tipW = new THREE.Vector3(0, FL.y + FL.len * 0.92, FL.z).applyMatrix4(spM);
      for (let a = 0; a < 3; a++) {
        const ang = (a - 1) * 0.7 + rnd('aa', sp.w, sp.b ?? 0, sp.i ?? 0, f, a) * 0.4;
        const out = new THREE.Vector3(Math.cos(az + ang), 0, Math.sin(az + ang));
        const hangA = new THREE.Vector3(0, -1, 0).addScaledVector(out, 0.5).normalize();
        q.setFromUnitVectors(new THREE.Vector3(0, -1, 0), hangA);
        const filLen = (0.08 + 0.22 * extrude) * sh.scale;
        m.compose(tipW, q, s.set(sh.scale, filLen, sh.scale));
        this.put(this.filaments, counts, 'filaments', m, mix(P.antherSpent, ac, 0.3));
        const end = tipW.clone().addScaledVector(hangA, filLen);
        const k = 0.8 * sh.scale * wither;
        m.compose(end, q, s.set(k, k * (0.9 + 0.1 * extrude), k));
        this.put(this.anthers, counts, 'anthers', m, ac);
      }
    }
    if (isMain) {
      const tip = new THREE.Vector3(0, GLUME.len, 0).applyMatrix4(spM);
      box.expandByPoint(pos).expandByPoint(tip);
      anchors.spikelets.push({ u, pos: tip.clone().lerp(pos, 0.5) });
    }
  }

  if (isMain) {
    // A spikelet half-way up for the flowering label (flowering runs
    // top-down, so this one is in flower around GS65).
    const mid = anchors.spikelets.reduce((a, b) => (Math.abs(b.u - 0.55) < Math.abs(a.u - 0.55) ? b : a), anchors.spikelets[0]);
    this.anchors = { base: W(new THREE.Vector3(0, 0, 0)), mid: W(new THREE.Vector3(0, E * 0.5, 0)), top: W(new THREE.Vector3(0, rTop, 0)), midFloret: mid ? mid.pos : null, box };
  }
}
