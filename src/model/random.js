// Seeded pseudo-randomness for natural irregularity between shoots, tillers
// and branches. No three.js, no Math.random: the same seed always gives the
// same plant, on every reload and every frame.
//
// Use it when the model is created, not per frame: draw each shoot's or
// branch's variation once (e.g. `const v = variation(seed, crop.id, 'T2')`)
// and keep the numbers. The model rebuilds geometry on every timeline change,
// so the values must be constants of the plant, never of the time.
//
// The main shoot (cereals) and main raceme (oilseed rape) are never varied:
// `npm run check` measures them against the AHDB stage rules.

// Default seed: the plant everyone sees unless the URL asks for another
// (?seed=<number>).
export const DEFAULT_SEED = 1;

// 32-bit FNV-1a over the parts' text, so any mix of numbers and strings
// (seed, crop id, shoot id) gives a well-spread integer seed.
export function seedOf(...parts) {
  let h = 2166136261;
  for (const p of parts) {
    const s = String(p) + '\u0000';
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
  }
  return h >>> 0;
}

// mulberry32: a tiny, fast PRNG with a 32-bit state. Returns a function that
// gives the next number in [0, 1) each time it is called.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A stream of variation for one plant part, keyed by its parts (e.g. seed,
// crop id, shoot id). Draw values in a fixed order so they stay stable.
//   u()            next uniform number in [0, 1)
//   range(a, b)    uniform between a and b
//   jitter(x)      uniform between -x and +x
//   factor(x)      uniform multiplier between 1 - x and 1 + x
export function variation(...parts) {
  const next = mulberry32(seedOf(...parts));
  next(); // discard the first draw (weakest mixing for similar keys)
  return {
    u: next,
    range: (a, b) => a + (b - a) * next(),
    jitter: (x) => (next() * 2 - 1) * x,
    factor: (x) => 1 + (next() * 2 - 1) * x,
  };
}
