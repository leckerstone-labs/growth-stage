import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { CROPS, getCrop } from './crops/index.js';
import { createCropModel } from './model/index.js';
import { createCropView } from './views/index.js';
import { clamp, lerp, smoothstep } from './model/interp.js';
import { createMaterials, PALETTE, rgb } from './render/materials.js';
import { Overlay } from './ui/overlay.js';
import { SoilBlock } from './render/soil.js';

const $ = (id) => document.getElementById(id);

// The crop comes from the URL (?crop=winter_barley); switching crop reloads
// the page with the new id.
const params = new URLSearchParams(location.search);
const crop = getCrop(params.get('crop'));
const model = createCropModel(crop);
const { computePlant, checkStages, tAt } = model;
const { stages: STAGES, phases: PHASES, sources: SOURCES, views: INSPECT_VIEWS } = crop;

// Crop picker in the header. Keeps the current stage and view when switching.
document.title = `Growth Stage — ${crop.name}`;
const cropSelect = $('crop');
for (const c of CROPS) cropSelect.add(new Option(c.name, c.id, false, c === crop));
cropSelect.addEventListener('change', () => {
  const q = new URLSearchParams({ crop: cropSelect.value, gs: stageAt(state.t).cur.code, view: state.mode });
  location.search = q.toString();
});

