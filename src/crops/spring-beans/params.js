// Spring field bean (Vicia faba) plant dimensions and shape settings, read by
// the legume morphology (src/model/legume.js) and renderer
// (src/render/legume-mesh.js). Plain numbers; colours are hex strings.
//
// Spring beans usually grow a single stem and seldom branch (Link et al.
// 2010; PGRO). Structure of the main stem in this model (18 true leaves):
//   - Two scale leaves at the first two nodes, just below and just above the
//     soil surface. They are not counted as leaves.
//   - True leaves 1–18, one per node, alternate in two ranks. Leaves 1–3 have
//     two leaflets; higher leaves have up to six (paripinnate, no tendril).
//   - A short raceme of flowers in the axil of leaves 7–16 (first flowering
//     node: an estimate; no UK figure found). Only the lowest seven flowering
//     nodes set pods.
// Dimensions are illustrative (sources in stages.js) and need checking
// against real plants: height ~0.8–1.1 m, leaflets ~4–8 cm, pods ~6–8 cm
// with three or four seeds.

export const SEED_DEPTH = 8; // drilling depth, cm (deep: beans are drilled ~7–10 cm)
// Seed size, cm (a field bean seed, thousand-seed weight ~500 g).
export const SEED = { len: 1.6, width: 1.2, thick: 0.75 };
// Scale-leaf nodes, cm from the soil surface once the shoot has emerged.
export const SCALE_LEAVES = [-1.2, 0.4];

export const LEAVES = {
  // Leaflets per leaf, leaf 1 → 18.
  leaflets: [2, 2, 2, 3, 4, 4, 4, 4, 5, 5, 6, 6, 6, 6, 6, 5, 4, 4],
  // Final leaflet length, cm.
  len: [3.8, 4.6, 5.2, 5.8, 6.4, 7.0, 7.4, 7.8, 7.9, 7.9, 7.7, 7.4, 7.2, 6.8, 6.4, 5.8, 5.0, 4.3],
  // Leaflet width as a fraction of its length: broad ovals, upper leaflets a
  // little narrower.
  width: [0.68, 0.67, 0.65, 0.63, 0.61, 0.59, 0.58, 0.57, 0.56, 0.55, 0.54, 0.53, 0.52, 0.51, 0.5, 0.5, 0.5, 0.5],
  // Leaf stalk (petiole) to the first leaflet pair, cm.
  petiole: [1.6, 2.0, 2.3, 2.6, 2.9, 3.2, 3.4, 3.6, 3.6, 3.6, 3.5, 3.4, 3.2, 3.1, 2.9, 2.6, 2.3, 2.1],
  spacing: 1.9, // cm along the rachis between leaflet pairs
  stipule: 0.9, // stipule length, cm
};

// Final internode lengths, cm: the first from the upper scale-leaf node to
// leaf 1 (BBCH GS31's "first internode"), then one below each later leaf.
export const INTERNODES = [2.5, 2, 2.5, 3, 3.5, 4.5, 5.5, 6, 6.5, 6.5, 6.5, 6.5, 6, 6, 5.5, 5, 4.5, 4];

// Stem half-width, cm (the stem is square): at the base and at the top.
export const STEM = { base: 0.42, top: 0.2 };

// Flowering. first: leaf whose axil carries the first raceme; flowers:
// flowers per raceme from the lowest flowering node up (2–6 is usual);
// open: how long a flower stays open, in flowering nodes (the `fl` channel),
// so several racemes are in flower at once.
export const FLOWERING = { first: 7, flowers: [4, 5, 5, 5, 4, 4, 4, 3, 3, 3], open: 5 };

// Pods: pods set at each flowering node from the lowest up (1–2 is typical);
// final length (cm, lowest → highest pod), radius (cm), beak length (cm) and
// seeds per pod (repeating pattern, 3–4 typical).
export const PODS = { perNode: [2, 2, 2, 2, 2, 1, 1], len: [7.2, 5.8], r: 0.8, beak: 0.5, seeds: [4, 3, 4, 4, 3, 3, 4, 3] };

// Basal side shoots: spring beans seldom branch.
export const BRANCHES = [];

