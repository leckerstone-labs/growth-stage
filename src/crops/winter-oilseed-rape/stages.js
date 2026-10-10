// Agronomic content for winter oilseed rape, independent of the renderer.
//
// AHDB uses the BBCH two-digit key for oilseed rape (GS00–GS99), so codes
// read like the cereal ones but mean different things: GS30 is the rosette,
// GS51 green bud, GS59 yellow bud, GS65 full flower. The principal stages
// overlap in the field (a plant can be extending its stem, showing buds and
// flowering at once); AHDB's rule is to record the most advanced stage, and
// the timeline follows that. Side-shoot stages (GS2x) and the internode
// count (GS3x) are shown as readouts rather than timeline checkpoints.
//
// Benchmarks quoted are from the AHDB oilseed rape growth guide (SOURCES).
//
// STATUS: draft content for the prototype. Needs agronomist review before
// being relied on as a field reference.

export const SOURCES = {
  ahdb_gs: {
    title: 'AHDB — The growth stages of oilseed rape',
    url: 'https://ahdb.org.uk/knowledge-library/the-growth-stages-of-oilseed-rape',
  },
  ahdb_early: {
    title: 'AHDB OSR growth guide — Early growth stages (GS0–GS2)',
    url: 'https://ahdb.org.uk/knowledge-library/early-growth-stages-of-oilseed-rape-gs0-gs2',
  },
  ahdb_flower: {
    title: 'AHDB OSR growth guide — Stem elongation and flowering (GS3–GS6)',
    url: 'https://ahdb.org.uk/knowledge-library/stem-elongation-and-flowering-in-oilseed-rape-gs3-gs6',
  },
  ahdb_seed: {
    title: 'AHDB OSR growth guide — Seed development (GS7–GS8)',
    url: 'https://ahdb.org.uk/knowledge-library/seed-development-in-oilseed-rape-gs7-gs8',
  },
  ahdb_harvest: {
    title: 'AHDB OSR growth guide — Senescence and harvest (GS9)',
    url: 'https://ahdb.org.uk/knowledge-library/senescence-and-harvest-of-oilseed-rape-gs9',
  },
  // Root length density with depth (plant view roots). The rooting depths
  // themselves are illustrative: AHDB gives no OSR depth benchmark.
  roots: {
    title: 'AHDB project PR402 — Managing oilseed rape to balance root and canopy growth',
    url: 'https://ahdb.org.uk/management-of-oilseed-rape-to-balance-root-and-canopy-growth',
  },
};

export const PHASES = [
  { id: 'germination', name: 'Germination', from: 0, to: 7.5 },
  { id: 'leaves', name: 'Leaf production', from: 7.5, to: 33 },
  { id: 'rosette', name: 'Rosette', from: 33, to: 38.5 },
  { id: 'buds', name: 'Stem extension & buds', from: 38.5, to: 59 },
  { id: 'flowering', name: 'Flowering', from: 59, to: 77.5 },
  { id: 'pods', name: 'Pod development', from: 77.5, to: 88 },
  { id: 'ripening', name: 'Ripening', from: 88, to: 100 },
];

export const CROP = {
  id: 'winter_oilseed_rape',
  name: 'Winter oilseed rape',
  species: 'oilseed_rape',
  speciesName: 'Oilseed rape',
  variant: 'winter',
  stageSystem: 'BBCH (AHDB)',
  family: 'brassica',
};

