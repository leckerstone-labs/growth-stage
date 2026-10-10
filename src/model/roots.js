// Root systems for every crop, as plain polylines (no three.js).
//
// The crop's params.js describes the architecture (ROOTS): a fibrous cereal
// system (seminal roots from the seed, then nodal "crown" roots from the
// crown) or a taproot with laterals (oilseed rape; field beans add nodules).
// The keyframes give the real rooting depth (the `roots` channel, cm). The
// view decides how much soil is drawn (`clip`): roots are generated at their
// real length, but only the part above the bottom of the soil block is
// returned, thinning out to nothing at the bottom edge. The real depth goes
// in the readout instead.
//
// Paths are generated at a fixed arc-length step from hashed directions, so
// a root only ever grows at its tip: the part already drawn doesn't wriggle
// as the root lengthens or the soil block changes depth.

import { clamp, lerp, smoothstep, hash } from './interp.js';

const BASE_STEP = 0.4; // cm between path points (laterals: LATERAL_STEP)
const LATERAL_STEP = 0.8;
const DEG = Math.PI / 180;

const norm = (v) => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

// Direction from azimuth (around the vertical) and angle from straight down.
const downDir = (az, fromDown) => [Math.cos(az) * Math.sin(fromDown), -Math.cos(fromDown), Math.sin(az) * Math.sin(fromDown)];

// Grow one root from `start` along `dir` for `length` cm. `gravity` bends it
// towards straight down per cm; `wander` is the random sideways drift per cm.
// Stops early at the clip depth. Returns points and their arc length.
function grow(start, dir, length, { clip, gravity, wander, seed, step: STEP = BASE_STEP, maxDrop = Infinity }) {
  const pts = [start.slice()];
  const s = [0];
  let p = start.slice();
  let d = norm(dir);
  const n = Math.ceil(length / STEP - 1e-6);
  for (let i = 1; i <= n; i++) {
    const h = Math.min(STEP, length - (i - 1) * STEP);
    const w = wander * STEP;
    d = norm([
      d[0] + (hash(seed, 'x', i) - 0.5) * w,
      d[1] - gravity * STEP * (1 + d[1]), // stronger while still near horizontal
      d[2] + (hash(seed, 'z', i) - 0.5) * w,
    ]);
    p = [p[0] + d[0] * h, p[1] + d[1] * h, p[2] + d[2] * h];
    pts.push(p);
    s.push(s[i - 1] + h);
    if (p[1] < -clip || start[1] - p[1] > maxDrop) break;
  }
  return { pts, s };
}

// Roots thin out to nothing over the bottom third of the soil shown, where
// the cut face fades out too.
const bottomFade = (y, clip) => smoothstep(-clip, -clip * 0.65, y);

// Radius at each point: r0 at the base tapering to r0 * tip along the root's
// full length, a fine point over the last few mm, and fading to nothing at
// the bottom of the soil shown.
function radii(path, len, r0, tipFrac, clip, minR) {
  return path.pts.map((p, i) => {
    const s = path.s[i];
    let r = Math.max(r0 * lerp(1, tipFrac, clamp(s / Math.max(len, 1e-3))), minR);
    r *= lerp(0.25, 1, smoothstep(0, 0.35, len - s)); // root tip
    return r * bottomFade(p[1], clip);
  });
}

// Laterals (first-order branch roots) along a parent root. They start a
// little behind the parent's tip and are longest near the surface, so most
// root length is in the topsoil (AHDB: over 70% in the top 30 cm).
function laterals(out, parent, len, spec, ctx, seed) {
  const L = spec;
  if (!L) return;
  const { clip, minR } = ctx;
  for (let k = 0, s0 = L.from; s0 < len - L.tipZone; k++, s0 += L.spacing) {
    // Point on the parent at arc length s0 (only within the drawn part).
    const i = parent.s.findIndex((x) => x >= s0);
    if (i < 1) break;
    const p = parent.pts[i];
    if (p[1] < -clip + 0.5) break;
    const depth = -p[1];
    const room = len - L.tipZone - s0;
    const lenK = Math.min(L.len * Math.exp(-depth / L.decay), room * L.rate) * (0.55 + 0.45 * hash(seed, 'll', k));
    if (lenK < 0.15) continue;
    // Out sideways from the parent, at an angle, then curving down gently.
    const a = parent.pts[i - 1];
    const t = norm([p[0] - a[0], p[1] - a[1], p[2] - a[2]]);
    const az = k * 2.39996 + hash(seed, 'la', k) * 1.2;
    const side = norm([Math.cos(az) - t[0] * (Math.cos(az) * t[0] + Math.sin(az) * t[2]), -t[1] * (Math.cos(az) * t[0] + Math.sin(az) * t[2]), Math.sin(az) - t[2] * (Math.cos(az) * t[0] + Math.sin(az) * t[2])]);
    const ang = L.angle * DEG;
    const dir = [side[0] * Math.sin(ang) + t[0] * Math.cos(ang), side[1] * Math.sin(ang) + t[1] * Math.cos(ang), side[2] * Math.sin(ang) + t[2] * Math.cos(ang)];
    const path = grow(p, dir, lenK, { clip, gravity: L.gravity, wander: 0.5, seed: `${seed}l${k}`, step: LATERAL_STEP });
    if (path.pts.length < 2) continue;
    out.roots.push({ kind: 'lateral', pts: path.pts, r: radii(path, lenK, L.r, 0.5, clip, minR * 0.7) });
    if (ctx.nodules) nodulesAlong(out, path, lenK, ctx, `${seed}l${k}`, 0.75);
  }
}

