// Draws a root system from model/roots.js into a merged Batch (one draw call
// for every root of the plant). Shared by the cereal and brassica meshes.

import * as THREE from 'three';
import { hash } from '../model/interp.js';
import { computeRoots } from '../model/roots.js';
import { mix, rgb } from './materials.js';

const TWO_PI = Math.PI * 2;
const RAD = { tap: 10, seminal: 4, nodal: 4, lateral: 3 }; // sides per tube

// colours: { root, old, collar? } as linear RGB triples. Older (upper) parts
// of a root are a little darker and browner than the white growing tips.
export function drawRoots(batch, system, colours) {
  const t = new THREE.Vector3(), side = new THREE.Vector3(), up = new THREE.Vector3();
  const Y = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0);
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  system.roots.forEach((root, k) => {
    const { pts, r } = root;
    const n = pts.length - 1;
    if (n < 1) return;
    const rad = RAD[root.kind] || 4;
    const tone = hash('rc', k) * 0.6;
    const base = mix(colours.root, colours.old, tone);
    const collar = root.kind === 'tap' && colours.collar;
    let ring = -1, col = null;
    batch.grid(n, rad, (i, j, o) => {
      if (i !== ring) {
        // Once per ring: the frame across the root and the colour.
        ring = i;
        a.fromArray(pts[Math.max(i - 1, 0)]);
        b.fromArray(pts[Math.min(i + 1, n)]);
        t.subVectors(b, a).normalize();
        side.crossVectors(Math.abs(t.y) < 0.9 ? Y : X, t).normalize();
        up.crossVectors(side, t); // so the faces point outwards
        // Pale at the tip, a little darker towards the base.
        col = collar ? mix(base, colours.collar, Math.max(0, 1 - i / 8)) : mix(colours.root, base, 1 - i / n);
      }
      const ang = (TWO_PI * j) / rad;
      o.p.fromArray(pts[i]).addScaledVector(side, Math.cos(ang) * r[i]).addScaledVector(up, Math.sin(ang) * r[i]);
      o.c = col; o.u = 0; o.v = 0;
    });
  });
  // Nodules: small rounded swellings, pinkish-buff.
  const nodCol = colours.nodule || rgb('#d9a98f');
  for (const nd of system.nodules) {
    const c = new THREE.Vector3().fromArray(nd.p);
    batch.grid(4, 6, (i, j, o) => {
      const th = (Math.PI * i) / 4, ph = (TWO_PI * j) / 6;
      o.p.set(c.x + nd.r * Math.sin(th) * Math.cos(ph), c.y + nd.r * 0.8 * Math.cos(th), c.z + nd.r * Math.sin(th) * Math.sin(ph));
      o.c = nodCol; o.u = 0; o.v = 0;
    }, true);
  }
}

// Rebuild a mesh's roots batch. args: { spec, st, stub, colours } saved by
// the mesh's build (null: no roots in this view); opts: { clip, minR }.
// Returns the root system drawn (for labels and readouts).
export function redrawRoots(batch, args, opts) {
  batch.reset();
  let system = { roots: [], nodules: [], cut: false };
  if (args) {
    system = computeRoots(args.spec, args.st, { ...opts, stub: args.stub });
    drawRoots(batch, system, args.colours);
  }
  batch.commit();
  return system;
}
