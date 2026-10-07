// Dev helper: renders the PNG icons from icons/icon.svg and
// icons/icon-maskable.svg in Chromium, so they match what browsers draw.
// With `npm run serve` running, pass this file to Playwright's run-code tool
// (browser_run_code with filename=scripts/render-icons.js). Commit the PNGs.
async (page) => {
  // Relative to the Playwright server's working directory (the repo root
  // when Claude Code is started here). Edit if the PNGs land elsewhere.
  const root = 'icons/';
  const jobs = [
    ['icon.svg', 512, 'icon-512.png'],
    ['icon.svg', 192, 'icon-192.png'],
    ['icon.svg', 32, 'favicon-32.png'],
    ['icon-maskable.svg', 512, 'icon-maskable-512.png'],
    ['icon-maskable.svg', 180, 'apple-touch-icon.png'],
  ];
  await page.goto('http://localhost:8642/icons/');
  for (const [src, n, out] of jobs) {
    await page.setViewportSize({ width: n, height: n });
    await page.setContent(`<style>html,body{margin:0;background:transparent}</style><img src="http://localhost:8642/icons/${src}?v=${Date.now()}" width="${n}" height="${n}" style="display:block">`);
    await page.waitForFunction(() => document.images[0].complete && document.images[0].naturalWidth > 0, null, { timeout: 5000 });
    await page.screenshot({ path: root + out, omitBackground: true, clip: { x: 0, y: 0, width: n, height: n } });
  }
  return `wrote ${jobs.length} icons to ${root}`;
}
