// Field bean (a legume) plant morphology as plain numbers — no three.js.
//
// createLegumeModel(crop) returns computePlant(t), which gives the seed and
// the shoot growing up from it (germination is hypogeal: the cotyledons stay
// in the seed below ground), every stem with its nodes, compound leaves
// (rachis and leaflets in world coordinates), stipules, racemes with every
// flower, and every pod with its length and seed state. The renderer
// (render/legume-mesh.js) skins these; the views and the stage checks read
// the same numbers, so what is measured is what is drawn.
//
// Units: centimetres, world y = 0 at the soil surface. The main stem grows
// straight up through x = z = 0 from the seed; its axis coordinate s runs up
// from the seed.
//
// Structure (numbers from src/crops/<crop>/params.js):
//   - Two scale leaves at the first two nodes, then true leaves one per
//     node, alternate in two ranks (distichous) with a slight twist.
//   - Each internode lengthens as the leaf above it grows (the leaf clock
//     `vL`), so only the youngest few internodes at the tip are short.
//   - A short raceme in the axil of each leaf from FLOWERING.first up.
//     Racemes open from the lowest node up (the `fl` channel); within a
//     raceme the lowest flower opens first. Only the lowest flowers of the
//     lowest nodes set pods (PODS.perNode); the rest wilt and drop.
//   - Basal side shoots (winter beans) grow from the scale-leaf nodes with
//     their own leaf clock and run the main stem's flowering, pod and
//     ripening key states with a lag.

import { buildKeyframes } from './keyframes.js';
import { clamp, lerp, smoothstep, hash, monotoneSpline } from './interp.js';
import { variation, DEFAULT_SEED } from './random.js';
import { polyAxis, leaningAxis } from './brassica.js';

const DEG = Math.PI / 180;
// BBCH GS3x counts "visibly extended" internodes; taken here as ≥ 1 cm.
export const VISIBLE_INTERNODE = 1;

const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const mixv = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

// Unit vector at angle `ang` from unit axis t towards unit direction r
// (r made perpendicular to t first).
function tilt(t, r, ang) {
  const rp = norm(sub(r, t.map((x) => x * dot(r, t))));
  return norm(add(t.map((x) => x * Math.cos(ang)), rp, Math.sin(ang)));
}

