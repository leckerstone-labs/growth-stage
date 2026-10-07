// Winter oilseed rape plant dimensions and shape settings, read by the
// brassica morphology (src/model/brassica.js) and renderer
// (src/render/brassica-mesh.js). Plain numbers; colours are hex strings.
//
// Benchmarks (AHDB oilseed rape growth guide): final height 100–160 cm;
// 25–40 plants/m² and 6,000–8,000 pods/m², so roughly 200 pods per plant;
// about 100,000 seeds/m² for 5 t/ha (≈ 15–20 seeds per pod).
//
// Structure of the main stem in this model (20 leaves):
//   - Leaves 1–12 form the rosette on a short crown at soil level.
//   - Leaves 13–20 are stem leaves, one above each of the first eight
//     extending internodes; a ninth internode carries the main raceme.
//   - Side branches grow from the axils of the top six stem leaves.
// Values are illustrative and need checking against real plants.

export const SEED_DEPTH = 1.5; // drilling depth, cm (AHDB: shallow, ~1–2 cm)

export const LEAVES = {
  rosette: 12,
  stem: 8,
  // Final length (stalk + blade), cm, leaf 1 → 20.
  len: [6, 9, 12, 15, 18, 21, 23, 25, 26, 26, 25, 24, 21, 17, 14, 11.5, 9.5, 8, 6.5, 5],
  // Blade width as a fraction of length.
  width: [0.62, 0.58, 0.52, 0.5, 0.48, 0.46, 0.45, 0.45, 0.44, 0.43, 0.42, 0.42, 0.42, 0.4, 0.38, 0.36, 0.34, 0.32, 0.3, 0.28],
  // Leaf stalk (petiole) as a fraction of length; upper stem leaves are stalkless.
  petiole: [0.35, 0.35, 0.34, 0.33, 0.32, 0.32, 0.32, 0.3, 0.3, 0.3, 0.28, 0.28, 0.2, 0.1, 0, 0, 0, 0, 0, 0],
  // Pairs of small side lobes along the stalk (lyrate leaves).
  lobes: [0, 0, 1, 2, 2, 3, 3, 3, 3, 3, 3, 3, 2, 1, 0, 0, 0, 0, 0, 0],
};

// Final internode lengths, cm: under stem leaves 13–20, then the top
// internode up to the base of the main raceme.
export const INTERNODES = [1.6, 3.2, 4.8, 6.4, 8, 10, 12, 13, 14];

// Stem radius, cm: at the base and just under the main raceme (final).
export const STEM = { base: 0.7, top: 0.26 };

// Main raceme: flower positions (each becomes a pod) and final rachis length.
export const MAIN_RACEME = { n: 48, len: 50, podLen: [7, 4.8], scale: 1 };

// Side branches from the axils of stem leaves (index into stem leaves 1–8),
// top first. lag: timeline units behind the main raceme. stalk: branch length
// below its raceme. angle: lean from vertical at the base, degrees.
export const BRANCHES = [
  { leaf: 8, lag: 2.2, stalk: 12, angle: 30, n: 28, len: 30, scale: 0.92 },
  { leaf: 7, lag: 3.0, stalk: 17, angle: 33, n: 27, len: 29, scale: 0.9 },
  { leaf: 6, lag: 3.8, stalk: 22, angle: 36, n: 26, len: 28, scale: 0.88 },
  { leaf: 5, lag: 4.6, stalk: 27, angle: 38, n: 24, len: 26, scale: 0.85 },
  { leaf: 4, lag: 5.4, stalk: 31, angle: 40, n: 22, len: 24, scale: 0.82 },
  { leaf: 3, lag: 6.2, stalk: 33, angle: 42, n: 20, len: 22, scale: 0.78 },
];

// Pods (siliques): radius, beak length and pedicel length (cm), seeds per pod.
export const POD = { r: 0.22, beak: 0.9, pedicel: 1.8, seeds: 18 };

// How much riper the lowest pods on a raceme are than the top ones, in units
// of the `seed` channel (bottom = seed + spread/2, top = seed − spread/2).
export const SEED_SPREAD = 2.4;
// A pod counts as ripe (BBCH GS8x) once its seeds are dark and hard.
export const RIPE_SEED = 4.5;

// Seed colour states keyed by the `seed` channel (pod view and pod colours).
export const SEEDS = [
  { s: 0, size: 0.35, col: '#f1f0dc', pod: '#86ad4c' }, // ovules
  { s: 1, size: 0.75, col: '#dfe8c0', pod: '#7fa848' }, // expanding, translucent
  { s: 2, size: 1, col: '#6f9a3a', pod: '#7aa244' }, // green, filling the cavity
  { s: 3, size: 1, col: '#8a8a45', pod: '#a8b456' }, // green-brown mottled
  { s: 4, size: 0.97, col: '#6b4a2a', pod: '#cdbb6c' }, // brown
  { s: 5, size: 0.93, col: '#2a211b', pod: '#c9ad78' }, // black, hard
];

// Colours (hex). Oilseed rape leaves and stems are glaucous blue-green.
export const COLOURS = {
  cotyledon: '#7aa356',
  cotyledonPale: '#e2dfa6', // below ground, before greening
  leafYoung: '#7ea468',
  leaf: '#557f62',
  leafYellow: '#d4c35c',
  leafDead: '#c9b48a',
  petiole: '#9bbd82',
  stem: '#7ea25c',
  stemRipe: '#c8ae78',
  stemDry: '#a98c62',
  hypocotyl: '#c9b4a0',
  root: '#ece2c8',
  rootCollar: '#c8b48c',
  bud: '#86ad50',
  budYellow: '#dcc53c',
  sepal: '#a9c45a',
  petal: '#f4d01c',
  petalOld: '#efe3a4',
  stamen: '#e8b81c',
  seedCoat: '#3b2a20',
};
