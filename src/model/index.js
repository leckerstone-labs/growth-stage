// Picks the plant model for a crop's family: the shared cereal morphology
// (morphology.js), the brassica one for oilseed rape (brassica.js) or the
// legume one for field beans (legume.js).
import { createModel } from './morphology.js';
import { createBrassicaModel } from './brassica.js';
import { createLegumeModel } from './legume.js';

// opts.seed (optional) picks the plant's natural variation (model/random.js).
const MODELS = { brassica: createBrassicaModel, legume: createLegumeModel };
export const createCropModel = (crop, opts = {}) => (MODELS[crop.family] || createModel)(crop, opts);