export function createLegumeModel(crop, { seed = DEFAULT_SEED } = {}) {
  const STAGES = crop.stages;
  const P = crop.params;
  const keyframes = buildKeyframes(STAGES, crop.rows, monotoneSpline);
  // Timeline position of a stage code. Winter and spring beans have
  // different checkpoints, so a code a variant lacks gives the next one.
  const tAt = (code) => (STAGES.find((s) => s.code >= code) || STAGES[STAGES.length - 1]).t;
  const SD = P.SEED_DEPTH;
  const L = P.LEAVES;
  const N = L.leaflets.length;
  const FL = P.FLOWERING;
  const D = FL.open;

  // A stem's static description: leaf sizes, internodes, racemes, pods.
  const mainSpec = {
    id: 'main', leaves: N, offset: 0, scale: 1, first: FL.first,
    nodes: FL.flowers.length, perNode: P.PODS.perNode, jitter: 0,
    az0: 0.5, // leaf ranks turned a little from the default camera, so leaves aren't seen edge-on
  };
  // Basal side shoots with their natural irregularity (src/model/random.js),
  // drawn once per plant. The main stem is never varied: npm run check
  // measures it.
  const branchSpecs = (P.BRANCHES || []).map((def, j) => {
    const v = variation(seed, crop.id, `S${j + 1}`);
    return {
      ...def,
      id: `S${j + 1}`,
      az: def.az + v.jitter(0.35),
      angle: def.angle + v.jitter(5),
      top: v.range(3, 9),
      bend: 9 * v.factor(0.3),
      lag: def.lag + v.jitter(0.3),
      start: def.start + v.jitter(0.12),
      scale: def.scale * v.factor(0.04),
      az0: v.jitter(0.5), // turn of the shoot's leaf ranks
      jitter: 1,
    };
  });

  const leafOf = (spec, n) => Math.min(N, n + (spec.offset || 0)); // params row for leaf n
  const slots = (spec) => spec.perNode.reduce((a, b) => a + b, 0);

  // Seed state of the pod at position x (0 lowest … 1 highest pod).
  const seedAt = (K, x) => clamp(K.seed + P.SEED_SPREAD * smoothstep(0, 2, K.seed) * (0.5 - x), 0, 5.2);

  // ---- Internodes of a stem from its leaf clock ----------------------------
  function internodes(spec, vL) {
    const ints = [];
    for (let i = 0; i < spec.leaves; i++) {
      const e = vL - i; // emergence of the leaf above this internode
      const fin = P.INTERNODES[leafOf(spec, i + 1) - 1] * spec.scale;
      ints.push(fin * lerp(0.02, 1, smoothstep(-0.8, 2.6, e)));
    }
    return ints;
  }

  // ---- One stem: leaves, stipules, racemes, flowers and pods --------------
  // axis: the stem's centre line; nodeS: s of each true-leaf node; tipS: top
  // of the stem; vL: its leaf clock; K: its key states (lagged for shoots).
  function computeStem(spec, K, vL, axis, nodeS, tipS, ints, radius) {
    const leaves = [];
    for (let n = 1; n <= spec.leaves; n++) {
      const row = leafOf(spec, n) - 1;
      const e = vL - (n - 1); // > 0 visible, ≥ 1 unfolded
      if (e <= -0.6) break;
      const s = nodeS[n - 1];
      const a = axis.at(s);
      const az = spec.az0 + n * Math.PI + n * 0.06 + (hash(spec.id, 'az', n) - 0.5) * 0.4;
      const radial = [Math.cos(az), 0, Math.sin(az)];
      const out = tilt(a.t, radial, Math.PI / 2);
      const base = add(a.p, out, radius(s) * 0.9);
      const grow = e <= 0 ? lerp(0.08, 0.14, clamp(e + 0.6)) : lerp(0.14, 1, 1 - Math.pow(1 - clamp(e / 2.4), 2));
      const unfold = smoothstep(0.15, 1.0, e);
      // Senescence: lower leaves die as the canopy closes above them; in
      // ripening the rest die (and blacken) from the bottom up. The lowest
      // leaves fall; the upper ones hang on, black and shrivelled.
      const th = ((n - 1) / spec.leaves) * 0.7;
      const shaded = smoothstep(n + 9, n + 12, vL); // lower leaves shaded out
      const killed = smoothstep(th, th + 0.25, K.leafLoss); // ripening: leaves blacken
      const sen = Math.max(shaded, killed);
      const drop = n <= spec.leaves * 0.55 ? Math.max(smoothstep(n + 12, n + 13, vL), smoothstep(th + 0.28, th + 0.36, K.leafLoss)) : 0;
      const shrivel = smoothstep(0.55, 1, sen);
      // Posture: angle of the leaf stalk from the stem; young leaves stand
      // up close to the tip, grown ones spread; dying ones droop.
      const jit = (hash(spec.id, 'lp', n) - 0.5) * 12;
      const mature = lerp(58, 42, n / spec.leaves) + jit;
      const ang = (lerp(8, mature, smoothstep(0.1, 1.6, e)) + 45 * smoothstep(0.3, 1, sen)) * DEG;
      const dir0 = tilt(a.t, out, ang);
      const droop = (0.25 + 0.6 * shrivel) * smoothstep(0.5, 2, e);
      // Rachis: petiole to the first leaflet pair, then a pair every
      // `spacing` cm, ending in a short point (no tendril).
      const nl = L.leaflets[row];
      const pairs = Math.ceil(nl / 2);
      const sc = grow * spec.scale * (1 - 0.25 * shrivel);
      const pet = L.petiole[row] * sc;
      const sp = L.spacing * sc * lerp(0.35, 1, unfold);
      const rachisLen = pet + (pairs - 1) * sp + 0.5 * sc;
      const SEG = 8;
      const rachis = [base];
      let p = base, d = dir0;
      for (let i = 0; i < SEG; i++) {
        d = norm(add(d, [0, -droop * 0.25, 0]));
        p = add(p, d, rachisLen / SEG);
        rachis.push(p);
      }
      const rAt = (q) => {
        const x = clamp(q / rachisLen) * SEG;
        const i = Math.min(SEG - 1, Math.floor(x));
        return { p: mixv(rachis[i], rachis[i + 1], x - i), t: norm(sub(rachis[i + 1], rachis[i])) };
      };
      const side = norm(cross(dir0, [0, 1, 0]));
      const leaflets = [];
      const llen = L.len[row] * sc;
      for (let j = 0; j < nl; j++) {
        const pair = Math.floor(j / 2);
        const sgn = j % 2 ? 1 : -1;
        const q = pet + pair * sp + (j % 2) * 0.3 * sc;
        const r = rAt(q);
        // Leaflets angle forward along the rachis; folded together while
        // the leaf is young, spread flat once unfolded.
        const spread = lerp(6, 52 + (hash(spec.id, 'lf', n, j) - 0.5) * 14, unfold) * DEG;
        const sv = side.map((x) => x * sgn);
        let ld = norm(add(r.t.map((x) => x * Math.cos(spread)), sv, Math.sin(spread)));
        ld = norm(add(ld, [0, (0.3 - 0.7 * shrivel) * unfold + 0.25 * (1 - unfold), 0]));
        let nrm = norm(cross(ld, sv.map((x) => -x * sgn)));
        if (nrm[1] < 0) nrm = nrm.map((x) => -x);
        // Each leaflet is rolled a little, outer edge up, so a pair forms a
        // shallow V along the rachis.
        nrm = norm(add(nrm, sv, -0.45 * unfold));
        leaflets.push({
          p: r.p, dir: ld, n: nrm, side: sgn,
          len: llen * (0.92 + 0.12 * hash(spec.id, 'll', n, j)) * (pair === pairs - 1 && nl > 2 ? 0.95 : 1),
          width: llen * L.width[row] * (1 - 0.4 * shrivel),
          fold: Math.max(1 - unfold, 0.8 * shrivel),
        });
      }
      const tip = rachis[SEG];
      leaves.push({
        n, s, az, e, base, dir: dir0, out, unfolded: e >= 1, present: drop < 0.5,
        grow, unfold, sen, drop, shrivel, black: killed >= shaded, rachis, leaflets, tip,
        stipule: L.stipule * spec.scale * lerp(0.35, 1, smoothstep(-0.5, 1, e)),
      });
    }

    // Racemes: one per flowering node, in the leaf axil.
    const racemes = [];
    const pods = [];
    const nSlots = slots(spec);
    let slot = 0;
    for (let k = 0; k < spec.nodes; k++) {
      const n = spec.first + k;
      const leaf = leaves[n - 1];
      const a = K.fl - k; // raceme age in flowering nodes; < 0: still in bud
      const nf = FL.flowers[k % FL.flowers.length];
      const setHere = spec.perNode[k] || 0;
      if (!leaf || a < -3.2) { slot += setHere; continue; }
      const s = nodeS[n - 1] + 0.25;
      const ax = axis.at(s);
      const out = leaf.out;
      const base = add(ax.p, out, radius(s) * 0.7);
      const enclosed = a < -2.2;
      const sep = smoothstep(-1.9, -1.0, a); // buds separating on their stalks
      const pd = tilt(ax.t, out, lerp(18, 42, sep) * DEG);
      const pedLen = lerp(0.15, 1.3, sep) * spec.scale;
      const pedEnd = add(base, pd, pedLen);
      const flowers = [];
      for (let j = 0; j < nf; j++) {
        const aj = a - (0.6 * j) / Math.max(1, nf - 1);
        const setsPod = j < setHere;
        const fan = ((j - (nf - 1) / 2) * 24 + (hash(spec.id, 'fa', k, j) - 0.5) * 16) * DEG;
        // Flowers face out from the stem, fanned round it a little.
        const c = Math.cos(fan), sn = Math.sin(fan);
        const horiz = norm([out[0] * c - out[2] * sn, 0, out[0] * sn + out[2] * c]);
        const at = add(pedEnd, pd, (j * 0.28 - 0.1) * spec.scale);
        const f = { j, k, aj, at, horiz, setsPod };
        if (aj < 0) {
          f.state = 'bud';
          f.size = smoothstep(-3.2, -0.1, aj);
          f.petals = smoothstep(-0.7, -0.2, aj); // white petal tip showing
          f.dir = norm(add(pd, ax.t, 0.8));
          f.dir = norm(add(f.dir, horiz, 0.4 * sep));
        } else if (setsPod ? aj < D - 1 : aj < D + 0.8) {
          f.state = 'open';
          f.open = smoothstep(0, 0.45, aj);
          f.wilt = smoothstep(D - 1, D + 0.3, aj);
          f.dir = norm(add(horiz, [0, -0.28 - 0.5 * f.wilt, 0]));
        } else if (setsPod) {
          f.state = 'pod';
        } else {
          f.state = 'gone';
        }
        if (setsPod) {
          const x = (slot + 0.5) / nSlots;
          slot++;
          if (f.state === 'pod') {
            const size = Math.max(0.08, clamp(1 - (x - K.podFull) / 0.5));
            const sd = size > 0.4 ? seedAt(K, x) : 0;
            // Pods angle up when young and swing out and down as they fill.
            const pitch = lerp(55, -12, smoothstep(0.6, 2.6, sd)) * DEG + (hash(spec.id, 'pp', k, j) - 0.5) * 0.3;
            const pdir = norm(add(horiz.map((v) => v * Math.cos(pitch)), [0, Math.sin(pitch), 0]));
            const fin = lerp(P.PODS.len[0], P.PODS.len[1], x) * spec.scale;
            const pod = {
              stem: spec.id, k, j, x, at, dir: pdir, size,
              len: fin * lerp(0.12, 1, size), finalLen: fin,
              r: P.PODS.r * spec.scale * lerp(0.3, 1, smoothstep(0.05, 0.8, size)),
              seed: sd, ripe: sd >= P.RIPE_SEED,
              seeds: P.PODS.seeds[(slot - 1) % P.PODS.seeds.length],
              cap: 1 - smoothstep(D, D + 2.5, aj), // wilted corolla on the tip
            };
            f.pod = pod;
            pods.push(pod);
          }
        }
        flowers.push(f);
      }
      racemes.push({ k, n, s, base, pd, pedEnd, pedLen, a, enclosed, sep, flowers, leaf });
    }
    return { leaves, racemes, pods, nSlots };
  }

  function computePlant(t) {
    const K = keyframes(t);
    const seedY = -SD;

    // ---- Main stem nodes ------------------------------------------------------
    // Scale-leaf nodes sit near the tip of the young shoot as it pushes up,
    // then settle at their final heights round the soil surface.
    const epi = K.epi;
    const scaleS = P.SCALE_LEAVES.map((y, i) => clamp(Math.min(SD + y, epi - [0.75, 0.4][i]), 0.02, 99));
    const vL = K.vL;
    const ints = internodes(mainSpec, vL);
    const nodeS = [];
    let s = scaleS[1];
    for (let i = 0; i < N; i++) { s += ints[i]; nodeS.push(s); }
    let lastVisible = -1;
    for (let i = 0; i < N; i++) if (vL - i > -0.6) lastVisible = i;
    const tipS = Math.max(epi, lastVisible >= 0 ? nodeS[lastVisible] + 0.35 : epi);
    // Stem half-width: thin below ground, thickening as each internode
    // lengthens; tapering towards the top.
    const finalTop = P.INTERNODES.reduce((a, b) => a + b, 0) + SD;
    const radius = (q) => {
      if (q < scaleS[1]) return lerp(0.12, 0.26, smoothstep(0, 4, vL)) * lerp(0.9, 1.05, q / Math.max(scaleS[1], 0.1));
      let i = 0;
      while (i < N - 1 && nodeS[i] < q) i++;
      const prog = ints[i] / (P.INTERNODES[i] || 1);
      // Young plants have thin stems; the stem thickens as the plant grows.
      const age = lerp(0.5, 1, smoothstep(2, 12, vL));
      return Math.max(0.1, lerp(P.STEM.base, P.STEM.top, clamp(q / finalTop)) * age * lerp(0.35, 1, smoothstep(0.05, 0.8, prog)));
    };

    // Axis: straight up from the seed; while the shoot is below ground its
    // tip is bent over in a hook that protects the plumule.
    const hookLen = Math.min(1.3, tipS * 0.35) * smoothstep(0, 0.05, K.hook);
    const pts = [[0, seedY, 0]];
    if (hookLen > 0.01) {
      const straight = tipS - hookLen;
      if (straight > 0.01) pts.push([0, seedY + straight, 0]);
      let p = pts[pts.length - 1];
      const step = hookLen / 10;
      for (let i = 0; i < 10; i++) {
        const bend = ((i + 0.5) / 10) * Math.PI * 0.9 * K.hook;
        p = add(p, [Math.sin(bend), Math.cos(bend), 0], step);
        pts.push(p);
      }
    } else {
      pts.push([0, seedY + Math.max(tipS, 0.05), 0]);
    }
    const axis = polyAxis(pts);
    const hookTop = Math.max(...pts.map((p) => p[1]));
    const main = { id: 'main', spec: mainSpec, K, vL, axis, nodeS, ints, tipS, radius, scaleS,
      ripe: K.stemRipe, ...computeStem(mainSpec, K, vL, axis, nodeS, tipS, ints, radius) };

    // ---- Basal side shoots ----------------------------------------------------
    const branches = [];
    for (const def of branchSpecs) {
      const vLb = clamp((vL - def.start) * def.rate, 0, def.leaves);
      if (vL < def.start) continue;
      // The lag closes up by harvest: all stems are dead and dry together.
      const Kb = keyframes(Math.max(0, t - def.lag * (1 - smoothstep(93, 100, t))));
      const bInts = internodes(def, vLb);
      // The shoot starts at its scale-leaf node, below ground, and grows out
      // at an angle before turning up.
      const az = def.az;
      const radial = [Math.cos(az), 0, Math.sin(az)];
      const nodeY = seedY + scaleS[def.node];
      const base = add([0, nodeY, 0], radial, radius(scaleS[def.node]) * 0.8);
      const under = Math.max(0.3, -nodeY + 0.3) * 1.1;
      const s0 = under * smoothstep(-0.3, 0.3, vLb);
      const bNodeS = [];
      let q = s0;
      for (let i = 0; i < def.leaves; i++) { q += bInts[i]; bNodeS.push(q); }
      let lv = -1;
      for (let i = 0; i < def.leaves; i++) if (vLb - i > -0.6) lv = i;
      const bTip = Math.max(s0 + 0.2, lv >= 0 ? bNodeS[lv] + 0.3 : s0 + 0.2);
      const bAxis = leaningAxis(base, az, def.angle * DEG, def.top * DEG, bTip + 1, def.bend);
      const bTop = bNodeS[def.leaves - 1];
      const bRadius = (x) => Math.max(0.08, lerp(P.STEM.base * 0.85, P.STEM.top, clamp(x / (bTop + 5))) * def.scale * lerp(0.4, 1, smoothstep(0, 6, vLb)));
      const stem = computeStem(def, Kb, vLb, bAxis, bNodeS, bTip, bInts, bRadius);
      branches.push({ id: def.id, spec: def, K: Kb, vL: vLb, axis: bAxis, nodeS: bNodeS, ints: bInts, tipS: bTip, radius: bRadius,
        ripe: Kb.stemRipe, visible: vLb > 0.3, ...stem });
    }

    const seedling = {
      seedY, epi, hookTop, hook: K.hook,
      // Cotyledon reserves are used up as the plant establishes.
      seedUsed: smoothstep(0, 9, vL + 1.5),
      rootLen: K.roots,
      collarR: radius(scaleS[0]) * 0.9,
    };
    return { t, K, seedling, main, branches, stems: [main, ...branches] };
  }

  // Live measurements of the main stem (and whole plant), used by overlays
  // and checks.
  function measureMain(plant) {
    const { K, main } = plant;
    const leaves = main.leaves;
    const fl = main.racemes.flatMap((r) => r.flowers);
    const pods = main.pods;
    const n = main.nSlots;
    const extended = main.ints.filter((x) => x >= VISIBLE_INTERNODE).length;
    const tops = [plant.seedling.hookTop];
    for (const st of plant.stems) {
      tops.push(st.axis.at(st.tipS).p[1]);
      for (const l of st.leaves) {
        if (!l.present) continue;
        tops.push(l.tip[1]);
        for (const f of l.leaflets) tops.push(f.p[1] + f.dir[1] * f.len);
      }
      for (const p of st.pods) tops.push(p.at[1] + p.dir[1] * p.len);
      for (const r of st.racemes) for (const f of r.flowers) tops.push(f.at[1] + 1.2);
    }
    const allPods = plant.stems.flatMap((st) => st.pods);
    return {
      // Seedling
      rootLen: plant.seedling.rootLen,
      epiLen: K.epi,
      hookTop: plant.seedling.hookTop,
      hook: K.hook,
      scaleY: main.scaleS.map((s) => main.axis.at(s).p[1]),
      // Leaves (BBCH counts every leaf unfolded, including ones since lost)
      leavesUnfolded: leaves.filter((l) => l.unfolded).length,
      leavesGreen: leaves.filter((l) => l.unfolded && l.present && l.sen < 0.5).length,
      leafletsOf: (k) => P.LEAVES.leaflets[k - 1],
      sideShoots: plant.branches.filter((b) => b.visible).length,
      ints: main.ints,
      extended,
      // Buds and flowers on the main stem
      budsPresent: main.racemes.length > 0,
      budsVisible: main.racemes.some((r) => !r.enclosed),
      budsSeparate: main.racemes.some((r) => r.sep >= 0.5),
      petalsVisible: fl.some((f) => f.state === 'bud' && f.petals > 0.5),
      racemesOpen: main.racemes.filter((r) => r.flowers.some((f) => f.state === 'open' && f.wilt < 0.5)).length,
      racemesFlowered: main.racemes.filter((r) => r.flowers.some((f) => f.state !== 'bud')).length,
      openNow: fl.filter((f) => f.state === 'open' && f.wilt < 0.5).length,
      budsLeft: fl.filter((f) => f.state === 'bud').length,
      firstFlowerLeaf: P.FLOWERING.first,
      // Pods on the main stem (shares of the pods it sets)
      podSlots: n,
      pods: pods.length,
      podsFinal: pods.filter((p) => p.size >= 0.99).length / n,
      podsBlack: pods.filter((p) => p.ripe).length / n,
      lowestPodSeed: pods.length ? pods[0].seed : 0,
      topPodSeed: pods.length ? pods[pods.length - 1].seed : 0,
      midSeed: clamp(K.seed, 0, 5),
      // Whole plant
      podsPlant: allPods.length,
      seedsPlant: allPods.reduce((a, p) => a + p.seeds, 0),
      stemsDark: plant.stems.reduce((a, st) => a + clamp(st.ripe), 0) / plant.stems.length,
      height: Math.max(...tops),
    };
  }

  // Verify that the key states satisfy the crop's stage rules (checks.js).
  function checkStages() {
    const fails = [];
    const plantAt = (code) => computePlant(tAt(code));
    const at = (code) => measureMain(plantAt(code));
    const expect = (code, ok, msg) => { if (!ok) fails.push(`GS${code}: ${msg}`); };
    crop.checks({ at, plantAt, expect, SEED_DEPTH: SD, params: P });
    return fails;
  }

  // Columns printed by npm run check.
  const table = {
    header: ' GS     t | leaves green shoots ints≥1 | rac open flw buds | pods final black seed | dark height podsPlant',
    row(s, p, m) {
      const f = (x, w = 5, d = 1) => x.toFixed(d).padStart(w);
      return `GS${String(s.code).padEnd(3)} ${f(s.t)} | ${f(m.leavesUnfolded, 4, 0)}  ${f(m.leavesGreen, 4, 0)}  ${f(m.sideShoots, 4, 0)}  ${f(m.extended, 4, 0)} | ${f(m.racemesFlowered, 3, 0)} ${f(m.racemesOpen, 3, 0)} ${f(m.openNow, 3, 0)} ${f(m.budsLeft, 3, 0)} | ${f(m.pods, 3, 0)} ${f(m.podsFinal * 100, 4, 0)}% ${f(m.podsBlack * 100, 4, 0)}% ${f(m.midSeed, 4)} | ${f(m.stemsDark * 100, 4, 0)}% ${f(m.height, 5, 0)} ${f(m.podsPlant, 4, 0)}`;
    },
  };

  return { crop, keyframes, tAt, computePlant, measureMain, checkStages, table };
}
