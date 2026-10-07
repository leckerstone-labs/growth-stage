// Soil shown as a cut-away block, like a botanical plate: the far half of the
// surface plus a vertical cut face through the plant, so the seed, coleoptile
// and roots can be seen below ground. The block turns to face the camera.

import * as THREE from 'three';

function profileTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, 'rgba(118,96,70,1)');
  grad.addColorStop(0.5, 'rgba(132,110,82,0.95)');
  grad.addColorStop(1, 'rgba(150,130,100,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 256);
  g.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 1800; i++) {
    const r = Math.random() * 2.4 + 0.4;
    g.fillStyle = Math.random() < 0.5 ? 'rgba(205,185,150,0.22)' : 'rgba(55,40,28,0.22)';
    g.beginPath();
    g.arc(Math.random() * 512, Math.random() * 256, r, 0, Math.PI * 2);
    g.fill();
  }
  // Fade out towards the sides so the block has soft edges.
  g.globalCompositeOperation = 'destination-in';
  const side = g.createLinearGradient(0, 0, 512, 0);
  side.addColorStop(0, 'rgba(0,0,0,0)');
  side.addColorStop(0.18, 'rgba(0,0,0,1)');
  side.addColorStop(0.82, 'rgba(0,0,0,1)');
  side.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = side;
  g.fillRect(0, 0, 512, 256);
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
    // in front of it.
    this.face = new THREE.Mesh(
      new THREE.PlaneGeometry(radius * 2, depth),
      new THREE.MeshStandardMaterial({ map: profileTexture(), transparent: true, roughness: 1, depthWrite: true }),
    );
    this.face.position.set(0, -depth / 2, -0.6);
    this.face.receiveShadow = false; // underground: no sun
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

  // Whole soil surface (no cut face) or the cut-away block.
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
