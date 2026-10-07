// Winter oilseed rape: everything the app needs to know about this crop.
// A brassica, so it uses its own model (src/model/brassica.js) and views
// (src/views/brassica.js) rather than the cereal ones.
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
