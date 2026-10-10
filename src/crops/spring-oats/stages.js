// Agronomic content for spring oats, independent of the renderer. Winter
// oats (src/crops/winter-oats/stages.js) reuse this text and override only
// what differs.
//
// AHDB publishes no oat growth guide: its cereal growth stage page covers
// wheat and barley. The oat stage key is the same Zadoks decimal code, as
// listed in the Opti-Oat Oat Growth Guide (2019; UK trials 2014–17, spring
// cv. Canyon, winter cv. Mascani; not an AHDB publication). Benchmarks
// quoted are from that guide; heights there are to the flag leaf ligule
// unless they say "to the top of the panicle". The oat identification
// features (no auricles, membranous ligule, leaves twisting anticlockwise,
// hairless leaves) are from AHDB's wild-oat page, which contrasts wild and
// cultivated oats with wheat and barley.
//
// Differences from wheat that the timeline follows:
//   - No GS49 checkpoint: oats are effectively awnless.
//   - The panicle stages are worded for a panicle (GS51 first spikelet of
//     the panicle just visible, GS55 half, GS59 completely emerged).
//   - GS91 (grain hard, difficult to divide) replaces wheat's GS89, as in
//     the Opti-Oat key.
//   - Spring oats tiller little: the plant here stops at two tillers (GS22).
//
// STATUS: draft content for the prototype. Needs agronomist review before
// being relied on as a field reference.

export const SOURCES = {
  opti_oat: {
    title: 'Opti-Oat — Oat Growth Guide (2019; not an AHDB publication)',
    url: 'https://www.hutton.ac.uk/sites/default/files/files/publications/Oat-Growth-Guide.pdf',
  },
  ahdb_gs: {
    title: 'AHDB — The growth stages of cereals',
    url: 'https://ahdb.org.uk/knowledge-library/the-growth-stages-of-cereals',
  },
  ahdb_oat_id: {
    title: 'AHDB — Distribution and biology of wild oat in the UK (how to tell oats from other cereals)',
    url: 'https://ahdb.org.uk/knowledge-library/distribution-and-biology-of-wild-oat-in-the-uk',
  },
  // Root architecture in the plant view (roots model). Oat rooting depths
  // are read approximately from the Opti-Oat guide's charts.
  roots: {
    title: 'AHDB — How to promote and measure root growth and distribution in cereals',
    url: 'https://ahdb.org.uk/knowledge-library/how-to-promote-and-measure-root-growth-and-distribution-in-cereals',
  },
};

