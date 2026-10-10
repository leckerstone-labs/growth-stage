// Oilseed rape (a brassica) plant morphology as plain numbers — no three.js.
//
// createBrassicaModel(crop) returns computePlant(t), which gives the seedling
// (seed, hooked hypocotyl, cotyledons, taproot), every leaf's midrib in world
// coordinates, the stem's internodes and every flower position on the main
// and side racemes (bud, open flower or pod, with its size and seed colour).
// The renderer (render/brassica-mesh.js) skins these; the views and the stage
// checks read the same numbers, so what is measured is what is drawn.
//
// Units: centimetres, world y = 0 at the soil surface. The main stem is
// vertical through x = z = 0. Its axis coordinate s runs up from the crown
// (the top of the hypocotyl).
//
// Structure (numbers from src/crops/<crop>/params.js):
//   - Rosette leaves sit on a short crown; stem leaves sit one per node above
//     the extending internodes; the last internode carries the main raceme.
//   - Leaves spiral round the stem at about 137.5° (2/5 phyllotaxis).
//   - Side branches grow from the axils of the upper stem leaves. Each runs
//     the main raceme's key states with a lag, so it flowers later.
//   - Flowers open from the bottom of each raceme upwards; each open flower's
//     pistil becomes a pod once its petals fall.

import { buildKeyframes } from './keyframes.js';
import { clamp, lerp, smoothstep, hash, monotoneSpline } from './interp.js';
import { variation, DEFAULT_SEED } from './random.js';

const DEG = Math.PI / 180;
const GOLDEN = 137.5 * DEG;
// BBCH GS3x counts "visibly extended" internodes; taken here as ≥ 1 cm.
export const VISIBLE_INTERNODE = 1;
const CROWN_H = 0.4; // height of the unextended crown carrying the rosette, cm
const LEAF_FLOOR = 0.15; // leaves rest on the soil, cm above it

const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

// A curve through points [x,y,z], measured by length along it.
export function polyAxis(pts) {
  const s = [0];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    s.push(s[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
  }
  const len = s[s.length - 1];
  return {
    pts, s, len,
    // Point and unit tangent at length q along the curve (clamped to it).
    at(q) {
      q = clamp(q, 0, len);
      let i = 1;
      while (i < pts.length - 1 && s[i] < q) i++;
      const a = pts[i - 1], b = pts[i];
      const f = s[i] - s[i - 1] > 1e-9 ? (q - s[i - 1]) / (s[i] - s[i - 1]) : 0;
      return { p: [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)], t: norm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]) };
    },
  };
}

// Axis that leans out from its base by `angle` and turns upwards to `top`
// (both from vertical) over about `bend` cm as it grows (branches), in the
// vertical plane at azimuth az.
function leaningAxis(base, az, angle, top, length, bend = 10) {
  const pts = [base];
  const step = 0.5;
  let p = base;
  for (let q = 0; q < length; q += step) {
    const phi = top + (angle - top) * Math.exp(-q / bend);
    p = add(p, [Math.sin(phi) * Math.cos(az), Math.cos(phi), Math.sin(phi) * Math.sin(az)], step);
    pts.push(p);
  }
  if (pts.length < 2) pts.push(add(base, [0, 0.01, 0]));
  return polyAxis(pts);
}

