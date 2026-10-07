// Dev helper, pasted into the browser via Playwright: renders a list of
// stages in a view and returns a single contact-sheet PNG data URL.
async (codes, mode, cols = 4, cell = 420) => {
  const W = window.__plant;
  const wait = (n) => new Promise((r) => { let i = 0; const f = () => (++i >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  W.setMode(mode);
  const rows = Math.ceil(codes.length / cols);
  const out = document.createElement('canvas');
  out.width = cols * cell; out.height = rows * cell;
  const g = out.getContext('2d');
  g.fillStyle = '#efebe1'; g.fillRect(0, 0, out.width, out.height);
  const src = document.getElementById('view');
  for (let i = 0; i < codes.length; i++) {
    W.go(codes[i]);
    W.state.enteringMode = true;
    await wait(40);
    const s = Math.min(src.width, src.height);
    g.drawImage(src, (src.width - s) / 2, (src.height - s) / 2, s, s, (i % cols) * cell, Math.floor(i / cols) * cell, cell, cell);
    g.fillStyle = '#1f2a1c'; g.font = 'bold 22px sans-serif';
    g.fillText('GS' + codes[i], (i % cols) * cell + 10, Math.floor(i / cols) * cell + 28);
  }
  return out.toDataURL('image/png');
}
