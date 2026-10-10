// Agronomic content for spring oilseed rape, the spring variant of oilseed
// rape. Spring and winter oilseed rape use the same AHDB stage key (BBCH),
// so this file reuses winter oilseed rape's stage list and wording
// (src/crops/winter-oilseed-rape/stages.js) and overrides only what differs:
// spring sowing, no overwintering rosette, fewer leaves and branches, a
// shorter plant and a quicker run from sowing to flowering and harvest.
//
// Stage list: winter's, without GS19. The buds form and the stem starts to
// extend at about seven leaves, so "9 or more leaves" is reached only once
// a more advanced stage (GS5x) applies, and AHDB says record the most
// advanced stage.
//
// AHDB has little on spring oilseed rape beyond sowing and populations, so
// timings come from Canadian and Ontario guides to spring canola (the same
// crop type; SOURCES). They are a guide for UK crops, not a UK benchmark.
//
// STATUS: draft content for the prototype. Needs agronomist review before
// being relied on as a field reference.

import * as winter from '../winter-oilseed-rape/stages.js';

export const SOURCES = {
  ...winter.SOURCES,
  ahdb_dl: {
    title: 'AHDB Recommended Lists — spring oilseed rape descriptive list',
    url: 'https://ahdb.org.uk/ahdb-recommended-lists-for-cereals-and-oilseeds-2021-2026',
  },
  canola: {
    title: 'Canola Council of Canada — Canola Encyclopedia: growth stages',
    url: 'https://www.canolacouncil.org/canola-encyclopedia/growth-stages/',
  },
  ontario: {
    title: 'Field Crop News (Ontario) — Canola growth rate and days to maturity',
    url: 'https://fieldcropnews.com/?p=28988',
  },
  bayer: {
    title: 'Bayer Crop Science Canada — Determining canola growth stages',
    url: 'https://www.cropscience.bayer.ca/articles/2021/determining-canola-growth-stages',
  },
};

// No winter: the rosette phase is short and the leaf phase ends at GS16.
export const PHASES = [
  { id: 'germination', name: 'Germination', from: 0, to: 7.5 },
  { id: 'leaves', name: 'Leaf production', from: 7.5, to: 29 },
  { id: 'rosette', name: 'Rosette', from: 29, to: 35 },
  { id: 'buds', name: 'Stem extension & buds', from: 35, to: 59 },
  { id: 'flowering', name: 'Flowering', from: 59, to: 77.5 },
  { id: 'pods', name: 'Pod development', from: 77.5, to: 88 },
  { id: 'ripening', name: 'Ripening', from: 88, to: 100 },
];

export const CROP = {
  ...winter.CROP,
  id: 'spring_oilseed_rape',
  name: 'Spring oilseed rape',
  variant: 'spring',
};