// How much riper the lowest pods are than the top ones, in units of the
// `seed` channel (bottom = seed + spread/2, top = seed − spread/2).
export const SEED_SPREAD = 2.4;
// A pod counts as ripe (BBCH 8x: "pods ripe and dark") once it is black.
export const RIPE_SEED = 4.5;

// Seed and pod colour states keyed by the `seed` channel. Pods: green and
// downy, yellowing as the seed matures (hilum turning black), brown then
// black as they ripen; the renderer adds patchy, seeded variation.
export const SEEDS = [
  { s: 0, size: 0.2, col: '#e9efd0', pod: '#86a463', hilum: '#d9dfb8' }, // ovules, flat pod
  { s: 1, size: 0.6, col: '#cfe0a8', pod: '#7c9d58', hilum: '#c9d6a0' }, // expanding
  { s: 2, size: 1, col: '#8db55a', pod: '#71954e', hilum: '#a3bf78' }, // green, filling the pod
  { s: 3, size: 1, col: '#b7c27a', pod: '#a2a35c', hilum: '#2a2520' }, // full size, hilum black; pod yellowing
  { s: 3.6, size: 0.98, col: '#c1b77a', pod: '#8a7a4a', hilum: '#221e1a' }, // pod yellow-brown
  { s: 4.2, size: 0.96, col: '#c6b27b', pod: '#5a4635', hilum: '#1d1a17' }, // pod brown, blackening
  { s: 4.8, size: 0.94, col: '#bfa673', pod: '#2f2823', hilum: '#161412' }, // pod nearly black
  { s: 5.4, size: 0.92, col: '#b99a6a', pod: '#24211f', hilum: '#141210' }, // black pod, seed dry and hard
];

// Colours (hex). Field bean leaves are a grey, glaucous green, paler and
// yellower at the shoot tip. Dying leaves go yellow, then brown, then dark
// brown-black. Ripe stems go yellowish, brown, then dark grey-brown, not
// jet black; ripe pods are dull black.
export const COLOURS = {
  leafYoung: '#97b383',
  leaf: '#7a9b7c',
  leafOld: '#66876b',
  leafYellow: '#c3b866',
  leafBrown: '#86694a',
  leafDead: '#40352c', // dark brown
  leafBlack: '#282421', // brown-black: killed in ripening
  petiole: '#8aa776',
  stem: '#76a052',
  stemPale: '#9cb873',
  stemYellow: '#a7a467',
  stemBrown: '#6e573e',
  stemDark: '#54473a',
  stemDarkest: '#3e352d',
  stemGrey: '#8a8072', // weathered dead stem
  epicotyl: '#e6e2c4', // below ground, before greening
  scale: '#cfcca0',
  stipule: '#80a06a',
  nectary: '#3b2536',
  calyx: '#88a65c',
  bud: '#93b067',
  petal: '#f7f5ef',
  petalFlush: '#f3e6e4', // faint pink-cream
  vein: '#6f4f6a',
  blotch: '#1c1513',
  petalWilt: '#8b6e4c',
  podBlack: '#232122', // dull black with a grey bloom
  podBrownBlack: '#33281f',
  seedCoat: '#c9b17f',
  seedHilum: '#1d1a17',
  root: '#ece2c8',
  rootCollar: '#c8b48c',
  nodule: '#d39c86',
  lining: '#f3f1e8', // inside of the pod (white, spongy)
  liningDry: '#b9ab94',
};

// Root system (src/model/roots.js): a strong taproot with laterals, most of
// them in the upper 30 cm, and nitrogen-fixing nodules on the upper roots.
// Nodules start about two weeks after emergence (SaskPulse; Bean YEN takes
// GS34, fourth node, as the start of nodulation) and are fully grown by
// flowering. Rooting depth comes from the `roots` keyframe channel.
export const ROOTS = {
  type: 'taproot',
  tap: { r: 0.05, collar: 1.0, decay: [3, 18], wander: 0.08 },
  laterals: { from: 0.4, spacing: 0.45, tipZone: 1.2, len: 16, rate: 0.35, decay: 16, angle: 70, r: 0.028, gravity: 0.05 },
  nodules: { depth: 16, spacing: 0.6, r: 0.17, from: 16, full: 45 },
};
