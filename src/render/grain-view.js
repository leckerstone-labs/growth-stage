// Grain inspection view: a separate small scene shown instead of the plant.
//
// Three grains from the middle of the ear, ×~10:
//   1. Whole grain, dorsal side (germ at the base).
//   2. Grain cut across, showing the contents.
//   3. The field test: squeezing (watery/milky contents), rolling (soft
//      dough), a held thumbnail impression (hard dough) or no dent (hard).

import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../model/interp.js';
import { rgb, mix } from './materials.js';

// Keyed by the `grain` channel (see keyframes.js). Wheat by default; a crop
// can supply its own in params.GRAIN.states (same keys).
const STATES = [
  { g: 0, len: 0.25, wid: 0.08, dep: 0.07, coat: '#dfe6c2', fill: '#eef1e0' },
  { g: 1, len: 0.48, wid: 0.17, dep: 0.14, coat: '#c7d79a', fill: '#e6eedc' }, // watery
  { g: 2, len: 0.66, wid: 0.29, dep: 0.25, coat: '#9fbf5f', fill: '#f7f5ec' }, // milk
  { g: 3, len: 0.67, wid: 0.33, dep: 0.29, coat: '#b5c262', fill: '#f3ecd6' }, // late milk
  { g: 3.5, len: 0.67, wid: 0.34, dep: 0.30, coat: '#d2b964', fill: '#ecdfba' }, // soft dough
  { g: 4, len: 0.66, wid: 0.34, dep: 0.30, coat: '#d2a556', fill: '#ebdfbf' }, // hard dough
  { g: 5, len: 0.64, wid: 0.33, dep: 0.29, coat: '#bf8e4c', fill: '#f3ecd9' }, // hard
];

export function stateAt(g, states = STATES) {
  let i = 0;
  while (i < states.length - 2 && g > states[i + 1].g) i++;
  const a = states[i], b = states[i + 1];
  const t = clamp((g - a.g) / (b.g - a.g));
  return {
    len: lerp(a.len, b.len, t), wid: lerp(a.wid, b.wid, t), dep: lerp(a.dep, b.dep, t),
    coat: mix(rgb(a.coat), rgb(b.coat), t), fill: mix(rgb(a.fill), rgb(b.fill), t),
  };
}

// Grain shape. Wheat (default): a naked caryopsis — ovoid, deep ventral
// crease, germ (embryo) at the base of the dorsal side, brush hairs at the
// apex. Barley (params.GRAIN.shape): hulled — the lemma and palea stay on the
// grain, so it is spindle-shaped with a shallow crease, faint ridges (lemma
// veins) and an awn stub at the tip instead of brush hairs.
//   a, b: profile exponents (base, tip; larger = more pointed)
//   crease: depth of the ventral crease (0..1), ridges: lemma vein ridges,
//   germ: germ visible through the coat (0..1), tip: 'brush' or 'awn'
const WHEAT_SHAPE = { a: 0.45, b: 0.6, crease: 0.85, ridges: 0, germ: 0.45, tip: 'brush' };

