// Picks the inspection views (geometry, readouts, labels, camera framing) for
// a crop's family: cereals, or brassica (oilseed rape).
import { createCerealView } from './cereal.js';
import { createBrassicaView } from './brassica.js';

export const createCropView = (ctx) => (ctx.crop.family === 'brassica' ? createBrassicaView(ctx) : createCerealView(ctx));
