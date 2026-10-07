// Materials and procedural textures. Everything is generated in code so the
// prototype has no image assets to ship and works offline.

import * as THREE from 'three';

// sRGB hex → linear RGB triple (vertex colours are linear in three.js).
export function rgb(hex) {
  const c = new THREE.Color(hex);
  return [c.r, c.g, c.b];
}
export const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export const PALETTE = {
  leafYoung: rgb('#93b85a'),
  leaf: rgb('#5f8d3c'),
  leafDeep: rgb('#5a8c3d'),
  flag: rgb('#5e9150'), // slightly glaucous
  leafYellow: rgb('#d7c25c'),
  leafDead: rgb('#cdb689'),
  leafDeadDark: rgb('#a48c63'),
  sheath: rgb('#8cb35e'),
  sheathPale: rgb('#bcd08a'),
  stem: rgb('#9fbd66'),
  stemRipe: rgb('#dcc07a'),
  node: rgb('#6e8f3f'),
  nodeRipe: rgb('#a8844f'),
  ligule: rgb('#eef0d9'),
  auricle: rgb('#c9d7a0'),
  ear: rgb('#9dbb62'),
  earPale: rgb('#b8cc7c'),
  earGold: rgb('#dcbc68'),
  earRipe: rgb('#cfa962'),
  anther: rgb('#e9d84c'),
  antherSpent: rgb('#eee9cf'),
  cut: rgb('#eef1d6'),
  root: rgb('#efe7d2'),
};

function canvasTexture(w, h, draw, { repeat = [1, 1] } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(...repeat);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Leaf blade: u across the width, v along the length. Many fine parallel
// veins and a pale midrib, as on a wheat leaf.
function leafTexture() {
  return canvasTexture(128, 512, (g, w, h) => {
    g.fillStyle = '#ececec';
    g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 4) {
      const major = (x / 4) % 3 === 0;
      g.fillStyle = major ? 'rgba(80,90,70,0.20)' : 'rgba(80,90,70,0.09)';
      g.fillRect(x, 0, major ? 1.6 : 1, h);
    }
    const mid = g.createLinearGradient(w / 2 - 6, 0, w / 2 + 6, 0);
    mid.addColorStop(0, 'rgba(255,255,240,0)');
    mid.addColorStop(0.5, 'rgba(255,255,235,0.55)');
    mid.addColorStop(1, 'rgba(255,255,240,0)');
    g.fillStyle = mid;
    g.fillRect(w / 2 - 6, 0, 12, h);
    // Faint mottling so large leaves don't look plastic.
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '40,50,30'},0.035)`;
      g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 6 + Math.random() * 20);
    }
  });
}

// Dicot leaf (oilseed rape): u across the width, v along the length. A pale
// midrib with branching (pinnate) veins and a waxy, slightly mottled surface.
function netLeafTexture() {
  return canvasTexture(256, 512, (g, w, h) => {
    g.fillStyle = '#ececec';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,240,0.32)';
    g.lineCap = 'round';
    for (let y = 18; y < h + 60; y += 34) {
      for (const side of [-1, 1]) {
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(w / 2, y);
        g.quadraticCurveTo(w / 2 + side * w * 0.22, y - 30, w / 2 + side * w * 0.48, y - 78);
        g.stroke();
        // Finer veins between the main ones.
        g.lineWidth = 1.2;
        g.strokeStyle = 'rgba(255,255,240,0.18)';
        g.beginPath();
        g.moveTo(w / 2 + side * w * 0.2, y - 22);
        g.lineTo(w / 2 + side * w * 0.3, y - 2);
        g.stroke();
        g.strokeStyle = 'rgba(255,255,240,0.32)';
      }
    }
    const mid = g.createLinearGradient(w / 2 - 10, 0, w / 2 + 10, 0);
    mid.addColorStop(0, 'rgba(255,255,240,0)');
    mid.addColorStop(0.5, 'rgba(255,255,235,0.7)');
    mid.addColorStop(1, 'rgba(255,255,240,0)');
    g.fillStyle = mid;
    g.fillRect(w / 2 - 10, 0, 20, h);
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '40,50,60'},0.04)`;
      g.beginPath();
      g.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 4, 0, Math.PI * 2);
      g.fill();
    }
  });
}

