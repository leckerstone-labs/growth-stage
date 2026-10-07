# CLAUDE.md — Growth Stage app

Animated crop growth-stage guide (Leckerstone Labs), shipped as a Progressive Web App at https://growthstage.leckerstonelabs.com. Architecture overview for humans: `README.md`. Contributor guide: `CONTRIBUTING.md`.

If present, `PROJECT_LOG.md` (session history, open threads) and `IDEA.md` (product brief) are the maintainer's local notes. They are git-ignored: read them for context, but never quote them in committed files.

Current state: Three.js PWA with **winter wheat** and **winter barley (two-row)** (Zadoks GS05–GS92) and **winter oilseed rape** (AHDB BBCH key, GS05–GS89). Pick the crop in the header or with `?crop=winter_barley` / `?crop=winter_oilseed_rape`. The PWA is the only app: there are no native iOS/Android apps. No build step for development; three.js is vendored in `vendor/`, and a service worker makes the published app work offline.

## Commands

```sh
npm run serve   # python3 scripts/serve.py → http://localhost:8642 (no-cache headers)
npm run check   # model must satisfy the AHDB stage rules at every checkpoint
npm run build-site  # build dist/ (stamps the service worker, writes _headers)
```

- **This repository is public** (MIT, `leckerstone-labs/growth-stage` on GitHub). Never commit email addresses, personal names, account or resource IDs, tokens, internal hostnames or IPs, business notes, or anything about other private systems. That includes commit messages. Refer to people by role ("an agronomist").
- **Domain:** https://growthstage.leckerstonelabs.com, public (no login). Canonical URL and Open Graph tags in `index.html` point there.
- **Build output:** `scripts/build-site.sh` copies only the listed app files (`index.html`, `styles.css`, `manifest.webmanifest`, `sw.js`, `favicon.ico`, `og-image.png`, `icons/`, `src/`, `vendor/`) into `dist/`, so `reference/`, `scripts/`, `.claude/` and the notes never ship. A new shipped file at the top level must be added to its `cp` line. `dist/` is plain static files plus a `_headers` file, so it can be hosted anywhere.
- **Deployment is not in this repo.** The official site is deployed from a private repo, from what has been pushed to `main`. Don't add hosting config, deploy scripts or account details here.

- Always use `npm run serve`, not `python3 -m http.server`. The plain server lets the browser cache ES modules, so edits silently don't appear. If Playwright shows stale behaviour, close the browser and reopen it.
- Run `npm run check` after any change to keyframes or morphology. It must pass before committing.

## PWA (installable, offline)