// Text shared by spring and winter oats, by stage code. Variants add the
// timeline position `t` and override what differs (oatStages below).
export const OAT_TEXT = {
  5: {
    phase: 'germination',
    title: 'Radicle emerged',
    description:
      'The seed has taken up water and the first root (radicle) has broken through at the embryo end. The oat seed keeps its husk (the lemma and palea), so the root pushes out past it.',
    check: 'Dig up a seed from drilling depth (typically 2–4 cm). A white root tip is showing from the embryo end of the husked seed.',
    inspect: 'plant',
    sources: ['opti_oat', 'ahdb_gs'],
  },
  7: {
    phase: 'germination',
    title: 'Coleoptile emerged from seed',
    description:
      'The coleoptile, a pointed protective sheath round the emerging shoot, has grown out of the seed. A few seminal roots grow from the seed at the same time; oats usually have fewer than wheat or barley.',
    check: 'Dig up a seed: a pale, pointed shoot (coleoptile) is growing up from the embryo end, still below the soil surface.',
    inspect: 'plant',
    sources: ['opti_oat', 'ahdb_gs'],
  },
  9: {
    phase: 'germination',
    title: 'Emergence',
    description:
      'The coleoptile has reached the soil surface. The first leaf is about to grow out through its tip.',
    check: 'Look along the row for pale coleoptile tips just breaking the soil. No green leaf blade showing yet.',
    inspect: 'plant',
    sources: ['opti_oat', 'ahdb_gs'],
  },
  10: {
    phase: 'seedling',
    title: 'First leaf through coleoptile',
    description:
      'The first true leaf has pushed out through the tip of the coleoptile. Below ground the sub-crown internode is lifting the growing point towards the surface, where the crown will form.',
    check: 'A green leaf is growing out of the pale coleoptile sheath. It is not yet unrolled and its ligule is not visible.',
    inspect: 'plant',
    sources: ['opti_oat', 'ahdb_gs'],
  },
  11: {
    phase: 'seedling',
    title: 'First leaf unfolded',
    description:
      'The first leaf has unrolled and its ligule is visible. Oat leaves have a large, membranous ligule and no auricles at all, which is the quickest way to tell an oat seedling from wheat or barley. Cultivated oat leaves are hairless.',
    check: 'Count leaves on the main shoot: a leaf counts as unfolded once its ligule is visible. Ignore the coleoptile. Where blade meets sheath you should see the ligule and no auricles.',
    inspect: 'plant',
    sources: ['opti_oat', 'ahdb_oat_id'],
  },
  12: {
    phase: 'seedling',
    title: '2 leaves unfolded',
    description:
      'Two leaves are unfolded on the main shoot. Seen from above, oat leaves twist anticlockwise; wheat and barley leaves twist clockwise. Check the lower half of the leaf, as the tip can twist the other way.',
    check: 'Count unfolded leaves (ligule visible) on the main shoot only.',
    inspect: 'plant',
    sources: ['opti_oat', 'ahdb_oat_id'],
  },
  13: {
    phase: 'seedling',
    title: '3 leaves unfolded',
    description:
      'Three leaves are unfolded. The seed is being used up, crown roots begin to grow from the crown just below the surface, and the first tiller is about to appear.',
    check: 'Count unfolded leaves on the main shoot. Leaf and tiller codes are recorded together from here, e.g. GS13, 20 (no tillers yet).',
    inspect: 'plant',
    sources: ['opti_oat', 'ahdb_gs'],
  },
  21: {
    phase: 'tillering',
    title: 'Main shoot and 1 tiller',
    description:
      'The first tiller has appeared from the axil of the lowest leaf on the main shoot. Leaf production carries on at the same time.',
    check: 'Count shoots growing from the base of one plant: the main shoot plus each tiller with a visible leaf.',
    inspect: 'plant',
    sources: ['opti_oat', 'ahdb_gs'],
  },
  22: {
    phase: 'tillering',
    title: 'Main shoot and 2 tillers',
    description:
      'Tillers appear roughly one per leaf, each from the axil of the next leaf up the main shoot. Tillering carries on until stem extension starts; the smaller, later tillers often die off afterwards.',
    check: 'Count tillers on several plants and record the typical number. GS2x codes are recorded alongside leaf number, e.g. GS15, 22.',
    inspect: 'plant',
    sources: ['opti_oat', 'ahdb_gs'],
  },
  23: {
    phase: 'tillering',
    title: 'Main shoot and 3 tillers',
    description:
      'Shoot numbers keep rising until stem extension starts.',
    check: 'Count tillers on several plants. Ignore leaves of the main shoot; count shoots.',
    inspect: 'plant',
    sources: ['opti_oat', 'ahdb_gs'],
  },
  30: {
    phase: 'stem',
    title: 'Panicle at 1 cm (pseudostem erect)',
    description:
      'The plant stands more upright. Inside the main shoot the developing panicle (the inflorescence) has been lifted about 1 cm above the base node, but no internode has reached 1 cm yet.',
    check: 'Split the main shoot lengthways. Measure from the base of the shoot to the tip of the developing panicle: about 1 cm. No node is yet detectable above a 1 cm internode.',
    inspect: 'stem',
    sources: ['opti_oat', 'ahdb_gs'],
  },
  31: {
    phase: 'stem',
    title: 'First node detectable',
    description:
      'The first internode has extended to at least 1 cm, so the first node can be felt or seen above it. The next internode is still shorter than 2 cm.',
    check: 'Remove leaves or split the main shoot. The 1st node must be above an internode of at least 1 cm. The internode above it must be less than 2 cm.',
    inspect: 'stem',
    sources: ['opti_oat', 'ahdb_gs'],
  },
  32: {
    phase: 'stem',
    title: 'Second node detectable',
    description:
      'The second internode has reached at least 2 cm, so the second node is detectable.',
    check: 'Find the 1st node, then confirm the internode above it is at least 2 cm. The 2nd node sits on top of it. Slicing the stem with a knife is more reliable than unpicking leaves.',
    inspect: 'stem',
    sources: ['opti_oat', 'ahdb_gs'],
  },
  33: {
    phase: 'stem',
    title: 'Third node detectable',
    description:
      'A third internode has reached 2 cm. Oat stems usually have six internodes: the bottom ones are the shortest and the top one, the peduncle under the panicle, is the longest. They keep growing until final height is reached at about GS75.',
    check: 'Count up from the 1st node. Each further node must sit above an internode of at least 2 cm.',
    inspect: 'stem',
    sources: ['opti_oat', 'ahdb_gs'],
  },
  37: {
    phase: 'stem',
    title: 'Flag leaf just visible',
    description:
      'The tip of the flag leaf, the last leaf, has appeared from the sheath of leaf 2. It is still rolled. The oat flag leaf is a little smaller than leaf 2.',
    check: 'Split the shoot: no further leaves sit inside the flag leaf, only the developing panicle. Confirm the new leaf is the flag leaf, not leaf 2.',
    inspect: 'stem',
    sources: ['opti_oat', 'ahdb_gs'],
  },
  39: {
    phase: 'stem',
    title: 'Flag leaf blade all visible',
    description:
      'The flag leaf is fully unrolled and its ligule is just visible above the collar of leaf 2.',
    check: 'Look where the flag leaf blade meets its sheath. The large, membranous ligule must be visible above the leaf 2 sheath. There are no auricles to look for on oats.',
    inspect: 'collar',
    sources: ['opti_oat', 'ahdb_gs', 'ahdb_oat_id'],
  },
  41: {
    phase: 'booting',
    title: 'Flag leaf sheath extending',
    description:
      'The flag leaf sheath elongates around the panicle. Early boot. Inside, the panicle is folded up tight, its branches pressed against the central rachis.',
    check: 'Feel the flag leaf sheath. The panicle is inside, low in the sheath, and the sheath is not yet obviously swollen.',
    inspect: 'ear',
    sources: ['opti_oat', 'ahdb_gs'],
  },
  43: {
    phase: 'booting',
    title: 'Boot just visibly swollen',
    description:
      'The panicle is now large enough to swell the flag leaf sheath slightly. Mid-boot. The folded panicle is looser than a wheat ear, so the swelling is less sharply defined.',
    check: 'Look along the flag leaf sheath for a slight swelling where the panicle sits.',
    inspect: 'ear',
    sources: ['opti_oat', 'ahdb_gs'],
  },
  45: {
    phase: 'booting',
    title: 'Boot swollen',
    description:
      'The flag leaf sheath is clearly swollen by the panicle. Late boot.',
    check: 'The swollen section of the flag leaf sheath is obvious by eye. No part of the panicle has appeared.',
    inspect: 'ear',
    sources: ['opti_oat', 'ahdb_gs'],
  },
  47: {
    phase: 'booting',
    title: 'Flag leaf sheath opening',
    description:
      'The top of the flag leaf sheath begins to split open. Oats have no awns, so there is no "awns visible" stage (GS49) before the panicle appears.',
    check: 'Look at the top of the flag leaf sheath for the sheath margins parting.',
    inspect: 'ear',
    sources: ['opti_oat', 'ahdb_gs'],
  },
  51: {
    phase: 'heading',
    title: 'First spikelet of panicle just visible',
    description:
      'The tip of the panicle, the top spikelet, has appeared at the flag leaf collar. The emerging part is still folded up.',
    check: 'Look at the main shoot: the first spikelet is just visible above the flag leaf ligule.',
    inspect: 'ear',
    sources: ['opti_oat', 'ahdb_gs'],
  },
  55: {
    phase: 'heading',
    title: 'Half of panicle emerged',
    description:
      'Half of the panicle is above the flag leaf ligule. The upper whorls of branches start to spread; the lower whorls, which carry most of the spikelets, are still in the sheath. The peduncle is extending fast.',
    check: 'Estimate the proportion of the panicle above the flag leaf ligule on several main shoots.',
    inspect: 'ear',
    sources: ['opti_oat', 'ahdb_gs'],
  },
  59: {
    phase: 'heading',
    title: 'Panicle completely emerged',
    description:
      'The whole panicle is above the flag leaf ligule: the lowest whorl of branches (the first node of the rachis) is clear and the neck is showing. The branches spread and the spikelets hang on their small branches (pedicels).',
    check: 'The lowest whorl of the panicle is clear of the flag leaf sheath, with a length of bare neck below it.',
    inspect: 'ear',
    sources: ['opti_oat', 'ahdb_gs'],
  },
  61: {
    phase: 'flowering',
    title: 'Start of flowering',
    description:
      'Flowering starts in the spikelets at the top of the panicle and works downwards; in each spikelet the lower floret flowers first. Many florets pollinate themselves as they open, so only some anthers are pushed out.',
    check: 'Look at the spikelets near the top of the panicle: yellow anthers hanging out, or open a floret to see them inside.',
    inspect: 'ear',
    sources: ['opti_oat', 'ahdb_gs'],
  },
  65: {
    phase: 'flowering',
    title: 'Flowering half-way',
    description:
      'Mid-flowering, the reference point for grain development timings. The upper half of the panicle has flowered; the lower whorls, which carry most of the spikelets, are flowering now.',
    check: 'Check spikelets from the top, middle and bottom whorls: about half have flowered.',
    inspect: 'ear',
    sources: ['opti_oat', 'ahdb_gs'],
  },
  69: {
    phase: 'flowering',
    title: 'Flowering complete',
    description:
      'Flowering has finished down to the bottom whorl. Most spikelets will set two grains of unequal size, so oat grain size is bimodal. Opti-Oat benchmark: 44 grains per panicle (spring).',
    check: 'Open florets from the bottom whorl: anthers are spent and the tiny grain is starting to form.',
    inspect: 'ear',
    sources: ['opti_oat', 'ahdb_gs'],
  },
  71: {
    phase: 'grain',
    title: 'Grain watery ripe',
    description:
      'Grains are forming inside the husk (the lemma and palea, which stay on the oat grain). Contents are a clear, watery liquid.',
    check: 'Take a grain from the middle of the panicle, peel back the husk and squeeze: clear liquid.',
    inspect: 'grain',
    sources: ['opti_oat', 'ahdb_gs'],
  },
  75: {
    phase: 'grain',
    title: 'Medium milk',
    description:
      'Contents are milky. The crop reaches its final height at about this stage, as the internodes stop growing.',
    check: 'Squeeze a grain from the middle of the panicle: white, milky liquid.',
    inspect: 'grain',
    sources: ['opti_oat', 'ahdb_gs'],
  },
  77: {
    phase: 'grain',
    title: 'Late milk',
    description:
      'Contents are thick and milky. The plant is yellowing from the bottom up; the panicle and flag leaf are still largely green.',
    check: 'Squeeze a grain: thick, creamy milk.',
    inspect: 'grain',
    sources: ['opti_oat', 'ahdb_gs'],
  },
  85: {
    phase: 'grain',
    title: 'Soft dough',
    description:
      'Grain contents are soft but dry; they no longer run when squeezed. The glumes and husks turn from green to straw and the panicle droops further.',
    check: 'Squeeze a grain: contents are doughy and can be rolled between fingers; a thumbnail impression does not hold.',
    inspect: 'grain',
    sources: ['opti_oat', 'ahdb_gs'],
  },
  87: {
    phase: 'grain',
    title: 'Hard dough',
    description:
      'A thumbnail impression is held. Grain filling is essentially complete.',
    check: 'Press a thumbnail into the grain: the impression remains.',
    inspect: 'grain',
    sources: ['opti_oat', 'ahdb_gs'],
  },
  91: {
    phase: 'ripening',
    title: 'Grain hard (difficult to divide)',
    description:
      'The grain is hard and difficult to divide with a thumbnail. The crop is drying down; the panicles hang over, pale straw coloured.',
    check: 'Grain is hard to dent or divide with a thumbnail.',
    inspect: 'grain',
    sources: ['opti_oat', 'ahdb_gs'],
  },
  92: {
    phase: 'ripening',
    title: 'Grain hard, not dented by thumbnail',
    description:
      'Harvest ripe. Grain cannot be dented by a thumbnail. Ripening can take up to two weeks after hard dough before the grain is dry enough to harvest (ideally no more than 15% moisture).',
    check: 'Grain cannot be dented by a thumbnail; straw is fully ripe.',
    inspect: 'grain',
    sources: ['opti_oat', 'ahdb_gs'],
  },
};

