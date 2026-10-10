// Agronomic content for spring field beans (Vicia faba), independent of the
// renderer. Winter beans (src/crops/winter-beans/stages.js) reuse this text
// and override what differs.
//
// There is no AHDB growth-stage key for field beans. UK practice is the BBCH
// faba bean key (Weber & Bleiholder 1990; Lancashire et al. 1991), as
// reproduced by Defra/APHA in the field bean VCU protocol and by ADAS/PGRO
// Bean YEN (SOURCES). Like oilseed rape, the principal stages overlap in the
// field (the stem extends while leaves unfold; flowering continues at the
// top while pods form lower down), and the rule is to record the most
// advanced stage. The timeline follows that: leaf count (GS1x) gives way to
// the bud stages (GS5x) once buds show, and side shoots (GS2x, spring
// beans) and extended internodes (GS3x) are readouts, not checkpoints.
//
// Numbers marked "in this model" are illustrative estimates (first flowering
// node, pods per node, sizes): no UK figures were found for them.
//
// STATUS: draft content. Needs agronomist review before being relied on as a
// field reference.

export const SOURCES = {
  bbch_defra: {
    title: 'Defra/APHA — Field bean VCU procedures, appendices (BBCH growth stages of faba bean)',
    url: 'https://assets.publishing.service.gov.uk/media/68877e672f4f3f3c34bbec96/Field_Bean_Procedures_Harvest_2026_appendices.pdf',
  },
  bean_yen: {
    title: 'ADAS/PGRO Bean YEN — Observations guidelines (growth stages, nodulation)',
    url: 'https://yen.adas.co.uk/sites/default/files/2023-04/Bean%20YEN%20Observations%20Guidelines%202023.pdf',
  },
  saskpulse: {
    title: 'Saskatchewan Pulse Growers — Faba bean growth staging guide',
    url: 'https://saskpulse.com/resources/faba-bean-growth-staging-guide-2/',
  },
  winter_spring: {
    title: 'Link et al. (2010) — Winter hardiness in faba bean: winter and spring types compared',
    url: 'https://doi.org/10.1016/j.fcr.2008.08.004',
  },
  // Rooting depth and nodules (plant view).
  roots: {
    title: 'AgroAtlas — Vicia faba (taproot, rooting depth)',
    url: 'https://agroatlas.ru/en/content/cultural/Vicia_faba_major_K/index.html',
  },
};

const B = ['bbch_defra', 'bean_yen'];

