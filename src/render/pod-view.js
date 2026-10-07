// Seed inspection view for oilseed rape: a separate small scene shown instead
// of the plant, like the cereal grain view.
//
//   1. A whole pod from the middle of the main raceme.
//   2. The same pod opened: one valve folded down, showing the central wall
//      (septum) with a row of seeds on each side.
//   3. Loose seeds, enlarged, for judging colour (the field check for
//      ripening and swathing/desiccation timing).

import * as THREE from 'three';
import { clamp, lerp, smoothstep, hash } from '../model/interp.js';
import { rgb, mix } from './materials.js';

const POD_LEN = 5.9; // cm, a mid-raceme pod at final size
const LOOSE = 5; // loose seeds shown enlarged
const ENLARGE = 4;

// Pod body as a grid: x along the pod, radius profile with a short beak.
// arc: 2π for a closed pod, π for one valve.
function podGeometry(R, arc = Math.PI * 2, open = 0) {
  const NU = 40, NV = 16;
  const pos = [], idx = [];
  const beak = 0.9;
  const L = POD_LEN;
  for (let i = 0; i <= NU; i++) {
    const s = ((L + beak) * i) / NU - (L + beak) / 2;
    const u = (s + (L + beak) / 2) / L;
    const r = u > 1 ? 0.035 * (1 - 0.6 * (u - 1) * L / beak) : R * Math.pow(Math.sin(Math.PI * clamp(0.03 + u * 0.97)), 0.35);
    for (let j = 0; j <= NV; j++) {
      const a = -arc / 2 + (arc * j) / NV + open;
      pos.push(s, Math.sin(a) * r, Math.cos(a) * r);
    }
  }
  for (let i = 0; i < NU; i++) {
    for (let j = 0; j < NV; j++) {
      const a = i * (NV + 1) + j, b = a + NV + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export class PodView {
  // params: the crop's params (POD, SEEDS)
  constructor(params) {
    this.P = params;
    this.seedCols = params.SEEDS.map((s) => ({ ...s, col: rgb(s.col), pod: rgb(s.pod) }));
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.HemisphereLight(0xfff8ec, 0x8a7d66, 1.4));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(-2, 3, 4);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xfff0d0, 0.8);
    rim.position.set(3, 1, -3);
    this.scene.add(rim);

    const R = params.POD.r;
    this.podMat = new THREE.MeshStandardMaterial({ roughness: 0.5, side: THREE.DoubleSide });
    this.whole = new THREE.Mesh(podGeometry(R), this.podMat);
    this.whole.position.set(0, 1.35, 0);
    this.whole.rotation.x = 0.35;
    // Opened pod: the back valve stays in place, the front one folds down.
    this.backValve = new THREE.Mesh(podGeometry(R, Math.PI, Math.PI), this.podMat);
    this.frontValve = new THREE.Mesh(podGeometry(R, Math.PI, 0), this.podMat);
    this.septum = new THREE.Mesh(
      new THREE.PlaneGeometry(POD_LEN * 0.94, R * 1.6),
      new THREE.MeshStandardMaterial({ color: 0xf6f3e6, roughness: 0.3, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
    );
    this.opened = new THREE.Group();
    this.opened.add(this.backValve, this.septum);
    this.opened.position.set(0, 0, 0);
    this.opened.rotation.x = 0.55;
    this.frontValve.position.set(0, -0.5, 0.25);
    this.frontValve.rotation.x = 2.3;
    this.opened.add(this.frontValve);

    // Seeds: InstancedMesh needs instanceColor created up front.
    const n = params.POD.seeds;
    const seedMat = new THREE.MeshStandardMaterial({ roughness: 0.35 });
    this.seeds = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 12), seedMat, n);
    this.seeds.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
    this.opened.add(this.seeds);
    this.loose = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 24, 16), seedMat, LOOSE);
    this.loose.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(LOOSE * 3), 3);
    this.scene.add(this.whole, this.opened, this.loose);

    const card = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 5),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#33402f'), roughness: 0.95 }),
    );
    card.position.set(0, 0.1, -1.2);
    this.scene.add(card);
    this.anchors = {};
  }

  colour(s) {
    const S = this.seedCols;
    let i = 0;
    while (i < S.length - 2 && s > S[i + 1].s) i++;
    const f = clamp((s - S[i].s) / (S[i + 1].s - S[i].s));
    return { col: mix(S[i].col, S[i + 1].col, f), pod: mix(S[i].pod, S[i + 1].pod, f), size: lerp(S[i].size, S[i + 1].size, f) };
  }

  // s: seed state of the mid-raceme pod (the `seed` channel).
  update(s) {
    s = clamp(s, 0, 5);
    const c = this.colour(s);
    this.podMat.color.setRGB(...c.pod);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const col = new THREE.Color();
    const n = this.P.POD.seeds;
    // Seeds alternate either side of the septum along the pod. Ripening is
    // uneven, so neighbouring seeds differ a little (mottled at the turn).
    const r0 = 0.1 * c.size; // ~2 mm seed
    for (let i = 0; i < n; i++) {
      const x = lerp(-POD_LEN * 0.43, POD_LEN * 0.43, (i + 0.5) / n);
      const si = clamp(s + (hash('sv', i) - 0.5) * 0.7 * smoothstep(2, 3, s) * (1 - smoothstep(4.6, 5, s)), 0, 5);
      const ci = this.colour(si);
      const r = r0 * (0.9 + 0.2 * hash('ss', i)) * (s < 0.5 ? 0.5 : 1);
      m.compose(new THREE.Vector3(x, (i % 2 ? 1 : -1) * 0.07, 0.11), q, new THREE.Vector3(r, r * 0.92, r));
      this.seeds.setMatrixAt(i, m);
      this.seeds.setColorAt(i, col.setRGB(...ci.col));
    }
    this.seeds.instanceMatrix.needsUpdate = true;
    this.seeds.instanceColor.needsUpdate = true;
    for (let i = 0; i < LOOSE; i++) {
      const si = clamp(s + (hash('lv', i) - 0.5) * 0.7 * smoothstep(2, 3, s) * (1 - smoothstep(4.6, 5, s)), 0, 5);
      const r = r0 * ENLARGE * (0.92 + 0.12 * hash('ls', i));
      m.compose(new THREE.Vector3(-1.6 + i * 0.9, -1.45, 0), q, new THREE.Vector3(r, r * 0.92, r));
      this.loose.setMatrixAt(i, m);
      this.loose.setColorAt(i, col.setRGB(...this.colour(si).col));
    }
    this.loose.instanceMatrix.needsUpdate = true;
    this.loose.instanceColor.needsUpdate = true;
    this.loose.visible = s >= 0.5;
    for (const o of [this.whole, this.opened]) o.updateMatrixWorld(true);
    const w = (o, x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(o.matrixWorld);
    this.anchors = {
      whole: w(this.whole, POD_LEN * 0.3, 0, 0.2),
      septum: w(this.opened, -POD_LEN * 0.25, 0.15, 0.05),
      seed: w(this.opened, POD_LEN * 0.15, 0.07, 0.15),
      valve: w(this.frontValve, POD_LEN * 0.2, 0, 0),
      loose: new THREE.Vector3(-2.1, -1.45, 0),
      // Vertical 1 cm scale bar beside the loose seeds.
      scale0: new THREE.Vector3(2.75, -1.95, 0),
      scale1: new THREE.Vector3(2.75, -0.95, 0),
    };
  }
}

// Field description of the seed state (the `seed` channel).
export function seedStateText(s) {
  if (s < 0.5) return 'Ovules only — pod still lengthening';
  if (s < 1.5) return 'Seeds expanding, pale and translucent';
  if (s < 2.5) return 'Green and soft, filling the pod';
  if (s < 3.5) return 'Green-brown (mottled)';
  if (s < 4.3) return 'Brown';
  if (s < 4.9) return 'Dark brown to black';
  return 'Black and hard';
}
