// 2D annotations drawn over the 3D view: labels with leader lines and
// measurement brackets. Positions come from 3D anchor points projected to the
// screen every frame, so labels follow the model as it rotates.

import * as THREE from 'three';

const SVG_NS = 'http://www.w3.org/2000/svg';
const v = new THREE.Vector3();

export class Overlay {
  constructor(svg, labels) {
    this.svg = svg;
    this.labels = labels;
    this.items = [];
    // Screen area labels must stay inside (main.js: clear of the header,
    // timeline and info panel). Null means the whole screen.
    this.bounds = null;
    this.sizes = new Map(); // measured label sizes, by text and style
  }

  // Width and height of a label, measured once in the DOM and cached.
  size(text, cls) {
    const key = `${cls}|${text}`;
    let s = this.sizes.get(key);
    if (!s) {
      const d = document.createElement('div');
      d.className = `lbl ${cls}`;
      d.style.visibility = 'hidden';
      d.textContent = text;
      this.labels.append(d);
      s = { w: d.offsetWidth, h: d.offsetHeight };
      d.remove();
      if (s.w) this.sizes.set(key, s); // not cached while hidden (zero size)
    }
    return s;
  }

  set(items) { this.items = items || []; }

  project(p, camera, w, h) {
    v.copy(p).project(camera);
    return { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h, behind: v.z > 1 };
  }

  draw(camera, w, h) {
    const svg = this.svg;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.replaceChildren();
    this.labels.replaceChildren();
    const placed = [];
    const tags = [];

    for (const it of this.items) {
      if (it.kind === 'dim') {
        const a = this.project(it.p0, camera, w, h);
        const b = this.project(it.p1, camera, w, h);
        if (a.behind || b.behind) continue;
        const x = Math.max(a.x, b.x) + (it.offset ?? 46);
        if (Math.abs(a.y - b.y) < 2) continue;
        const g = el('g', { class: `dim ${it.tone || ''}` });
        g.append(
          el('line', { x1: x, y1: a.y, x2: x, y2: b.y }),
          el('line', { x1: x - 5, y1: a.y, x2: x + 5, y2: a.y }),
          el('line', { x1: x - 5, y1: b.y, x2: x + 5, y2: b.y }),
          el('line', { class: 'ext', x1: a.x + 4, y1: a.y, x2: x - 6, y2: a.y }),
          el('line', { class: 'ext', x1: b.x + 4, y1: b.y, x2: x - 6, y2: b.y }),
        );
        svg.append(g);
        placed.push({ x: x + 10, y: (a.y + b.y) / 2, text: it.text, tone: it.tone, side: 'right', anchor: null, small: true });
      } else if (it.kind === 'hline') {
        const a = this.project(it.p, camera, w, h);
        if (a.behind) continue;
        svg.append(el('line', { class: 'hline', x1: a.x - (it.half ?? 140), y1: a.y, x2: a.x + (it.half ?? 140), y2: a.y }));
        placed.push({ x: a.x + (it.half ?? 140), y: a.y, text: it.text, tone: 'muted', side: 'right', anchor: null, small: true });
      } else if (it.kind === 'tag') {
        // A small badge sitting on the point itself (e.g. leaf numbers).
        const a = this.project(it.p, camera, w, h);
        if (a.behind) continue;
        tags.push({ x: a.x, y: a.y, text: it.text, tone: it.tone });
      } else if (it.kind === 'label') {
        const a = this.project(it.p, camera, w, h);
        if (a.behind) continue;
        const side = it.side || 'right';
        const dx = (it.dx ?? 70) * (side === 'left' ? -1 : 1);
        placed.push({ x: a.x + dx, y: a.y + (it.dy ?? 0), text: it.text, tone: it.tone, side, anchor: a, dot: it.dot !== false });
      }
    }

    this.layout(placed, tags, w, h);

    for (const p of placed) {
      if (p.anchor) {
        const ex = p.x + (p.side === 'left' ? 4 : -4);
        svg.append(el('path', { class: `leader ${p.tone || ''}`, d: `M${p.anchor.x},${p.anchor.y} L${ex},${p.y}` }));
        if (p.dot) svg.append(el('circle', { class: `dot ${p.tone || ''}`, cx: p.anchor.x, cy: p.anchor.y, r: 3.2 }));
      }
      const d = document.createElement('div');
      d.className = `lbl ${p.side} ${p.tone || ''} ${p.small ? 'small' : ''}`;
      d.textContent = p.text;
      d.style.left = `${p.x}px`;
      d.style.top = `${p.y}px`;
      this.labels.append(d);
    }
    for (const p of tags) {
      const d = document.createElement('div');
      d.className = `lbl tag ${p.tone || ''}`;
      d.textContent = p.text;
      d.style.left = `${p.x}px`;
      d.style.top = `${p.y}px`;
      this.labels.append(d);
    }
  }
}