// Stage text, keyed by BBCH code. `t` (timeline position) and `phase` are
// set per variant (stageList below).
export const TEXT = {
  5: {
    title: 'Radicle emerged',
    description:
      'The large seed has swollen with water and the radicle (first root) has broken through the seed coat beside the hilum, the dark scar where the seed was attached in the pod. It grows straight down and becomes the taproot.',
    check: 'Dig up seeds at drilling depth (spring beans are usually drilled 7–10 cm deep). A white root tip shows beside the hilum.',
    inspect: 'plant',
    sources: B,
  },
  7: {
    title: 'Shoot emerged from the seed',
    description:
      'The shoot (plumule) has grown out of the seed. Field beans germinate hypogeally: the two cotyledons stay inside the seed coat below ground and feed the seedling. The shoot grows up with its tip bent over in a hook, which protects the growing point.',
    check: 'Dig up a seed: a pale, hooked shoot is growing up from it, still below the surface. The seed stays where it was sown.',
    inspect: 'plant',
    sources: [...B, 'saskpulse'],
  },
  9: {
    title: 'Emergence',
    description:
      'The hooked shoot breaks through the soil surface, then straightens and turns green. Nothing comes up with it: unlike oilseed rape, the seed and its cotyledons stay in the soil.',
    check: 'Look along the rows for pale hooks or green shoot tips just through the surface.',
    inspect: 'plant',
    sources: [...B, 'saskpulse'],
  },
  10: {
    title: 'Pair of scale leaves visible',
    description:
      'The shoot has straightened. Its first two nodes carry only small, pale scale leaves at or just below the soil surface, not true leaves. They are not counted as leaves and may be eaten or lost.',
    check: 'Find the two small scale leaves at the base of the shoot. The first true leaf is still folded at the tip.',
    inspect: 'nodes',
    sources: [...B, 'saskpulse'],
  },
  11: {
    title: 'First leaf unfolded',
    description:
      'The first true leaf, at the third node, has unfolded: a single pair of oval, grey-green leaflets on a short stalk, with two small stipules where it joins the stem. Field bean leaves have no tendrils.',
    check: 'Count unfolded true leaves on the main stem, not the scale leaves. A leaf counts once its leaflets have opened out.',
    inspect: 'nodes',
    sources: [...B, 'saskpulse'],
  },
  12: {
    title: '2 leaves unfolded',
    description:
      'Two leaves are unfolded. Leaves come alternately on opposite sides of the stem, so a young plant looks flat from one side. The first leaves have two leaflets each; the stem is square and hollow.',
    check: 'Count unfolded true leaves on the main stem only. Roll the stem between finger and thumb: it is square.',
    inspect: 'nodes',
    sources: [...B, 'saskpulse'],
  },
  13: {
    title: '3 leaves unfolded',
    description:
      'Three leaves are unfolded. The stem lengthens between the leaves as each one grows: BBCH stem elongation (GS3x) runs alongside, the first internode being the one from the upper scale leaf to leaf 1. Nitrogen-fixing nodules start to form on the roots.',
    check: 'Count unfolded leaves. Dig up a plant with plenty of soil: small pink-brown nodules on the upper roots show that nitrogen fixation has started.',
    inspect: 'nodes',
    sources: [...B, 'saskpulse'],
  },
  14: {
    title: '4 leaves unfolded',
    description:
      'Four leaves are unfolded. Leaves now have three or four leaflets. Bean YEN takes the fourth node as the start of nodulation.',
    check: 'Count unfolded leaves on the main stem. The youngest leaves at the tip are still folded and do not count.',
    inspect: 'nodes',
    sources: B,
  },
  16: {
    title: '6 leaves unfolded',
    description:
      'Six leaves are unfolded and the stem is extending fast. Spring beans seldom grow side shoots, so most plants are a single stem. A new node appears roughly every five days (SaskPulse).',
    check: 'Count unfolded leaves, including any lower leaf that has fallen (its node is still on the stem).',
    inspect: 'nodes',
    sources: [...B, 'saskpulse', 'winter_spring'],
  },
  50: {
    title: 'Flower buds present, enclosed by leaves',
    description:
      'Flower buds have formed in the axil of a leaf a few nodes below the tip (leaf 7 in this model), but are still hidden by the young leaves and stipules at the top of the stem.',
    check: 'Part the youngest leaves at the shoot tip: a small cluster of green buds sits where a leaf stalk joins the stem.',
    inspect: 'flowers',
    sources: B,
  },
  51: {
    title: 'First flower buds visible outside the leaves',
    description:
      'The lowest bud cluster can now be seen without parting the leaves. Each flowering node carries one short raceme in the leaf axil.',
    check: 'Look at the top of the plant: green bud clusters in the leaf axils just below the shoot tip.',
    inspect: 'flowers',
    sources: B,
  },
  55: {
    title: 'First individual flower buds visible, closed',
    description:
      'The raceme stalk lengthens and its buds separate, so single closed buds can be told apart. More bud clusters are forming at the nodes above.',
    check: 'On the lowest raceme, separate green buds on short stalks can be counted.',
    inspect: 'flowers',
    sources: B,
  },
  59: {
    title: 'First petals visible',
    description:
      'The lowest buds show white petal tips. Many buds are still closed and no flower is open yet.',
    check: 'The lowest buds on the main stem show white at the tip but are still closed.',
    inspect: 'flowers',
    sources: B,
  },
  60: {
    title: 'First flowers open',
    description:
      'The first flowers have opened on the lowest flowering node. Each is about 2–3 cm long: a white upper petal (the standard) with dark veins, and two white wing petals, each with a large black blotch.',
    check: 'Find the lowest raceme on the main stem: its first flowers are open.',
    inspect: 'flowers',
    sources: B,
  },
  61: {
    title: 'Flowers open on the first raceme',
    description:
      'Flowers are open on the first raceme. Within a raceme the lowest flower opens first, and flowering moves up the stem one node at a time.',
    check: 'Count the racemes (leaf axils) on the main stem with open flowers.',
    inspect: 'flowers',
    sources: B,
  },
  63: {
    title: 'Flowers open on 3 racemes',
    description:
      'Three racemes have open flowers. New nodes are still forming at the tip, with buds in their axils.',
    check: 'Count racemes with open flowers, from the lowest flowering node up.',
    inspect: 'flowers',
    sources: B,
  },
  65: {
    title: 'Full flowering: flowers open on 5 racemes',
    description:
      'Five racemes have open flowers. The lowest flowers are fading: the ones that have set seed leave a small pod, and many others drop. Most flowers on the upper nodes never set pods.',
    check: 'Count racemes with open flowers on the main stem (BBCH GS65: five per plant).',
    inspect: 'flowers',
    sources: B,
  },
  67: {
    title: 'Flowering declining',
    description:
      'No new racemes are opening and the flowers lower down have faded. Small pods are growing at the lower flowering nodes.',
    check: 'Fewer flowers are open than at full flowering; the top racemes are the last in flower.',
    inspect: 'flowers',
    sources: B,
  },
  69: {
    title: 'End of flowering',
    description:
      'No open flowers remain. Pods are set at the lower flowering nodes, usually one or two per node; the upper nodes carry none.',
    check: 'No open flowers on the main stem. Count pods per node at the lower flowering nodes.',
    inspect: 'pods',
    sources: B,
  },
  71: {
    title: '10% of pods at final length',
    description:
      'Pods lengthen fast, lowest first. A tenth have reached their final length (6–8 cm in this model). The seeds inside are still small and soft.',
    check: 'Compare pods up the stem: the lowest are full length, the upper ones still growing.',
    inspect: 'pods',
    sources: B,
  },
  75: {
    title: '50% of pods at final length',
    description:
      'Half of the pods are full length. They are fleshy and green, held up from the stem; inside, the seeds are swelling in a white, spongy lining.',
    check: 'Open a pod from the middle of the main stem: the seeds are green and soft and do not yet fill the pod.',
    inspect: 'pods',
    sources: B,
  },
  79: {
    title: 'Nearly all pods at final length',
    description:
      'Nearly all pods are full length and swinging out and down under the weight of the seed. The lowest leaves are yellowing, browning and falling.',
    check: 'Pods all the way up the stem are full length.',
    inspect: 'pods',
    sources: B,
  },
  80: {
    title: 'Ripening begins: seeds green, filling the pod',
    description:
      'Ripening begins. The seeds are green and soft and fill the pod cavity.',
    check: 'Open pods from the middle of the main stem: the seeds are green and fill the cavity.',
    inspect: 'seed',
    sources: B,
  },
  81: {
    title: '10% of pods ripe',
    description:
      'Pods ripen from the bottom of the stem up. The lowest pods are turning black and leathery, with dry, hard seeds. The hilum (seed scar) turns black as each seed reaches full size.',
    check: 'Look at the lowest pods: black and leathery; the seeds inside are hard and cannot be dented with a thumbnail.',
    inspect: 'seed',
    sources: B,
  },
  83: {
    title: '30% of pods ripe and dark',
    description:
      'A third of the pods are black with dry, hard seed. The upper pods are still green or yellowing.',
    check: 'Count black pods against all pods on the main stem.',
    inspect: 'pods',
    sources: B,
  },
  85: {
    title: '50% of pods ripe and dark',
    description:
      'Half the pods are black. The leaves are dying from the bottom up: yellow, then brown to black, curling as they dry; most of them fall.',
    check: 'Half the pods on the main stem are black; open one: buff seeds with a black hilum, dry and hard.',
    inspect: 'pods',
    sources: B,
  },
  89: {
    title: 'Fully ripe',
    description:
      'Nearly all pods are black with dry, hard seed. The stems are still green to start with, then darken from the base (GS9x).',
    check: 'Pods throughout the plant are black; seeds rattle and cannot be dented with a thumbnail.',
    inspect: 'seed',
    sources: B,
  },
  95: {
    title: '50% of stems brown or black',
    description:
      'The stems are darkening from the base up; about half the stem has turned brown to dark grey-brown. Most leaves have died and fallen; they lie black on the ground.',
    check: 'Estimate the share of the stems that has turned brown or black.',
    inspect: 'plant',
    sources: B,
  },
  97: {
    title: 'Plant dead and dry',
    description:
      'The whole plant is dead and dry: pods black, stems dark brown to grey-black, a few shrivelled upper leaves still hanging on. Harvest (GS99) follows.',
    check: 'Pods are black and brittle, stems dark and dry; seeds are hard and loose in the pods.',
    inspect: 'plant',
    sources: B,
  },
};