export const STAGES = [
  {
    code: 5, t: 0, phase: 'germination',
    title: 'Radicle emerged',
    description:
      'The small, round seed has taken up water and the first root (radicle) has broken through the seed coat. It grows straight down and becomes the taproot.',
    check: 'Dig up a seed from drilling depth (usually 1–2 cm). A white root tip is showing through the dark seed coat.',
    inspect: 'plant',
    sources: ['ahdb_gs', 'ahdb_early'],
  },
  {
    code: 7, t: 3, phase: 'germination',
    title: 'Hypocotyl and cotyledons out of the seed',
    description:
      'The hypocotyl (the seedling stem below the seed leaves) has grown out of the seed. It grows up as a hook, pulling the two folded cotyledons (seed leaves) out of the seed coat behind it.',
    check: 'Dig up a seed: a pale, hooked stem is growing upwards from the seed, still below the soil surface.',
    inspect: 'plant',
    sources: ['ahdb_gs', 'ahdb_early'],
  },
  {
    code: 9, t: 6, phase: 'germination',
    title: 'Emergence',
    description:
      'The hypocotyl hook breaks through the soil surface, lifting the cotyledons with it. Oilseed rape is a dicot: the seed leaves are carried above ground (AHDB: emergence begins about five days after sowing in good conditions).',
    check: 'Look along the row for pale hooks or closed seed leaves just breaking the soil surface.',
    inspect: 'plant',
    sources: ['ahdb_gs', 'ahdb_early'],
  },
  {
    code: 10, t: 9, phase: 'leaves',
    title: 'Cotyledons completely unfolded',
    description:
      'The hypocotyl has straightened and both cotyledons have opened out flat and turned green. They are kidney-shaped with a notch at the tip, on short stalks. The first true leaf is forming between them.',
    check: 'Both seed leaves are open and green. No true leaf is unfolded yet. Cotyledons are not counted as leaves.',
    inspect: 'leaves',
    sources: ['ahdb_gs', 'ahdb_early'],
  },
  {
    code: 11, t: 12, phase: 'leaves',
    title: 'First leaf unfolded',
    description:
      'The first true leaf has unfolded from the centre of the plant. True leaves are stalked (petiolate), with a rounded blade and a wavy, toothed edge, unlike the notched cotyledons.',
    check: 'Count true leaves unfolded on the main stem, ignoring the two cotyledons.',
    inspect: 'leaves',
    sources: ['ahdb_gs', 'ahdb_early'],
  },
  {
    code: 12, t: 15, phase: 'leaves',
    title: '2 leaves unfolded',
    description:
      'Two true leaves are unfolded. Each new leaf comes from the centre of the plant, turned about two-fifths of the way round from the one before, so the leaves form a spiral rosette.',
    check: 'Count unfolded true leaves on the main stem only. A leaf counts once it has opened out from the centre.',
    inspect: 'leaves',
    sources: ['ahdb_gs', 'ahdb_early'],
  },
  {
    code: 13, t: 18, phase: 'leaves',
    title: '3 leaves unfolded',
    description:
      'Three true leaves are unfolded. Leaves now have the typical lobed shape: a large end lobe and smaller side lobes along the stalk. The seed leaves are starting to yellow.',
    check: 'Count unfolded true leaves. Ignore the cotyledons, even while they are still green.',
    inspect: 'leaves',
    sources: ['ahdb_gs', 'ahdb_early'],
  },
  {
    code: 14, t: 21, phase: 'leaves',
    title: '4 leaves unfolded',
    description:
      'Four true leaves are unfolded. The taproot is growing down quickly and the top of the root and hypocotyl (the root collar) starts to thicken.',
    check: 'Count unfolded true leaves on several plants and record the typical number.',
    inspect: 'leaves',
    sources: ['ahdb_gs', 'ahdb_early'],
  },
  {
    code: 16, t: 25, phase: 'leaves',
    title: '6 leaves unfolded',
    description:
      'Six true leaves are unfolded and the plant is a spreading rosette. The cotyledons have died off. The oldest leaves are the largest; the youngest stand more upright in the centre.',
    check: 'Count leaves including any lower leaves that have died: leaf scars on the short stem show where they were.',
    inspect: 'leaves',
    sources: ['ahdb_gs', 'ahdb_early'],
  },
  {
    code: 19, t: 30, phase: 'leaves',
    title: '9 or more leaves unfolded',
    description:
      'Nine or more true leaves have unfolded. The oldest leaves are dying back, so fewer are green than have been produced. The taproot and root collar keep thickening into the winter.',
    check: 'Count living leaves plus the scars of lost ones on the main stem. From nine leaves on, the stage is GS19.',
    inspect: 'leaves',
    sources: ['ahdb_gs', 'ahdb_early'],
  },
  {
    code: 30, t: 36, phase: 'rosette',
    title: 'Rosette (no extended internodes)',
    description:
      'Over winter the plant stays a flat rosette: the leaves all come from a short crown at soil level and the stem has not started to extend. Old leaves die off in cold weather and new ones come from the centre. The flower buds are forming deep in the centre.',
    check: 'The crop is short. Look at the crown: the leaves all arise at ground level, with no length of stem between them.',
    inspect: 'stem',
    sources: ['ahdb_gs', 'ahdb_flower'],
  },
  {
    code: 50, t: 41, phase: 'buds',
    title: 'Flower buds present, enclosed by leaves',
    description:
      'In early spring the stem starts to extend and the main flower bud cluster is present at the top of the stem, still hidden by the youngest leaves folded over it.',
    check: 'Part the youngest leaves in the centre of the plant: a tight cluster of small green buds is inside.',
    inspect: 'buds',
    sources: ['ahdb_gs', 'ahdb_flower'],
  },
  {
    code: 51, t: 44, phase: 'buds',
    title: 'Green bud',
    description:
      'The bud cluster is now visible from above the crop as the young leaves around it open out. The stem is extending, with the first internodes lengthening.',
    check: 'Look down into the crop: green flower buds can be seen in the centre of the plants without parting the leaves.',
    inspect: 'buds',
    sources: ['ahdb_gs', 'ahdb_flower'],
  },
  {
    code: 53, t: 48, phase: 'buds',
    title: 'Flower buds raised above the youngest leaves',
    description:
      'Stem extension lifts the bud cluster clear of the youngest leaves. Upper stem leaves are stalkless and clasp the stem with lobes at their base.',
    check: 'The bud cluster sits above the tips of the youngest leaves around it.',
    inspect: 'buds',
    sources: ['ahdb_gs', 'ahdb_flower'],
  },
  {
    code: 55, t: 51.5, phase: 'buds',
    title: 'Individual buds visible (main raceme)',
    description:
      'The buds on the main raceme have separated and can be seen individually, still closed and green. The stem is extending quickly.',
    check: 'Look at the top of the main stem: single buds on short stalks can be told apart. Side branches have no visible buds yet.',
    inspect: 'buds',
    sources: ['ahdb_gs', 'ahdb_flower'],
  },
  {
    code: 57, t: 54.5, phase: 'buds',
    title: 'Individual buds visible (side racemes)',
    description:
      'Side branches have grown from the axils of the upper stem leaves, and the buds on their racemes are now individually visible too.',
    check: 'Look at the side branches below the main raceme: separate closed buds are visible at their tips.',
    inspect: 'buds',
    sources: ['ahdb_gs', 'ahdb_flower'],
  },
  {
    code: 59, t: 57.5, phase: 'buds',
    title: 'Yellow bud',
    description:
      'The first petals are visible inside the closed buds, so the lowest buds of the main raceme look yellow. No flower is open yet.',
    check: 'The lowest buds on the main raceme show yellow at the tip but are still closed.',
    inspect: 'buds',
    sources: ['ahdb_gs', 'ahdb_flower'],
  },
  {
    code: 60, t: 60.5, phase: 'flowering',
    title: 'First flowers open',
    description:
      'The first flowers have opened at the bottom of the main raceme. Each has four yellow petals in a cross. Flowers always open from the lowest bud upwards.',
    check: 'Find the first open flowers on the main raceme, at the base of the bud cluster.',
    inspect: 'buds',
    sources: ['ahdb_gs', 'ahdb_flower'],
  },
  {
    code: 61, t: 63, phase: 'flowering',
    title: '10% of flowers on main raceme open',
    description:
      'About a tenth of the flowers on the main raceme are open and the raceme is starting to lengthen. The open flowers ring the cluster of buds still to open.',
    check: 'Estimate the share of flowers on the main raceme that are open or have opened, counting from the bottom.',
    inspect: 'buds',
    sources: ['ahdb_gs', 'ahdb_flower'],
  },
  {
    code: 63, t: 66, phase: 'flowering',
    title: '30% of flowers on main raceme open',
    description:
      'A third of the main raceme has flowered. The side racemes are coming into flower too, so the crop turns yellow.',
    check: 'Count up the main raceme: the lowest third of the flowers have opened.',
    inspect: 'buds',
    sources: ['ahdb_gs', 'ahdb_flower'],
  },
  {
    code: 65, t: 69, phase: 'flowering',
    title: 'Full flower',
    description:
      'Half of the flowers on the main raceme are open and the older petals are starting to fall. The lowest flowers have already set small green pods.',
    check: 'Count up the main raceme: about 50% of flowers have opened. Petals are dropping from the lowest flowers.',
    inspect: 'buds',
    sources: ['ahdb_gs', 'ahdb_flower'],
  },
  {
    code: 67, t: 72.5, phase: 'flowering',
    title: 'Flowering declining',
    description:
      'Most petals have fallen. Flowers are still opening near the top of the racemes while pods lengthen below.',
    check: 'Most flowers on the main raceme have lost their petals; only the top of the raceme is still in flower.',
    inspect: 'buds',
    sources: ['ahdb_gs'],
  },
  {
    code: 69, t: 76, phase: 'flowering',
    title: 'End of flowering',
    description:
      'Flowering has finished. The racemes are now lines of green pods, with the youngest still short at the top.',
    check: 'No open flowers remain on the main raceme.',
    inspect: 'buds',
    sources: ['ahdb_gs'],
  },
  {
    code: 71, t: 79, phase: 'pods',
    title: '10% of pods at final size',
    description:
      'Pods develop from the pollinated flowers. A tenth of them, at the bottom of the main raceme, have reached their final size. Seed filling lasts about 40 days (AHDB).',
    check: 'Compare pods up the main raceme: the lowest are full length; most are still growing.',
    inspect: 'pods',
    sources: ['ahdb_gs', 'ahdb_seed'],
  },
  {
    code: 75, t: 83, phase: 'pods',
    title: '50% of pods at final size',
    description:
      'Half of the pods have reached final size. Inside each pod a central wall makes two compartments, with a row of seeds in each. The seeds are still expanding.',
    check: 'Open a pod from the middle of the main raceme: the seeds are pale, soft and not yet filling the cavity.',
    inspect: 'pods',
    sources: ['ahdb_gs', 'ahdb_seed'],
  },
  {
    code: 79, t: 87, phase: 'pods',
    title: 'Nearly all pods at final size',
    description:
      'More than 90% of pods have reached final size. The leaves are yellowing and dropping. AHDB benchmark: 6,000–8,000 pods/m² and at least 100,000 seeds/m² for a 5 t/ha crop.',
    check: 'Pods all the way up the racemes are full length.',
    inspect: 'pods',
    sources: ['ahdb_gs', 'ahdb_seed'],
  },
  {
    code: 80, t: 89, phase: 'ripening',
    title: 'Seeds green, filling the pod cavity',
    description:
      'Ripening begins. The seeds have expanded to fill the pod and are soft and green.',
    check: 'Open pods from the middle of the main raceme: seeds are green and fill the cavity.',
    inspect: 'seed',
    sources: ['ahdb_gs', 'ahdb_seed'],
  },
  {
    code: 81, t: 91, phase: 'ripening',
    title: '10% of pods ripe',
    description:
      'Seeds turn brown and then black and hard as they ripen, starting in the lowest pods. A tenth of the pods have ripe seed. Pod walls are turning from green to yellow.',
    check: 'Open pods from the bottom, middle and top of the main raceme and look at seed colour.',
    inspect: 'seed',
    sources: ['ahdb_gs', 'ahdb_seed'],
  },
  {
    code: 83, t: 93, phase: 'ripening',
    title: '30% of pods ripe',
    description:
      'About a third of the pods have ripe, dark seed. AHDB swathing guide (about six weeks after flowering ends): seeds in the top third green to green-brown, the middle third green-brown, the bottom third dark brown to black.',
    check: 'Check seed colour in the top, middle and bottom thirds of the plant against the swathing guide.',
    inspect: 'seed',
    sources: ['ahdb_gs', 'ahdb_harvest'],
  },
  {
    code: 85, t: 95, phase: 'ripening',
    title: '50% of pods ripe',
    description:
      'Half the pods have dark, hard seed. Stems are turning yellow and most leaves have gone.',
    check: 'Open pods from the middle of the main raceme: the seeds are dark brown to black.',
    inspect: 'seed',
    sources: ['ahdb_gs', 'ahdb_seed'],
  },
  {
    code: 87, t: 97.5, phase: 'ripening',
    title: '70% of pods ripe',
    description:
      'Most pods are ripe and straw-coloured. Ripe pods shatter easily, spilling seed, if knocked or left too long.',
    check: 'Most seeds are black and hard. Pods rattle when the plant is shaken.',
    inspect: 'seed',
    sources: ['ahdb_gs', 'ahdb_harvest'],
  },
  {
    code: 89, t: 100, phase: 'ripening',
    title: 'Fully ripe',
    description:
      'Nearly all (more than 90%) pods are ripe, with dark, hard seed (AHDB). The crop is then left to dry (GS97, plant dead and dry) until it is ready to harvest (GS99).',
    check: 'Seeds in pods throughout the plant are black and hard and cannot be dented with a thumbnail.',
    inspect: 'seed',
    sources: ['ahdb_gs', 'ahdb_seed', 'ahdb_harvest'],
  },
];

// Timeline ticks that keep their label (the rest show as minor ticks).
export const TICKS = {
  major: [5, 9, 10, 11, 12, 13, 14, 16, 19, 30, 50, 51, 53, 55, 57, 59, 60, 61, 63, 65, 67, 69, 71, 75, 79, 80, 81, 83, 85, 87, 89],
};

// Crop-specific wording and options in the UI.
export const UI = {
  variant: null, // no variety toggle
};

export const INSPECT_VIEWS = {
  plant: { label: 'Plant', hint: 'Whole plant' },
  leaves: { label: 'Leaves', hint: 'From above: count the true leaves' },
  stem: { label: 'Stem', hint: 'Main stem with leaves trimmed: extended internodes' },
  buds: { label: 'Buds', hint: 'Top of the main stem: buds and flowers' },
  pods: { label: 'Pods', hint: 'Main raceme: pod development' },
  seed: { label: 'Seed', hint: 'Pod from the middle of the main raceme, opened' },
};