// ---------------------------------------------------------------------------
// Renderer and scene
// ---------------------------------------------------------------------------
const canvas = $('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.localClippingEnabled = true;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.2, 2000);
camera.position.set(40, 40, 140);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
// One finger / left button rotates, pinch / wheel zooms, two fingers /
// right button (or shift-drag) pans. updateCamera keeps the user's pan and zoom.
controls.enablePan = true;
controls.screenSpacePanning = true;
controls.minDistance = 1.2;
controls.maxDistance = 600;
controls.maxPolarAngle = Math.PI * 0.62;

scene.add(new THREE.HemisphereLight(0xfffaf0, 0xb3a98c, 1.25));
const key = new THREE.DirectionalLight(0xfff6e6, 2.5);
key.position.set(-35, 70, 45);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -55; key.shadow.camera.right = 55;
key.shadow.camera.top = 95; key.shadow.camera.bottom = -20;
key.shadow.camera.near = 1; key.shadow.camera.far = 300;
key.shadow.bias = -0.0004;
key.shadow.normalBias = 0.06;
scene.add(key);
const fill = new THREE.DirectionalLight(0xe8f0ff, 0.55);
fill.position.set(45, 25, -35);
scene.add(fill);

// Crop colour changes (e.g. paler barley leaves), before anything is built.
for (const [k, hex] of Object.entries(crop.params.PALETTE || {})) PALETTE[k] = rgb(hex);
const M = createMaterials();
const soil = new SoilBlock(M.soil);
scene.add(soil.group);

const overlay = new Overlay($('overlay-lines'), $('overlay-labels'));

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const state = {
  t: 100, // set from the URL or the final stage at start-up
  mode: 'plant',
  variant: false, // crop's variety toggle (awned wheat); none for barley
  playing: false,
  dirty: true,
  plant: null,
  goal: null, // camera goal { target, dist }
  userZoom: 1,
  lastDist: null,
  pan: new THREE.Vector3(), // user's pan offset from the view's target
  lastTarget: null,
  prevGoal: null, // last frame's goal target and fitted distance
  prevWant: null,
  env: null, // stable framing state (see stableGoal)
  enteringMode: true,
};

// The crop family's views (cereal or brassica) build the geometry and the
// readout, labels and camera goal for each inspection view.
const view = createCropView({ crop, model, M, scene, soil, state });

const fails = checkStages();
if (fails.length) console.warn('Stage checks failed:\n' + fails.join('\n'));
else console.info(`${crop.name} model: all stage checks pass.`);

// ---------------------------------------------------------------------------
// Stage lookup
// ---------------------------------------------------------------------------
function stageAt(t) {
  let cur = STAGES[0];
  for (const s of STAGES) if (s.t <= t + 0.05) cur = s;
  const idx = STAGES.indexOf(cur);
  return { cur, next: STAGES[idx + 1] || null, at: Math.abs(cur.t - t) < 0.3 };
}
const phaseOf = (t) => PHASES.find((p) => t >= p.from && t <= p.to) || PHASES[PHASES.length - 1];

// ---------------------------------------------------------------------------
// Timeline UI
// ---------------------------------------------------------------------------
const slider = $('slider');
const track = $('track');
// Same query as the phone block in styles.css: vertical timeline on the right.
const PHONE = window.matchMedia('(max-width: 760px)');
const MAJOR = new Set(crop.ticks.major);
function buildTimeline() {
  const phases = $('phases');
  for (const p of PHASES) {
    const d = document.createElement('div');
    d.style.flex = `${p.to - p.from}`;
    d.dataset.id = p.id;
    d.innerHTML = `<span>${p.name}</span>`;
    phases.append(d);
  }
  const ticks = $('ticks');
  for (const s of STAGES) {
    const b = document.createElement('button');
    b.style.left = `${s.t}%`;
    b.style.setProperty('--t', s.t);
    b.dataset.code = s.code;
    b.innerHTML = `<span>${s.code}</span>`;
    b.title = `GS${s.code} — ${s.title}`;
    b.addEventListener('click', () => goTo(s.t));
    ticks.append(b);
  }
  updateTickLabels();
}
function updateTickLabels() {
  const ticks = [...$('ticks').children];
  if (!PHONE.matches) {
    for (const b of ticks) b.classList.toggle('minor', !MAJOR.has(+b.dataset.code));
    return;
  }
  // Vertical scrolling scale: stages are evenly spaced, so all are labelled.
  for (const b of ticks) b.classList.remove('minor');
}

let anim = null;
function goTo(t, ms = 450) {
  state.playing = false;
  updatePlay();
  const from = state.t;
  const start = performance.now();
  anim = (now) => {
    const f = clamp((now - start) / ms);
    const e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
    setT(lerp(from, t, e));
    if (f >= 1) anim = null;
  };
}
function setT(t) {
  state.t = clamp(t, 0, 100);
  slider.value = state.t;
  track.style.setProperty('--pos', yOf(state.t));
  state.dirty = true;
}
slider.addEventListener('input', () => { anim = null; state.playing = false; updatePlay(); setT(+slider.value); });
// Gentle snap to a nearby checkpoint when the thumb is released.
function snapToStage() {
  const near = STAGES.reduce((a, s) => (Math.abs(s.t - state.t) < Math.abs(a.t - state.t) ? s : a));
  if (Math.abs(near.t - state.t) < 1.3) goTo(near.t, 220);
}
slider.addEventListener('change', snapToStage);

// Phone: the vertical timeline is a scrolling scale, like a picker wheel,
// earliest stage at the top. The band in the middle stays put and the scale
// slides under the finger (drag up to move on), with every stage the same
// distance apart (STEP px) so close stages are easy to pick. A flick keeps it
// gliding; it always settles on a stage. A tap on a stage number goes to it.
const STEP = 34;
const SCALE_LEN = (STAGES.length - 1) * STEP;
function yOf(t) { // scale position (px from sowing) of timeline position t
  for (let i = 0; i < STAGES.length - 1; i++) {
    const a = STAGES[i], b = STAGES[i + 1];
    if (t <= b.t) return (i + clamp((t - a.t) / (b.t - a.t))) * STEP;
  }
  return SCALE_LEN;
}
function tOf(y) {
  const f = clamp(y / STEP, 0, STAGES.length - 1), i = Math.min(Math.floor(f), STAGES.length - 2);
  return lerp(STAGES[i].t, STAGES[i + 1].t, f - i);
}
function layoutScale() {
  for (const b of $('ticks').children) b.style.setProperty('--y', yOf(+b.style.getPropertyValue('--t')));
  for (const d of $('phases').children) {
    const p = PHASES.find((x) => x.id === d.dataset.id);
    const y0 = yOf(p.from), y1 = yOf(p.to);
    d.style.setProperty('--y0', y0 + 1);
    d.style.setProperty('--h', Math.max(2, y1 - y0 - 2));
  }
  $('phases').style.setProperty('--len', SCALE_LEN);
}

let drag = null;
function snapNearest() {
  const y = yOf(state.t);
  goTo(STAGES[Math.round(clamp(y / STEP, 0, STAGES.length - 1))].t, 200);
}
track.addEventListener('pointerdown', (e) => {
  if (!PHONE.matches) return;
  track.setPointerCapture(e.pointerId);
  anim = null; state.playing = false; updatePlay();
  drag = { y0: e.clientY, pos0: yOf(state.t), lastY: e.clientY, lastAt: e.timeStamp, v: 0, moved: false };
});
track.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dy = e.clientY - drag.y0;
  if (Math.abs(dy) > 5) drag.moved = true;
  if (!drag.moved) return;
  // The scale follows the finger: dragging up brings later stages to the band.
  setT(tOf(drag.pos0 - dy));
  const dt = Math.max(1, e.timeStamp - drag.lastAt);
  drag.v = 0.7 * ((e.clientY - drag.lastY) / dt) + 0.3 * drag.v; // px per ms
  drag.lastY = e.clientY; drag.lastAt = e.timeStamp;
});
function endDrag(e) {
  if (!drag) return;
  const d = drag;
  drag = null;
  if (!d.moved) {
    // Tap: go to the stage nearest the tapped point, if it's close to one.
    const r = track.getBoundingClientRect();
    const y = yOf(state.t) + (e.clientY - (r.top + r.height / 2));
    const i = Math.round(y / STEP);
    if (i >= 0 && i < STAGES.length && Math.abs(y - i * STEP) < STEP / 2) goTo(STAGES[i].t);
    return;
  }
  // Glide with the release speed, slowing down, then settle on a stage.
  // Capped so a hard flick travels about nine stages at most.
  let v = e.timeStamp - d.lastAt > 80 ? 0 : clamp(d.v, -1.5, 1.5), y = yOf(state.t), last = performance.now();
  anim = (now) => {
    const dt = Math.min(50, now - last);
    last = now;
    y = clamp(y - v * dt, 0, SCALE_LEN);
    v *= Math.exp(-dt / 200);
    setT(tOf(y));
    if (Math.abs(v) < 0.08 || y <= 0 || y >= SCALE_LEN) snapNearest();
  };
}
track.addEventListener('pointerup', endDrag);
track.addEventListener('pointercancel', endDrag);