// Builds a variant's stage list from [code, t, phase] rows, with optional
// text overrides by code.
export function stageList(rows, overrides = {}) {
  return rows.map(([code, t, phase]) => ({ code, t, phase, ...TEXT[code], ...(overrides[code] || {}) }));
}

export const PHASES = [
  { id: 'germination', name: 'Germination', from: 0, to: 7.5 },
  { id: 'leaves', name: 'Leaf development', from: 7.5, to: 28.5 },
  { id: 'buds', name: 'Flower buds', from: 28.5, to: 43.25 },
  { id: 'flowering', name: 'Flowering', from: 43.25, to: 65 },
  { id: 'pods', name: 'Pod development', from: 65, to: 77 },
  { id: 'ripening', name: 'Ripening', from: 77, to: 94.75 },
  { id: 'senescence', name: 'Senescence', from: 94.75, to: 100 },
];

export const CROP = {
  id: 'spring_beans',
  name: 'Spring beans',
  species: 'beans',
  speciesName: 'Field beans',
  variant: 'spring',
  stageSystem: 'BBCH (faba bean)',
  family: 'legume',
};

// Timeline positions after the leaf stages, shared by both variants.
export const LATER = [
  [50, 31, 'buds'], [51, 34.5, 'buds'], [55, 38, 'buds'], [59, 41.5, 'buds'],
  [60, 45, 'flowering'], [61, 48, 'flowering'], [63, 51.5, 'flowering'], [65, 55, 'flowering'], [67, 59, 'flowering'], [69, 63, 'flowering'],
  [71, 67, 'pods'], [75, 71, 'pods'], [79, 75, 'pods'],
  [80, 79, 'ripening'], [81, 82.5, 'ripening'], [83, 86, 'ripening'], [85, 89.5, 'ripening'], [89, 93, 'ripening'],
  [95, 96.5, 'senescence'], [97, 100, 'senescence'],
];

export const STAGES = stageList([
  [5, 0, 'germination'], [7, 3, 'germination'], [9, 6, 'germination'],
  [10, 9, 'leaves'], [11, 12, 'leaves'], [12, 15, 'leaves'], [13, 18, 'leaves'], [14, 21.5, 'leaves'], [16, 26, 'leaves'],
  ...LATER,
]);

// Timeline ticks that keep their label (the rest show as minor ticks).
export const TICKS = { major: STAGES.map((s) => s.code) };

// Crop-specific wording and options in the UI.
export const UI = {
  variant: null, // no variety toggle
};

export const INSPECT_VIEWS = {
  plant: { label: 'Plant', hint: 'Whole plant' },
  nodes: { label: 'Nodes', hint: 'Main stem: count unfolded leaves and nodes' },
  flowers: { label: 'Flowers', hint: 'Flowering nodes on the main stem' },
  pods: { label: 'Pods', hint: 'Pod-bearing nodes on the main stem' },
  seed: { label: 'Seed', hint: 'Pod from the middle of the main stem, opened' },
};
