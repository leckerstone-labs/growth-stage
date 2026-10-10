// Agronomic content for winter barley (two-row), independent of the renderer.
//
// Same AHDB cereal growth stage key (Zadoks) and the same timeline positions
// `t` as winter wheat, so the two crops line up stage for stage. The text
// differs where barley does: more leaves, large clasping auricles, long awns
// that appear before the ear (GS49), flowering mostly inside the florets,
// and ears that hang over when ripe.
//
// Benchmarks quoted are from the AHDB barley growth guide (SOURCES).
//
// STATUS: draft content for the prototype. Needs agronomist review before
// being relied on as a field reference.

export const SOURCES = {
  ahdb_gs: {
    title: 'AHDB — The growth stages of cereals',
    url: 'https://ahdb.org.uk/knowledge-library/the-growth-stages-of-cereals',
  },
  ahdb_tillering: {
    title: 'AHDB Barley growth guide — Leaf emergence and tillering (GS1–GS2)',
    url: 'https://ahdb.org.uk/knowledge-library/leaf-emergence-and-tillering-growth-stages-in-barley-gs1-g2',
  },
  ahdb_stem: {
    title: 'AHDB Barley growth guide — Stem extension and stem reserves',
    url: 'https://ahdb.org.uk/knowledge-library/measurement-of-stem-extension-and-stem-reserves-in-barley',
  },
  ahdb_ear: {
    title: 'AHDB Barley growth guide — Ear formation, grain development and ripening',
    url: 'https://ahdb.org.uk/knowledge-library/ear-formation-grain-development-and-crop-ripening-in-barley',
  },
  // Rooting depths and root architecture in the plant view (roots model).
  roots: {
    title: 'AHDB — How to promote and measure root growth and distribution in cereals',
    url: 'https://ahdb.org.uk/knowledge-library/how-to-promote-and-measure-root-growth-and-distribution-in-cereals',
  },
};

export const PHASES = [
  { id: 'germination', name: 'Germination', from: 0, to: 7.5 },
  { id: 'seedling', name: 'Leaf production', from: 7.5, to: 19.5 },
  { id: 'tillering', name: 'Tillering', from: 19.5, to: 36 },
  { id: 'stem', name: 'Stem extension', from: 36, to: 66.8 },
  { id: 'booting', name: 'Booting', from: 66.8, to: 77.1 },
  { id: 'heading', name: 'Ear emergence', from: 77.1, to: 83.4 },
  { id: 'flowering', name: 'Flowering', from: 83.4, to: 88.9 },
  { id: 'grain', name: 'Grain filling', from: 88.9, to: 96.8 },
  { id: 'ripening', name: 'Ripening', from: 96.8, to: 100 },
];

export const CROP = {
  id: 'winter_barley',
  name: 'Winter barley',
  stageSystem: 'Zadoks (AHDB)',
};