// Move labels apart so none overlap each other, the badges on the plant, or
// the edges of the bounds. Labels are placed one at a time from the top; each
// goes to the free position nearest where it wants to be: shifted up or down,
// or (for labels with a leader line) flipped to the other side of its anchor.
Overlay.prototype.layout = function (placed, tags, w, h) {
  const B = this.bounds || { left: 0, right: w, top: 0, bottom: h };
  const GAP = 3;
  const taken = tags.map((t) => {
    const s = this.size(t.text, `tag ${t.tone || ''}`);
    return { l: t.x - s.w / 2, r: t.x + s.w / 2, t: t.y - s.h / 2, b: t.y + s.h / 2 };
  });
  const rectAt = (p, side, x, y) => {
    const l = side === 'left' ? x - p.w : x;
    return { l, r: l + p.w, t: y - p.h / 2, b: y + p.h / 2 };
  };
  const hits = (q) => taken.filter((o) => q.l < o.r + GAP && q.r > o.l - GAP && q.t < o.b + GAP && q.b > o.t - GAP);
  // Keep a label's x inside the bounds.
  const clampX = (p, side, x) => side === 'left'
    ? Math.min(Math.max(x, B.left + p.w + 4), B.right - 4)
    : Math.max(Math.min(x, B.right - p.w - 4), B.left + 4);
  const clampY = (p, y) => Math.min(Math.max(y, B.top + p.h / 2 + 2), B.bottom - p.h / 2 - 2);

  for (const p of placed) {
    const s = this.size(p.text, `${p.tone || ''} ${p.small ? 'small' : ''}`);
    p.w = s.w; p.h = s.h;
  }
  for (const p of [...placed].sort((a, b) => a.y - b.y)) {
    const sides = [{ side: p.side, x: p.x, cost: 0 }];
    if (p.anchor) {
      const flip = p.side === 'left' ? 'right' : 'left';
      sides.push({ side: flip, x: 2 * p.anchor.x - p.x, cost: 40 });
    }
    let best = null;
    for (const o of sides) {
      const x = clampX(p, o.side, o.x);
      // Candidate heights: where it wants to be, and just above or below
      // anything it would overlap there.
      const ys = [clampY(p, p.y)];
      for (const q of hits(rectAt(p, o.side, x, ys[0]))) ys.push(clampY(p, q.t - GAP - p.h / 2 - 1), clampY(p, q.b + GAP + p.h / 2 + 1));
      for (let k = 0; k < ys.length && k < 24; k++) {
        const y = ys[k], r = rectAt(p, o.side, x, y);
        const hit = hits(r);
        if (hit.length) {
          // Blocked: try just past what it hits (searches outwards).
          for (const q of hit) ys.push(clampY(p, y < (q.t + q.b) / 2 ? q.t - GAP - p.h / 2 - 1 : q.b + GAP + p.h / 2 + 1));
          continue;
        }
        const cost = o.cost + Math.abs(y - p.y) + Math.abs(x - o.x) * 0.5;
        if (!best || cost < best.cost) best = { side: o.side, x, y, r, cost };
      }
    }
    // Nowhere free (very crowded): keep it where it wanted to be.
    if (!best) {
      const x = clampX(p, p.side, p.x), y = clampY(p, p.y);
      best = { side: p.side, x, y, r: rectAt(p, p.side, x, y) };
    }
    p.side = best.side; p.x = best.x; p.y = best.y;
    taken.push(best.r);
  }
};

function el(tag, attrs) {
  const e = document.createElementNS(SVG_NS, tag);
  for (const [k, val] of Object.entries(attrs)) e.setAttribute(k, val);
  return e;
}
