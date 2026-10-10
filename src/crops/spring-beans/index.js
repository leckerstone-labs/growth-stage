// Spring field beans: everything the app needs to know about this crop.
// A legume, so it uses its own model (src/model/legume.js) and views
// (src/views/legume.js). species/variant let the UI group winter and spring
// beans as one crop with a Winter/Spring toggle.
import * as stages from './stages.js';
import { ROWS } from './keyframes.js';
import * as params from './params.js';
import { checks } from './checks.js';

export default {
  ...stages.CROP,
  stages: stages.STAGES,
  phases: stages.PHASES,
  sources: stages.SOURCES,
  views: stages.INSPECT_VIEWS,
  ticks: stages.TICKS,
  ui: stages.UI,
  rows: ROWS,
  params,
  checks,
};
