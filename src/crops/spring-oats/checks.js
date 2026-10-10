// Stage rules for oats, checked by `npm run check` and at start-up. Same
// Zadoks stage definitions as wheat and barley (node rule, flag leaf,
// boot, emergence measured from the flag leaf ligule), plus oat ones: no
// awns, leaves twisting the other way, and the Opti-Oat height and shoot
// benchmarks for each variant. Winter oats (src/crops/winter-oats/checks.js)
// use the same rules with their own numbers.
//
// Helpers: { at(code) → measureMain(), plantAt(code) → computePlant(),
// expect(code, ok, msg), SEED_DEPTH }

// B: the variant's benchmarks.
//   shoots: [[code, shoots]…] during tillering; finalShoots: at harvest
//   h39: flag ligule height range at GS39 (cm); h59: { ligule, top } ranges
//   at GS59; final: panicle top range at harvest (cm)
export const oatChecks = (B) => function checks({ at, plantAt, expect, SEED_DEPTH }) {
  // Germination and leaf production.
  let p = plantAt(5);
  expect(5, p.main.seedling.coleoLen === 0 && p.main.seedling.rootDepth > 0, 'radicle only, no coleoptile');
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
  // Oat leaves twist anticlockwise: the opposite sign to wheat's.
  expect(13, plantAt(13).main.leaves.every((l) => l.twist <= 0), 'leaves twist anticlockwise (opposite to wheat)');

  // Tillers.
  for (const [code, n] of [[13, 1], ...B.shoots]) {
    const shoots = plantAt(code).shoots.length;
    expect(code, shoots === n, `main shoot + ${n - 1} tiller(s) (${shoots} shoots)`);
  }
  expect(92, plantAt(92).shoots.length === B.finalShoots, `${B.finalShoots} panicle-bearing shoots at harvest (Opti-Oat benchmark)`);

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
  expect(39, m.flagToLeaf2 < 1, `flag leaf smaller than leaf 2 (${m.flagToLeaf2.toFixed(2)})`);
  // Six internodes in all, the peduncle the longest (Opti-Oat).
  m = at(92);
  expect(92, m.ints.length === 5 && m.ped > Math.max(...m.ints), `six internodes, peduncle longest (ped ${m.ped.toFixed(1)} cm)`);

  // Booting: panicle enclosed, boot swelling; no awns at all.
  for (const c of [39, 41, 43, 45, 47]) {
    m = at(c);
    expect(c, m.earTipBelowLigule > 0, `panicle enclosed (tip ${m.earTipBelowLigule.toFixed(2)} cm below ligule)`);
    expect(c, m.awnTipAboveLigule === null, 'no awns');
  }
  expect(41, at(41).bootSwelling < 1.2, `boot not yet obviously swollen (${at(41).bootSwelling.toFixed(2)})`);
  expect(43, at(43).bootSwelling > 1.25, `boot slightly swollen (${at(43).bootSwelling.toFixed(2)})`);
  expect(45, at(45).bootSwelling > 1.5, `boot clearly swollen (${at(45).bootSwelling.toFixed(2)})`);

  // Panicle emergence, measured from the flag leaf ligule.
  m = at(51);
  expect(51, m.earEmerged > 0 && m.earEmerged < 0.2, `panicle tip just visible (${(m.earEmerged * 100).toFixed(0)}%)`);
  m = at(55);
  expect(55, Math.abs(m.earEmerged - 0.5) < 0.1, `half emerged (${(m.earEmerged * 100).toFixed(0)}%)`);
  m = at(59);
  expect(59, m.earEmerged >= 1, 'panicle fully emerged');

  // Heights (Opti-Oat; to the flag leaf ligule unless "top"). The model's
  // top is measured along the shoot, before the panicle arches over.
  const range = (x, [lo, hi]) => x >= lo && x <= hi;
  m = at(39);
  expect(39, range(m.flagLiguleHeight, B.h39), `flag ligule ${B.h39.join('–')} cm (${m.flagLiguleHeight.toFixed(0)})`);
  m = at(59);
  expect(59, range(m.flagLiguleHeight, B.h59.ligule), `flag ligule ${B.h59.ligule.join('–')} cm (${m.flagLiguleHeight.toFixed(0)})`);
  expect(59, range(m.height, B.h59.top), `panicle top ${B.h59.top.join('–')} cm (${m.height.toFixed(0)})`);
  const final = at(92).height;
  expect(92, range(final, B.final), `final height ${B.final.join('–')} cm to panicle top (${final.toFixed(0)})`);
  const h75 = at(75).height;
  expect(75, h75 >= final - 1, `final height reached by GS75 (${h75.toFixed(0)} of ${final.toFixed(0)} cm)`);

  // Thickness targets (mm) — typical field values, to be confirmed.
  const mm = (x) => x.toFixed(1);
  m = at(13);
  expect(13, m.pseudostemDiam >= 1.5 && m.pseudostemDiam <= 2.8, `pseudostem 1.5–2.8 mm (${mm(m.pseudostemDiam)})`);
  m = at(30);
  expect(30, m.pseudostemDiam >= 4 && m.pseudostemDiam <= 8, `pseudostem 4–8 mm (${mm(m.pseudostemDiam)})`);
  m = at(39);
  expect(39, m.stemDiam >= 3 && m.stemDiam <= 5, `stem 3–5 mm (${mm(m.stemDiam)})`);
};

// Spring oats (Opti-Oat, cv. Canyon): 46 cm to the ligule at GS39; 70 cm
// to the ligule and 91 cm to the panicle top at GS59; 108 cm final. Shoot
// counts are this model plant's (benchmark ~1.7 shoots per plant at GS31,
// ~1.4 panicles at harvest).
export const checks = oatChecks({
  shoots: [[21, 2], [22, 3]],
  finalShoots: 2,
  h39: [41, 51],
  h59: { ligule: [64, 76], top: [84, 98] },
  final: [100, 116],
});