function step(dir) {
  const { cur } = stageAt(state.t);
  const i = STAGES.indexOf(cur);
  let target;
  if (dir > 0) target = STAGES.find((s) => s.t > state.t + 0.05);
  else target = Math.abs(cur.t - state.t) > 0.05 ? cur : STAGES[i - 1];
  if (target) goTo(target.t);
}
$('prev').addEventListener('click', () => step(-1));
$('next').addEventListener('click', () => step(1));
$('play').addEventListener('click', () => {
  state.playing = !state.playing;
  if (state.playing && state.t >= 99.9) setT(0);
  anim = null;
  updatePlay();
});
function updatePlay() {
  $('play').textContent = state.playing ? '❚❚' : '▶';
  $('play').setAttribute('aria-label', state.playing ? 'Pause' : 'Play');
}
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') { step(1); e.preventDefault(); }
  if (e.key === 'ArrowLeft') { step(-1); e.preventDefault(); }
  if (e.key === ' ') { $('play').click(); e.preventDefault(); }
});

// ---------------------------------------------------------------------------
// View switcher
// ---------------------------------------------------------------------------
function buildViews() {
  const nav = $('views');
  for (const [id, v] of Object.entries(INSPECT_VIEWS)) {
    const b = document.createElement('button');
    b.dataset.mode = id;
    b.textContent = v.label;
    b.title = v.hint;
    b.addEventListener('click', () => setMode(id));
    nav.append(b);
  }
}
function setMode(mode) {
  if (state.mode === mode) return;
  state.mode = mode;
  state.enteringMode = true;
  state.userZoom = 1;
  state.dirty = true;
}
const viewEnabled = (mode, t) => view.enabled(mode, t);

