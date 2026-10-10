// Crop registry. Each crop lives in src/crops/<crop>/ with its stage text
// (stages.js), key states (keyframes.js), dimensions (params.js) and stage
// rules (checks.js), assembled by its index.js. `family` picks the model and
// views: cereals by default, 'brassica' for oilseed rape, 'legume' for field
// beans.
//
// Species and variants: winter and spring forms of a crop use the same AHDB
// stage key, so they are variants of one species. Every variant is still a
// full crop here, with id `<variant>_<species>` (e.g. spring_barley), plus
// `species` ('barley'), `speciesName` ('Barley') and `variant` ('winter' or
// 'spring'). The header lists species; a Winter/Spring toggle appears when a
// species has more than one variant. The order below is the order shown, and
// a species' first variant listed is the one picked when switching to it.
import winterWheat from './winter-wheat/index.js';
import winterBarley from './winter-barley/index.js';
import springBarley from './spring-barley/index.js';
import springOats from './spring-oats/index.js';
import winterOats from './winter-oats/index.js';
import winterOilseedRape from './winter-oilseed-rape/index.js';
import winterBeans from './winter-beans/index.js';
import springBeans from './spring-beans/index.js';

export const CROPS = [winterWheat, winterBarley, springBarley, springOats, winterOats, winterOilseedRape, winterBeans, springBeans];

// Unknown or missing ids fall back to the first crop.
export const getCrop = (id) => CROPS.find((c) => c.id === id) || CROPS[0];

// Species in registry order: [{ species, speciesName, variants: [crop…] }].
export const SPECIES = CROPS.reduce((list, c) => {
  let s = list.find((x) => x.species === c.species);
  if (!s) list.push((s = { species: c.species, speciesName: c.speciesName, variants: [] }));
  s.variants.push(c);
  return list;
}, []);

// The crop to show for a species: the same variant as `current` if that
// species has it, otherwise its first registered variant.
export const cropForSpecies = (species, current) => {
  const s = SPECIES.find((x) => x.species === species);
  if (!s) return CROPS[0];
  return s.variants.find((c) => c.variant === current?.variant) || s.variants[0];
};
