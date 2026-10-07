// Stage rules for winter barley (two-row), checked by `npm run check` and at
// start-up. Same AHDB stage definitions as wheat, plus barley's own: awns
// visible before the ear (GS49), a small flag leaf, and AHDB height
// benchmarks.
//
// Helpers: { at(code) → measureMain(), plantAt(code) → computePlant(),
// expect(code, ok, msg), SEED_DEPTH }

export function checks({ at, plantAt, expect, SEED_DEPTH }) {
  // Germination and leaf production.
  let p = plantAt(5);
  expect(5, p.main.seedling.coleoLen === 0 && p.main.seedling.seminalLen > 0, 'radicle only, no coleoptile');
  p = plantAt(7);
  expect(7, p.main.seedling.coleoLen > 0 && -SEED_DEPTH + p.main.seedling.coleoLen < -0.5, 'coleoptile out of seed, below surface');
  p = plantAt(9);
  const tip9 = -SEED_DEPTH + p.main.seedling.coleoLen;
  expect(9, tip9 > -0.1 && tip9 < 0.5, `coleoptile tip at soil surface (${tip9.toFixed(2)} cm)`);
  expect(9, p.main.leaves[0].emerge === 0, 'no leaf through coleoptile yet');
  const leafE = (code) => plantAt(code).main.leaves.map((l) => l.emerge);
  let e = leafE(10);
  expect(10, e[0] > 0 && e[0] < 1, `first leaf through coleoptile (${e[0].toFixed(2)})`);
  for (const [code, n] of [[11, 1], [12, 2], [13, 3]]) {
    e = leafE(code);
    expect(code, e[n - 1] >= 1 && e[n] < 1, `${n} leaves unfolded (leaf ${n}=${e[n - 1].toFixed(2)}, leaf ${n + 1}=${e[n].toFixed(2)})`);
  }
  // Tillers.
  for (const [code, n] of [[13, 1], [21, 2], [22, 3], [23, 4], [24, 5]]) {
    const shoots = plantAt(code).shoots.length;
    expect(code, shoots === n, `main shoot + ${n - 1} tiller(s) (${shoots} shoots)`);
  }
  expect(92, plantAt(92).shoots.length === 3, '3 ear-bearing shoots at harvest (AHDB benchmark)');

  // Stem extension (AHDB node rule).
  let m = at(30);
  expect(30, m.detectable === 0, 'no node should be detectable');
  expect(30, m.leafEmerge(4) > 0 && m.leafEmerge(4) < 1, 'leaf 4 should be emerging');
  m = at(31);
  expect(31, m.detectable === 1 && m.ints[1] < 2, `1 node, i2<2 (i1=${m.ints[0].toFixed(2)}, i2=${m.ints[1].toFixed(2)})`);
  expect(31, m.leafEmerge(4) > 0.95, 'leaf 4 fully emerged');
  m = at(32);
  expect(32, m.detectable === 2 && m.ints[2] < 2, `2 nodes (i2=${m.ints[1].toFixed(2)}, i3=${m.ints[2].toFixed(2)})`);
  expect(32, m.leafEmerge(3) >= 1, 'leaf 3 fully emerged');
  m = at(33);
  expect(33, m.detectable === 3, `3 nodes (i3=${m.ints[2].toFixed(2)}, i4=${m.ints[3].toFixed(2)})`);
  m = at(37);
  expect(37, m.flagEmerge > 0 && m.flagEmerge < 0.5, `flag tip just visible (e=${m.flagEmerge.toFixed(2)})`);
  m = at(39);
  expect(39, m.flagLiguleVisible, 'flag ligule visible');
  expect(39, m.flagToLeaf2 < 0.8, `flag leaf clearly smaller than leaf 2 (${m.flagToLeaf2.toFixed(2)})`);

  // Booting: ear and awns enclosed, boot swelling.
  for (const c of [39, 41, 43, 45, 47, 49]) {
    m = at(c);
    expect(c, m.earTipBelowLigule > 0, `ear enclosed (tip ${m.earTipBelowLigule.toFixed(2)} cm below ligule)`);
  }
  for (const c of [41, 43, 45, 47]) {
    m = at(c);
    expect(c, m.awnTipAboveLigule < 0, `awns enclosed (tips ${m.awnTipAboveLigule.toFixed(2)} cm vs ligule)`);
  }
  m = at(49);
  expect(49, m.awnTipAboveLigule > 0 && m.awnTipAboveLigule < 3, `awn tips just visible (${m.awnTipAboveLigule.toFixed(2)} cm above ligule)`);
  expect(41, at(41).bootSwelling < 1.2, 'boot not yet obviously swollen');
  expect(43, at(43).bootSwelling > 1.25, 'boot slightly swollen');
  expect(45, at(45).bootSwelling > 1.5, 'boot clearly swollen');

  // Ear emergence.
  m = at(51);
  expect(51, m.earEmerged > 0 && m.earEmerged < 0.2, `ear tip just visible (${(m.earEmerged * 100).toFixed(0)}%)`);
  m = at(55);
  expect(55, Math.abs(m.earEmerged - 0.5) < 0.1, `half emerged (${(m.earEmerged * 100).toFixed(0)}%)`);
  m = at(59);
  expect(59, m.earEmerged >= 1, 'ear fully emerged');

  // Height (AHDB: 89–98 cm final with PGR; nearly half of it at GS39).
  const final = at(92).height;
  expect(92, final >= 82 && final <= 98, `final height 82–98 cm (${final.toFixed(0)})`);
  const h39 = at(39).height / final;
  expect(39, h39 >= 0.4 && h39 <= 0.52, `nearly half final height at GS39 (${(h39 * 100).toFixed(0)}%)`);

  // Thickness targets (mm) — typical field values, to be confirmed.
  const mm = (x) => x.toFixed(1);
  m = at(13);
  expect(13, m.pseudostemDiam >= 1.5 && m.pseudostemDiam <= 2.5, `pseudostem 1.5–2.5 mm (${mm(m.pseudostemDiam)})`);
  m = at(21);
  expect(21, m.pseudostemDiam >= 2 && m.pseudostemDiam <= 3.5, `pseudostem 2–3.5 mm (${mm(m.pseudostemDiam)})`);
  m = at(30);
  expect(30, m.pseudostemDiam >= 5 && m.pseudostemDiam <= 8, `pseudostem 5–8 mm (${mm(m.pseudostemDiam)})`);
  m = at(39);
  expect(39, m.stemDiam >= 3 && m.stemDiam <= 5, `stem 3–5 mm (${mm(m.stemDiam)})`);
}
