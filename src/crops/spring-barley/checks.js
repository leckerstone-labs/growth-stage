// Stage rules for spring barley (two-row), checked by `npm run check` and at
// start-up. The AHDB stage rules are winter barley's (barleyChecks in
// src/crops/winter-barley/checks.js: leaf counts, tillers, the node rule,
// flag leaf at GS39, awns at GS49, ear emergence, boot swelling), with
// spring benchmark ranges, plus checks of what makes it a spring crop.
import { barleyChecks } from '../winter-barley/checks.js';

// Height: AHDB spring varieties 10–20 cm shorter than winter (89–98 cm) and
// 57% of final height at flag leaf emergence; Teagasc 54–64 cm. Thickness
// targets (mm) are typical field values, to be confirmed.
export const SPRING = {
  finalHeight: [60, 78],
  heightAt39: [0.5, 0.62],
  heightNote: 'AHDB: 57%',
  pseudostem: { 13: [1.5, 2.5], 21: [1.8, 3.5], 30: [3.5, 7] },
  stem39: [3, 5],
};

export function checks(helpers) {
  barleyChecks(helpers, SPRING);
  const { at, plantAt, expect } = helpers;

  // About 8 main-stem leaves (Teagasc: 7–9), the top four on the extended
  // stem (on nodes 1–4).
  const ms = plantAt(39).main;
  expect(39, ms.N >= 7 && ms.N <= 9, `7–9 main-stem leaves (${ms.N})`);
  const onStem = ms.leaves.filter((l) => l.m >= 1).length;
  expect(39, onStem === 4, `top four leaves on the extended stem (${onStem})`);

  // Upright from the start: no shoot lies flatter than 45° from vertical
  // during tillering (winter barley is prostrate, ~60–70°).
  for (const code of [13, 21, 22, 23, 24, 30]) {
    const flat = Math.max(...plantAt(code).shoots.map((s) => s.lean * 180 / Math.PI));
    expect(code, flat < 45, `shoots upright, no prostrate habit (max lean ${flat.toFixed(0)}°)`);
  }

  // Peak of 5 shoots per plant (GS24) falling to 3 ears is checked by
  // barleyChecks; the ear is shorter than winter barley's.
  expect(59, at(59).earLen < 7, `ear shorter than winter barley's (${at(59).earLen.toFixed(1)} cm)`);
}
