// Stage rules for spring wheat, checked by `npm run check` and at start-up.
// The AHDB stage rules are winter wheat's (wheatChecks in
// src/crops/winter-wheat/checks.js: leaf counts, the node rule, flag leaf at
// GS39, boot swelling, ear emergence), with spring thickness ranges, plus
// checks of what makes it a spring crop.
import { wheatChecks } from '../winter-wheat/checks.js';

// Thickness targets (mm): typical field values, to be confirmed. The
// pseudostem at GS30 is thinner than winter wheat's: fewer leaves are
// wrapped round it.
export const SPRING = {
  pseudostem: { 13: [1.5, 2.5], 21: [1.8, 3.5], 30: [3.5, 7] },
  stem39: [3, 5],
};

export function checks(helpers) {
  wheatChecks(helpers, SPRING);
  const { at, plantAt, expect } = helpers;

  // About 8 main-stem leaves (NDSU: most spring wheats make 8), the top
  // four on the extended stem (on nodes 1–4).
  const ms = plantAt(39).main;
  expect(39, ms.N >= 7 && ms.N <= 9, `7–9 main-stem leaves (${ms.N})`);
  const onStem = ms.leaves.filter((l) => l.m >= 1).length;
  expect(39, onStem === 4, `top four leaves on the extended stem (${onStem})`);

  // Upright from the start: no shoot lies flatter than 45° from vertical
  // during tillering (winter wheat is prostrate over winter).
  for (const code of [13, 21, 22, 23, 24, 30]) {
    const flat = Math.max(...plantAt(code).shoots.map((s) => s.lean * 180 / Math.PI));
    expect(code, flat < 45, `shoots upright, no prostrate habit (max lean ${flat.toFixed(0)}°)`);
  }

  // Tillers: up to 4 by late tillering, then about 2 ears per plant
  // (Farmers Weekly: ~600 ears/m² from 325–400 seeds/m²).
  for (const [code, n] of [[22, 3], [23, 4], [24, 5]]) {
    const shoots = plantAt(code).shoots.length;
    expect(code, shoots === n, `main shoot + ${n - 1} tillers (${shoots} shoots)`);
  }
  expect(92, plantAt(92).shoots.length === 2, `2 ear-bearing shoots at harvest (${plantAt(92).shoots.length})`);

  // Height: AHDB RL spring wheats 72–80 cm without PGR, about 10 cm shorter
  // than winter wheats (82–95 cm). The model sits about 10 cm below the
  // winter wheat model. About half of it at GS39 (estimate).
  const final = at(92).height;
  expect(92, final >= 62 && final <= 74, `final height 62–74 cm (${final.toFixed(0)})`);
  const h39 = at(39).height / final;
  expect(39, h39 >= 0.42 && h39 <= 0.6, `about half of final height at GS39 (${(h39 * 100).toFixed(0)}%)`);

  // Ear shorter than winter wheat's (9 cm).
  expect(59, at(59).earLen < 8.5, `ear shorter than winter wheat's (${at(59).earLen.toFixed(1)} cm)`);
}
