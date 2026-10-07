// Prints main-shoot measurements at every checkpoint and verifies the AHDB
// stage rules hold in the model, for every crop (or one: --crop <id>).
// Run: npm run check
import { CROPS } from '../src/crops/index.js';
import { createCropModel } from '../src/model/index.js';

const only = process.argv.includes('--crop') ? process.argv[process.argv.indexOf('--crop') + 1] : null;
const f = (x) => x.toFixed(1).padStart(5);
let failed = 0;
for (const crop of CROPS.filter((c) => !only || c.id === only)) {
  const model = createCropModel(crop);
  const { computePlant, measureMain, checkStages } = model;
  console.log(`\n${crop.name}`);
  if (model.table) {
    // Crop families with their own measurements print their own columns.
    console.log(model.table.header);
    for (const s of crop.stages) {
      const p = computePlant(s.t);
      console.log(model.table.row(s, p, measureMain(p)));
    }
  } else {
    console.log(' GS     t | i1    i2    i3    i4   ped | nodes flagE ligule  earTip-lig emerged boot  height pseudo stem shoots');
    for (const s of crop.stages) {
      const p = computePlant(s.t);
      const m = measureMain(p);
      console.log(`GS${s.code} ${f(s.t)} |${m.ints.map(f).join(' ')} ${f(m.ped)} |   ${m.detectable}  ${m.flagEmerge.toFixed(2)} ${f(m.flagLiguleHeight)}  ${f(-m.earTipBelowLigule)}     ${(m.earEmerged * 100).toFixed(0).padStart(3)}%  ${m.bootSwelling.toFixed(2)} ${f(m.height)} ${f(m.pseudostemDiam)} ${f(m.stemDiam)}  ${p.shoots.map((x) => x.id).join(',')}`);
    }
  }
  const fails = checkStages();
  failed += fails.length;
  console.log(fails.length ? `\n${crop.name} FAIL:\n  ${fails.join('\n  ')}` : `\n${crop.name}: all stage checks pass.`);
}
process.exit(failed ? 1 : 0);
