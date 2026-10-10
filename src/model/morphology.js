// Cereal plant morphology as plain numbers — no three.js.
//
// createModel(crop) returns computePlant(t), which gives, for every shoot,
// where each node, leaf sheath, collar, blade and ear sits at timeline
// position t. The renderer turns this into geometry; the inspection overlays
// read the same numbers, so the measurements shown on screen always match the
// model.
//
// The structure is shared by the cereals; each crop's numbers (leaf sizes,
// shoots, ear shape) come from src/crops/<crop>/params.js and its key states
// from src/crops/<crop>/keyframes.js.
//
// Units: centimetres. Each shoot has an "axis coordinate" s measured from its
// base (s = 0) along the shoot. The seed sits 3.2 cm below the soil surface
// (world y = 0). Early on the main shoot's base is at the seed; the sub-crown
// internode then lifts it until the crown settles 1.2 cm below the surface.
//
// Shared botanical structure (main shoot with N leaves, NI = MAIN.internodes
// elongating internodes below the peduncle: 4 for wheat and barley, 5 for
// oats):
//   - The lowest N-NI-1 leaves attach at crown nodes that never elongate.
//   - The next leaf attaches at the base node, the top NI at nodes 1–NI.
//   - NI+1 internodes elongate: i1..iNI and the peduncle (under the ear).
//   - Leaves are counted down from the top in the UI: flag leaf, leaf 2…
//   - Each blade emerges from the sheath of the leaf below; its ligule
//     becomes visible when it is fully emerged.

import { buildKeyframes } from './keyframes.js';
import { clamp, lerp, smoothstep, hash, monotoneSpline } from './interp.js';
import { variation, DEFAULT_SEED } from './random.js';

export const CROWN_DEPTH = 1.2; // cm below soil, once the crown has formed
export const SEED_DEPTH = 3.2; // drilling depth (centre of the seed), cm

const BASE_NODE_S = 0.2; // base node sits just above the crown

// Before stem extension the shoot axis inside the pseudostem is only the
// crown and growing point — under 1 mm across.
const APEX_R = 0.04;
// One leaf-sheath wall plus a little looseness between layers. Seedling
// sheaths are thin (~0.13 mm); upper-leaf sheaths thicker (~0.24 mm).
const SHEATH_WALL = 0.024;
// Leaves already exist as primordia inside the shoot a couple of
// phyllochrons before their tips appear.
const PRIMORDIA = 2.5;

const DEG = Math.PI / 180;

// Azimuth (radians around the vertical) of main-shoot leaf n. Leaves are
// distichous: alternate leaves on opposite sides, with a little jitter.
const mainLeafAzimuth = (n) => n * Math.PI + (hash('az', n) - 0.5) * 0.5;

