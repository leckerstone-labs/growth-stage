// Stage rules for winter field beans: the shared field bean rules
// (src/crops/spring-beans/checks.js) with winter's checkpoints and sizes.
import { beanChecks } from '../spring-beans/checks.js';

export const checks = beanChecks({
  leafCodes: [],
  shootCodes: [[13, 0], [21, 1], [22, 2]],
  extendCode: 22,
  height: [100, 130],
  podsPlant: [12, 25],
});