// Nodules (legumes): small swellings along the upper roots. Crop params:
// ROOTS.nodules = { depth: only above this depth (cm), spacing: cm between
// candidate spots, r: full radius (cm), from / full: rooting depths (cm) at
// which they appear / reach full size }. Not used by any crop yet (field
// beans will).
function nodulesAlong(out, path, len, ctx, seed, share) {
  const N = ctx.nodules;
  for (let k = 0, s = N.spacing * 0.5; s < len; k++, s += N.spacing) {
    const i = path.s.findIndex((x) => x >= s);
    if (i < 0) break;
    const p = path.pts[i];
    if (-p[1] > N.depth || p[1] < -ctx.clip * 0.7) continue; // not in the faded part
    if (hash(seed, 'nod', k) > share) continue;
    out.nodules.push({ p, r: N.r * ctx.nodSize * (0.7 + 0.5 * hash(seed, 'nr', k)) });
  }
}

// ---------------------------------------------------------------------------
// Fibrous system (cereals, oats): seminal roots from the seed, then nodal
// (crown) roots from the crown, a few per leaf, each lengthening from when
// it starts; all branch.
//   st: { depth, leafClock, seed: [x,y,z], crown: [x,y,z] }
// ---------------------------------------------------------------------------
function fibrous(spec, st, ctx, out) {
  const { clip, minR } = ctx;
  const S = spec.seminal;
  S.roots.forEach(([az, tilt, delay, share], i) => {
    const len = Math.max(0, st.depth - delay) * share;
    if (len < 0.05) return;
    const path = grow(st.seed, downDir(az, tilt * DEG), len, { clip, gravity: S.gravity, wander: 0.3, seed: `sr${i}` });
    out.roots.push({ kind: 'seminal', pts: path.pts, r: radii(path, len, S.r, 0.45, clip, minR) });
    laterals(out, path, len, spec.laterals, ctx, `sr${i}`);
  });
  // Nodal roots: from leafClock `start`, `perLeaf` per leaf, up to `max`.
  // Each grows `rate` cm per leaf from when it starts, up to the rooting
  // depth (with some spread: not every root goes as deep).
  const Nd = spec.nodal;
  const count = Math.floor(clamp((st.leafClock - Nd.start) * Nd.perLeaf, 0, Nd.max));
  for (let i = 0; i < count; i++) {
    const age = st.leafClock - (Nd.start + i / Nd.perLeaf);
    const reach = st.depth * (0.55 + 0.45 * hash('nd', i));
    const len = Math.min(reach, age * Nd.rate);
    if (len < 0.05) continue;
    const az = i * 2.39996 + hash('na', i);
    const tilt = Nd.tilt[0] + hash('nt', i) * (Nd.tilt[1] - Nd.tilt[0]);
    const start = [st.crown[0] + Math.cos(az) * 0.08, st.crown[1] + 0.05, st.crown[2] + Math.sin(az) * 0.08];
    const path = grow(start, downDir(az, tilt * DEG), len, { clip, gravity: Nd.gravity, wander: 0.3, seed: `cr${i}` });
    out.roots.push({ kind: 'nodal', pts: path.pts, r: radii(path, len, Nd.r, 0.45, clip, minR) });
    laterals(out, path, len, spec.laterals, ctx, `cr${i}`);
  }
}

// ---------------------------------------------------------------------------
// Taproot system (oilseed rape, field beans): one thick taproot straight
// down from the seed, thickening at the top with the root collar, and
// laterals along it.
//   st: { depth, seed: [x,y,z], collarR }
// ---------------------------------------------------------------------------
function taproot(spec, st, ctx, out) {
  const { clip, minR } = ctx;
  const T = spec.tap;
  const len = st.depth;
  if (len < 0.05) return;
  const path = grow(st.seed, [0, -1, 0], len, { clip, gravity: 0.5, wander: T.wander, seed: 'tap' });
  // Thick at the root collar, tapering to a long thin root.
  const r0 = Math.max(T.r, st.collarR * T.collar);
  const decay = T.decay[0] + T.decay[1] * st.collarR;
  const r = path.pts.map((p, i) => {
    const s = path.s[i];
    const rr = Math.max(T.r * 0.5, minR * 1.8, r0 * Math.exp(-s / decay)) * lerp(0.25, 1, smoothstep(0, 0.6, len - s));
    return rr * bottomFade(p[1], clip);
  });
  out.roots.push({ kind: 'tap', pts: path.pts, r });
  laterals(out, path, len, spec.laterals, ctx, 'tap');
  if (ctx.nodules) nodulesAlong(out, path, len, ctx, 'tap', 0.5);
}

const SYSTEMS = { fibrous, taproot };

// spec: crop params ROOTS. st: depth and origins from the plant model.
// opts: { clip: soil depth drawn (cm), minR: thinnest radius worth drawing
// at the current zoom, stub: cap every root at this length (stem views) }.
// Returns { roots: [{ kind, pts, r }], nodules: [{ p, r }], cut } where cut
// says whether any root reaches the bottom of the soil shown.
export function computeRoots(spec, st, { clip = 10, minR = 0, stub = 0 } = {}) {
  const out = { roots: [], nodules: [], cut: false };
  if (!spec || !(st.depth > 0)) return out;
  const depth = stub ? Math.min(st.depth, stub) : st.depth;
  const ctx = {
    clip, minR,
    nodules: !stub && spec.nodules ? spec.nodules : null,
    nodSize: spec.nodules ? smoothstep(spec.nodules.from, spec.nodules.full, st.depth) : 0,
  };
  if (ctx.nodules && ctx.nodSize <= 0) ctx.nodules = null;
  SYSTEMS[spec.type](spec, { ...st, depth }, ctx, out);
  out.cut = out.roots.some((r) => r.pts[r.pts.length - 1][1] < -clip + 0.5);
  return out;
}
