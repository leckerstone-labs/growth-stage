// Agronomic content for spring wheat, the spring variant of wheat. Spring
// and winter wheat use the same AHDB stage key (Zadoks), so this file reuses
// winter wheat's stage list, phases and wording
// (src/crops/winter-wheat/stages.js) and overrides only the text that
// differs: no winter habit, fewer leaves and tillers, a shorter plant and
// faster development.
//
// AHDB has no spring wheat growth guide. Benchmarks quoted come from the
// AHDB Recommended List (straw height), the AHDB winter wheat guide (effect
// of later sowing on leaf number), an agronomist's spring wheat advice in
// Farmers Weekly (sowing window, tillering, ear target) and NDSU Extension
// (main-stem leaf number; North American spring wheat, so a guide only).
//
// STATUS: draft content for the prototype. Needs agronomist review before
// being relied on as a field reference.

import * as winter from '../winter-wheat/stages.js';

export const SOURCES = {
  ...winter.SOURCES,
  ahdb_rl: {
    title: 'AHDB Recommended Lists for cereals and oilseeds 2022/23 (spring wheat)',
    url: 'https://www.bspb.co.uk/wp-content/uploads/AHDB-Recommended-Lists-for-cereals-and-oilseeds-2022-23-summer-edition.pdf',
  },
  fwi: {
    title: 'Farmers Weekly — Spring wheat helps growers to beat blackgrass',
    url: 'https://fwi.co.uk/arable/spring-wheat-helps-growers-to-beat-blackgrass',
  },
  ndsu: {
    title: 'NDSU Extension — How heat and water stress affect wheat plants in vegetative stages (spring wheat leaf number)',
    url: 'https://www.ndsu.edu/agriculture/node/4274',
  },
};

export const PHASES = winter.PHASES;

export const CROP = {
  id: 'spring_wheat',
  name: 'Spring wheat',
  species: 'wheat',
  speciesName: 'Wheat',
  variant: 'spring',
  stageSystem: 'Zadoks (AHDB)',
};

// Text that differs from winter wheat, by stage code. Each entry replaces
// only the fields it lists.
const SPRING = {
  5: {
    description:
      'The seed has taken up water and the first root (radicle) has broken through the seed coat at the embryo end. Spring wheat is usually drilled from late winter to April into warming soil, so germination is quick. Many spring varieties can also be drilled in late autumn; AHDB lists them for both sowings.',
    sources: ['ahdb_gs', 'ahdb_rl', 'fwi'],
  },
  12: {
    description:
      'Two leaves are unfolded on the main shoot. Leaves come faster than in an autumn-sown crop: later sowing shortens the time between leaves and reduces the number of leaves the main shoot makes (AHDB).',
    sources: ['ahdb_gs', 'ahdb_tillering'],
  },
  13: {
    description:
      'Three leaves are unfolded. The seed is being used up, crown roots begin to grow from the crown just below the surface, and the first tiller is about to appear.',
    sources: ['ahdb_gs', 'ahdb_tillering'],
  },
  22: {
    description:
      'Tillers appear roughly one per leaf, each from the axil of the next leaf up the main shoot. Spring wheat grows upright from the start: there is no prostrate winter habit. It does not tiller like a winter wheat, so plant numbers matter more: seed rates rise from about 325 seeds/m² for a January sowing to about 400 for April (agronomist advice, Farmers Weekly).',
    sources: ['ahdb_gs', 'fwi'],
  },
  23: {
    description:
      'Shoot numbers keep rising until stem extension starts. A spring wheat crop is aiming for about 600 ears/m² (agronomist advice, Farmers Weekly), roughly two ears per plant. The youngest tillers are usually lost during stem extension.',
    sources: ['ahdb_gs', 'fwi'],
  },
  24: {
    description:
      'Late tillering, and about as many tillers as a spring wheat plant makes. The main shoot has only about 8 leaves in all (NDSU: most spring wheats make 8), against 11 or more in winter wheat, so tillering runs on into the start of stem extension and the youngest tillers die before they form an ear.',
    sources: ['ahdb_gs', 'ahdb_tillering', 'ndsu'],
  },
  30: {
    description:
      'Inside the main shoot, the developing ear has been lifted about 1 cm above the base node, but the first internode has not yet reached 1 cm. Leaf 4 (counting down from the future flag leaf) is emerging. Spring wheat is already upright, so there is no change in habit to go by: split the shoot. It is a short-cycle crop in which everything happens quickly (agronomist, Farmers Weekly).',
    sources: ['ahdb_gs', 'fwi'],
  },
  33: {
    description:
      'A third internode has reached 2 cm. Leaf 2 is emerging. Subsequent nodes follow the same rule. Of spring wheat\'s eight or so leaves, only the top four are on the extended stem in this model; the rest came out at ground level.',
    sources: ['ahdb_gs', 'ndsu'],
  },
  39: {
    description:
      'The flag leaf is fully unrolled and its ligule is just visible above the collar of leaf 2. About half of final crop height. Spring wheats are shorter than winter wheats: 72–80 cm without growth regulator in AHDB trials, against 82–95 cm.',
    sources: ['ahdb_gs', 'ahdb_stem', 'ahdb_rl'],
  },
  49: {
    description:
      'In awned varieties the awn tips appear above the flag leaf ligule. Most UK wheats are awnless, so this stage is often not seen.',
  },
};

export const STAGES = winter.STAGES.map((s) => ({ ...s, ...SPRING[s.code] }));

export const TICKS = winter.TICKS;
export const UI = winter.UI;
export const INSPECT_VIEWS = winter.INSPECT_VIEWS;
