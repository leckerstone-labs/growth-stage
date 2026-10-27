// Writes the text guides into a built site: one page per crop at
// <out>/<slug>/index.html with every stage's description and check, a
// sitemap.xml, and links to every guide in place of the <!--GUIDES--> marker
// in <out>/index.html. The 3D app renders its stage text with JavaScript, so
// these pages are what search engines and AI assistants can read.
// Everything comes from the crop registry. Nothing here may vary between
// builds of the same code (no dates): the service worker version is a hash of
// the output.
// Run: node scripts/build-guides.js dist (scripts/build-site.sh does this).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CROPS } from '../src/crops/index.js';

const ORIGIN = 'https://growthstage.leckerstonelabs.com';
const MARKER = '<!--GUIDES-->';

const out = process.argv[2];
if (!out) throw new Error('usage: node scripts/build-guides.js <dist dir>');

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const slug = (crop) => crop.id.replaceAll('_', '-');
const gs = (code) => `GS${String(code).padStart(2, '0')}`;
const modelLink = (crop, code) => `../?crop=${encodeURIComponent(crop.id)}${code == null ? '' : `&gs=${code}`}`;

function guidePage(crop) {
  const url = `${ORIGIN}/${slug(crop)}/`;
  const range = `${gs(crop.stages[0].code)}–${gs(crop.stages.at(-1).code)}`;
  const title = `${crop.name} growth stages (${range}) | Growth Stage`;
  const description = `${crop.name} growth stages ${range} on the ${crop.stageSystem} key: what changes and what to check at each stage, with an animated 3D model of the plant.`;

  const phaseIds = new Set(crop.phases.map((p) => p.id));
  for (const s of crop.stages) {
    if (!phaseIds.has(s.phase)) throw new Error(`${crop.id} ${gs(s.code)}: unknown phase ${s.phase}`);
  }
  const phases = crop.phases
    .map((p) => ({ ...p, stages: crop.stages.filter((s) => s.phase === p.id) }))
    .filter((p) => p.stages.length);

  const sourceKeys = [...new Set(crop.stages.flatMap((s) => s.sources || []))];
  for (const k of sourceKeys) {
    if (!crop.sources[k]) throw new Error(`${crop.id}: unknown source ${k}`);
  }

  const stage = (s) => `
<section class="stage" id="${gs(s.code).toLowerCase()}">
<h3><span class="code">${gs(s.code)}</span> ${esc(s.title)}</h3>
<p>${esc(s.description)}</p>
<p class="check"><strong>What to check:</strong> ${esc(s.check)}</p>
<p class="model"><a href="${esc(modelLink(crop, s.code))}">See ${gs(s.code)} in the 3D model</a></p>
</section>`;

  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="theme-color" content="#efebe1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${esc(url)}" />
<link rel="icon" href="../favicon.ico" sizes="48x48" />
<link rel="icon" href="../icons/icon.svg" type="image/svg+xml" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="Leckerstone Labs" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${esc(url)}" />
<meta property="og:image" content="${ORIGIN}/og-image.png" />
<meta property="og:locale" content="en_GB" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="stylesheet" href="../guide.css" />
</head>
<body>
<header class="site"><a href="../">Growth Stage</a></header>
<main>
<h1>${esc(crop.name)} growth stages</h1>
<p class="intro">Every growth stage of ${esc(crop.name.toLowerCase())} on the ${esc(crop.stageSystem)} key, from ${gs(crop.stages[0].code)} to ${gs(crop.stages.at(-1).code)}: what changes, and what to check on the plant. To watch the plant grow through them, open the <a href="${esc(modelLink(crop))}">animated 3D model</a>.</p>
${phases.map((p) => `
<h2>${esc(p.name)}</h2>
${p.stages.map(stage).join('\n')}`).join('\n')}

<h2>Sources</h2>
<ul class="sources">
${sourceKeys.map((k) => `<li><a href="${esc(crop.sources[k].url)}">${esc(crop.sources[k].title)}</a></li>`).join('\n')}
</ul>
</main>
<nav class="crops" aria-label="Other crops">
<h2>Other crops</h2>
<ul>
${CROPS.filter((c) => c !== crop).map((c) => `<li><a href="../${slug(c)}/">${esc(c.name)} growth stages</a></li>`).join('\n')}
</ul>
</nav>
<footer>
<p>Draft content, not yet reviewed by an agronomist. Not a substitute for professional agronomic advice, and not endorsed by AHDB. Spotted a mistake? <a href="https://github.com/leckerstone-labs/growth-stage/issues">Report it on GitHub</a>.</p>
<p><a href="https://leckerstonelabs.com/projects/growth-stage?utm_source=growthstage&amp;utm_medium=guide">A Leckerstone Labs project</a> · <a href="https://github.com/leckerstone-labs/growth-stage">Source on GitHub</a></p>
</footer>
</body>
</html>
`;
}

for (const crop of CROPS) {
  mkdirSync(join(out, slug(crop)), { recursive: true });
  writeFileSync(join(out, slug(crop), 'index.html'), guidePage(crop));
}

const urls = [`${ORIGIN}/`, ...CROPS.map((c) => `${ORIGIN}/${slug(c)}/`)];
writeFileSync(join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(u)}</loc></url>`).join('\n')}
</urlset>
`);

const indexPath = join(out, 'index.html');
const index = readFileSync(indexPath, 'utf8');
if (!index.includes(MARKER)) throw new Error(`${indexPath}: ${MARKER} marker missing`);
const links = CROPS.map((c) => `<a href="${slug(c)}/">${esc(c.name)}</a>`).join(' · ');
writeFileSync(indexPath, index.replace(MARKER, links));

console.log(`Guides: ${CROPS.length} crop pages and sitemap.xml written to ${out}/`);