export const STAGES = [
  {
    code: 5, t: 0, phase: 'germination',
    title: 'Radicle emerged',
    description:
      'The seed has taken up water and the first root (radicle) has broken through at the embryo end. Barley seed keeps its husk (the lemma and palea), so the root pushes out past it.',
    check: 'Dig up a seed from drilling depth (typically 2–4 cm). A white root tip is showing from the embryo end of the husked seed.',
    inspect: 'plant',
    sources: ['ahdb_gs'],
  },
  {
    code: 7, t: 3, phase: 'germination',
    title: 'Coleoptile emerged from seed',
    description:
      'The coleoptile — a pointed protective sheath covering the emerging shoot — has grown out of the seed. Barley usually puts out several seminal roots at once.',
    check: 'Dig up a seed: a pale, pointed shoot (coleoptile) is growing up from the embryo end, still below the soil surface.',
    inspect: 'plant',
    sources: ['ahdb_gs'],
  },
  {
    code: 9, t: 6, phase: 'germination',
    title: 'Emergence',
    description:
      'The coleoptile has reached the soil surface. The first leaf is about to grow out through its tip.',
    check: 'Look along the row for pale coleoptile tips just breaking the soil. No green leaf blade showing yet.',
    inspect: 'plant',
    sources: ['ahdb_gs'],
  },
  {
    code: 10, t: 9, phase: 'seedling',
    title: 'First leaf through coleoptile',
    description:
      'The first true leaf has pushed out through the tip of the coleoptile. Below ground the sub-crown internode is lifting the growing point towards the surface, where the crown will form.',
    check: 'A green leaf is growing out of the pale coleoptile sheath. It is not yet unrolled and its ligule is not visible.',
    inspect: 'plant',
    sources: ['ahdb_gs'],
  },
  {
    code: 11, t: 12, phase: 'seedling',
    title: 'First leaf unfolded',
    description:
      'The first leaf has unrolled and its ligule is visible. Barley leaves are broader and a paler green than wheat leaves, and from the first leaf on they carry the large barley auricles.',
    check: 'Count leaves on the main shoot: a leaf counts as unfolded once its ligule is visible. Ignore the coleoptile.',
    inspect: 'plant',
    sources: ['ahdb_gs'],
  },
  {
    code: 12, t: 15, phase: 'seedling',
    title: '2 leaves unfolded',
    description:
      'Two leaves are unfolded on the main shoot. In autumn, winter barley leaves emerge quickly — about one every 108 °C days (the AHDB phyllochron benchmark) — then slow down over winter.',
    check: 'Count unfolded leaves (ligule visible) on the main shoot only.',
    inspect: 'plant',
    sources: ['ahdb_gs', 'ahdb_tillering'],
  },
  {
    code: 13, t: 18, phase: 'seedling',
    title: '3 leaves unfolded',
    description:
      'Three leaves are unfolded. The seed is being used up, crown roots begin to grow from the crown just below the surface, and the first tiller is about to appear.',
    check: 'Count unfolded leaves on the main shoot. Leaf and tiller codes are recorded together from here, e.g. GS13, 20 (no tillers yet).',
    inspect: 'plant',
    sources: ['ahdb_gs', 'ahdb_tillering'],
  },
  {
    code: 21, t: 21, phase: 'tillering',
    title: 'Main shoot and 1 tiller',
    description:
      'The first tiller has appeared from the axil of the lowest leaf on the main shoot. Leaf production continues at the same time: this plant also has about 3 leaves unfolded.',
    check: 'Count shoots growing from the base of one plant. Count the main shoot plus each tiller with a visible leaf.',
    inspect: 'plant',
    sources: ['ahdb_gs', 'ahdb_tillering'],
  },
  {
    code: 22, t: 24.9, phase: 'tillering',
    title: 'Main shoot and 2 tillers',
    description:
      'Tillers appear roughly one per leaf, each from the axil of the next leaf up the main shoot. Barley tillers freely; the plant is prostrate to semi-prostrate over winter.',
    check: 'Count tillers on several plants and record the typical number. GS2x codes are recorded alongside leaf number, e.g. GS14, 22.',
    inspect: 'plant',
    sources: ['ahdb_gs', 'ahdb_tillering'],
  },
  {
    code: 23, t: 28.9, phase: 'tillering',
    title: 'Main shoot and 3 tillers',
    description:
      'Shoot numbers keep rising until stem extension starts. AHDB benchmark: about 1,180 shoots/m² by GS30, falling to about 775 ears/m² (3 shoots per plant) at harvest.',
    check: 'Count tillers on several plants. Ignore leaves of the main shoot; count shoots.',
    inspect: 'plant',
    sources: ['ahdb_gs', 'ahdb_tillering'],
  },
  {
    code: 24, t: 32.9, phase: 'tillering',
    title: 'Main shoot and 4 tillers',
    description:
      'Late tillering. Shoot number peaks around the start of stem extension. The main shoot has many leaves by now: winter barley averages about 14 on the main stem (AHDB), and the oldest are already dying back.',
    check: 'Count tillers, then start checking for GS30 by splitting the main shoot.',
    inspect: 'plant',
    sources: ['ahdb_gs', 'ahdb_tillering'],
  },
  {
    code: 30, t: 36.8, phase: 'stem',
    title: 'Ear at 1 cm (pseudostem erect)',
    description:
      'The plant becomes more upright. Inside the main shoot, the developing ear has been lifted about 1 cm above the base node, but the first internode has not yet reached 1 cm. Leaf 4 (counting down from the future flag leaf) is emerging. Winter barley usually reaches GS30 earlier in spring than wheat.',
    check: 'Split the main shoot lengthways. Measure from the base of the shoot to the tip of the developing ear: about 1 cm. No node is yet detectable above a 1 cm internode.',
    inspect: 'stem',
    sources: ['ahdb_gs'],
  },
  {
    code: 31, t: 43.1, phase: 'stem',
    title: 'First node detectable',
    description:
      'The first internode has extended to at least 1 cm, so the first node can be felt or seen above it. The next internode is still shorter than 2 cm. Leaf 4 is well or fully emerged; leaf 3 is emerging.',
    check: 'Remove leaves or split the main shoot. The 1st node must be above an internode of at least 1 cm. The internode above it must be less than 2 cm.',
    inspect: 'stem',
    sources: ['ahdb_gs', 'ahdb_stem'],
  },
  {
    code: 32, t: 49.4, phase: 'stem',
    title: 'Second node detectable',
    description:
      'The second internode has reached at least 2 cm, so the second node is detectable. Leaf 3 is fully emerged; leaf 2 is emerging.',
    check: 'Find the 1st node, then confirm the internode above it is at least 2 cm. The 2nd node sits on top of it. Slice the stem with a knife rather than unpicking leaves — it is easy to miss the small flag leaf and miscount.',
    inspect: 'stem',
    sources: ['ahdb_gs'],
  },
  {
    code: 33, t: 54.2, phase: 'stem',
    title: 'Third node detectable',
    description:
      'A third internode has reached 2 cm. Leaf 2 is emerging. Barley stems extend over five internodes, with four nodes in the extended stem (AHDB benchmark).',
    check: 'Count up from the 1st node. Each further node must sit above an internode of at least 2 cm.',
    inspect: 'stem',
    sources: ['ahdb_gs', 'ahdb_stem'],
  },
  {
    code: 37, t: 60.5, phase: 'stem',
    title: 'Flag leaf just visible',
    description:
      'The tip of the flag leaf — the last leaf — has appeared from the sheath of leaf 2. It is still rolled. The barley flag leaf is noticeably smaller than leaf 2.',
    check: 'Split the shoot: no further leaves sit inside the flag leaf, only the developing ear. Confirm the new leaf is the flag leaf, not leaf 2.',
    inspect: 'stem',
    sources: ['ahdb_gs'],
  },
  {
    code: 39, t: 65.2, phase: 'stem',
    title: 'Flag leaf blade fully visible',
    description:
      'The flag leaf is fully unrolled and its ligule is just visible above the collar of leaf 2. The crop is nearly half its final height (AHDB).',
    check: 'Look where the flag leaf blade meets its sheath. The ligule and the large, hairless barley auricles — which wrap right round the stem and cross over — must be visible above the leaf 2 sheath.',
    inspect: 'collar',
    sources: ['ahdb_gs', 'ahdb_stem'],
  },
  {
    code: 41, t: 68.4, phase: 'booting',
    title: 'Flag leaf sheath extending',
    description:
      'The flag leaf sheath elongates around the ear. Early boot. The awns are growing inside it, above the ear.',
    check: 'Feel the flag leaf sheath. The ear is inside, low in the sheath, and the sheath is not yet obviously swollen.',
    inspect: 'ear',
    sources: ['ahdb_gs'],
  },
  {
    code: 43, t: 70.8, phase: 'booting',
    title: 'Boot just visibly swollen',
    description:
      'The ear is now large enough to swell the flag leaf sheath slightly. Mid-boot. The awns fill the sheath above the ear.',
    check: 'Look along the flag leaf sheath for a slight swelling where the ear sits.',
    inspect: 'ear',
    sources: ['ahdb_gs'],
  },
  {
    code: 45, t: 73.1, phase: 'booting',
    title: 'Boot swollen',
    description:
      'The flag leaf sheath is clearly swollen by the ear. Late boot. In barley, flowering can begin inside the boot from about now.',
    check: 'The swollen section of the flag leaf sheath is obvious by eye. Neither the awns nor the ear have appeared.',
    inspect: 'ear',
    sources: ['ahdb_gs'],
  },
  {
    code: 47, t: 75.1, phase: 'booting',
    title: 'Flag leaf sheath opening',
    description:
      'The top of the flag leaf sheath begins to split open as the awns push up.',
    check: 'Look at the top of the flag leaf sheath for the sheath margins parting. Awn tips are about to show.',
    inspect: 'ear',
    sources: ['ahdb_gs'],
  },
  {
    code: 49, t: 76.3, phase: 'booting',
    title: 'First awns visible',
    description:
      'The awn tips appear above the flag leaf ligule while the ear is still inside the sheath. In barley this is a distinct, easy-to-see stage, unlike in most UK wheats.',
    check: 'Look above the flag leaf collar of the main shoot: the tips of the awns are just showing. The ear itself is not yet visible.',
    inspect: 'ear',
    sources: ['ahdb_gs'],
  },
  {
    code: 51, t: 77.9, phase: 'heading',
    title: 'First spikelet of ear just visible',
    description:
      'The tip of the ear has appeared above the flag leaf ligule, inside its bundle of awns.',
    check: 'Look at the main shoot: the first spikelet is just visible above the flag leaf collar, below the awns.',
    inspect: 'ear',
    sources: ['ahdb_gs'],
  },
  {
    code: 55, t: 80.2, phase: 'heading',
    title: 'Half of ear emerged',
    description:
      'Half of the ear has emerged above the flag leaf ligule. The peduncle (top internode) is extending rapidly. Much of the flowering has already happened inside the florets.',
    check: 'Estimate the proportion of the ear above the flag leaf collar on several main shoots.',
    inspect: 'ear',
    sources: ['ahdb_gs'],
  },
  {
    code: 59, t: 82.6, phase: 'heading',
    title: 'Ear completely emerged',
    description:
      'The whole ear is above the flag leaf ligule. AHDB benchmark: about 20 days from flag leaf emergence to ear emergence. Two-row ears carry about 24 grains (AHDB).',
    check: 'The base of the ear (the lowest spikelet) is clear of the flag leaf sheath.',
    inspect: 'ear',
    sources: ['ahdb_gs', 'ahdb_ear'],
  },
  {
    code: 61, t: 84.2, phase: 'flowering',
    title: 'Start of flowering',
    description:
      'Barley flowers mostly inside closed florets, around the time the awns and ear emerge, so anthers are seldom seen outside the ear. The flowering codes are usually judged from ear emergence rather than by looking for anthers.',
    check: 'Open a floret in the middle of the ear: the anthers inside are yellow and shedding pollen, or already spent.',
    inspect: 'ear',
    sources: ['ahdb_gs', 'ahdb_ear'],
  },
  {
    code: 65, t: 86.2, phase: 'flowering',
    title: 'Flowering half-way',
    description:
      'Mid-flowering, the reference point for grain development timings. In barley it is hard to see from outside; most florets have already been pollinated within the closed lemma and palea.',
    check: 'Open florets from the middle and ends of the ear: about half have spent anthers.',
    inspect: 'ear',
    sources: ['ahdb_gs', 'ahdb_ear'],
  },
  {
    code: 69, t: 88.2, phase: 'flowering',
    title: 'Flowering complete',
    description:
      'Flowering is finished in all florets. Only in the two fertile rows (the central spikelet at each rachis node) will grains form; the small side spikelets are sterile in two-row barley.',
    check: 'Open florets: anthers are spent and the tiny grain is starting to form.',
    inspect: 'ear',
    sources: ['ahdb_gs', 'ahdb_ear'],
  },
  {
    code: 71, t: 89.7, phase: 'grain',
    title: 'Grain watery ripe',
    description:
      'Grains are forming. Contents are a clear, watery liquid. AHDB benchmark: grain filling lasts about 40 days in winter barley.',
    check: 'Squeeze a grain from the middle of the ear: clear liquid.',
    inspect: 'grain',
    sources: ['ahdb_gs', 'ahdb_ear'],
  },
  {
    code: 75, t: 91.7, phase: 'grain',
    title: 'Medium milk',
    description:
      'Grains have reached their final length. Contents are milky. The heavier ears begin to bend over.',
    check: 'Squeeze a grain from the middle of the ear: white, milky liquid.',
    inspect: 'grain',
    sources: ['ahdb_gs', 'ahdb_ear'],
  },
  {
    code: 77, t: 93.3, phase: 'grain',
    title: 'Late milk',
    description:
      'Contents are thick and milky. The plant is yellowing from the bottom up.',
    check: 'Squeeze a grain: thick, creamy milk.',
    inspect: 'grain',
    sources: ['ahdb_gs'],
  },
  {
    code: 85, t: 95.3, phase: 'grain',
    title: 'Soft dough',
    description:
      'Grain contents are soft but dry — they no longer run when squeezed.',
    check: 'Squeeze a grain: contents are doughy and can be rolled between fingers; a thumbnail impression does not hold.',
    inspect: 'grain',
    sources: ['ahdb_gs'],
  },
  {
    code: 87, t: 96.8, phase: 'grain',
    title: 'Hard dough',
    description:
      'A thumbnail impression is held. Grain filling is essentially complete; grain moisture has fallen from about 70% to 45% (AHDB).',
    check: 'Press a thumbnail into the grain: the impression remains.',
    inspect: 'grain',
    sources: ['ahdb_gs', 'ahdb_ear'],
  },
  {
    code: 89, t: 98.4, phase: 'ripening',
    title: 'Grain hard',
    description:
      'The grain is hard and difficult to divide with a thumbnail. The crop is drying down; ears hang over on bent necks.',
    check: 'Grain is hard to dent with a thumbnail.',
    inspect: 'grain',
    sources: ['ahdb_gs'],
  },
  {
    code: 92, t: 100, phase: 'ripening',
    title: 'Grain hard, not dented by thumbnail',
    description:
      'Harvest ripe. Grain cannot be dented by a thumbnail. AHDB benchmark: ripening takes about 20 days, drying from about 45% to 20% moisture. Ripe ears hang down and can snap off (necking) if harvest is delayed.',
    check: 'Grain cannot be dented by a thumbnail; straw is fully ripe and the ears hang over.',
    inspect: 'grain',
    sources: ['ahdb_gs', 'ahdb_ear'],
  },
];

// Timeline ticks that keep their label (the rest show as minor ticks).
export const TICKS = {
  major: [5, 9, 11, 13, 21, 23, 30, 31, 32, 33, 37, 39, 45, 49, 55, 59, 65, 75, 87, 92],
};

// Crop-specific wording and options in the UI.
export const UI = {
  auricleLabel: 'Auricles (large, hairless, clasping)',
  variant: null, // two-row only: no variety toggle
  // Flowering readout: barley flowers inside closed florets, so no anthers.
  flowering: { during: 'inside the florets (anthers seldom seen)', after: 'complete' },
};

export const INSPECT_VIEWS = {
  plant: { label: 'Plant', hint: 'Whole plant' },
  stem: { label: 'Stem', hint: 'Main shoot split lengthways — nodes and internodes' },
  collar: { label: 'Collar', hint: 'Flag leaf ligule and clasping auricles' },
  ear: { label: 'Ear', hint: 'Boot, awns and ear emergence' },
  grain: { label: 'Grain', hint: 'Grain from the middle of the ear' },
};