// Build a variant's stage list from [code, t] pairs: the shared text, then
// the variant's own wording on top.
export function oatStages(times, overrides = {}) {
  return times.map(([code, t]) => ({ code, t, ...OAT_TEXT[code], ...overrides[code] }));
}

export const PHASES = [
  { id: 'germination', name: 'Germination', from: 0, to: 7.5 },
  { id: 'seedling', name: 'Leaf production', from: 7.5, to: 19.5 },
  { id: 'tillering', name: 'Tillering', from: 19.5, to: 29 },
  { id: 'stem', name: 'Stem extension', from: 29, to: 66.8 },
  { id: 'booting', name: 'Booting', from: 66.8, to: 77.1 },
  { id: 'heading', name: 'Panicle emergence', from: 77.1, to: 83.4 },
  { id: 'flowering', name: 'Flowering', from: 83.4, to: 88.9 },
  { id: 'grain', name: 'Grain filling', from: 88.9, to: 96.8 },
  { id: 'ripening', name: 'Ripening', from: 96.8, to: 100 },
];

// Variant contract shared with the header's winter/spring toggle: crops of
// one species share `species`, and `variant` says which this is.
export const CROP = {
  id: 'spring_oats',
  name: 'Spring oats',
  species: 'oats',
  speciesName: 'Oats',
  variant: 'spring',
  stageSystem: 'Zadoks (Opti-Oat)',
};

