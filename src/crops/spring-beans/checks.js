// Stage rules for field beans (BBCH faba bean key), checked by
// `npm run check` and at start-up. Shared by spring and winter beans:
// beanChecks(opts) returns the checks for one variant.
//
// Helpers: { at(code) → measureMain(), plantAt(code) → computePlant(),
// expect(code, ok, msg), SEED_DEPTH, params }
//
// opts: { leafCodes: [[code, leaves]…], shootCodes: [[code, shoots]…],
//         extendCode, height: [lo, hi] cm, podsPlant: [lo, hi] }

const pct = (x) => `${Math.round(x * 100)}%`;

export function beanChecks(opts) {
  return function checks({ at, plantAt, expect, params }) {
    // Germination and emergence (hypogeal: the seed stays below ground).
    let m = at(5);
    expect(5, m.rootLen > 0 && m.epiLen === 0, 'radicle only');
    m = at(7);
    expect(7, m.epiLen > 0 && m.hookTop < -0.5, `shoot out of the seed, below ground (tip ${m.hookTop.toFixed(2)} cm)`);
    m = at(9);
    expect(9, m.hookTop > -0.05 && m.hookTop < 1, `hook breaking the soil surface (${m.hookTop.toFixed(2)} cm)`);
    m = at(10);
    expect(10, m.hook < 0.05, 'shoot straightened');
    expect(10, m.scaleY[0] < 0 && m.scaleY[1] > 0 && m.scaleY[1] < 1, `scale leaves at the soil surface (${m.scaleY.map((y) => y.toFixed(1)).join(', ')} cm)`);
    expect(10, m.leavesUnfolded === 0, 'no true leaf unfolded');
    const p10 = plantAt(10);
    expect(10, p10.seedling.seedY < -5, 'seed still below ground (hypogeal)');

    // Leaf development: unfolded true leaves on the main stem.
    for (const [code, n] of [[11, 1], [12, 2], [13, 3], ...opts.leafCodes]) {
      m = at(code);
      expect(code, m.leavesUnfolded === n, `${n} leaves unfolded (${m.leavesUnfolded})`);
    }
    expect(12, at(12).leafletsOf(1) === 2 && at(12).leafletsOf(2) === 2, 'first leaves have two leaflets');
    expect(13, at(13).sideShoots === 0, 'no side shoots yet');
    // Side shoots (winter beans) and extended internodes.
    for (const [code, n] of opts.shootCodes) {
      m = at(code);
      expect(code, m.sideShoots === n, `${n} side shoots (${m.sideShoots})`);
    }
    m = at(opts.extendCode);
    expect(opts.extendCode, m.extended >= 3, `stem extending: 3 or more extended internodes (GS3x readout, ${m.extended})`);

    // Flower buds on the main stem.
    m = at(50);
    expect(50, m.budsPresent && !m.budsVisible, 'flower buds present, enclosed by leaves');
    m = at(51);
    expect(51, m.budsVisible && !m.budsSeparate, 'buds visible outside the leaves, still clustered');
    m = at(55);
    expect(55, m.budsSeparate && !m.petalsVisible, 'individual buds visible, closed');
    m = at(59);
    expect(59, m.petalsVisible && m.racemesFlowered === 0, 'petals visible, no flower open');

    // Flowering: racemes with open flowers on the main stem.
    m = at(60);
    expect(60, m.openNow > 0 && m.racemesFlowered === 1, `first flowers open (${m.openNow})`);
    m = at(61);
    expect(61, m.racemesOpen >= 1 && m.racemesOpen < 3, `flowers open on the first raceme (${m.racemesOpen})`);
    m = at(63);
    expect(63, m.racemesOpen >= 3 && m.racemesOpen < 5, `flowers open on 3 racemes (${m.racemesOpen})`);
    const full = at(65);
    expect(65, full.racemesOpen >= 5, `flowers open on 5 racemes (${full.racemesOpen})`);
    expect(65, full.pods > 0, 'lowest flowers have set pods');
    m = at(67);
    expect(67, m.openNow > 0 && m.openNow < full.openNow && m.budsLeft === 0, `flowering declining (${m.openNow} open, ${full.openNow} at GS65)`);
    m = at(69);
    expect(69, m.openNow === 0, `no open flowers (${m.openNow})`);
    expect(69, m.pods === m.podSlots, `all pods set (${m.pods})`);
    expect(69, m.podsFinal === 0, 'no pod at final length yet');

    // Pod development: share of pods at final length.
    for (const [code, lo, hi] of [[71, 0.1, 0.3], [75, 0.5, 0.7]]) {
      m = at(code);
      expect(code, m.podsFinal >= lo && m.podsFinal < hi, `${pct(lo)} of pods at final length (${pct(m.podsFinal)})`);
    }
    m = at(79);
    expect(79, m.podsFinal >= 0.85, `nearly all pods at final length (${pct(m.podsFinal)})`);
    expect(79, m.podsBlack === 0, 'no ripe pods yet');

    // Ripening: share of pods ripe and dark (black), from the bottom up.
    m = at(80);
    expect(80, m.podsBlack === 0 && m.midSeed >= 2 && m.midSeed < 3, `seeds green, filling the pod (seed ${m.midSeed.toFixed(1)})`);
    for (const [code, lo, hi] of [[81, 0.1, 0.3], [83, 0.3, 0.5], [85, 0.5, 0.7]]) {
      m = at(code);
      expect(code, m.podsBlack >= lo && m.podsBlack < hi, `${pct(lo)} of pods ripe and dark (${pct(m.podsBlack)})`);
    }
    m = at(83);
    expect(83, m.lowestPodSeed > m.topPodSeed + 1, 'pods ripen from the bottom up');
    m = at(89);
    expect(89, m.podsBlack >= 0.9, `nearly all pods ripe (${pct(m.podsBlack)})`);
    expect(89, m.stemsDark < 0.2, `stems not yet dark (${pct(m.stemsDark)})`);

    // Senescence: stems darken.
    m = at(95);
    expect(95, m.stemsDark >= 0.4 && m.stemsDark < 0.7, `about half of the stems dark (${pct(m.stemsDark)})`);
    m = at(97);
    expect(97, m.stemsDark >= 0.95 && m.leavesGreen === 0, 'plant dead and dry');

    // Size benchmarks (estimates: see params.js).
    m = at(89);
    expect(89, m.height >= opts.height[0] && m.height <= opts.height[1], `final height ${opts.height.join('–')} cm (${m.height.toFixed(0)})`);
    expect(89, m.podsPlant >= opts.podsPlant[0] && m.podsPlant <= opts.podsPlant[1], `${opts.podsPlant.join('–')} pods per plant (${m.podsPlant})`);
    const spp = m.seedsPlant / m.podsPlant;
    expect(89, spp >= 3 && spp <= 4, `3–4 seeds per pod (${spp.toFixed(1)})`);
    expect(60, at(60).firstFlowerLeaf === params.FLOWERING.first, 'first raceme at the first flowering node');
    // Nodules: present by flowering (roots channel past ROOTS.nodules.full).
    expect(60, at(60).rootLen >= params.ROOTS.nodules.from, 'nodules on the roots by flowering');
  };
}

export const checks = beanChecks({
  leafCodes: [[14, 4], [16, 6]],
  shootCodes: [[16, 0]],
  extendCode: 16,
  height: [80, 110],
  podsPlant: [7, 14],
});
