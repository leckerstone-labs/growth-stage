// Picks the plant model for a crop's family: the shared cereal morphology
// (morphology.js) or the brassica one for oilseed rape (brassica.js).
import { createModel } from './morphology.js';
import { createBrassicaModel } from './brassica.js';

// opts.seed (optional) picks the plant's natural variation (model/random.js).
export const createCropModel = (crop, opts = {}) => (crop.family === 'brassica' ? createBrassicaModel(crop, opts) : createModel(crop, opts));
