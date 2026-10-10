// Agronomic content for winter field beans. Same BBCH faba bean key and the
// same stage text as spring beans (src/crops/spring-beans/stages.js), with
// the wording that differs overridden here: deeper sowing, overwintering as
// a small plant, basal side shoots in spring (GS21, GS22 replace the GS14 and
// GS16 leaf checkpoints: the side-shoot stage is the more advanced one), and
// a lower first flowering node.
//
// STATUS: draft content. Needs agronomist review before being relied on as a
// field reference.

import * as spring from '../spring-beans/stages.js';

export const SOURCES = spring.SOURCES;
const B = ['bbch_defra', 'bean_yen'];

const OVERRIDES = {
  5: {
    check: 'Dig up seeds at sowing depth (winter beans go in deeper than spring beans, often ploughed down to 10 cm or more). A white root tip shows beside the hilum.',
  },
  13: {
    title: '3 leaves unfolded (overwintering)',
    description:
      'Winter beans go into the winter as small plants with two or three leaves on a short shoot (Link et al. 2010). Growth almost stops in the cold; the roots keep growing. A cold spell (vernalisation) lets the plant flower on a lower node.',
    check: 'Count unfolded leaves on the main stem. Check for frost damage and for nodules on the upper roots.',
    sources: [...B, 'winter_spring'],
  },
  21: {
    title: '1 side shoot',
    description:
      'In early spring a side shoot (basal branch) grows from one of the lowest nodes, at or just below the soil surface. BBCH records side shoots in GS2x once they are the most advanced stage.',
    check: 'Count the stems coming from the base of the plant besides the main stem: GS21 is one side shoot.',
    inspect: 'plant',
    sources: [...B, 'winter_spring'],
  },
  22: {
    title: '2 side shoots',
    description:
      'A second side shoot has appeared. Winter beans usually grow two or more stems that develop almost together; each will flower a little after the main stem. Spring beans seldom do this.',
    check: 'Count side shoots from the base. Count leaves on the main stem only.',
    inspect: 'plant',
    sources: [...B, 'winter_spring'],
  },
  50: {
    description:
      'Flower buds have formed in the axil of a leaf a few nodes below the tip (leaf 6 in this model: winter beans flower on a lower node and earlier than spring beans), still hidden by the young leaves at the top of the stem.',
    sources: [...B, 'winter_spring'],
  },
  65: {
    description:
      'Five racemes on the main stem have open flowers, and the side shoots are flowering too. The lowest flowers are fading: those that set seed leave a small pod; most flowers on the upper nodes drop.',
  },
};

export const PHASES = [
  { id: 'germination', name: 'Germination', from: 0, to: 7.5 },
  { id: 'leaves', name: 'Leaves', from: 7.5, to: 20.75 },
  { id: 'shoots', name: 'Side shoots', from: 20.75, to: 29.5 },
  { id: 'buds', name: 'Flower buds', from: 29.5, to: 43.25 },
  ...spring.PHASES.slice(3),
];

export const CROP = {
  id: 'winter_beans',
  name: 'Winter beans',
  species: 'beans',
  speciesName: 'Field beans',
  variant: 'winter',
  stageSystem: 'BBCH (faba bean)',
  family: 'legume',
};

export const STAGES = spring.stageList([
  [5, 0, 'germination'], [7, 3, 'germination'], [9, 6, 'germination'],
  [10, 9, 'leaves'], [11, 12, 'leaves'], [12, 15, 'leaves'], [13, 18, 'leaves'],
  [21, 23.5, 'shoots'], [22, 28, 'shoots'],
  ...spring.LATER.map(([c, t, p]) => [c, t === 31 ? 32 : t, p]),
], OVERRIDES);

export const TICKS = { major: STAGES.map((s) => s.code) };
export const UI = spring.UI;
export const INSPECT_VIEWS = spring.INSPECT_VIEWS;
