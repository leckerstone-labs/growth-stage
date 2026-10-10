// Agronomic content for winter oats, the winter variant of oats. Spring and
// winter oats use the same Zadoks key, so this file reuses the oat text in
// src/crops/spring-oats/stages.js and overrides only what differs: autumn
// sowing, a prostrate plant over winter, more leaves and tillers, earlier
// stages in spring, and the winter benchmarks (Opti-Oat Oat Growth Guide,
// 2019, cv. Mascani).
//
// STATUS: draft content for the prototype. Needs agronomist review before
// being relied on as a field reference.

import * as spring from '../spring-oats/stages.js';

export const SOURCES = spring.SOURCES;

export const PHASES = spring.PHASES.map((p) =>
  p.id === 'tillering' ? { ...p, to: 33 } : p.id === 'stem' ? { ...p, from: 33 } : p);

export const CROP = {
  id: 'winter_oats',
  name: 'Winter oats',
  species: 'oats',
  speciesName: 'Oats',
  variant: 'winter',
  stageSystem: 'Zadoks (Opti-Oat)',
};

// Text that differs from spring oats, by stage code. Each entry replaces
// only the fields it lists.
const WINTER = {
  5: {
    description:
      'The seed has taken up water and the first root (radicle) has broken through at the embryo end. Winter oats are sown in autumn. The oat seed keeps its husk (the lemma and palea), so the root pushes out past it.',
  },
  9: {
    description:
      'The coleoptile has reached the soil surface. The first leaf is about to grow out through its tip. Opti-Oat benchmark: about 365 °C days from sowing to full emergence; as temperatures fall in autumn, emergence takes longer.',
  },
  12: {
    description:
      'Two leaves are unfolded on the main shoot. Seen from above, oat leaves twist anticlockwise; wheat and barley leaves twist clockwise. Check the lower half of the leaf, as the tip can twist the other way. Opti-Oat measured about 145 °C days per leaf in winter oats.',
  },
  21: {
    description:
      'The first tiller has appeared from the axil of the lowest leaf on the main shoot. Leaf production carries on at the same time. The plant spreads out over winter (prostrate habit).',
  },
  22: {
    description:
      'Tillers appear roughly one per leaf, each from the axil of the next leaf up the main shoot. Oats are the least winter-hardy cereal: Opti-Oat recorded about 88% of plants surviving the winter. Winter oats generally need some cold to flower, but unlike winter wheat they will flower eventually without it.',
  },
  23: {
    description:
      'Shoot numbers keep rising until stem extension starts. Opti-Oat benchmark: about 640 shoots/m² at GS31 from 210 plants/m² (about three per plant), falling to about 415 panicles/m² at harvest (about two per plant) as the smaller, later tillers die.',
  },
  30: {
    description:
      'The plant stands upright again after the winter. Inside the main shoot the developing panicle (the inflorescence) has been lifted about 1 cm above the base node, but no internode has reached 1 cm yet. Opti-Oat benchmark date for winter oats: about 11 April.',
  },
  31: {
    description:
      'The first internode has extended to at least 1 cm, so the first node can be felt or seen above it. The next internode is still shorter than 2 cm. Opti-Oat benchmark: about 24 April, with shoot numbers at their peak.',
  },
  39: {
    description:
      'The flag leaf is fully unrolled and its ligule is just visible above the collar of leaf 2. Opti-Oat benchmark: about 24 May, 45 cm to the flag leaf ligule.',
  },
  59: {
    description:
      'The whole panicle is above the flag leaf ligule: the lowest whorl of branches (the first node of the rachis) is clear and the neck is showing. The branches spread and the spikelets hang on their small branches (pedicels). Opti-Oat benchmark: about 12 June, 65 cm to the flag leaf ligule and 93 cm to the top of the panicle.',
  },
  69: {
    description:
      'Flowering has finished down to the bottom whorl. Most spikelets will set two grains of unequal size, so oat grain size is bimodal. Opti-Oat benchmark: 47 grains per panicle (winter).',
  },
  75: {
    description:
      'Contents are milky. The crop reaches its final height at about this stage. Opti-Oat benchmark: about 6 July, 71 cm to the flag leaf ligule and 104 cm to the top of the panicle (dwarf varieties are 15–20 cm shorter).',
  },
  87: {
    description:
      'A thumbnail impression is held. Grain filling is essentially complete. Opti-Oat benchmark: about 1 August.',
  },
  92: {
    description:
      'Harvest ripe. Grain cannot be dented by a thumbnail. Ripening can take up to two weeks after hard dough before the grain is dry enough to harvest (ideally no more than 15% moisture). Opti-Oat benchmark: harvest about 18 August.',
  },
};

export const STAGES = spring.oatStages([
  [5, 0], [7, 3], [9, 6], [10, 9], [11, 12], [12, 15], [13, 18],
  [21, 21], [22, 25], [23, 29],
  [30, 35], [31, 41.5], [32, 48], [33, 53.6], [37, 60], [39, 65.2],
  ...spring.LATE_TIMES,
], WINTER);

// Timeline ticks that keep their label (the rest show as minor ticks).
export const TICKS = {
  major: [5, 9, 11, 13, 21, 23, 30, 31, 32, 33, 37, 39, 45, 51, 55, 59, 65, 69, 75, 87, 92],
};

export const UI = spring.UI;
export const INSPECT_VIEWS = spring.INSPECT_VIEWS;
