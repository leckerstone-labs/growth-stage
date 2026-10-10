// Stage rules for winter oats: the oat rules (src/crops/spring-oats/
// checks.js) with the winter benchmarks (Opti-Oat, cv. Mascani): 45 cm to
// the ligule at GS39; 65 cm to the ligule and 93 cm to the panicle top at
// GS59; 104 cm final. Shoot counts are this model plant's (benchmark ~3
// shoots per plant at GS31, ~2 panicles at harvest).
import { oatChecks } from '../spring-oats/checks.js';

export const checks = oatChecks({
  shoots: [[21, 2], [22, 3], [23, 4]],
  finalShoots: 2,
  h39: [40, 50],
  h59: { ligule: [59, 71], top: [86, 100] },
  final: [97, 111],
});