// y = length, x = width, z = depth (+z dorsal, −z ventral/crease side).
export function grainGeometry(st, { dent = 0, shape = WHEAT_SHAPE } = {}) {
  const U = 40, V = 36;
  const pos = [], col = [], idx = [];
  const germ = rgb('#c79a5a');
  const { a, b } = shape;
  const norm = Math.pow(a / (a + b), a) * Math.pow(b / (a + b), b);
  for (let i = 0; i <= U; i++) {
    const u = i / U;
    const f = (Math.pow(u, a) * Math.pow(1 - u, b)) / norm;
    for (let j = 0; j <= V; j++) {
      const v = (j / V) * Math.PI * 2;
      let x = Math.cos(v) * st.wid / 2 * f;
      let z = Math.sin(v) * st.dep / 2 * f;
      // Ventral crease: a deep groove down the middle of the −z side.
      if (z < 0) {
        const cx = x / (st.wid / 2 * Math.max(f, 1e-3));
        z *= 1 - shape.crease * Math.exp(-Math.pow(cx / 0.22, 2)) * smoothstep(0.03, 0.2, u) * smoothstep(0.03, 0.2, 1 - u);
        z *= 0.9;
      }
      // Thumbnail impression across the dorsal side (hard dough).
      if (dent > 0 && z > 0) {
        const d = Math.exp(-Math.pow((u - 0.55) / 0.06, 2)) * Math.pow(Math.max(0, Math.sin(v)), 2);
        z -= dent * d * st.dep * 0.28;
      }
      if (shape.ridges) {
        const k = 1 + shape.ridges * Math.cos(v * 10) * smoothstep(0.05, 0.3, u) * smoothstep(0.05, 0.3, 1 - u);
        x *= k; z *= k;
      }
      const y = (u - 0.5) * st.len;
      pos.push(x, y, z);
      // Germ: a slightly darker, wrinkled oval at the dorsal base.
      const gx = x / (st.wid * 0.3), gy = (u - 0.08) / 0.11;
      const inGerm = z > 0 && gx * gx + gy * gy < 1 ? 1 : 0;
      const c = mix(st.coat, germ, inGerm * shape.germ);
      col.push(...c);
    }
  }
  for (let i = 0; i < U; i++) {
    for (let j = 0; j < V; j++) {
      const p = i * (V + 1) + j, q = p + V + 1;
      idx.push(p, q, p + 1, q, q + 1, p + 1); // outward-facing
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export class GrainView {
  // grain: the crop's params.GRAIN ({ states, shape }), or wheat if absent.
  constructor(grain = {}) {
    this.states = grain.states || STATES;
    this.shape = grain.shape || WHEAT_SHAPE;
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.HemisphereLight(0xfff8ec, 0x8a7d66, 1.4));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(-2, 3, 4);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xfff0d0, 0.8);
    rim.position.set(3, 1, -3);
    this.scene.add(rim);

    // Each grain is placed in front of a small card so it reads clearly.
    this.clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
    this.coatMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, side: THREE.FrontSide });
    this.cutCoatMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, clippingPlanes: [this.clip] });
    this.fillMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide, clippingPlanes: [this.clip], toneMapped: false });
    this.dropMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.08, transparent: true, opacity: 0.6, clearcoat: 1 });
    this.whole = new THREE.Mesh(new THREE.BufferGeometry(), this.coatMat);
    this.cutCoat = new THREE.Mesh(new THREE.BufferGeometry(), this.cutCoatMat);
    this.cutFill = new THREE.Mesh(this.cutCoat.geometry, this.fillMat);
    this.test = new THREE.Mesh(new THREE.BufferGeometry(), this.coatMat);
    this.drop = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), this.dropMat);
    this.dough = new THREE.Mesh(new THREE.CapsuleGeometry(1, 2.2, 6, 12), new THREE.MeshStandardMaterial({ roughness: 0.9 }));
    this.brush = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xf2ecd8 }));

    this.wholeG = new THREE.Group(); this.wholeG.position.set(-1.1, 0, 0);
    this.cutG = new THREE.Group(); this.cutG.position.set(0, 0, 0);
    this.testG = new THREE.Group(); this.testG.position.set(1.1, 0, 0);
    this.wholeG.add(this.whole, this.brush);
    this.cutG.add(this.cutCoat, this.cutFill);
    this.testG.add(this.test, this.drop, this.dough);
    // Show the cut grain tilted so the cut face looks at the viewer.
    this.cutG.rotation.set(1.1, 0, 0);
    this.wholeG.rotation.set(0.15, 0.25, 0);
    this.testG.rotation.set(0.2, -0.3, 0);
    this.scene.add(this.wholeG, this.cutG, this.testG);
    // Dark specimen card behind the grains so pale contents read clearly.
    const card = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 1.5),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#33402f'), roughness: 0.95 }),
    );
    card.position.set(0, -0.05, -0.6);
    this.scene.add(card);
    this.target = new THREE.Vector3(0, 0, 0);
    this.anchors = {};
  }

  update(K) {
    const g = K.grain;
    const st = stateAt(g, this.states);
    const shape = this.shape;
    const geo = grainGeometry(st, { shape });
    for (const m of [this.whole, this.cutCoat]) { m.geometry.dispose(); }
    this.whole.geometry = geo;
    const cutGeo = grainGeometry(st, { shape });
    this.cutCoat.geometry = cutGeo;
    this.cutFill.geometry = cutGeo;
    this.clip.constant = 0; // cut across the middle; plane follows the group
    this.fillMat.color.setRGB(...st.fill);
    // Watery contents are translucent: show the cut as darker/greener.
    if (g < 1.6) this.fillMat.color.setRGB(...mix(st.fill, rgb('#c7d6a8'), 0.6 * (1 - smoothstep(1, 1.6, g))));

    const dent = smoothstep(3.6, 4, g) * (1 - smoothstep(4.3, 4.8, g));
    this.test.geometry.dispose();
    this.test.geometry = grainGeometry(st, { dent, shape });

    // Squeeze test: a droplet of contents for watery and milky grain.
    const liquid = g >= 0.8 && g < 3.3;
    this.drop.visible = liquid;
    if (liquid) {
      const milky = smoothstep(1.2, 2, g);
      const thick = smoothstep(2.2, 3.1, g);
      this.dropMat.color.setRGB(...mix(rgb('#e8f0f4'), rgb('#fbfaf3'), milky));
      this.dropMat.opacity = lerp(0.45, 0.97, milky);
      this.dropMat.roughness = lerp(0.05, 0.35, thick);
      const r = lerp(0.05, 0.075, milky) * (1 - 0.3 * thick);
      this.drop.scale.set(r * 1.15, r * (1 - 0.25 * thick), r);
      this.drop.position.set(st.wid / 2 + r * 0.55, -0.05, st.dep * 0.2); // bead of contents squeezed out at the side
    }
    // Soft dough: contents roll into a little worm.
    const doughy = g >= 3.3 && g < 3.85;
    this.dough.visible = doughy;
    if (doughy) {
      this.dough.material.color.setRGB(...st.fill);
      this.dough.scale.setScalar(0.035);
      this.dough.rotation.set(0, 0, 1.2);
      this.dough.position.set(0.05, -0.38, 0.05);
    }

    // Brush hairs at the apex of the whole grain (wheat), or the base of the
    // broken-off awn (barley).
    const bp = [];
    if (shape.tip === 'awn' && g > 0.5) {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const x = Math.cos(a) * 0.006, z = Math.sin(a) * 0.006 + st.dep * 0.12;
        bp.push(x, st.len / 2 - 0.02, z, x * 0.5, st.len / 2 + 0.12, z);
      }
    } else if (shape.tip === 'brush' && g > 1.5) {
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        const x = Math.cos(a) * 0.02, z = Math.sin(a) * 0.02;
        bp.push(x, st.len / 2 - 0.01, z, x * 4, st.len / 2 + 0.06, z * 4);
      }
    }
    this.brush.geometry.dispose();
    this.brush.geometry = new THREE.BufferGeometry();
    this.brush.geometry.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3));

    // Clip plane in world space: across the cut grain's middle.
    this.cutG.updateMatrixWorld(true);
    const n = new THREE.Vector3(0, -1, 0).transformDirection(this.cutG.matrixWorld);
    const p = new THREE.Vector3(0, 0.02, 0).applyMatrix4(this.cutG.matrixWorld);
    this.clip.setFromNormalAndCoplanarPoint(n, p);

    this.state = { g, st, dent, liquid, doughy };
    this.wholeG.updateMatrixWorld(true);
    this.testG.updateMatrixWorld(true);
    const w = (grp, x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(grp.matrixWorld);
    this.anchors = {
      whole: w(this.wholeG, 0, -st.len / 2 - 0.05, 0),
      germ: w(this.wholeG, 0, -st.len * 0.4, st.dep / 2),
      cut: w(this.cutG, 0, 0, 0),
      test: w(this.testG, 0, -st.len / 2 - 0.05, 0),
      scale0: new THREE.Vector3(-1.35, -0.62, 0),
      scale1: new THREE.Vector3(-0.85, -0.62, 0),
    };
  }
}

export function grainStateText(g) {
  if (g < 0.5) return { title: 'No grain yet', test: '' };
  if (g < 1.5) return { title: 'Watery ripe', test: 'Squeezed: clear, watery liquid' };
  if (g < 2.5) return { title: 'Milky', test: 'Squeezed: white milky liquid' };
  if (g < 3.25) return { title: 'Late milk', test: 'Squeezed: thick, creamy milk' };
  if (g < 3.8) return { title: 'Soft dough', test: 'Contents doughy, no liquid; dent does not hold' };
  if (g < 4.4) return { title: 'Hard dough', test: 'Thumbnail impression is held' };
  if (g < 4.85) return { title: 'Hard', test: 'Difficult to divide with a thumbnail' };
  return { title: 'Harvest ripe', test: 'Cannot be dented by a thumbnail' };
}
