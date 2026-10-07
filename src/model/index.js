// Picks the plant model for a crop's family: the shared cereal morphology
// (morphology.js) or the brassica one for oilseed rape (brassica.js).
import { createModel } from './morphology.js';
import { createBrassicaModel } from './brassica.js';

export const createCropModel = (crop) => (crop.family === 'brassica' ? createBrassicaModel(crop) : createModel(crop));
