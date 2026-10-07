// Crop registry. Each crop lives in src/crops/<crop>/ with its stage text
// (stages.js), key states (keyframes.js), dimensions (params.js) and stage
// rules (checks.js), assembled by its index.js. `family` picks the model and
// views: cereals by default, 'brassica' for oilseed rape.
import winterWheat from './winter-wheat/index.js';
import winterBarley from './winter-barley/index.js';
import winterOilseedRape from './winter-oilseed-rape/index.js';

export const CROPS = [winterWheat, winterBarley, winterOilseedRape];

// Unknown or missing ids fall back to the first crop.
export const getCrop = (id) => CROPS.find((c) => c.id === id) || CROPS[0];