- `manifest.webmanifest` + `icons/` (SVG sources; PNGs rendered with `scripts/render-icons.js` in Playwright and committed; `favicon.ico` via ImageMagick). Colours match `styles.css` (`--paper` #efebe1 background/theme, `--accent` #2f5d3a icon).
- `sw.js`: precache everything on install, cache-first afterwards, navigations (any `?crop=` query) answered with the cached `./` page, old `growth-stage-*` caches deleted on activate. No `skipWaiting` on install: the page asks for it.
- **Versioning:** `build-site.sh` replaces `__BUILD_VERSION__` with `<short commit>[-dirty]-<8-char hash of every shipped file>` and the `/*__PRECACHE__*/ … /*__END__*/` span with the file list from `find dist`. Never hand-maintain the list. Any shipped change → new `sw.js` bytes → browsers install the new worker.
- **How updates reach users:** `sw.js` is served `no-cache`, so the browser checks it on every visit; `src/pwa.js` also calls `reg.update()` when the app returns to the foreground and hourly. The new worker installs in the background and waits; `pwa.js` shows the "Update available — Reload" toast; Reload posts `skipWaiting` and the page reloads once on `controllerchange`. Ignored, the update applies when all tabs / the installed app are closed.
- **Dev:** `pwa.js` does not register the worker on localhost/127.0.0.1, and unregisters any leftover, so `npm run serve` always shows edits. `?sw=1` turns it on for that local address (remembered in localStorage), `?sw=0` turns it off. Unbuilt, the version reads `dev` and nothing is precached (files are cached as fetched), so with `?sw=1` on the dev server edits won't show until you turn it off. For a real test, `npm run build-site` and serve `dist/` with its `_headers` applied, then use `?sw=1`; Playwright `context.setOffline(true)` checks offline.
- **Headers/CSP:** `build-site.sh` writes `dist/_headers` (no-cache everywhere; nosniff, Referrer-Policy, Permissions-Policy, X-Frame-Options, CSP). Scripts: `'self'`, the inline import map by SHA-256 hash (computed at build; the build fails if another inline `<script>` appears, so put new scripts in files), and `https://static.cloudflareinsights.com`; `connect-src` allows `https://cloudflareinsights.com` for Web Analytics (beacon not added yet). Styles: `'self'` only, so no `style="…"` attributes in HTML or `innerHTML` strings; setting `el.style.x` from JS is fine.
- **UI:** the toast sits above the timeline (desktop) or above the info bar (phone). Install button, Leckerstone Labs credit, GitHub links and the draft/not-professional-advice/not-AHDB disclaimer are in the info panel footer. Header, panels and timeline respect `env(safe-area-inset-*)`.
- `og-image.png` (1200×630) is a placeholder screenshot of wheat at GS65 with the title overlaid; regenerate it by screenshotting the app with the UI hidden.

## How the code is layered (keep it this way)

| Layer | File | Rule |
|---|---|---|
| Crop registry | `src/crops/index.js` | Lists the crops. Each crop folder is assembled by its `index.js`. |
| Agronomic content | `src/crops/<crop>/stages.js` | Stage codes, text, checks, sources, timeline position `t` (0–100), phases, tick labels, crop-specific UI wording. No rendering code. |
| Key states | `src/crops/<crop>/keyframes.js` + `src/model/keyframes.js` | One row per checkpoint (per crop); values carry forward; monotone-spline interpolation (no overshoot, so thresholds are crossed once). Extra channels in a crop's first row are interpolated too. |
| Dimensions | `src/crops/<crop>/params.js` | Leaf/sheath/blade tables, shoots, stem radii, ear profile, ear and collar type. |
| Morphology | `src/model/morphology.js` (cereals), `src/model/brassica.js` (OSR) | Pure maths (no three.js). `src/model/index.js` picks one by `crop.family`. Each returns `computePlant`, `measureMain`, `checkStages` (runs the crop's `checks.js`) and `tAt`; brassica also returns `table` for `npm run check`. |
| Rendering | `src/render/*.js` | Cereals: merged-geometry batches (`plant-mesh.js`), instanced ear (`ear-mesh.js`), grain close-up. OSR: `brassica-mesh.js` (reuses `Batch`), `pod-view.js` seed close-up. Shared: soil, materials. |
| Views | `src/views/cereal.js`, `src/views/brassica.js` | Per crop family: which views are enabled when, geometry build per view, readout rows, overlay items and camera goal. `src/views/index.js` picks one by `crop.family`. |
| UI | `src/main.js`, `src/ui/overlay.js` | Crop-independent: timeline, header, camera, render loop; overlay labels, brackets and `tag` badges. |
| PWA | `src/pwa.js`, `sw.js` | Service worker registration, update toast, install button. Independent of main.js. |

Principles that make the model look right. Keep them when adding crops:

- **Diagnostic features come from the model's structure, not hand-drawn shapes.** Boot swelling happens because sheaths are fitted around their contents. Ear emergence is measured from the flag ligule. Node detection uses the AHDB internode rule.
- **Only build what exists at that stage.** Leaves are present from primordium (vH + 2.5) until they rot away. Sheaths are sized from their actual contents plus a wall. Stems thicken as their internodes elongate. Building the final plant and scaling it down produced chunky, telescoped pseudostems.
- **Sheaths are stiff tubes.** Each keeps roughly its base width and only bulges where something inside pushes it out. Fitting them tightly to their contents pinches the sheath above the ear.
- **Rendered parts must stay inside the model's envelope.** The ear is fitted to the model's length, follows the curved shoot axis, and is squeezed sideways while enclosed. When something pokes through, measure the geometry against the envelope numerically (see Debugging) rather than guessing.
- **Timings refer to stage codes.** Use `tAt(code)` / `between()` in morphology and `tAt` in main, never raw `t` numbers. The timeline has already been re-allocated once, when the seedling stages were added.
- **Exaggerations are deliberate and labelled in the UI:** stem-view width ×1–4, anthers ~1.6× thicker, enlarged ligule and auricles, and the blade bent back in the collar view. Note any new ones in README.

## Adding another crop

The app picks the crop from the URL (`?crop=<id>`); the header has a picker that reloads with the new id, keeping the stage and view. Add a crop folder and register it in `src/crops/index.js`:

```
src/crops/<crop>/index.js       # assembles the pieces below
src/crops/<crop>/stages.js      # STAGES, PHASES, SOURCES, TICKS, UI wording
src/crops/<crop>/keyframes.js   # ROWS (channels may differ per crop)
src/crops/<crop>/params.js      # leaf/sheath/blade tables, SHOOTS, stem radii, ear/grain dims, collar type
src/crops/<crop>/checks.js      # stage rules for npm run check
```

Keep generic and shared: the interp/keyframe machinery, the shoot/leaf/sheath/collar/stem builders, seedling and roots, soil, overlay, camera, timeline UI, the grain-view framework, and the contact-sheet tooling. Make the inflorescence builder pluggable (spike, two/six-row spike, panicle, raceme).

What differs per crop. These are reference notes: verify each against AHDB before relying on them.

- **Barley (winter/spring):** winter two-row barley is done (`src/crops/winter-barley/`). How it differs from wheat in code: 14 leaves; `awnL` keyframe channel (awns bundled in the boot, visible at GS49 before the ear); `EAR.type: 'barley'` builder in `ear-mesh.js`; `EAR.neck` bends the shoot axis so ripe ears hang; `COLLAR` overrides for large clasping auricles; `GRAIN` for a hulled grain; `PALETTE` overrides. A six-row variety or spring barley would be a new crop folder (or a variant) reusing these.
  - Same Zadoks scale and stem-extension rules as wheat.
  - Auricles are large, hairless and clasping (wheat's are small and hairy); AHDB's GS39 illustration has a wheat-vs-barley ligule inset.
  - Long awns, so GS49 (awns visible) is a real stage.
  - Three spikelets per rachis node: two-row (only the central one fertile) or six-row.
  - Flowering largely happens inside the boot, so anthers are seldom seen.
  - Spring barley has fewer leaves (~8–10), no prostrate winter habit and a shorter tillering phase.
  - Ear "nods" strongly when ripe.
- **Oats (spring):** the inflorescence is a panicle, not a spike, so it needs a new builder. No auricles; a prominent ligule. Same Zadoks codes.
- **Oilseed rape:** winter OSR is done (`src/crops/winter-oilseed-rape/`, `family: 'brassica'`). AHDB uses the BBCH two-digit key for OSR, so codes look like cereal ones but mean different things (GS30 rosette, GS51 green bud, GS59 yellow bud, GS65 full flower, GS8x share of pods ripe).
  - Principal stages overlap in the field; AHDB says record the most advanced. The timeline follows that: GS3x internode count and GS2x side shoots are readouts, not checkpoints.
  - Model: rosette leaves on a crown, stem leaves one per node, side racemes from the top six stem-leaf axils. Each side raceme runs the main raceme's keyframes with a lag (`BRANCHES[].lag`).
  - Every flower position is tracked from bud → flower → pod via the `opened`/`fallen`/`podFull`/`seed` channels, so the BBCH percentages are counted, not drawn.
  - Spring OSR would be a new folder reusing `brassica.js` with fewer leaves and no winter rosette.
- **Spring crops in general:** sown in spring, fewer leaves, faster development. Use separate `params.js`/`keyframes.js`; don't reuse winter rows.

## Reference material

- AHDB stage key: https://ahdb.org.uk/knowledge-library/the-growth-stages-of-cereals. Wheat growth guide pages are linked from `SOURCES` in the stage data.
- `reference/` holds AHDB stage illustrations and the node-counting diagram, downloaded for visual comparison. They are AHDB copyright: the folder is git-ignored and must not be shipped.
  - The images live at `https://projectblue.blob.core.windows.net/media/Default/Imported%20Publication%20Thumbs/AHDB%20Cereals%20%26%20Oilseeds/General/Growth%20stages/Cereal%20growth%20stage%20GSxx.PNG`.
  - The growth-stage page's HTML lists them (search it for `projectblue`).
  - AHDB publishes equivalent guides for barley and OSR.

## Debugging and visual review

- `window.__plant` in the browser has `crop`, `model`, `view`, `go(code, mode)`, `setT(t)`, `setMode(mode)`, `state`, `plantMesh` (a `BrassicaMesh` for OSR), `earMesh` (cereals), `camera` and `controls`.
- **Shared-code regression check:** before editing anything shared, capture a fingerprint of every stage × view for wheat and barley in the browser: readout text, label texts, and a checksum of visible geometry positions in `plantMesh.group` and `earMesh.group`. Capture it again after the edit and `cmp` the two. Used for the crop-registry, views and OSR changes.
- **Contact sheets:** in Playwright, `eval` the function in `scripts/contact-sheet.js` with a list of stage codes and a view, then save the returned data URL with `python3 scripts/save-dataurl.py <evaluate-output.txt> out.png`. This is the fastest way to review the whole lifecycle; use one per view.
- **Close-ups:** set `__plant.state.goal.{target,height,width}` and `state.enteringMode = true`.
- **Overflow / poke-through:** transform instance vertices and compare their distance from `plantMesh.axes.get(id)` with the sheath radius at that height. Attribute each instance to its own shoot, because neighbouring tillers' ears sit within millimetres near the crown.
- **three.js gotchas already hit:**
  - InstancedMesh needs `instanceColor` created up front.
  - Resized BufferGeometries must be replaced, not edited in place. Both cause "vertex buffer not big enough".
  - Inside-out triangle winding shows up as wrong cut faces in clipped views.
  - The stem-view width exaggeration scales the whole plant group, so anything else in it (roots) gets stretched too.

## Conventions

- Units are centimetres. Each shoot has an axis coordinate `s` measured from its base. The seed is 3.2 cm deep and the crown settles at 1.2 cm below the surface.
- Leaves are numbered from the base in code and from the top in UI text: flag, leaf 2, leaf 3, leaf 4 (UK convention).
- The stage shown is the last checkpoint passed, with "developing towards GSxx" between checkpoints. Fractional codes are never shown.
- Agronomic text and model dimensions are drafts until an agronomist has reviewed them. Say so in the UI (the info panel footer does), along with "not a substitute for professional advice, not endorsed by AHDB".
- Remote: `github.com/leckerstone-labs/growth-stage` (public). Commit locally; push only when asked.