// Changes from winter oilseed rape, by stage code. Each entry replaces only
// the fields it lists.
const SPRING = {
  5: {
    description:
      'The small, round seed has taken up water and the first root (radicle) has broken through the seed coat. It grows straight down and becomes the taproot. Spring oilseed rape is sown from February to April, at a higher plant population than winter crops: at least 40–50 plants/m² (AHDB).',
    sources: ['ahdb_gs', 'ahdb_early'],
  },
  9: {
    description:
      'The hypocotyl hook breaks through the soil surface, lifting the cotyledons with it. Oilseed rape is a dicot: the seed leaves are carried above ground. Spring crops emerge 4–15 days after sowing, depending on soil temperature and moisture (Canola Council).',
    sources: ['ahdb_gs', 'ahdb_early', 'canola'],
  },
  11: {
    description:
      'The first true leaf has unfolded from the centre of the plant, typically 4–8 days after emergence (Canola Council). True leaves are stalked (petiolate), with a rounded blade and a wavy, toothed edge, unlike the notched cotyledons.',
    sources: ['ahdb_gs', 'ahdb_early', 'canola'],
  },
  16: {
    t: 26,
    description:
      'Six true leaves are unfolded. The cotyledons have died off. With lengthening days and warming soil a spring crop moves on quickly: stem extension may begin by about this stage (Bayer), so a spring crop never builds the large, flat rosette of a winter crop.',
    sources: ['ahdb_gs', 'ahdb_early', 'bayer'],
  },
  30: {
    t: 32,
    title: 'Rosette (no extended internodes)',
    description:
      'A short rosette stage: the leaves all come from a crown at soil level and the stem has not started to extend. There is no winter, so this lasts only a week or two. Lengthening days and rising temperatures trigger the flower buds to form in the centre, and the stem extends (bolts) soon after (Canola Council).',
    check: 'Look at the crown: the leaves all arise at ground level, with no length of stem between them. A spring crop usually has about seven leaves at this point.',
    sources: ['ahdb_gs', 'canola'],
  },
  50: {
    t: 38,
    description:
      'The main flower bud cluster is present at the top of the stem, still hidden by the youngest leaves folded over it. The stem is starting to extend and new leaves keep unfolding on it.',
    sources: ['ahdb_gs', 'ahdb_flower', 'canola'],
  },
  51: { t: 42 },
  53: { t: 46.5 },
  55: { t: 50.5 },
  57: {
    t: 54,
    description:
      'Side branches have grown from the axils of the upper stem leaves, and the buds on their racemes are now individually visible too. Spring crops carry fewer branches than winter oilseed rape: typically 3–7 (Ontario guide).',
    sources: ['ahdb_gs', 'ahdb_flower', 'ontario'],
  },
  60: {
    description:
      'The first flowers have opened at the bottom of the main raceme. Each has four yellow petals in a cross. Flowers always open from the lowest bud upwards. Spring crops start flowering about 45–50 days after emergence (Ontario guide), usually in June in the UK.',
    sources: ['ahdb_gs', 'ahdb_flower', 'ontario'],
  },
  65: {
    description:
      'Half of the flowers on the main raceme are open and the older petals are starting to fall. The lowest flowers have already set small green pods. The stem has nearly finished extending (Ontario guide: maximum height around peak flowering), though the racemes keep lengthening above it as the pods form.',
    sources: ['ahdb_gs', 'ahdb_flower', 'ontario'],
  },
  69: {
    description:
      'Flowering has finished: the main raceme flowers for 14–21 days (Canola Council). The racemes are now lines of green pods, with the youngest still short at the top.',
    sources: ['ahdb_gs', 'canola'],
  },
  71: {
    description:
      'Pods develop from the pollinated flowers. A tenth of them, at the bottom of the main raceme, have reached their final size. Seed filling is complete about 35–45 days after the first flower opens (Canola Council).',
    sources: ['ahdb_gs', 'ahdb_seed', 'canola'],
  },
  79: {
    description:
      'More than 90% of pods have reached final size. The leaves are yellowing and dropping. Spring oilseed rape yields less than winter oilseed rape: about 3 t/ha for the control varieties in AHDB descriptive list trials.',
    sources: ['ahdb_gs', 'ahdb_seed', 'ahdb_dl'],
  },
  89: {
    description:
      'Nearly all (more than 90%) pods are ripe, with dark, hard seed (AHDB). The crop is then left to dry (GS97, plant dead and dry) until it is ready to harvest (GS99). Spring crops are harvested from August into September, about four to five months after sowing (Ontario guide: 90–96 days from planting to maturity there).',
    sources: ['ahdb_gs', 'ahdb_seed', 'ahdb_harvest', 'ontario'],
  },
};

export const STAGES = winter.STAGES
  .filter((s) => s.code !== 19)
  .map((s) => ({ ...s, ...SPRING[s.code] }));

export const TICKS = { major: winter.TICKS.major.filter((c) => c !== 19) };
export const UI = winter.UI;
export const INSPECT_VIEWS = winter.INSPECT_VIEWS;