$('variant-label').textContent = crop.ui.variant || '';
if (!crop.ui.variant) document.querySelector('.tools').hidden = true;
$('variant').addEventListener('change', (e) => { state.variant = e.target.checked; state.dirty = true; });
// ---------------------------------------------------------------------------
// View controls
// ---------------------------------------------------------------------------
function resetView() { state.enteringMode = true; state.userZoom = 1; state.dirty = true; }
$('reset').addEventListener('click', resetView);
$('zoom-in').addEventListener('click', () => { state.userZoom = clamp(state.userZoom / 1.4, 0.08, 6); });
$('zoom-out').addEventListener('click', () => { state.userZoom = clamp(state.userZoom * 1.4, 0.08, 6); });

// Double-tap (or double-click) the plant to reset the view. Done by hand
// because touch browsers don't reliably send dblclick.
let lastTap = null, down = null;
canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, at: e.timeStamp }; hideHint(); });
canvas.addEventListener('pointerup', (e) => {
  if (!down || e.timeStamp - down.at > 250 || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) { lastTap = null; return; }
  const tap = { x: e.clientX, y: e.clientY, at: e.timeStamp };
  if (lastTap && tap.at - lastTap.at < 350 && Math.hypot(tap.x - lastTap.x, tap.y - lastTap.y) < 30) { resetView(); lastTap = null; }
  else lastTap = tap;
});

// Gesture hint, shown until the first time someone touches the plant.
const hint = $('hint');
function hideHint() {
  if (!hint.classList.contains('show')) return;
  hint.classList.remove('show');
  try { localStorage.setItem('gs-hint-seen', '1'); } catch {}
}
let hintSeen = false;
try { hintSeen = localStorage.getItem('gs-hint-seen') === '1'; } catch {}
if (!hintSeen) {
  const touch = window.matchMedia('(pointer: coarse)').matches;
  hint.textContent = touch
    ? 'Drag to rotate · pinch to zoom · two fingers to move · double-tap to reset'
    : 'Drag to rotate · scroll to zoom · right-drag to move · double-click to reset';
  setTimeout(() => hint.classList.add('show'), 600);
  setTimeout(hideHint, 9000);
}

// ---------------------------------------------------------------------------
// Info panel (phone: bottom sheet). Tap the bar or swipe it up to open; swipe
// down or tap the scrim to close.
// ---------------------------------------------------------------------------
const info = $('info');
function setInfoOpen(open) {
  info.classList.toggle('open', open);
  $('info-toggle').setAttribute('aria-expanded', open);
  $('scrim').classList.toggle('show', open && PHONE.matches);
  info.querySelector('.it-btn-text').textContent = open ? 'Hide' : 'Details';
  if (!open) info.scrollTop = 0;
}
let swipe = null, swallowClick = false;
$('info-toggle').addEventListener('pointerdown', (e) => { swipe = e.clientY; });
$('info-toggle').addEventListener('pointerup', (e) => {
  if (swipe === null) return;
  const dy = e.clientY - swipe;
  swipe = null;
  if (Math.abs(dy) > 24) { setInfoOpen(dy < 0); swallowClick = true; setTimeout(() => (swallowClick = false), 0); }
});
$('info-toggle').addEventListener('click', () => { if (!swallowClick) setInfoOpen(!info.classList.contains('open')); });
$('scrim').addEventListener('click', () => setInfoOpen(false));
$('inspect-btn').addEventListener('click', () => setMode(stageAt(state.t).cur.inspect));

