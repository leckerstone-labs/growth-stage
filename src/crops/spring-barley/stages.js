// Agronomic content for spring barley (two-row), the spring variant of
// barley. Spring and winter barley use the same AHDB stage key (Zadoks), so
// this file reuses winter barley's stage list, phases and wording
// (src/crops/winter-barley/stages.js) and overrides only the text that
// differs: no winter habit, fewer leaves and tillers, a shorter plant and
// faster development.
//
// Benchmarks quoted are from the AHDB barley growth guide and the Teagasc
// Spring Barley Guide (SOURCES). Teagasc's figures come from Irish crop
// monitoring, so they are a guide for UK crops, not a UK benchmark.
//
// STATUS: draft content for the prototype. Needs agronomist review before
// being relied on as a field reference.

import * as winter from '../winter-barley/stages.js';

export const SOURCES = {
  ...winter.SOURCES,
  teagasc: {
    title: 'Teagasc — The Spring Barley Guide (crop growth benchmarks)',
    url: 'https://teagasc.ie/wp-content/uploads/2025/05/The-Spring-Barley-Guide-1.pdf',
  },
};

export const PHASES = winter.PHASES;

export const CROP = {
  id: 'spring_barley',
  name: 'Spring barley',
  species: 'barley',
  speciesName: 'Barley',
  variant: 'spring',
  stageSystem: 'Zadoks (AHDB)',
};

// Text that differs from winter barley, by stage code. Each entry replaces
// only the fields it lists.
const SPRING = {
  5: {
    description:
      'The seed has taken up water and the first root (radicle) has broken through at the embryo end. Spring barley is usually drilled from late February to April into warming soil, so germination is quick. The seed keeps its husk (the lemma and palea), so the root pushes out past it.',
  },
  12: {
    description:
      'Two leaves are unfolded on the main shoot. Spring barley leaves come quickly: about one every 82 °C days (AHDB phyllochron benchmark, against 108 for winter barley), or roughly one leaf every 10 days in April and every 7 days in May (Teagasc).',
    sources: ['ahdb_gs', 'ahdb_tillering', 'teagasc'],
  },
  13: {
    description:
      'Three leaves are unfolded. The seed is being used up, crown roots begin to grow from the crown just below the surface, and the first tiller is about to appear: tillers start after the third leaf has emerged (Teagasc).',
    sources: ['ahdb_gs', 'teagasc'],
  },
  22: {
    description:
      'Tillers appear roughly one per leaf, each from the axil of the next leaf up the main shoot. Spring barley grows upright from the start: there is no prostrate winter habit. Spring crops produce fewer tillers than winter crops (AHDB), and getting tillers to survive matters more than producing many.',
    sources: ['ahdb_gs', 'ahdb_tillering', 'teagasc'],
  },
  23: {
    description:
      'Shoot numbers keep rising until stem extension starts. Teagasc benchmark for spring barley: about 1,100 shoots/m² at the peak, falling to about 870 ears/m², or about 3 ear-bearing shoots per plant at 270–280 plants/m². Teagasc suggests a target of at least 950 ears/m².',
    sources: ['ahdb_gs', 'teagasc'],
  },
  24: {
    description:
      'Late tillering, and about as many tillers as a spring barley plant makes. The main shoot has only about 8 leaves in all (Teagasc: 7–9), against about 14 in winter barley, so tillering runs on into the start of stem extension and the youngest tillers often die before they form an ear.',
    sources: ['ahdb_gs', 'ahdb_tillering', 'teagasc'],
  },
  30: {
    description:
      'Inside the main shoot, the developing ear has been lifted about 1 cm above the base node, but the first internode has not yet reached 1 cm. Leaf 4 (counting down from the future flag leaf) is emerging. Spring barley gets here about six weeks after sowing: the Teagasc benchmark crop, sown in mid-March, reached GS30 at the end of April.',
    sources: ['ahdb_gs', 'teagasc'],
  },
  33: {
    description:
      'A third internode has reached 2 cm. Leaf 2 is emerging. Barley stems extend over five internodes, with four nodes in the extended stem (AHDB). Of spring barley\'s eight or so leaves, only the top four are on the extended stem; the rest came out at ground level (Teagasc).',
    sources: ['ahdb_gs', 'ahdb_stem', 'teagasc'],
  },
  39: {
    description:
      'The flag leaf is fully unrolled and its ligule is just visible above the collar of leaf 2. Spring barley is already about 57% of its final height at flag leaf emergence (AHDB), more than winter barley. Teagasc benchmark: about two weeks after GS31.',
    sources: ['ahdb_gs', 'ahdb_stem', 'teagasc'],
  },
  59: {
    description:
      'The whole ear is above the flag leaf ligule. Teagasc benchmark: about two weeks after the flag leaf. Spring two-row ears carry about 19–24 grains, a few fewer than winter barley (AHDB).',
    sources: ['ahdb_gs', 'ahdb_ear', 'teagasc'],
  },
  71: {
    description:
      'Grains are forming. Contents are a clear, watery liquid. AHDB benchmark: grain filling lasts 34–41 days in spring barley.',
  },
  92: {
    description:
      'Harvest ripe. Grain cannot be dented by a thumbnail. In the Teagasc benchmark crop the grain reached hard dough in mid-July and was harvested in mid-August, about five months after a mid-March sowing. Ripe ears hang down and can snap off (necking) if harvest is delayed.',
    sources: ['ahdb_gs', 'teagasc'],
  },
};

export const STAGES = winter.STAGES.map((s) => ({ ...s, ...SPRING[s.code] }));

export const TICKS = winter.TICKS;
export const UI = winter.UI;
export const INSPECT_VIEWS = winter.INSPECT_VIEWS;
