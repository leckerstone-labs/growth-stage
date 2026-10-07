// Keyframe machinery shared by all crops. Each crop supplies its own ROWS
// (src/crops/<crop>/keyframes.js): one row per checkpoint stage, values carry
// forward from the previous row, then each channel is interpolated with a
// monotone spline over the stage's timeline position `t`.
//
// The channels are whatever the crop's first row sets: the cereal ones are
// documented in src/crops/winter-wheat/keyframes.js, oilseed rape's in
// src/crops/winter-oilseed-rape/keyframes.js.

// Build one interpolator per channel, given the stage list (for `t`).
export function buildKeyframes(stages, rows, monotoneSpline) {
  const tByCode = new Map(stages.map((s) => [s.code, s.t]));
  const filled = [];
  let prev = {};
  for (const row of rows) {
    const t = tByCode.get(row.code);
    if (t === undefined) throw new Error(`Keyframe GS${row.code} has no stage`);
    prev = { ...prev, ...row, t };
    filled.push(prev);
  }
  const xs = filled.map((r) => r.t);
  const channels = Object.keys(rows[0]).filter((k) => k !== 'code');
  const fns = {};
  for (const c of channels) fns[c] = monotoneSpline(xs, filled.map((r) => r[c]));
  return (t) => {
    const out = {};
    for (const c of channels) out[c] = fns[c](t);
    return out;
  };
}
