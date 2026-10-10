// Seed inspection view for field beans: a separate small scene shown instead
// of the plant, like the oilseed rape pod view (render/pod-view.js).
//
//   1. A whole pod from the middle of the main stem.
//   2. The same pod opened: one half (valve) with the seeds lying in the
//      white, spongy lining, the other half folded down.
//   3. Loose seeds at true size beside a 1 cm scale, hilum (seed scar) up:
//      the field check for ripening (seed colour and hardness, black hilum).

import * as THREE from 'three';
import { clamp, lerp, smoothstep, hash } from '../model/interp.js';
import { rgb, mix } from './materials.js';

const POD_LEN = 6.8; // cm, a mid-stem pod at final length
const BEAK = 0.5;
const SEEDS = 3; // seeds in the opened pod (field beans: 3–4)
const LOOSE = 3;

// Pod shell as a grid: x along the pod, flattened cross-section, bulging over
// the seeds. arc: 2π closed, π one half (valve) open towards +z.
function podGeometry(R, arc, a0, bulge) {
  const NU = 48, NV = 18;
  const pos = [], idx = [];
  const L = POD_LEN;
  for (let i = 0; i <= NU; i++) {
    const s = ((L + BEAK) * i) / NU;
    const u = s / L;
    let r;
    if (u > 1) r = 0.06 * (1 - (s - L) / BEAK) + 0.01;
    else r = R * Math.pow(Math.sin(Math.PI * clamp(0.04 + u * 0.96)), 0.4) * (1 + bulge * Math.max(0, Math.sin(u * Math.PI * SEEDS)));
    // The beak curves up a little.
    const yOff = u > 0.8 ? 0.35 * Math.pow((u - 0.8) / 0.27, 2) : 0;
    for (let j = 0; j <= NV; j++) {
      const a = a0 + (arc * j) / NV;
      pos.push(s - (L + BEAK) / 2, Math.sin(a) * r * 0.8 + yOff, Math.cos(a) * r);
    }
  }
  for (let i = 0; i < NU; i++) {
    for (let j = 0; j < NV; j++) {
      const a = i * (NV + 1) + j, b = a + NV + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// A bean seed (unit size: length 1 along x), flattened, with a slight notch
// at the hilum on the top edge. Vertex colours are set in update().
function seedGeometry() {
  const g = new THREE.SphereGeometry(0.5, 28, 18);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const notch = 1 - 0.18 * Math.max(0, y * 2) * Math.exp(-x * x * 18);
    p.setXYZ(i, x, y * 0.76 * notch, z * 0.48);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(p.count * 3), 3));
  g.computeVertexNormals();
  return g;
}

export class BeanPodView {
  // params: the crop's params (PODS, SEED, SEEDS, COLOURS)
  constructor(params) {
    this.P = params;
    this.seedCols = params.SEEDS.map((s) => ({ ...s, col: rgb(s.col), pod: rgb(s.pod), hilum: rgb(s.hilum) }));
    this.C = { lining: rgb(params.COLOURS.lining), liningDry: rgb(params.COLOURS.liningDry) };
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.HemisphereLight(0xfff8ec, 0x8a7d66, 1.4));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(-2, 3, 4);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xfff0d0, 0.8);
    rim.position.set(3, 1, -3);
    this.scene.add(rim);

    const R = params.PODS.r;
    this.podMat = new THREE.MeshStandardMaterial({ roughness: 0.55, side: THREE.FrontSide });
    this.liningMat = new THREE.MeshStandardMaterial({ roughness: 0.95, side: THREE.BackSide });
    this.wholeGeo = podGeometry(R, Math.PI * 2, 0, 0.12);
    this.whole = new THREE.Mesh(this.wholeGeo, this.podMat);
    this.whole.position.set(-0.4, 2.15, 0);
    // Opened pod: the back half stays, open towards the viewer; the front
    // half is folded down below it.
    const half = podGeometry(R, Math.PI, Math.PI / 2, 0.08);
    this.opened = new THREE.Group();
    this.opened.add(new THREE.Mesh(half, this.podMat), new THREE.Mesh(half, this.liningMat));
    this.opened.position.set(-0.4, 0.35, 0);
    this.opened.rotation.x = 0.25;
    this.front = new THREE.Group();
    this.front.add(new THREE.Mesh(half, this.podMat), new THREE.Mesh(half, this.liningMat));
    this.front.position.set(-0.4, -0.95, 0.15);
    this.front.rotation.x = 0.45;
    this.scene.add(this.whole, this.opened, this.front);

    this.seedGeo = seedGeometry();
    this.seedMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45 });
    this.inPod = [];
    for (let i = 0; i < SEEDS; i++) {
      const m = new THREE.Mesh(this.seedGeo, this.seedMat);
      this.opened.add(m);
      this.inPod.push(m);
    }
    this.loose = [];
    for (let i = 0; i < LOOSE; i++) {
      const m = new THREE.Mesh(this.seedGeo, this.seedMat);
      this.scene.add(m);
      this.loose.push(m);
    }

    const card = new THREE.Mesh(
      new THREE.PlaneGeometry(13, 8),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#33402f'), roughness: 0.95 }),
    );
    card.position.set(0, -0.1, -1.4);
    this.scene.add(card);
    this.anchors = {};
  }

  colour(s) {
    const S = this.seedCols;
    let i = 0;
    while (i < S.length - 2 && s > S[i + 1].s) i++;
    const f = clamp((s - S[i].s) / (S[i + 1].s - S[i].s));
    return { col: mix(S[i].col, S[i + 1].col, f), pod: mix(S[i].pod, S[i + 1].pod, f), hilum: mix(S[i].hilum, S[i + 1].hilum, f), size: lerp(S[i].size, S[i + 1].size, f) };
  }

  // s: seed state of the mid-stem pod (the `seed` channel).
  update(s) {
    s = clamp(s, 0, 5);
    const c = this.colour(s);
    this.podMat.color.setRGB(...c.pod);
    // Green pods are downy (matt); ripe black pods leathery with a slight sheen.
    this.podMat.roughness = lerp(0.82, 0.52, smoothstep(4, 5, s));
    this.liningMat.color.setRGB(...mix(this.C.lining, this.C.liningDry, smoothstep(3.5, 5, s)));
    // Seed colours: coat, with the hilum along the top edge.
    const pos = this.seedGeo.attributes.position, col = this.seedGeo.attributes.color;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const h = y > 0.3 && Math.abs(x) < 0.17 ? 1 : 0;
      const k = mix(c.col, c.hilum, h);
      col.setXYZ(i, k[0], k[1], k[2]);
    }
    col.needsUpdate = true;
    const SL = this.P.SEED.len;
    const size = c.size * (s < 0.5 ? 0.25 : 1);
    // Seeds in the opened half, spaced along the pod, flat side up to the
    // viewer, hilum towards the pod's upper seam.
    for (let i = 0; i < SEEDS; i++) {
      const m = this.inPod[i];
      const x = lerp(-POD_LEN * 0.4, POD_LEN * 0.4, (i + 0.5) / SEEDS) - BEAK / 2;
      const k = SL * size * (0.92 + 0.12 * hash('bs', i));
      m.scale.set(k, k, k);
      m.position.set(x, 0, -0.05);
      m.rotation.set(0, 0, (hash('br', i) - 0.5) * 0.25); // flat side to the viewer
    }
    for (let i = 0; i < LOOSE; i++) {
      const m = this.loose[i];
      const k = SL * size * (0.94 + 0.1 * hash('bl', i));
      m.scale.set(k, k, k);
      m.position.set(-2.6 + i * 2.1, -2.75, 0.2);
      m.rotation.set(0, 0, (hash('blr', i) - 0.5) * 0.3);
    }
    for (const o of [this.whole, this.opened, this.front]) o.updateMatrixWorld(true);
    const w = (o, x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(o.matrixWorld);
    this.anchors = {
      whole: w(this.whole, POD_LEN * 0.15, 0.3, 0.3),
      seed: w(this.opened, -POD_LEN * 0.28, 0.1, 0.2),
      lining: w(this.opened, POD_LEN * 0.05, -0.45, -0.2),
      valve: w(this.front, POD_LEN * 0.25, -0.2, 0),
      loose: new THREE.Vector3(-2.6, -2.75, 0.4),
      hilum: new THREE.Vector3(1.6, -2.75 + SL * size * 0.33, 0.4),
      // Vertical 1 cm scale bar beside the loose seeds.
      scale0: new THREE.Vector3(3.9, -3.25, 0),
      scale1: new THREE.Vector3(3.9, -2.25, 0),
    };
  }
}

// Field description of the seed state (the `seed` channel).
export function beanSeedText(s) {
  if (s < 0.5) return 'Ovules only — pod still lengthening';
  if (s < 1.5) return 'Seeds expanding, soft and pale green';
  if (s < 2.5) return 'Green and soft, filling the pod';
  if (s < 3.5) return 'Full size, yellow-green; hilum turning black';
  if (s < 4.5) return 'Pod blackening; seed firm, buff';
  return 'Pod black; seed dry and hard, buff with a black hilum';
}