// ---------------------------------------------------------------------------
// Rebuild model + UI for the current timeline position
// ---------------------------------------------------------------------------
function rebuild() {
  const t = state.t;
  const { cur, next, at } = stageAt(t);
  if (!viewEnabled(state.mode, t)) { state.mode = 'plant'; state.enteringMode = true; }
  const mode = state.mode;
  const plant = computePlant(t);
  state.plant = plant;
  const { rows, items, goal } = view.build(plant, mode);

  // Header
  $('code').textContent = `GS${cur.code}`;
  $('title').textContent = cur.title;
  const phase = phaseOf(t);
  $('sub').innerHTML = at || !next
    ? `${phase.name}`
    : `${phase.name} · developing towards <b>GS${next.code}</b>`;
  $('desc').textContent = cur.description;
  $('check').textContent = cur.check;
  const ib = $('inspect-btn');
  ib.hidden = cur.inspect === mode;
  ib.textContent = `Show ${INSPECT_VIEWS[cur.inspect].label.toLowerCase()} view`;
  // The plant view's rooting depth has its own source.
  const srcKeys = mode === 'plant' && SOURCES.roots && !cur.sources.includes('roots') ? [...cur.sources, 'roots'] : cur.sources;
  $('sources').innerHTML = 'Source: ' + srcKeys.map((k) => `<a href="${SOURCES[k].url}" target="_blank" rel="noopener">${SOURCES[k].title}</a>`).join('; ');

  for (const b of $('views').children) {
    b.setAttribute('aria-pressed', b.dataset.mode === mode);
    b.disabled = !viewEnabled(b.dataset.mode, t);
    b.classList.toggle('rec', b.dataset.mode === cur.inspect && b.dataset.mode !== mode);
  }
  for (const b of $('ticks').children) b.classList.toggle('cur', +b.dataset.code === cur.code);
  $('thumb').textContent = `GS${cur.code}`;
  for (const d of $('phases').children) d.classList.toggle('on', d.dataset.id === phase.id);

  $('readout').innerHTML = rows.map(([k, v, c]) => `<div class="row"><span>${k}</span><span class="${c || ''}">${v}</span></div>`).join('');
  $('readout-title').textContent = `On the model · ${INSPECT_VIEWS[mode].label.toLowerCase()} view`;
  $('readout-short').textContent = cur.check;
  overlay.set(items);
  state.goal = goal;
}

// ---------------------------------------------------------------------------
// Camera: follows the goal for the current view while respecting the user's
// rotation and zoom.
// ---------------------------------------------------------------------------
// Phone: the part of the screen not covered by the header, view buttons,
// timeline column and info bar. The camera is shifted so the plant is centred
// in it, and sized to fit it.
let free = null;
function measureLayout() {
  const top = document.querySelector('.top');
  const root = document.documentElement.style;
  root.setProperty('--top-h', `${top.offsetHeight}px`);
  root.setProperty('--views-h', `${$('views').offsetHeight}px`);
  // Phone: the info bar's real height, so the timeline and view buttons sit
  // above it.
  if (PHONE.matches) root.setProperty('--bar-h', `${$('info-toggle').offsetHeight}px`);
  const w = window.innerWidth, h = window.innerHeight;
  const viewsBottom = $('views').getBoundingClientRect().bottom;
  if (!PHONE.matches) {
    free = null;
    camera.clearViewOffset();
    // Labels: below the view buttons, above the timeline, left of the info card.
    overlay.bounds = { left: 0, right: info.getBoundingClientRect().left - 6, top: viewsBottom + 4, bottom: document.querySelector('.timeline').getBoundingClientRect().top };
    return;
  }
  const tools = document.querySelector('.tools');
  const below = tools.offsetHeight ? tools.getBoundingClientRect().bottom : viewsBottom;
  const x1 = document.querySelector('.timeline').getBoundingClientRect().left;
  const y1 = $('info-toggle').getBoundingClientRect().top;
  free = { x0: 0, y0: below + 4, x1, y1: y1 - 22 };
  overlay.bounds = { left: 0, right: x1 - 4, top: below + 4, bottom: y1 - 6 };
  const cx = (free.x0 + free.x1) / 2, cy = (free.y0 + free.y1) / 2;
  camera.setViewOffset(w, h, w / 2 - cx, h / 2 - cy, w, h);
}