// Timeline positions after GS39, shared by both variants.
export const LATE_TIMES = [
  [41, 68.4], [43, 70.8], [45, 73.1], [47, 75.6],
  [51, 78.2], [55, 80.4], [59, 82.6],
  [61, 84.2], [65, 86.2], [69, 88.2],
  [71, 89.7], [75, 91.7], [77, 93.3], [85, 95.3], [87, 96.8], [91, 98.4], [92, 100],
];

export const STAGES = oatStages([
  [5, 0], [7, 3], [9, 6], [10, 9], [11, 12], [12, 15], [13, 18],
  [21, 21.5], [22, 26],
  [30, 31.8], [31, 39], [32, 46.4], [33, 52.6], [37, 59.6], [39, 65.2],
  ...LATE_TIMES,
], {
  9: {
    description:
      'The coleoptile has reached the soil surface. The first leaf is about to grow out through its tip. Opti-Oat benchmark: about 316 °C days from sowing to full emergence in spring.',
  },
  12: {
    description:
      'Two leaves are unfolded on the main shoot. Seen from above, oat leaves twist anticlockwise; wheat and barley leaves twist clockwise. Check the lower half of the leaf, as the tip can twist the other way. Spring oats stand fairly upright from the start.',
  },
  21: {
    description:
      'The first tiller has appeared from the axil of the lowest leaf on the main shoot. Spring oats tiller less, and for a shorter time, than winter oats: Opti-Oat benchmark about 445 shoots/m² at GS31 from 260 plants/m², under two shoots per plant on average.',
  },
  22: {
    description:
      'A well-tillered spring oat plant: tillering stops when stem extension starts, and the smaller, later tillers then often die. Opti-Oat benchmark: about 370 panicle-bearing shoots/m² at harvest, about 1.4 per plant.',
  },
  30: {
    description:
      'The plant stands upright. Inside the main shoot the developing panicle (the inflorescence) has been lifted about 1 cm above the base node, but no internode has reached 1 cm yet. Opti-Oat benchmark date for spring oats: about 15 May.',
  },
  31: {
    description:
      'The first internode has extended to at least 1 cm, so the first node can be felt or seen above it. The next internode is still shorter than 2 cm. Opti-Oat benchmark: about 22 May.',
  },
  39: {
    description:
      'The flag leaf is fully unrolled and its ligule is just visible above the collar of leaf 2. Opti-Oat benchmark: about 4 June, 46 cm to the flag leaf ligule.',
  },
  59: {
    description:
      'The whole panicle is above the flag leaf ligule: the lowest whorl of branches (the first node of the rachis) is clear and the neck is showing. The branches spread and the spikelets hang on their small branches (pedicels). Opti-Oat benchmark: about 23 June, 70 cm to the flag leaf ligule and 91 cm to the top of the panicle.',
  },
  75: {
    description:
      'Contents are milky. The crop reaches its final height at about this stage. Opti-Oat benchmark: about 10 July, 73 cm to the flag leaf ligule and 108 cm to the top of the panicle.',
  },
  87: {
    description:
      'A thumbnail impression is held. Grain filling is essentially complete. Opti-Oat benchmark: about 19 August.',
  },
  92: {
    description:
      'Harvest ripe. Grain cannot be dented by a thumbnail. Ripening can take up to two weeks after hard dough before the grain is dry enough to harvest (ideally no more than 15% moisture). Opti-Oat benchmark: harvest about 27 August.',
  },
});

// Timeline ticks that keep their label (the rest show as minor ticks).
export const TICKS = {
  major: [5, 9, 11, 13, 21, 22, 30, 31, 32, 33, 37, 39, 45, 51, 55, 59, 65, 69, 75, 87, 92],
};

// Crop-specific wording and options in the UI.
export const UI = {
  auricleLabel: 'No auricles (oats have none)',
  variant: null, // no variety toggle
  ear: 'panicle', // what the readout and labels call the inflorescence
  ripeColour: 'pale straw',
};

export const INSPECT_VIEWS = {
  plant: { label: 'Plant', hint: 'Whole plant' },
  stem: { label: 'Stem', hint: 'Main shoot split lengthways — nodes and internodes' },
  collar: { label: 'Collar', hint: 'Flag leaf ligule — oats have no auricles' },
  ear: { label: 'Panicle', hint: 'Boot, panicle emergence and flowering' },
  grain: { label: 'Grain', hint: 'Grain from the middle of the panicle' },
};