// Sheaths and stems: longitudinal striations.
function striateTexture() {
  return canvasTexture(256, 64, (g, w, h) => {
    g.fillStyle = '#efefef';
    g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 5) {
      g.fillStyle = `rgba(70,85,60,${0.08 + Math.random() * 0.1})`;
      g.fillRect(x + Math.random(), 0, 1.4, h);
    }
  });
}

function soilTexture() {
  return canvasTexture(512, 512, (g, w, h) => {
    const cx = w / 2, cy = h / 2;
    g.clearRect(0, 0, w, h);
    const grad = g.createRadialGradient(cx, cy, 0, cx, cy, w / 2);
    grad.addColorStop(0, 'rgba(126,104,78,1)');
    grad.addColorStop(0.55, 'rgba(140,118,90,0.85)');
    grad.addColorStop(1, 'rgba(160,140,110,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 2600; i++) {
      const r = Math.random() * 3 + 0.5;
      const light = Math.random() < 0.5;
      g.fillStyle = light ? 'rgba(200,180,150,0.25)' : 'rgba(60,45,30,0.25)';
      g.beginPath();
      g.arc(Math.random() * w, Math.random() * h, r, 0, Math.PI * 2);
      g.fill();
    }
  });
}

// Back-face material for section views: anything cut by the clipping plane
// shows its inside as a flat, pale "cut surface", like a botanical section.
function cutMaterial(clippingPlanes) {
  const m = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, clippingPlanes });
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      '#include <color_fragment>\n diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86, 0.89, 0.70), 0.55);',
    );
  };
  return m;
}

// Leaves are thin and translucent: light passing through makes the shaded
// side glow green rather than go black. Approximated by adding a share of the
// vertex colour to the back faces.
function translucentLeaf(m) {
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * (gl_FrontFacing ? 0.12 : 0.38);',
    );
  };
  return m;
}

export function createMaterials() {
  const clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
  const clip = [clipPlane];
  const leafTex = leafTexture();
  const striate = striateTexture();
  const std = (opts) => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0, ...opts });
  const M = {
    clipPlane,
    blade: translucentLeaf(std({ map: leafTex, side: THREE.DoubleSide, shadowSide: THREE.DoubleSide, roughness: 0.55 })),
    sheath: std({ map: striate, side: THREE.DoubleSide, roughness: 0.5 }),
    stem: std({ map: striate, roughness: 0.45 }),
    ligule: new THREE.MeshStandardMaterial({
      color: 0xffffff, vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.85, roughness: 0.4,
    }),
    auricle: std({ side: THREE.DoubleSide, roughness: 0.5 }),
    hair: new THREE.LineBasicMaterial({ color: new THREE.Color('#f4f1df'), transparent: true, opacity: 0.9 }),
    root: std({ roughness: 0.8 }),
    seed: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55 }),
    cut: cutMaterial(clip),
    soil: new THREE.MeshStandardMaterial({ map: soilTexture(), transparent: true, roughness: 1, depthWrite: false }),
    ear: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, map: striate, side: THREE.DoubleSide }),
    anther: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }),
    awn: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }),
    // Oilseed rape: waxy net-veined leaves, petals, buds and pods.
    netLeaf: translucentLeaf(std({ map: netLeafTexture(), side: THREE.DoubleSide, shadowSide: THREE.DoubleSide, roughness: 0.42 })),
    petal: translucentLeaf(std({ side: THREE.DoubleSide, roughness: 0.5 })),
    pod: std({ roughness: 0.45, side: THREE.DoubleSide }),
  };
  // Materials that can be cut in section views.
  M.clippable = [M.sheath, M.stem, M.ligule, M.auricle];
  return M;
}

export function setSection(M, on) {
  for (const m of M.clippable) {
    m.clippingPlanes = on ? [M.clipPlane] : [];
    // In section view surfaces are single-sided so the cut shows the pale
    // back-face "cut surface" instead of the inside of the sheath.
    if (m === M.sheath) m.side = on ? THREE.FrontSide : THREE.DoubleSide;
    m.needsUpdate = true;
  }
}

// Booting: make sheaths see-through so the ear shows inside the swollen boot.
export function setGhost(M, on) {
  M.sheath.transparent = on;
  M.sheath.opacity = on ? 0.38 : 1;
  M.sheath.depthWrite = !on;
  M.sheath.needsUpdate = true;
}