export function createBrassicaModel(crop, { seed = DEFAULT_SEED } = {}) {
  const STAGES = crop.stages;
  const P = crop.params;
  const keyframes = buildKeyframes(STAGES, crop.rows, monotoneSpline);
  const tAt = (code) => STAGES.find((s) => s.code === code).t;
  const NR = P.LEAVES.rosette;
  const N = NR + P.LEAVES.stem;
  const NI = P.INTERNODES.length;
  const leafAz = (n) => n * GOLDEN + (hash('az', n) - 0.5) * 0.25;
  // Internode i extends over its own window of the `ext` channel, lowest
  // first. The top one, under the raceme, starts early and runs long: it is
  // what lifts the buds clear of the youngest leaves (GS53).
  const intWindow = (i) => (i === NI - 1 ? [0.18, 0.92] : [i * 0.065, i * 0.065 + 0.4]);

  // Side branches with their natural irregularity (src/model/random.js),
  // drawn once per plant so every frame shows the same plant. The main
  // raceme is never varied: npm run check measures it.
  const BRANCHES = P.BRANCHES.map((def, j) => {
    const v = variation(seed, crop.id, `B${j + 1}`);
    return {
      ...def,
      az: v.jitter(0.35), // radians off the leaf it grows from
      angle: def.angle + v.jitter(5), // degrees from vertical at the base
      top: v.range(5, 13), // degrees from vertical it turns up to
      bend: 10 * v.factor(0.3), // cm over which it turns up
      lag: def.lag + v.jitter(0.4), // timeline units
      stalk: def.stalk * v.factor(0.08),
      len: def.len * v.factor(0.08),
      scale: def.scale * v.factor(0.04),
    };
  });

  // Seed state of the pod at position x (0 bottom … 1 top) of a raceme.
  const seedAt = (K, x) => clamp(K.seed + P.SEED_SPREAD * smoothstep(0, 2, K.seed) * (0.5 - x), 0, 5.2);

  // ---- One raceme: flower positions along its axis ---------------------------
  function computeRaceme(id, def, K, axis, s0, podLen) {
    const n = def.n;
    const R = K.rach * (def.len / 50);
    const Rr = Math.max(0.02, R);
    // Buds still to open are packed into a short dome at the tip; the rachis
    // lengthens below them as flowers open, spacing out the flowers and pods.
    const Lc = Math.min(Rr, (0.25 + 0.9 * K.spread) * Math.max(0.2, K.bud) * def.scale);
    const xs = [], w = [];
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) / n;
      xs.push(x);
      // Just-opened flowers sit closer together than older pods.
      w.push(x < K.opened ? 0.4 + 0.6 * clamp((K.opened - x) / 0.12) : 0);
    }
    const total = w.reduce((a, b) => a + b, 0) || 1;
    let cum = 0;
    const flowers = [];
    for (let i = 0; i < n; i++) {
      const x = xs[i];
      const q = clamp((x - K.opened) / Math.max(1e-3, 1 - K.opened)); // place among buds still closed
      const s = x < K.opened
        ? s0 + (Rr - Lc) * (cum + w[i] / 2) / total
        : s0 + Rr - Lc * (1 - (0.05 + 0.95 * Math.pow(q, 0.7)));
      cum += w[i];
      const opened = K.opened > x;
      const openness = clamp((K.opened - x) / 0.03);
      const petals = opened && x >= K.fallen;
      // Pods reach final size bottom first; a pistil stays short until its petals fall.
      let size = opened ? Math.max(0.06, clamp(1 - (x - K.podFull) / 0.45)) : 0;
      if (petals) size = Math.min(size, 0.08);
      const seed = size > 0.4 ? seedAt(K, x) : 0;
      const budSize = K.bud * lerp(1, 0.45, q) * def.scale;
      const budPed = (0.12 + 0.5 * K.spread * (1 - 0.6 * q)) * def.scale;
      const pedLen = !opened ? budPed : lerp(lerp(budPed, 1.4 * def.scale, openness), P.POD.pedicel * def.scale, smoothstep(0.08, 0.6, size));
      const pedAngle = !opened ? lerp(8, 38, K.spread) * (1 - 0.5 * q) * DEG : lerp(lerp(38, 58, openness), 48, smoothstep(0.08, 0.6, size)) * DEG;
      flowers.push({
        i, x, s, az: i * GOLDEN + (hash(id, 'fa', i) - 0.5) * 0.4,
        state: !opened ? 'bud' : petals ? 'flower' : 'pod',
        budSize,
        yellow: !opened && x < K.yb ? clamp((K.yb - x) / 0.05) : 0,
        openness: opened ? openness : 0,
        petalFade: petals ? clamp(1 - (x - K.fallen) / 0.08) : 0,
        podSize: size,
        podLen: lerp(podLen[0], podLen[1], x) * def.scale * size,
        podFinalLen: lerp(podLen[0], podLen[1], x) * def.scale,
        seed,
        ripe: seed >= P.RIPE_SEED,
        pedLen, pedAngle,
      });
    }
    const tip = axis.at(s0 + Rr);
    return {
      id, def, K, axis, s0, len: R, flowers,
      tipS: s0 + Rr,
      // Bud cluster: present once flower buds have formed at the apex.
      budR: 0.22 * K.bud * def.scale + 0.08 * K.spread * K.bud,
      tip: tip.p,
    };
  }

  function computePlant(t) {
    const K = keyframes(t);
    const seedY = -P.SEED_DEPTH;

    // ---- Seedling: seed, hypocotyl hook, cotyledons -------------------------
    // The hypocotyl grows up from the seed; its top is bent over in a hook
    // below ground (cotyledons pointing down), straightening at emergence.
    const hypoPts = [[0, seedY, 0]];
    const hookLen = Math.min(0.55, K.hypo * 0.6);
    const step = 0.05;
    let hp = [0, seedY, 0];
    for (let q = step; q <= K.hypo + 1e-6; q += step) {
      const bend = smoothstep(K.hypo - hookLen, K.hypo, q) * Math.PI * 0.95 * K.hook;
      hp = add(hp, [Math.sin(bend), Math.cos(bend), 0], step);
      hypoPts.push(hp);
    }
    const hypo = polyAxis(hypoPts.length > 1 ? hypoPts : [[0, seedY, 0], [0, seedY + 0.001, 0]]);
    const node = hypo.at(hypo.len);
    const crownY = node.p[1];
    const hookTop = Math.max(...hypoPts.map((p) => p[1]));

    // Below ground the cotyledons are small, pale and folded inside the
    // seed coat; they expand and green up once lifted into the light.
    const cotyGrow = lerp(0.45, 1, K.coty) + 0.45 * smoothstep(0, 3, K.vL);
    const cotyLight = smoothstep(-0.1, 0.4, node.p[1]);
    const cotySen = smoothstep(2.8, 5.2, K.vL);
    const cotyGone = smoothstep(5.2, 6.8, K.vL);
    const cotyledons = [0, 1].map((side) => {
      const az = Math.PI / 2 + side * Math.PI; // across the hook plane
      const radial = [Math.cos(az), 0, Math.sin(az)];
      // Folded together along the hypocotyl until they open.
      const a = lerp(4, 72, K.coty) * DEG;
      const dir = norm(add(node.t.map((v) => v * Math.cos(a)), radial, Math.sin(a)));
      return {
        base: node.p, dir, az,
        len: 1.55 * cotyGrow, petiole: 0.5 * cotyGrow, width: 1.35 * cotyGrow * lerp(0.75, 1, K.coty),
        open: K.coty, sen: cotySen, light: cotyLight,
        present: K.hypo > 0.3 && cotyGone < 0.95,
      };
    });

    // ---- Stem: crown, internodes, stem radius ---------------------------------
    const ints = P.INTERNODES.map((L, i) => L * smoothstep(...intWindow(i), K.ext));
    const nodeS = [CROWN_H];
    for (let i = 0; i < NI; i++) nodeS.push(nodeS[i] + ints[i]);
    const racemeBaseS = nodeS[NI];
    const apexR = 0.06 + 0.1 * smoothstep(0, 0.5, K.bud);
    const crownR = Math.max(0.05, K.collar * 0.7);
    const knots = [[0, crownR], [CROWN_H, Math.max(apexR, crownR * 0.8)]];
    for (let i = 0; i < NI; i++) {
      const fin = lerp(P.STEM.base, P.STEM.top, (i + 0.5) / NI);
      const prog = smoothstep(...intWindow(i), K.ext);
      knots.push([(nodeS[i] + nodeS[i + 1]) / 2, lerp(apexR, fin, smoothstep(0, 0.9, prog))]);
    }
    knots.push([racemeBaseS, Math.max(apexR, knots[knots.length - 1][1] * 0.8)]);
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
    const mainLen = racemeBaseS + K.rach * (P.MAIN_RACEME.len / 50) + 2;
    const mainAxis = polyAxis([[0, crownY, 0], [0, crownY + Math.max(mainLen, 0.5), 0]]);

    // ---- Leaves -------------------------------------------------------------
    const leaves = [];
    for (let n = 1; n <= N; n++) {
      const stemLeaf = n > NR;
      const k = n - NR; // stem leaf number 1–8
      const e = K.vL - (n - 1); // > 0 visible, ≥ 1 unfolded
      let grow = e <= 0 ? 0 : 1 - Math.pow(1 - clamp(e / 3.2), 2);
      // Stem leaves expand as the internode above them extends, so the
      // leaves near the top stay small while the buds are lifted clear.
      if (stemLeaf) grow = Math.min(grow, lerp(0.15, 1, smoothstep(...intWindow(k), K.ext)));
      const Lfin = P.LEAVES.len[n - 1];
      const len = Lfin * lerp(0.1, 1, grow);
      const s = stemLeaf ? nodeS[k] : 0.03 * n;
      // Senescence: rosette leaves die bottom-up as new ones form; after
      // flowering the stem leaves yellow and fall, lowest first.
      const th = ((k - 1) / 8) * 0.6;
      let sen, drop;
      if (stemLeaf) {
        sen = smoothstep(th, th + 0.3, K.leafLoss);
        drop = smoothstep(th + 0.3, th + 0.42, K.leafLoss);
      } else {
        sen = Math.max(smoothstep(n + 6.5, n + 9, K.vL), smoothstep(0, 0.15, K.leafLoss));
        drop = Math.max(smoothstep(n + 9, n + 10.5, K.vL), smoothstep(0.15, 0.3, K.leafLoss));
      }
      // Posture (angle from vertical at the base): young leaves stand up in
      // the centre; grown rosette leaves spread out and lie flatter in winter.
      const jit = (hash('lp', n) - 0.5) * 10;
      const mature = stemLeaf ? lerp(40, 55, k / 8) + jit : lerp(42, 82, K.habit) + jit;
      let tilt = lerp(stemLeaf ? 28 : 12, mature, smoothstep(0.3, stemLeaf ? 1.8 : 1.4, e)) * DEG;
      // The youngest leaves fold in over the bud cluster until it shows.
      const young = 1 - smoothstep(1, 2.6, e);
      const wrap = K.enclose * young * smoothstep(0.05, 0.25, K.bud);
      tilt *= 1 - 0.55 * wrap;
      const curl = Math.max(1 - smoothstep(0.35, 1.1, e), 0.7 * wrap) + 0.35 * sen;
      const droop = (stemLeaf ? 0.35 : lerp(0.12, 1.0, K.habit)) * grow + 0.6 * sen;
      const az = leafAz(n);
      const radial = [Math.cos(az), 0, Math.sin(az)];
      const base = add(mainAxis.at(s).p, radial, stemRadius(s) * 0.9);
      // Midrib: bends over more towards the tip; rests on the soil.
      const SEG = 12;
      const midrib = [base];
      let p = base;
      for (let j = 0; j < SEG; j++) {
        const u = (j + 0.5) / SEG;
        const phi = Math.min(tilt + droop * Math.pow(u, 1.3), 1.75);
        p = add(p, [Math.sin(phi) * radial[0], Math.cos(phi), Math.sin(phi) * radial[2]], len / SEG);
        if (p[1] < LEAF_FLOOR) p = [p[0], LEAF_FLOOR, p[2]];
        midrib.push(p);
      }
      leaves.push({
        n, stemLeaf, k: stemLeaf ? k : 0, s, az,
        emerge: e, unfolded: e >= 1, present: e > 0 && drop < 0.5,
        len, fullLen: Lfin,
        width: len * P.LEAVES.width[n - 1],
        petiole: P.LEAVES.petiole[n - 1], lobes: P.LEAVES.lobes[n - 1],
        tilt, curl, sen, drop, midrib, tip: midrib[SEG],
        young: e < 2.6,
      });
    }

    // ---- Racemes --------------------------------------------------------------
    const main = computeRaceme('main', P.MAIN_RACEME, K, mainAxis, racemeBaseS, P.MAIN_RACEME.podLen);
    const branches = [];
    for (const [j, def] of BRANCHES.entries()) {
      const Kb = keyframes(Math.max(0, t - def.lag));
      const stalk = def.stalk * smoothstep(0.3, 0.9, Kb.ext);
      if (Kb.bud < 0.05 || K.ext < 0.3) continue;
      const leaf = leaves[NR + def.leaf - 1];
      const az = leaf.az + def.az;
      const radial = [Math.cos(az), 0, Math.sin(az)];
      const base = add(mainAxis.at(leaf.s + 0.3).p, radial, stemRadius(leaf.s) * 0.8);
      const R = Kb.rach * (def.len / 50);
      const axis = leaningAxis(base, az, def.angle * DEG, def.top * DEG, stalk + R + 2, def.bend);
      const r = computeRaceme(`B${j + 1}`, def, Kb, axis, Math.max(0.05, stalk), P.MAIN_RACEME.podLen);
      r.stalk = stalk;
      r.leaf = def.leaf;
      branches.push(r);
    }

    // Seed reserve and taproot.
    const seedling = {
      seedY, hypo, hookTop, node: node.p, crownY,
      seedUsed: smoothstep(0, 1, K.coty),
      rootLen: K.roots,
      collarR: K.collar,
    };

    return {
      t, K, seedling, cotyledons, leaves, crownY,
      ints, nodeS, racemeBaseS, stemRadius, mainAxis,
      main, branches, racemes: [main, ...branches],
    };
  }

  // Live measurements of the main stem, used by overlays and checks.
  function measureMain(plant) {
    const { K, leaves, main } = plant;
    const unfolded = leaves.filter((l) => l.unfolded).length;
    const extended = plant.ints.filter((x) => x >= VISIBLE_INTERNODE).length;
    const fl = main.flowers;
    const frac = (f) => fl.filter(f).length / fl.length;
    // The leaves immediately round the bud cluster: the youngest one or two
    // showing (BBCH 52/53 compare the buds with these).
    const youngLeaves = leaves.filter((l) => l.present && l.emerge > 0.2 && l.emerge < 1.8);
    const youngTop = youngLeaves.length ? Math.max(...youngLeaves.map((l) => Math.max(...l.midrib.map((p) => p[1])))) : 0;
    const budTop = main.axis.at(main.tipS).p[1] + main.budR;
    // Highest point of a raceme: its bud cluster, or a pod or flower held up
    // on its stalk (about 40° off the rachis).
    const top = (r) => Math.max(r.tip[1] + r.budR, ...r.flowers.map((f) => r.axis.at(f.s).p[1] + (f.pedLen + f.podLen) * 0.75));
    const tops = [budTop, ...leaves.filter((l) => l.present).map((l) => Math.max(...l.midrib.map((p) => p[1]))), ...plant.racemes.map(top)];
    const topBranch = plant.branches[0];
    const ripeBy = (lo, hi) => {
      const sel = fl.filter((f) => f.x >= lo && f.x < hi && f.podSize > 0.4);
      return sel.length ? sel.reduce((a, f) => a + f.seed, 0) / sel.length : 0;
    };
    return {
      // Seedling
      rootLen: plant.seedling.rootLen,
      hypoLen: K.hypo,
      hookTop: plant.seedling.hookTop,
      cotyOpen: K.coty,
      cotyY: plant.seedling.node[1],
      // Leaves (BBCH counts every leaf unfolded, including ones since lost)
      leavesUnfolded: unfolded,
      leavesGreen: leaves.filter((l) => l.unfolded && l.present && l.sen < 0.5).length,
      leafEmerge: (n) => leaves[n - 1]?.emerge ?? 0,
      collarDiam: 20 * K.collar,
      // Stem
      ints: plant.ints,
      extended,
      // Buds
      budPresent: K.bud > 0.2,
      budsEnclosed: K.enclose > 0.5,
      budVisibleFromAbove: K.bud > 0.2 && K.enclose < 0.5,
      budTop,
      youngLeafTop: youngTop,
      budAboveLeaves: budTop - youngTop,
      mainBudsSeparate: K.spread >= 0.5,
      sideBudsSeparate: !!topBranch && topBranch.K.spread >= 0.5 && topBranch.stalk >= 1,
      yellowBuds: fl.filter((f) => f.state === 'bud' && f.yellow > 0.5).length,
      // Flowering (main raceme, share of flower positions)
      opened: frac((f) => f.state !== 'bud'),
      openNow: fl.filter((f) => f.state === 'flower').length,
      petalsFallen: frac((f) => f.state === 'pod'),
      // Pods and seed
      podsFinal: frac((f) => f.podSize >= 0.99),
      podsRipe: frac((f) => f.ripe),
      seedThirds: { bottom: ripeBy(0, 1 / 3), middle: ripeBy(1 / 3, 2 / 3), top: ripeBy(2 / 3, 1.01) },
      midSeed: clamp(K.seed, 0, 5),
      height: Math.max(...tops),
      branches: plant.branches.filter((b) => b.stalk > 1).length,
      pods: plant.racemes.reduce((a, r) => a + r.flowers.filter((f) => f.state === 'pod').length, 0),
    };
  }

  // Verify that the key states satisfy the crop's stage rules (checks.js).
  function checkStages() {
    const fails = [];
    const plantAt = (code) => computePlant(tAt(code));
    const at = (code) => measureMain(plantAt(code));
    const expect = (code, ok, msg) => { if (!ok) fails.push(`GS${code}: ${msg}`); };
    crop.checks({ at, plantAt, expect, SEED_DEPTH: P.SEED_DEPTH });
    return fails;
  }

  // Columns printed by npm run check.
  const table = {
    header: ' GS     t | leaves green | ints≥1 stemTop | bud budTop-leaves | opened open fallen | podsFull ripe seed | height pods br',
    row(s, p, m) {
      const f = (x, w = 5, d = 1) => x.toFixed(d).padStart(w);
      return `GS${String(s.code).padEnd(3)} ${f(s.t)} | ${f(m.leavesUnfolded, 4, 0)}  ${f(m.leavesGreen, 4, 0)} | ${f(m.extended, 4, 0)}  ${f(p.racemeBaseS, 6)} | ${f(p.K.bud, 4, 2)} ${f(m.budAboveLeaves, 6)} | ${f(m.opened * 100, 4, 0)}% ${f(m.openNow, 3, 0)} ${f(m.petalsFallen * 100, 4, 0)}% | ${f(m.podsFinal * 100, 4, 0)}% ${f(m.podsRipe * 100, 4, 0)}% ${f(m.midSeed, 4)} | ${f(m.height, 5, 0)} ${f(m.pods, 4, 0)} ${m.branches}`;
    },
  };

  return { crop, keyframes, tAt, computePlant, measureMain, checkStages, table };
}