function fitDistance(goal) {
  const vFov = (camera.fov * Math.PI) / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  // Leave room for the header, info panel and timeline.
  let usableH = 0.72, usableW = 0.62;
  if (free) {
    usableH = (0.94 * (free.y1 - free.y0)) / window.innerHeight;
    usableW = (0.94 * (free.x1 - free.x0)) / window.innerWidth;
  }
  const dH = (goal.height / usableH) / (2 * Math.tan(vFov / 2));
  const dW = (goal.width / usableW) / (2 * Math.tan(hFov / 2));
  return Math.max(dH, dW);
}

// Stable framing, for every view. Views size their goal from the geometry,
// which pulses as parts come and go (a barley leaf rises upright then flops
// over; a leaf dies; flowers turn to pods). Following that exactly makes the
// camera bob and zoom. Instead, like a dead-zone game camera:
//  - the frame's size is an envelope: it grows at once when the goal grows,
//    but shrinks back gradually;
//  - the frame's centre stays put while the goal's box fits inside the frame,
//    and is pushed just enough to keep it inside when it doesn't (so a part
//    that keeps moving, like OSR buds lifted by the stem, is tracked with no
//    lag), while drifting back towards the goal's centre.
// "Gradually" is measured along the timeline (most of it within ~1.5 units
// of t, plus a slow drift when it is still), so it behaves the same at any
// play or scrub speed, and a big jump (a stage tap) lets go almost at once.
function stableGoal(goal, dt) {
  const c = goal.target, h = goal.height / 2, w = goal.width / 2;
  const e = state.env;
  if (!e || state.enteringMode) {
    state.env = { C: c.clone(), H: h, W: w, t: state.t };
    return goal;
  }
  const a = 1 - Math.exp(-(Math.abs(state.t - e.t) / 1.5 + dt / 1.5));
  e.t = state.t;
  e.H = Math.max(h, lerp(e.H, h, a));
  e.W = Math.max(w, lerp(e.W, w, a));
  e.C.lerp(c, a);
  e.C.y = clamp(e.C.y, c.y + h - e.H, c.y - h + e.H);
  e.C.x = clamp(e.C.x, c.x + w - e.W, c.x - w + e.W);
  e.C.z = clamp(e.C.z, c.z + w - e.W, c.z - w + e.W);
  return { ...goal, target: e.C.clone(), height: 2 * e.H, width: 2 * e.W };
}

