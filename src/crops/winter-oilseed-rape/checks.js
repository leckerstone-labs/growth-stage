// Stage rules for oilseed rape (AHDB BBCH key), checked by `npm run check`
// and at start-up. osrChecks() holds the rules shared by winter and spring
// oilseed rape (src/crops/spring-oilseed-rape/checks.js), with the size
// benchmarks passed in; checks() is winter oilseed rape's set.
//
// Helpers: { at(code) → measureMain(), plantAt(code) → computePlant(),
// expect(code, ok, msg), SEED_DEPTH }

// Winter benchmarks (AHDB: 100–160 cm; ~200 pods per plant at 6,000–8,000
// pods/m² and 25–40 plants/m²). GS19 (9 or more leaves) is a checkpoint:
// the oldest leaves are dying back by then.
export const WINTER = {
  leafStages: [[11, 1], [12, 2], [13, 3], [14, 4], [16, 6]],
  gs19: true,
  finalHeight: [100, 160],
  heightNote: '100–160 cm',
  pods: [150, 320],
  rosetteHeight: 20,
};

export function checks(helpers) {
  osrChecks(helpers, WINTER);
}

export function osrChecks({ at, expect }, B) {
  const pct = (x) => `${Math.round(x * 100)}%`;
  // Germination and emergence (epigeal: the hypocotyl lifts the cotyledons).
  let m = at(5);
  expect(5, m.rootLen > 0 && m.hypoLen === 0, 'radicle only');
  m = at(7);
  expect(7, m.hypoLen > 0 && m.hookTop < -0.3, `hypocotyl out of the seed, below ground (top ${m.hookTop.toFixed(2)} cm)`);
  m = at(9);
  expect(9, m.hookTop > -0.05 && m.hookTop < 0.4, `hook breaking the soil surface (${m.hookTop.toFixed(2)} cm)`);
  expect(9, m.cotyOpen < 0.3, 'cotyledons still closed');
  m = at(10);
  expect(10, m.cotyOpen >= 0.99 && m.cotyY > 0.3, 'cotyledons unfolded above ground');
  expect(10, m.leavesUnfolded === 0, 'no true leaf unfolded');

  // Leaf production: BBCH counts true leaves unfolded on the main stem.
  for (const [code, n] of B.leafStages) {
    m = at(code);
    expect(code, m.leavesUnfolded === n, `${n} leaves unfolded (${m.leavesUnfolded})`);
  }
  if (B.gs19) {
    m = at(19);
    expect(19, m.leavesUnfolded >= 9, `9 or more leaves unfolded (${m.leavesUnfolded})`);
    expect(19, m.leavesGreen < m.leavesUnfolded, 'oldest leaves dying back');
  }

  // Rosette and stem extension.
  m = at(30);
  expect(30, m.extended === 0, `no extended internodes (${m.extended})`);
  expect(30, !m.budPresent || m.budsEnclosed, 'any buds hidden in the centre');
  m = at(50);
  expect(50, m.budPresent && m.budsEnclosed, 'flower buds present, enclosed by leaves');
  m = at(51);
  expect(51, m.budVisibleFromAbove, 'green bud: buds visible from above');
  expect(51, m.budAboveLeaves < 0, `buds not yet above the youngest leaves (${m.budAboveLeaves.toFixed(1)} cm)`);
  expect(51, m.ints[0] > 0.3, `stem starting to extend (internode 1 ${m.ints[0].toFixed(1)} cm)`);
  m = at(53);
  expect(53, m.budAboveLeaves > 0, `buds raised above the youngest leaves (${m.budAboveLeaves.toFixed(1)} cm)`);
  m = at(55);
  expect(55, m.mainBudsSeparate && !m.sideBudsSeparate, 'individual buds on main raceme only');
  m = at(57);
  expect(57, m.sideBudsSeparate, 'individual buds on side racemes');
  expect(57, m.yellowBuds === 0, 'no yellow buds yet');
  m = at(59);
  expect(59, m.yellowBuds > 0 && m.opened === 0, `yellow bud, no flower open (${m.yellowBuds} yellow)`);

  // Flowering, main raceme.
  m = at(60);
  expect(60, m.opened > 0 && m.opened < 0.1, `first flowers open (${pct(m.opened)})`);
  for (const [code, lo, hi] of [[61, 0.1, 0.2], [63, 0.3, 0.4], [65, 0.5, 0.6]]) {
    m = at(code);
    expect(code, m.opened >= lo && m.opened < hi, `${pct(lo)} of flowers opened (${pct(m.opened)})`);
  }
  expect(65, at(65).petalsFallen > 0, 'older petals falling');
  m = at(67);
  expect(67, m.petalsFallen > 0.5 && m.openNow > 0, `most petals fallen, still flowering (${pct(m.petalsFallen)})`);
  m = at(69);
  expect(69, m.openNow === 0, `no open flowers (${m.openNow})`);

  // Pods reach final size (BBCH 7x: share of pods).
  for (const [code, lo, hi] of [[71, 0.1, 0.2], [75, 0.5, 0.6]]) {
    m = at(code);
    expect(code, m.podsFinal >= lo && m.podsFinal < hi, `${pct(lo)} of pods at final size (${pct(m.podsFinal)})`);
  }
  m = at(79);
  expect(79, m.podsFinal >= 0.9, `>90% of pods at final size (${pct(m.podsFinal)})`);
  expect(79, m.podsRipe === 0, 'no ripe pods yet');

  // Ripening (BBCH 8x: share of pods ripe, seeds dark and hard).
  m = at(80);
  expect(80, m.podsRipe === 0 && m.midSeed >= 2 && m.midSeed < 3, `seeds green, none ripe (seed ${m.midSeed.toFixed(1)})`);
  for (const [code, lo, hi] of [[81, 0.1, 0.3], [83, 0.3, 0.5], [85, 0.5, 0.7], [87, 0.7, 0.9]]) {
    m = at(code);
    expect(code, m.podsRipe >= lo && m.podsRipe < hi, `${pct(lo)} of pods ripe (${pct(m.podsRipe)})`);
  }
  m = at(89);
  expect(89, m.podsRipe >= 0.9, `nearly all pods ripe (${pct(m.podsRipe)})`);
  // AHDB swathing guide pattern, about GS83: top green to green-brown,
  // middle green-brown, bottom dark brown to black.
  const s = at(83).seedThirds;
  expect(83, s.top >= 2 && s.top < 3.6 && s.middle >= 3 && s.middle < 4.5 && s.bottom >= 4.3,
    `swathing seed-colour pattern (top ${s.top.toFixed(1)}, middle ${s.middle.toFixed(1)}, bottom ${s.bottom.toFixed(1)})`);

  // Size benchmarks (B).
  m = at(89);
  const [h0, h1] = B.finalHeight, [p0, p1] = B.pods;
  expect(89, m.height >= h0 && m.height <= h1, `final height ${B.heightNote} (${m.height.toFixed(0)})`);
  expect(89, m.pods >= p0 && m.pods <= p1, `${p0}–${p1} pods per plant (${m.pods})`);
  expect(30, at(30).height < B.rosetteHeight, `rosette is short (${at(30).height.toFixed(0)} cm)`);
}
