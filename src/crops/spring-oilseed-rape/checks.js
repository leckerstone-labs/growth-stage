// Stage rules for spring oilseed rape, checked by `npm run check` and at
// start-up. The AHDB BBCH rules are winter oilseed rape's (osrChecks in
// src/crops/winter-oilseed-rape/checks.js), with spring benchmark ranges,
// plus checks of what makes it a spring crop.
import { osrChecks } from '../winter-oilseed-rape/checks.js';

// Height: Canola Council 75–175 cm and Ontario 100–175 cm for spring canola;
// AHDB scores spring varieties fairly short (6–7 for shortness of stem) but
// gives no height in cm. 90–130 cm is an estimate for a UK crop. Pods per
// plant: an estimate (no UK benchmark found for spring crops).
export const SPRING = {
  leafStages: [[11, 1], [12, 2], [13, 3], [14, 4], [16, 6]],
  gs19: false,
  finalHeight: [90, 130],
  heightNote: '90–130 cm (estimate)',
  pods: [80, 170],
  rosetteHeight: 20,
};

export function checks(helpers) {
  osrChecks(helpers, SPRING);
  const { at, plantAt, expect } = helpers;

  // Fewer leaves than winter oilseed rape (Canola Council: 9–30 on the main
  // stem); stem extension starts at about 6–7 leaves (Bayer: by six).
  const leaves = plantAt(89).leaves.length;
  expect(89, leaves >= 9 && leaves <= 16, `9–16 main-stem leaves (${leaves})`);
  const m30 = at(30);
  expect(30, m30.leavesUnfolded >= 6 && m30.leavesUnfolded <= 8, `6–8 leaves when the stem starts to extend (${m30.leavesUnfolded})`);

  // No winter rosette: the leaves never lie flat on the ground.
  for (const code of [16, 30, 50]) {
    const flat = Math.max(...plantAt(code).leaves.filter((l) => l.present && !l.stemLeaf).map((l) => l.tilt * 180 / Math.PI));
    expect(code, flat < 70, `rosette leaves not flattened (max tilt ${flat.toFixed(0)}°)`);
  }

  // Fewer side branches (Ontario guide: 3–7).
  const br = at(89).branches;
  expect(89, br >= 3 && br <= 7, `3–7 side branches (${br})`);
  // The main stem is 30–60% of its final length just before flowering
  // (Canola Council): measured from the crown to the tip of the main raceme.
  const top = (code) => plantAt(code).main.tipS;
  const frac = top(59) / top(89);
  expect(59, frac >= 0.3 && frac <= 0.6, `main stem ${Math.round(frac * 100)}% of its final length before flowering`);
}
