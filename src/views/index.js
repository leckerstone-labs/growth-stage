// Picks the inspection views (geometry, readouts, labels, camera framing) for
// a crop's family: cereals, brassica (oilseed rape) or legume (field beans).
import { createCerealView } from './cereal.js';
import { createBrassicaView } from './brassica.js';
import { createLegumeView } from './legume.js';

const VIEWS = { brassica: createBrassicaView, legume: createLegumeView };
export const createCropView = (ctx) => (VIEWS[ctx.crop.family] || createCerealView)(ctx);