function updateCamera(dt) {
  if (!state.goal) return;
  const goal = stableGoal(state.goal, dt);
  const want = fitDistance(goal);
  const offset = camera.position.clone().sub(controls.target);
  let dist = offset.length();
  if (state.enteringMode) {
    controls.target.copy(goal.target);
    camera.position.copy(goal.target).addScaledVector(goal.dir.clone().normalize(), want);
    state.enteringMode = false;
    state.lastDist = want;
    state.userZoom = 1;
    state.pan.set(0, 0, 0);
    controls.update();
    state.lastTarget = controls.target.clone();
    state.prevGoal = goal.target.clone();
    state.prevWant = want;
    return;
  }
  // Detect a user pan since the last frame (OrbitControls moves the target)
  // and keep it as an offset, limited so the plant can't be lost off screen.
  if (state.lastTarget) {
    state.pan.add(controls.target.clone().sub(state.lastTarget));
    const maxPan = 0.75 * Math.max(goal.height, goal.width);
    if (state.pan.length() > maxPan) state.pan.setLength(maxPan);
  }
  // Detect a user zoom since the last frame and remember it as a factor.
  if (state.lastDist && Math.abs(dist - state.lastDist) > 1e-3 * state.lastDist) {
    state.userZoom = clamp(state.userZoom * (dist / state.lastDist), 0.08, 6);
  }
  // Follow the plant as it grows: small, smooth changes in the goal (a part
  // rising as the stem extends) are applied exactly, so fast-moving parts
  // stay in frame. Big jumps (a stage tap, a fast scrub) are eased in below.
  const size = Math.max(goal.height, goal.width);
  if (state.prevGoal) {
    const delta = goal.target.clone().sub(state.prevGoal);
    if (delta.length() < 0.3 * size) controls.target.add(delta);
  }
  if (state.prevWant) {
    const r = want / state.prevWant;
    if (Math.abs(r - 1) < 0.15) dist *= r;
  }
  state.prevGoal = goal.target.clone();
  state.prevWant = want;
  const k = 1 - Math.exp(-dt * 6);
  controls.target.lerp(goal.target.clone().add(state.pan), k);
  const newDist = lerp(dist, want * state.userZoom, k);
  offset.setLength(newDist);
  camera.position.copy(controls.target).add(offset);
  state.lastDist = newDist;
  state.lastTarget = controls.target.clone();
}

// Section plane: through the main shoot, facing away from the camera so the
// near half is cut away.
function updateClip() {
  if (!state.plant) return;
  const through = view.clipPoint(state.mode);
  if (!through) return;
  const toCam = camera.position.clone().sub(controls.target);
  toCam.y = 0;
  if (toCam.lengthSq() < 1e-6) toCam.set(0, 0, 1);
  toCam.normalize().negate();
  M.clipPlane.setFromNormalAndCoplanarPoint(toCam, through);
}

// ---------------------------------------------------------------------------
// Loop
// ---------------------------------------------------------------------------
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  measureLayout();
  camera.updateProjectionMatrix();
  updateTickLabels();
  state.dirty = true;
}
window.addEventListener('resize', resize);
// The header grows when a long stage title wraps; the panels below follow it.
new ResizeObserver(resize).observe(document.querySelector('.top'));

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (anim) anim(now);
  if (state.playing) {
    const near = STAGES.reduce((a, s) => Math.min(a, Math.abs(s.t - state.t)), 99);
    const speed = 4.5 * (0.3 + 0.7 * smoothstep(0, 1.2, near));
    setT(state.t + speed * dt);
    if (state.t >= 100) { state.playing = false; updatePlay(); }
  }
  if (state.dirty) { state.dirty = false; rebuild(); }
  updateCamera(dt);
  controls.update();
  updateClip();
  soil.update(camera, controls.target);
  renderer.render(view.sceneFor(state.mode), camera);
  overlay.draw(camera, window.innerWidth, window.innerHeight);
  requestAnimationFrame(frame);
}

buildTimeline();
layoutScale();
buildViews();
resize();
// Start at the stage and view given in the URL (set when switching crop);
// otherwise, or if this crop has no such stage, at the crop's final stage.
const startStage = STAGES.find((x) => x.code === +params.get('gs')) || STAGES[STAGES.length - 1];
state.t = startStage.t;
if (Object.hasOwn(INSPECT_VIEWS, params.get('view') ?? '')) state.mode = params.get('view');
setT(state.t);
requestAnimationFrame(frame);

// Handy for testing from the console: __plant.go(39, 'collar')
window.__plant = {
  crop, model, state, view, ...view.debug, camera, controls,
  go(code, mode) {
    const s = STAGES.find((x) => x.code === code);
    if (s) setT(s.t);
    if (mode) setMode(mode);
  },
  setT,
  setMode,
};