export function createModel(crop, { seed = DEFAULT_SEED } = {}) {
  const STAGES = crop.stages;
  const { MAIN, ERECT_ANGLE, earProfile, EAR } = crop.params;
  const keyframes = buildKeyframes(STAGES, crop.rows, monotoneSpline);
  // Elongating internodes below the peduncle (keyframe channels i1..iNI),
  // and the leaves on the extended stem: base node + nodes 1–NI.
  const NI = MAIN.internodes ?? 4;
  const CULM_LEAVES = NI + 1;
  const INT_KEYS = Array.from({ length: NI }, (_, m) => `i${m + 1}`);

  // Timeline position of a stage, so model timings follow the stage list. A
  // code the crop doesn't use as a checkpoint (e.g. GS24 for spring oats,
  // which stop at two tillers) falls between its neighbours by code.
  const tAt = (code) => {
    const i = STAGES.findIndex((s) => s.code >= code);
    if (i < 0) return STAGES[STAGES.length - 1].t;
    const b = STAGES[i];
    if (b.code === code || i === 0) return b.t;
    const a = STAGES[i - 1];
    return lerp(a.t, b.t, (code - a.code) / (b.code - a.code));
  };
  const between = (a, b, f) => lerp(tAt(a), tAt(b), f);
  const SHOOTS = crop.params.shoots(tAt, between);
  const wallOf = (mi) => lerp(0.013, SHEATH_WALL, mi / (MAIN.N - 1));
  const erectAngle = (top) => ERECT_ANGLE[Math.min(top, ERECT_ANGLE.length - 1)] * DEG;

  // Natural irregularity between tillers (src/model/random.js), drawn once
  // per plant so every frame shows the same plant. The main shoot (k = 0)
  // is never varied: npm run check measures it. Tiller appearance and death
  // timings are not varied either, so shoot counts at each stage stay put.
  const VARY = SHOOTS.map((def) => {
    if (!def.k) return null;
    const v = variation(seed, crop.id, def.id);
    return {
      az: v.jitter(0.5), // radians, round the main shoot
      offset: v.factor(0.2), // distance of the base from the main shoot
      lag: v.jitter(0.35), // timeline units, added to def.lag after GS24
      scale: v.factor(0.05), // height, leaf and ear size
      leanP: v.jitter(6), // degrees, prostrate (winter) lean
      leanE: v.jitter(3), // degrees, erect lean once stems extend
      bend: v.factor(0.3), // how quickly the lean straightens up
      leanTop: v.range(0.25, 0.55), // share of the base lean kept at the top
      earNod: v.range(2, 5), // degrees the emerged ear leans out
      earTwist: v.u() * Math.PI, // which way the ear faces
      leaves: Array.from({ length: MAIN.N }, () => ({
        blade: v.factor(0.1), width: v.factor(0.06), droop: v.factor(0.2), twist: v.factor(0.3), az: v.jitter(0.3),
      })),
    };
  });

  function computeShoot(def, t, V) {
    const { k } = def;
    const N = MAIN.N - (k ? k + 2 : 0);
    // Tillers' leaf jitter is keyed by the seed; the main shoot keeps its own.
    const h = V ? (...p) => hash(seed, crop.id, ...p) : hash;
    const lagEff = (def.lag + (V ? V.lag : 0)) * smoothstep(tAt(24), between(32, 33, 0.5), t);
    let ts = t - lagEff;
    let dead = 0, hide = 0;
    if (def.death) {
      ts = Math.min(ts, def.death.start);
      dead = smoothstep(def.death.start, def.death.end, t);
      hide = smoothstep(def.death.end, def.death.hide, t);
    }
    ts = Math.max(0, ts);
    const K = keyframes(ts);
    // This shoot's own leaf clock. Tiller k appears when the main shoot's
    // clock passes k + 2 (with leaf k + 3), unless its def sets `appear`:
    // spring cereals with few leaves tiller sooner relative to leaf number.
    const H = K.vH - (k ? def.appear ?? k + 2 : 0);
    if (k && H <= 0) return null; // tiller not yet emerged

    const sc = def.scale * (V ? V.scale : 1);
    const tillerAppear = k ? smoothstep(0, 0.6, H) : 1;

    // ---- Placement ----------------------------------------------------------
    const az = k ? mainLeafAzimuth(k) + V.az : 0;
    const offset = k ? (0.22 + 0.06 * k) * V.offset : 0;
    // The shoot base rises from the seed as the sub-crown internode extends.
    const baseY = -SEED_DEPTH + K.subcrown - 0.03 * k;
    const base = [Math.cos(az) * offset, baseY, Math.sin(az) * offset];
    const lean = (lerp(def.leanP + (V ? V.leanP : 0), def.leanE + (V ? V.leanE : 0), K.habit) + dead * 25 + hide * 20) * DEG;
    const dir = [Math.sin(lean) * Math.cos(az), Math.cos(lean), Math.sin(lean) * Math.sin(az)];

    // ---- Nodes and internodes -----------------------------------------------
    const ints = INT_KEYS.map((c) => K[c] * sc);
    const nodeS = [BASE_NODE_S];
    for (let m = 0; m < NI; m++) nodeS.push(nodeS[m] + ints[m]);
    // The node under the peduncle (node 4 in wheat and barley, 5 in oats).
    const node4 = nodeS[NI];
    const E = Math.max(0.04, K.earL * sc * (k ? 0.96 : 1));

    // Stem radius grows with development: each internode reaches its final
    // thickness as it elongates; until then the axis is just the growing point.
    const apexR = APEX_R * sc * (0.6 + 0.4 * smoothstep(0, 8, H));
    const thick = (len, full) => lerp(apexR, full * sc, smoothstep(0, 1.5, len));

    // ---- Leaves -------------------------------------------------------------
    const leaves = [];
    // The first leaf grows out through the tip of the coleoptile; tillers'
    // first leaves emerge from their own small sheath at the base.
    let prevCollar = k ? 0 : Math.max(0, K.coleo - K.subcrown);
    for (let n = 1; n <= N; n++) {
      const mi = Math.min(MAIN.N - 1, n - 1 + (k ? k + 2 : 0)); // matching main-shoot leaf
      const top = N - n + 1; // 1 = flag leaf
      const m = n - (N - CULM_LEAVES + 1); // node index: <0 crown, 0 base, 1–NI
      const sNode = m < 0 ? 0.02 * n : nodeS[m];
      const e = clamp(H - (n - 1));
      // Leaves beyond the youngest primordium don't exist yet.
      const present = n <= H + PRIMORDIA;
      const Sfinal = MAIN.sheath[mi] * sc;
      const target = sNode + Sfinal;
      let collar;
      if (e < 1) {
        // Still inside the sheath of the leaf below: ligule hidden.
        collar = Math.max(sNode + 0.1, Math.min(prevCollar - 0.3 * (1 - e) - 0.05, target));
      } else {
        const g = top === 1 ? K.flagS : smoothstep(n, n + 1, H);
        const lo = prevCollar + 0.25;
        collar = Math.max(lo, lerp(lo, target, g));
      }
      const bladeBase = Math.max(collar, prevCollar);

      // Senescence: bottom-up, driven by the leaf clock. Dying tillers override.
      let sen = smoothstep(n + 4.5, n + 6.5, H);
      sen = Math.max(sen, dead);
      const decay = smoothstep(n + 7.5, n + 9.5, H);

      const lv = V ? V.leaves[n - 1] : null;
      const B = MAIN.blade[mi] * sc * (k ? 0.95 * lv.blade : 1);
      const W = MAIN.width[mi] * sc * (lv ? lv.width : 1);
      let posture = lerp(lerp(62, 70, h('pp', k, n)) * DEG, erectAngle(top), K.habit);
      // Seedling leaves are short and stiff and stand fairly upright (AHDB
      // GS13 drawing) before the plant spreads out during tillering.
      posture = lerp(lerp(26, 34, h('sp', k, n)) * DEG, posture, smoothstep(2.5, 5, K.vH));
      const tilt = lerp(0, posture, smoothstep(0.72, 1, e));
      // Longer blades arch over more; short seedling leaves barely droop.
      const droopBase = top === 1 ? 0.55 : 0.25 + 0.95 * Math.pow(B / 25, 1.3);
      const droop = (droopBase * lerp(1.35, 1, K.habit)) * (lv ? lv.droop : 1) * Math.pow(e, 3) + sen * 1.5;
      leaves.push({
        n, top, m, flag: top === 1,
        nodeS: sNode, collarS: collar, prevCollarS: prevCollar, bladeBaseS: bladeBase,
        emerge: e,
        bladeLen: e * B * (1 - 0.65 * decay),
        fullLen: B,
        width: W * (1 - 0.35 * sen),
        // Emerging blades stay tightly rolled and only open out as they finish
        // emerging (ligule about to appear).
        curl: (1 - smoothstep(0.72, 1, e)) + sen * 0.45,
        tilt, droop,
        // MAIN.twist: -1 twists the other way (oats: anticlockwise, where
        // wheat and barley twist clockwise).
        twist: (top === 1 ? 0.9 : 0.35 + h('tw', k, n) * 0.7) * (B / 22) * (1 + sen) * (lv ? lv.twist : 1) * (MAIN.twist ?? 1),
        sway: (h('sw', k, n) - 0.5) * 0.5,
        az: (k ? az + Math.PI / 2 + lv.az : 0) + mainLeafAzimuth(n),
        sen, decay,
        // A leaf takes up room once it exists; long-dead lower leaves have
        // rotted away and no longer wrap the shoot.
        present: present && decay < 0.95,
        wall: wallOf(mi) * sc,
        sheathOpen: top === 1 ? K.open : 0,
      });
      prevCollar = collar;
    }

    // ---- Peduncle and ear ---------------------------------------------------
    const flag = leaves[N - 1];
    const pedKey = K.ped * sc;
    const pedFromEar = flag.collarS + K.earPos * E - E - node4;
    const w = smoothstep(tAt(39), tAt(41), ts);
    const ped = Math.max(0.03, lerp(pedKey, pedFromEar, w));
    const earBase = node4 + ped;
    const earTop = earBase + E;
    const earR = EAR.radius * K.earW * sc; // half the face width; matches ear-mesh.js geometry
    // Awns (crops with an awnL channel, e.g. barley): length above the ear tip.
    const awnLen = (K.awnL ?? 0) * sc;
    // Ripe ears of some crops (barley) hang over: the shoot axis bends through
    // the top of the peduncle (render/plant-mesh.js makeAxis).
    // EAR.neckSpan [from, to] (cm from the ear base, or 'top' for the ear
    // tip) is where the bend happens: just under the ear for barley; along
    // the whole rachis for an oat panicle, so it arches over.
    const span = EAR.neckSpan ?? [-6, 0.5];
    const neck = EAR.neck ? { s0: earBase + span[0], s1: span[1] === 'top' ? earTop : earBase + span[1], angle: EAR.neck * DEG * smoothstep(0.15, 0.9, K.ripe) } : null;

    // ---- Stem radius --------------------------------------------------------
    // Piecewise-linear between internode midpoints, so thickness changes
    // smoothly along the stem.
    const knots = [[0, thick(ints[0], MAIN.stemR[0])]];
    for (let m = 0; m < NI; m++) knots.push([(nodeS[m] + nodeS[m + 1]) / 2, thick(ints[m], MAIN.stemR[m])]);
    knots.push([node4 + ped / 2, thick(ped, MAIN.stemR[NI])]);
    knots.push([earBase, thick(ped, MAIN.stemR[NI])]);
    const stemRadius = (s) => {
      if (s <= knots[0][0]) return knots[0][1];
      for (let i = 1; i < knots.length; i++) {
        if (s <= knots[i][0]) {
          const [s0, r0] = knots[i - 1], [s1, r1] = knots[i];
          return s1 - s0 < 1e-6 ? r1 : lerp(r0, r1, (s - s0) / (s1 - s0));
        }
      }
      return knots[knots.length - 1][1];
    };

    // ---- Sheath radius profiles ---------------------------------------------
    // Work from the innermost leaf outwards. Each sheath is fitted around what
    // is actually inside it — the stem, the ear and younger sheaths — plus one
    // wall thickness. So the pseudostem is thin while there are few leaves,
    // thickens as leaves are added, and the flag-leaf sheath swells (the boot)
    // because the ear is growing inside it.
    const step = 0.25;
    const cells = Math.ceil((Math.max(earTop, flag.collarS) + 2) / step) + 1;
    const env = new Float32Array(cells);
    for (let i = 0; i < cells; i++) {
      const s = i * step;
      let r = s <= earBase ? stemRadius(s) : 0;
      if (s >= earBase && s <= earTop) r = Math.max(r, earR * earProfile((s - earBase) / E));
      env[i] = r;
    }
    const envAt = (s) => {
      const x = clamp(s / step, 0, cells - 1);
      const i = Math.floor(x), f = x - i;
      return lerp(env[i], env[Math.min(i + 1, cells - 1)], f);
    };
    for (let li = leaves.length - 1; li >= 0; li--) {
      const L = leaves[li];
      if (!L.present) { L.sheath = null; L.collarR = 0; continue; }
      const s0 = L.nodeS, s1 = L.collarS;
      const len = Math.max(0.01, s1 - s0);
      const rings = Math.max(4, Math.min(48, Math.ceil(len / 0.45)));
      const prof = [];
      // A sheath is a fairly stiff tube: it keeps roughly the width it has at
      // its base (set by what it wraps there), tapering a little towards the
      // collar, and only bulges where something inside pushes it out.
      const loose = L.wall * (1 + 0.25 * L.sen);
      const baseR = envAt(s0 + Math.min(0.3, len * 0.2)) + loose;
      for (let j = 0; j <= rings; j++) {
        const f = j / rings;
        const s = s0 + len * f;
        const inner = envAt(s);
        // At the collar the margins close in tight, so there's no thick rim.
        const close = smoothstep(0.82, 1, f);
        const r = Math.max(baseR * lerp(1, 0.9, f), inner + lerp(loose, L.wall * 0.45, close));
        prof.push({ s, r, inner });
      }
      L.sheath = prof;
      L.collarR = prof[prof.length - 1].r;
      // Update envelope so the next (older, outer) sheath clears this one.
      for (let i = Math.ceil(s0 / step); i <= Math.floor(s1 / step) && i < cells; i++) {
        const s = i * step;
        const j = clamp(Math.round(((s - s0) / len) * rings), 0, rings);
        env[i] = Math.max(env[i], prof[j].r);
      }
    }

    // ---- Seed, coleoptile, sub-crown internode and roots (main shoot) --------
    const seedling = k ? null : {
      seedY: -SEED_DEPTH,
      // The seed's reserves are used up over the first few leaves.
      seedUsed: smoothstep(2.5, 6.5, K.vH),
      coleoLen: K.coleo,
      // The coleoptile withers once the first leaves are out.
      coleoSen: smoothstep(1.5, 4, K.vH),
      coleoGone: smoothstep(5, 7.5, K.vH),
      crownY: baseY,
      // Rooting depth (real cm) and leaf clock, for the roots (model/roots.js).
      rootDepth: K.roots,
      leafClock: K.vH,
    };

    return {
      id: def.id, k, N, ts, K, H, seedling,
      base, dir, az, lean,
      // Shape of the shoot axis (render/plant-mesh.js makeAxis) and of the
      // ear's lean once free of the sheath (render/ear-mesh.js earFrame).
      bend: 6 * (V ? V.bend : 1), leanTop: V ? V.leanTop : 0.4,
      earNod: V ? V.earNod : 0, earTwist: V ? V.earTwist : 0,
      scale: sc * tillerAppear,
      alive: 1 - hide,
      dead, hide,
      nodeS, ints, ped, node4,
      earBase, earTop, earLen: E, earR, earW: K.earW, awnLen, neck,
      stemR: MAIN.stemR[0] * sc,
      stemRadius,
      leaves,
    };
  }

  function computePlant(t) {
    const shoots = [];
    for (const [i, def] of SHOOTS.entries()) {
      const sh = computeShoot(def, t, VARY[i]);
      if (sh && sh.alive > 0.01) shoots.push(sh);
    }
    return { t, K: keyframes(t), shoots, main: shoots[0] };
  }

  // Live measurements of the main shoot, used by overlays and checks.
  function measureMain(plant) {
    const ms = plant.main;
    const leaves = ms.leaves;
    const flag = leaves[leaves.length - 1];
    const leaf2 = leaves[leaves.length - 2];
    // AHDB node rule: 1st node above an internode >= 1 cm; later nodes above
    // internodes >= 2 cm.
    let detectable = 0;
    if (ms.ints[0] >= 1) {
      detectable = 1;
      for (let i = 1; i < NI && ms.ints[i] >= 2; i++) detectable++;
    }
    const emerged = clamp((ms.earTop - flag.collarS) / ms.earLen, 0, 1);
    return {
      ints: ms.ints, ped: ms.ped, detectable,
      flagEmerge: flag.emerge,
      flagLiguleVisible: flag.emerge >= 1 && flag.collarS > leaf2.collarS,
      flagLiguleHeight: flag.collarS - CROWN_DEPTH,
      earEmerged: emerged,
      earTipBelowLigule: flag.collarS - ms.earTop,
      // Awn tips relative to the flag ligule (> 0 visible); awned crops only.
      awnTipAboveLigule: ms.awnLen > 0 ? ms.earTop + ms.awnLen - flag.collarS : null,
      // Flag leaf blade length relative to leaf 2's (final sizes).
      flagToLeaf2: flag.fullLen / leaf2.fullLen,
      earLen: ms.earLen,
      leafEmerge: (top) => leaves[leaves.length - top]?.emerge ?? 0,
      // Widest point of the flag-leaf sheath relative to its width around
      // the internode below the top node (only stem inside).
      bootSwelling: flag.sheath ? Math.max(...flag.sheath.map((p) => p.r)) / (ms.stemRadius((ms.nodeS[NI - 1] + ms.node4) / 2) + SHEATH_WALL) : 1,
      // Diameters in mm: pseudostem just above the soil, and the stem itself
      // halfway up internode 2.
      pseudostemDiam: 20 * Math.max(ms.stemRadius(CROWN_DEPTH + 0.3),
        ...leaves.filter((l) => l.present && l.sheath && l.nodeS < CROWN_DEPTH + 0.3 && l.collarS > CROWN_DEPTH + 0.3)
          .map((l) => l.sheath.reduce((a, p) => (Math.abs(p.s - CROWN_DEPTH - 0.3) < Math.abs(a.s - CROWN_DEPTH - 0.3) ? p : a)).r)),
      stemDiam: 20 * ms.stemRadius((ms.nodeS[1] + ms.nodeS[2]) / 2),
      height: Math.max(ms.earTop, flag.collarS) - CROWN_DEPTH,
    };
  }

  // Verify that the key states satisfy the crop's stage rules (checks.js) at
  // each checkpoint. Returns a list of human-readable failures (empty when
  // everything passes).
  function checkStages() {
    const fails = [];
    const plantAt = (code) => computePlant(tAt(code));
    const at = (code) => measureMain(plantAt(code));
    const expect = (code, ok, msg) => { if (!ok) fails.push(`GS${code}: ${msg}`); };
    crop.checks({ at, plantAt, expect, SEED_DEPTH });
    return fails;
  }

  return { crop, keyframes, tAt, SHOOTS, earProfile, computePlant, measureMain, checkStages };
}
