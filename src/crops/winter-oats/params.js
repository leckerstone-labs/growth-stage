// Winter oat plant dimensions and shape settings. The panicle, collar,
// grain, colours and roots come from spring oats
// (src/crops/spring-oats/params.js); this file sets what differs: more
// leaves and tillers, a prostrate habit over winter and the winter panicle.
//
// Benchmarks (Opti-Oat Oat Growth Guide, 2019, winter cv. Mascani): 45 cm
// to the flag leaf ligule at GS39; 65 cm to the ligule and 93 cm to the top
// of the panicle at GS59; final height 104 cm to the top of the panicle (71
// cm to the ligule), reached at GS75; six internodes; 47 grains per
// panicle; 640 shoots/m² at GS31 falling to 415 at harvest from 210
// plants/m² (about three shoots per plant at the peak, two panicles at
// harvest).
//
// Estimates (illustrative): 11 main-stem leaves, every leaf and sheath size,
// panicle layout and rooting depths.
//
// Botanical structure (main shoot, 11 leaves in this model):
//   - Leaves 1–5 attach at crown nodes that never elongate.
//   - Leaf 6 attaches at the base node, leaves 7–11 at nodes 1–5.
//   - Six internodes elongate: i1..i5 and the peduncle.

import * as spring from '../spring-oats/params.js';

export const MAIN = {
  ...spring.MAIN,
  N: 11,
  blade: [8, 10, 12, 15, 18, 21, 24, 27, 30, 30, 24],
  width: [0.4, 0.5, 0.6, 0.75, 0.9, 1.1, 1.3, 1.5, 1.7, 1.85, 1.65],
  sheath: [3, 3.5, 4.5, 5.5, 6.5, 8, 10, 13, 16, 19, 22],
  earLen: 22, // panicle length (estimate)
};

// Shoots: main shoot and three tillers (GS23), prostrate over winter. T2
// and T3 die during stem extension, leaving two panicles per plant.
export const shoots = (tAt, between) => [
  { id: 'MS', k: 0, lag: 0, scale: 1, leanP: 0, leanE: 0 },
  { id: 'T1', k: 1, lag: 1.2, scale: 0.95, leanP: 58, leanE: 12 },
  { id: 'T2', k: 2, lag: 2.4, scale: 0.88, leanP: 62, leanE: 15,
    death: { start: between(31, 32, 0.75), end: between(33, 37, 0.5), hide: between(41, 43, 0.6) } },
  { id: 'T3', k: 3, lag: 3.6, scale: 0.78, leanP: 66, leanE: 17,
    death: { start: tAt(31), end: between(32, 33, 0.5), hide: tAt(39) } },
];

// 24 spikelets (with the terminal one), about 48 grains (benchmark 47).
export const PANICLE = { ...spring.PANICLE, spikelets: [7, 6, 4, 3, 2, 1] };

export const { ERECT_ANGLE, earProfile, EAR, COLLAR, GRAIN, PALETTE, ROOTS } = spring;
