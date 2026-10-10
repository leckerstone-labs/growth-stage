// Soil shown as a cut-away block, like a botanical plate: the far half of the
// surface plus a vertical cut face through the plant, so the seed, coleoptile
// and roots can be seen below ground. The block turns to face the camera.
// Every crop uses the same block; src/views/below-ground.js sets its depth
// (deeper as the plant grows) and frames it.

import * as THREE from 'three';

// Cut face texture for a block `depth` cm deep: soil crumbs the same size
// whatever the depth, darker near the surface, fading out at the bottom and
// at the sides.
const PX_PER_CM = 10.7; // 512 px across the 48 cm wide face
function profileTexture(depth) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = Math.max(64, Math.round(depth * PX_PER_CM));
  const W = c.width, H = c.height;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(118,96,70,1)');
  grad.addColorStop(0.55, 'rgba(132,110,82,0.95)');
  grad.addColorStop(1, 'rgba(150,130,100,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'source-atop';
  // Seeded, so the crumbs stay put when the block deepens.
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const n = Math.round((1800 * H) / 256);
  for (let i = 0; i < n; i++) {
    const r = rnd() * 2.4 + 0.4;
    g.fillStyle = rnd() < 0.5 ? 'rgba(205,185,150,0.22)' : 'rgba(55,40,28,0.22)';
    g.beginPath();
    g.arc(rnd() * W, rnd() * H, r, 0, Math.PI * 2);
    g.fill();
  }
  // Fade out towards the sides so the block has soft edges.
  g.globalCompositeOperation = 'destination-in';
  const side = g.createLinearGradient(0, 0, W, 0);
  side.addColorStop(0, 'rgba(0,0,0,0)');
  side.addColorStop(0.18, 'rgba(0,0,0,1)');
  side.addColorStop(0.82, 'rgba(0,0,0,1)');
  side.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = side;
  g.fillRect(0, 0, W, H);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class SoilBlock {
  constructor(surfaceMaterial, { radius = 24, depth = 10 } = {}) {
    this.group = new THREE.Group();
    // Far half of the soil surface.
    this.top = new THREE.Mesh(new THREE.CircleGeometry(radius, 64, 0, Math.PI), surfaceMaterial);
    this.top.rotation.x = -Math.PI / 2;
    this.top.receiveShadow = true;
    // Vertical cut face, a little behind the plant so the seed and crown sit
    // in front of it. Its depth follows the plant (setDepth).
    this.face = new THREE.Mesh(
      new THREE.PlaneGeometry(radius * 2, 1),
      // No depth write: roots behind the cut are drawn over it (see M.root).
      new THREE.MeshStandardMaterial({ transparent: true, roughness: 1, depthWrite: false }),
    );
    this.face.renderOrder = -1;
    this.face.receiveShadow = false; // underground: no sun
    this.textures = new Map(); // by whole-cm depth
    this.depth = null;
    this.setDepth(depth);
    // Near half of the surface, shown only when looking down on the plant
    // (oilseed rape leaf count), where a cut-away would hide nothing useful.
    this.near = new THREE.Mesh(new THREE.CircleGeometry(radius, 64, Math.PI, Math.PI), surfaceMaterial);
    this.near.rotation.x = -Math.PI / 2;
    this.near.receiveShadow = true;
    this.near.visible = false;
    this.group.add(this.top, this.face, this.near);
    // CircleGeometry's half (thetaStart 0..π) lies on +y before rotation,
    // i.e. −z after it: the far side when the block faces +z.
  }

  // Depth of the cut face, cm. One texture per whole cm, made when first used.
  setDepth(depth) {
    const d = Math.max(2, Math.round(depth));
    if (d === this.depth) return;
    this.depth = d;
    if (!this.textures.has(d)) this.textures.set(d, profileTexture(d));
    this.face.material.map = this.textures.get(d);
    this.face.material.needsUpdate = true;
    this.face.scale.y = d;
    this.face.position.set(0, -d / 2, -0.6);
  }

  // Whole soil surface with no cut face (a view looking straight down), or
  // the cut-away block (every other view).
  setFull(on) {
    this.near.visible = on;
    this.face.visible = !on;
  }

  // Turn so the cut face looks at the camera (yaw only).
  update(camera, target) {
    const dx = camera.position.x - target.x, dz = camera.position.z - target.z;
    this.group.rotation.y = Math.atan2(dx, dz);
  }
}
