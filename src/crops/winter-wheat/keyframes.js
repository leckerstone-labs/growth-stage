// Visual key states for winter wheat, one row per checkpoint stage.
//
// Each row describes the MAIN SHOOT at that checkpoint. Values carry forward
// from the previous row unless overridden, then every channel is interpolated
// with a monotone spline over the timeline position `t` (from the crop's stages.js).
// Tillers reuse the same table with a small delay (see src/model/morphology.js).
//
// Rows are authored so the stage definitions hold exactly at each checkpoint
// (e.g. at GS31 internode 1 >= 1 cm and internode 2 < 2 cm). checkStages()
// (checks.js) verifies this at start-up.
//
// Channels
//   vH      main-shoot leaf clock (Haun stage). Leaf n emerges between vH = n-1
//           and n (negative before the first leaf appears). Keeps running
//           after the flag leaf (leaf 11) to drive bottom-up leaf senescence.
//   habit   0 = prostrate winter habit, 1 = erect. Seedlings start fairly
//           upright, spread during tillering, then stand up again at GS30.
//   coleo   coleoptile length from the seed, cm (reaches the surface at GS09)
//   subcrown  sub-crown internode, cm: lifts the growing point from the seed
//           towards the surface, where the crown forms
//   roots   seminal root length, cm;  crownRoots  crown (nodal) root length, cm
//   i1..i4  elongating internode lengths above the base node, cm
//   ped     peduncle (top internode) length, cm — used up to GS39; after that
//           the peduncle is derived from earPos so ear emergence is exact
//   earPos  (ear tip height − flag-leaf ligule height) / ear length.
//           < 0 ear enclosed, 0..1 emerging, > 1 base of ear above the ligule
//   flagS   0..1 extension of the flag leaf sheath after GS39
//   earL    ear length, cm (main shoot final ≈ 9 cm)
//   earW    ear width as a fraction of final
//   open    0..1 flag leaf sheath splitting at the top (GS47)
//   flower  flowering progress: florets flower when this passes their rank
//   fill    0..1 grain fill (spikelets swell)
//   ripe    0..1 ripening colour of ear and straw
//   grain   grain contents: 0 none, 1 watery, 2 milk, 3 late milk,
//           3.5 soft dough, 4 hard dough, 5 hard (harvest ripe)

export const ROWS = [
  { code: 5, vH: -1.6, habit: 0.8, coleo: 0, subcrown: 0, roots: 0.5, crownRoots: 0,
    i1: 0, i2: 0, i3: 0, i4: 0, ped: 0, earPos: -1, flagS: 0,
    earL: 0.02, earW: 0.08, open: 0, flower: 0, fill: 0, ripe: 0, grain: 0 },
  { code: 7, vH: -1.0, coleo: 0.8, roots: 2.5 },
  { code: 9, vH: -0.15, coleo: 3.3, subcrown: 0.9, roots: 4 },
  { code: 10, vH: 0.4, coleo: 3.5, subcrown: 1.5, roots: 5.5 },
  { code: 11, vH: 1.0, habit: 0.75, subcrown: 1.8, roots: 6.5 },
  { code: 12, vH: 2.0, habit: 0.68, subcrown: 2.0, roots: 8 },
  { code: 13, vH: 3.0, habit: 0.55, roots: 9, crownRoots: 0.6 },
  { code: 21, vH: 3.6, habit: 0.25, roots: 10, crownRoots: 2, earL: 0.05, earW: 0.1 },
  { code: 22, vH: 4.5, habit: 0.08 },
  { code: 23, vH: 5.4, habit: 0.08 },
  { code: 24, vH: 6.4, habit: 0.3, earL: 0.15, earW: 0.12, crownRoots: 5 },
  { code: 30, vH: 7.5, habit: 0.7, i1: 0.55, i2: 0.2, i3: 0.05, earL: 0.3, earW: 0.15, crownRoots: 8, roots: 12 },
  { code: 31, vH: 8.15, habit: 0.86, i1: 1.3, i2: 0.9, i3: 0.3, i4: 0.1, ped: 0.02, earL: 0.5, earW: 0.2 },
  { code: 32, vH: 9.05, habit: 0.95, i1: 3.0, i2: 2.15, i3: 0.8, i4: 0.25, ped: 0.05, earL: 1.0, earW: 0.26 },
  { code: 33, vH: 9.75, habit: 1, i1: 3.8, i2: 4.3, i3: 2.15, i4: 0.7, ped: 0.1, earL: 2.0, earW: 0.32 },
  { code: 37, vH: 10.2, i1: 4, i2: 6.5, i3: 5, i4: 1.6, ped: 0.3, earL: 4, earW: 0.22 },
  { code: 39, vH: 11.0, i2: 7.5, i3: 9, i4: 5, ped: 0.8, earL: 6, earW: 0.24 },
  { code: 41, vH: 11.4, i2: 8, i3: 10.5, i4: 8, earPos: -0.22, flagS: 0.35, earL: 7, earW: 0.27 },
  { code: 43, vH: 11.7, i3: 11.5, i4: 11, earPos: -0.2, flagS: 0.65, earL: 8, earW: 0.36 },
  { code: 45, vH: 12.0, i3: 12, i4: 14, earPos: -0.16, flagS: 0.9, earL: 8.7, earW: 0.56 },
  { code: 47, vH: 12.3, i4: 15.5, earPos: -0.1, flagS: 1, earL: 9, earW: 0.62, open: 0.6 },
  { code: 49, vH: 12.5, i4: 16, earPos: -0.03, open: 0.8 },
  { code: 51, vH: 12.7, i4: 16.5, earPos: 0.08, open: 1, earW: 0.85 },
  { code: 55, vH: 13.0, i4: 17, earPos: 0.5, earW: 0.92 },
  { code: 59, vH: 13.3, earPos: 1.03, earW: 0.96 },
  { code: 61, vH: 13.6, earPos: 1.4, flower: 0.1 },
  { code: 65, vH: 14.0, earPos: 1.8, flower: 0.36, earW: 1 },
  { code: 69, vH: 14.4, earPos: 2.05, flower: 0.75 },
  { code: 71, vH: 14.8, earPos: 2.15, flower: 1.0, fill: 0.1, ripe: 0.04, grain: 1 },
  { code: 75, vH: 15.4, earPos: 2.2, flower: 1.2, fill: 0.6, ripe: 0.12, grain: 2, earW: 1 },
  { code: 77, vH: 15.9, flower: 1.3, fill: 0.8, ripe: 0.25, grain: 3 },
  { code: 85, vH: 16.5, fill: 0.95, ripe: 0.5, grain: 3.5 },
  { code: 87, vH: 17.0, fill: 1, ripe: 0.72, grain: 4 },
  { code: 89, vH: 17.6, ripe: 0.9, grain: 4.6 },
  { code: 92, vH: 18.0, fill: 0.97, ripe: 1, grain: 5 },
];
