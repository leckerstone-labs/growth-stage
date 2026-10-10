# CLAUDE.md — Growth Stage app

Animated crop growth-stage guide (Leckerstone Labs), shipped as a Progressive Web App at https://growthstage.leckerstonelabs.com. Architecture overview for humans: `README.md`. Contributor guide: `CONTRIBUTING.md`.

If present, `PROJECT_LOG.md` (session history, open threads) and `IDEA.md` (product brief) are the maintainer's local notes. They are git-ignored: read them for context, but never quote them in committed files.

Current state: Three.js PWA with **winter wheat**, **winter and spring barley (two-row)**, **spring and winter oats** (Zadoks GS05–GS92), **winter oilseed rape** (AHDB BBCH key, GS05–GS89) and **winter and spring field beans** (BBCH faba bean key as used by Defra/APHA and Bean YEN, GS05–GS97; there is no AHDB bean key). Pick the crop in the header (species picker plus a Winter/Spring toggle) or with `?crop=winter_barley` / `?crop=spring_barley` / `?crop=spring_oats` / `?crop=winter_oats` / `?crop=winter_oilseed_rape` / `?crop=winter_beans` / `?crop=spring_beans`. The app opens at the crop's final stage unless `?gs=` names one (switching crop keeps the stage if the new crop has it). The PWA is the only app: there are no native iOS/Android apps. No build step for development; three.js is vendored in `vendor/`, and a service worker makes the published app work offline.

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
- **Versioning:** `build-site.sh` replaces `__BUILD_VERSION__` with a 12-char hash of every shipped file (paths + contents) and the `/*__PRECACHE__*/ … /*__END__*/` span with the file list from `find dist`. Never hand-maintain the list. Any shipped change → new `sw.js` bytes → browsers install the new worker and users see the toast. Never put the git commit, a date or anything machine-specific into `sw.js`: any byte change prompts every user to update, so a docs-only commit would show a spurious "Update available" (this happened when the commit was part of the version).
- **Multiple tabs:** the toast's Reload asks whichever worker is waiting now (a newer one may have replaced it); a tab that sees another tab apply the update hides its own toast.
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
| Variation | `src/model/random.js` | Seeded PRNG (`variation(seed, crop.id, partId)`) for per-tiller/branch irregularity. Draw once when the model is created, never per frame, never `Math.random`. Main shoot / main raceme are never varied. `?seed=` picks the plant (default `DEFAULT_SEED`). |
| Morphology | `src/model/morphology.js` (cereals), `src/model/brassica.js` (OSR), `src/model/legume.js` (field beans) | Pure maths (no three.js). `src/model/index.js` picks one by `crop.family`. Each returns `computePlant`, `measureMain`, `checkStages` (runs the crop's `checks.js`) and `tAt`; brassica and legume also return `table` for `npm run check`. Legume's `tAt(code)` falls forward to the next checkpoint when a variant lacks the code (winter and spring beans have different leaf/side-shoot checkpoints). |
| Roots | `src/model/roots.js` (maths), `src/render/roots-mesh.js` (drawing) | Shared by every crop. `computeRoots(ROOTS, state, { clip, minR })`: `ROOTS.type` `'fibrous'` (seminal + nodal) or `'taproot'` (+ laterals), optional `nodules` (beans). The keyframe `roots` channel is the real root length from the seed (cm). Meshes save `rootArgs` in `build()` and draw with `setRoots(opts)` once the view knows the framing. |
| Rendering | `src/render/*.js` | Cereals: merged-geometry batches (`plant-mesh.js`), instanced ear (`ear-mesh.js`; `EAR.type` 'wheat', 'barley' or 'panicle', the oat panicle in `panicle-mesh.js`), grain close-up. OSR: `brassica-mesh.js` (reuses `Batch`), `pod-view.js` seed close-up. Beans: `legume-mesh.js` (reuses `Batch` and brassica-mesh's `tube`/`ellipsoid`/`frames`), `bean-pod-view.js` seed close-up. Shared: soil, materials, roots. |
| Soil | `src/render/soil.js`, `src/views/below-ground.js` | One cut-away soil block for every crop. Views call `belowGround()` in the plant view (soil depth from the plant's size, roots, rooting-depth readout and label, camera goal) and `belowGroundOther()` in other views. Don't add per-crop soil code. |
| Views | `src/views/cereal.js`, `src/views/brassica.js`, `src/views/legume.js` | Per crop family: which views are enabled when, geometry build per view, readout rows, overlay items and camera goal. `src/views/index.js` picks one by `crop.family`. |
| UI | `src/main.js`, `src/ui/overlay.js` | Crop-independent: timeline, header, camera, render loop; overlay labels, brackets and `tag` badges. |
| PWA | `src/pwa.js`, `sw.js` | Service worker registration, update toast, install button. Independent of main.js. |

Principles that make the model look right. Keep them when adding crops:

- **Diagnostic features come from the model's structure, not hand-drawn shapes.** Boot swelling happens because sheaths are fitted around their contents. Ear emergence is measured from the flag ligule. Node detection uses the AHDB internode rule.
- **Only build what exists at that stage.** Leaves are present from primordium (vH + 2.5) until they rot away. Sheaths are sized from their actual contents plus a wall. Stems thicken as their internodes elongate. Building the final plant and scaling it down produced chunky, telescoped pseudostems.
- **Sheaths are stiff tubes.** Each keeps roughly its base width and only bulges where something inside pushes it out. Fitting them tightly to their contents pinches the sheath above the ear.
- **Rendered parts must stay inside the model's envelope.** The ear is fitted to the model's length, follows the curved shoot axis, and is squeezed sideways while enclosed. When something pokes through, measure the geometry against the envelope numerically (see Debugging) rather than guessing.
- **Timings refer to stage codes.** Use `tAt(code)` / `between()` in morphology and `tAt` in main, never raw `t` numbers. The timeline has already been re-allocated once, when the seedling stages were added.
- **Exaggerations are deliberate and labelled in the UI:** stem-view width ×1–4 (an oat panicle is not widened), anthers ~1.6× thicker, enlarged ligule and auricles, the blade bent back in the collar view, thicker-than-life roots in the plant view, and (beans) flowers ~1.15× and leaves trimmed to stubs at the inspected nodes in the flowers and pods views. Note any new ones in README.

## Adding another crop

The app picks the crop from the URL (`?crop=<id>`; unknown ids fall back to the first crop). Add a crop folder and register it in the flat `CROPS` list in `src/crops/index.js`:

```
src/crops/<crop>/index.js       # assembles the pieces below
src/crops/<crop>/stages.js      # STAGES, PHASES, SOURCES, TICKS, UI wording
src/crops/<crop>/keyframes.js   # ROWS (channels may differ per crop)
src/crops/<crop>/params.js      # leaf/sheath/blade tables, SHOOTS, stem radii, ear/grain dims, collar type, ROOTS
src/crops/<crop>/checks.js      # stage rules for npm run check
```

**Species and variants.** Winter and spring forms of a crop use the same AHDB stage key, so they are *variants* of one *species*, not separate crops in the UI. Each variant is still a full crop folder and crop object, registered in `CROPS`:

- id `<variant>_<species>` (`winter_barley`, `spring_barley`, `spring_oats`, `winter_beans`…), plus `species` (`'barley'`), `speciesName` (`'Barley'`) and `variant` (`'winter'` | `'spring'`) in its `CROP` object. `name` stays the full name ("Spring barley"): it is the page title.
- The header picker lists species (`SPECIES` in `src/crops/index.js`). A species with one variant shows its full name ("Winter wheat"); one with several shows `speciesName` and a Winter/Spring toggle (`#season`). Picking a species keeps the current variant if it has one, else its first registered variant (`cropForSpecies`). Switching crop or variant reloads with the new id, keeping the stage (if the code exists, else the final stage; between variants of one species, the nearest earlier stage the other variant has, e.g. winter beans GS22 → spring beans GS16), view and seed.
- A second variant should import the first one's files and override only what differs, not copy them. `src/crops/spring-barley/` is the example: `stages.js` maps winter barley's `STAGES` with a per-code table of replaced fields (text about winter, benchmarks, sources); `params.js` re-exports the shared collar/grain/colours and sets its own `MAIN`, `shoots`, `EAR` and `ROOTS`; `checks.js` calls winter barley's `barleyChecks()` with spring benchmark ranges and adds spring-only checks. `keyframes.js` is its own (don't reuse winter rows).
- Keep the stage list the same as the other variant where you can. Shared code calls `tAt()` for cereal codes such as 24, 32, 33, 39; a code a crop doesn't use as a checkpoint (spring oats stop at GS22, oats have no GS49) falls between its neighbours by code, so dropping one is safe.

Keep generic and shared: the interp/keyframe machinery, the shoot/leaf/sheath/collar/stem builders, seedling and roots, soil, overlay, camera, timeline UI, the grain-view framework, and the contact-sheet tooling. Make the inflorescence builder pluggable (spike, two/six-row spike, panicle, raceme).

What differs per crop. These are reference notes: verify each against AHDB before relying on them.

- **Barley (winter/spring):** winter and spring two-row barley are done (`src/crops/winter-barley/`, `src/crops/spring-barley/`). How it differs from wheat in code: 14 leaves; `awnL` keyframe channel (awns bundled in the boot, visible at GS49 before the ear); `EAR.type: 'barley'` builder in `ear-mesh.js`; `EAR.neck` bends the shoot axis so ripe ears hang; `COLLAR` overrides for large clasping auricles; `GRAIN` for a hulled grain; `PALETTE` overrides. A six-row variety would be a new crop folder reusing these.
  - Same Zadoks scale and stem-extension rules as wheat.
  - Auricles are large, hairless and clasping (wheat's are small and hairy); AHDB's GS39 illustration has a wheat-vs-barley ligule inset.
  - Long awns, so GS49 (awns visible) is a real stage.
  - Three spikelets per rachis node: two-row (only the central one fertile) or six-row.
  - Flowering largely happens inside the boot, so anthers are seldom seen.
  - Spring barley (done): 8 leaves (Teagasc 7–9), upright from the start, tillers that appear closer together in leaf terms (the optional `appear` field on a shoot def), ~70 cm, 21 grains per ear (optional `EAR.nodes`), shallower roots.
  - Ear "nods" strongly when ripe.
- **Oats (spring/winter):** done (`src/crops/spring-oats/`, `src/crops/winter-oats/`, which imports spring's stage text, panicle, collar, grain and colours). Benchmarks from the Opti-Oat Oat Growth Guide (2019; AHDB has no oat guide). In code:
  - `EAR.type: 'panicle'` → `render/panicle-mesh.js`, laid out by `PANICLE` (whorl positions, branches and spikelets per whorl, branch lengths, spread, droop, pedicels, share of florets showing anthers). Everything is placed in panicle-local coordinates and mapped through the shoot axis; packed in the boot (squeezed into `earR × earProfile`), each whorl spreads once ≥1 cm clear of the ligule. Tillers' panicles lean out only once fully emerged. Run the poke-through check after changing it.
  - `MAIN.internodes: 5` (six internodes in all; keyframe channels i1..i5; shared morphology/views handle any count, default 4). `MAIN.twist: -1` (leaves twist anticlockwise).
  - `COLLAR`: `auricles: false`, large ligule with `ligArc`/`ligRound`/`ligTeeth`. `EAR.neckSpan: [-3, 'top']` makes the ripening rachis arch over. `UI.ear: 'panicle'` renames the ear in readouts and labels.
  - No GS49; GS91 instead of GS89; spring oats stop at GS22, winter oats at GS23 (Opti-Oat shoot benchmarks).
- **Oilseed rape:** winter OSR is done (`src/crops/winter-oilseed-rape/`, `family: 'brassica'`). AHDB uses the BBCH two-digit key for OSR, so codes look like cereal ones but mean different things (GS30 rosette, GS51 green bud, GS59 yellow bud, GS65 full flower, GS8x share of pods ripe).
  - Principal stages overlap in the field; AHDB says record the most advanced. The timeline follows that: GS3x internode count and GS2x side shoots are readouts, not checkpoints.
  - Model: rosette leaves on a crown, stem leaves one per node, side racemes from all eight stem-leaf axils (smaller and later lower down). Each side raceme runs the main raceme's keyframes with a lag (`BRANCHES[].lag`).
  - Every flower position is tracked from bud → flower → pod via the `opened`/`fallen`/`podFull`/`seed` channels, so the BBCH percentages are counted, not drawn.
  - Spring OSR would be a new folder reusing `brassica.js` with fewer leaves and no winter rosette.
- **Field beans:** winter and spring beans are done (`src/crops/winter-beans/`, `src/crops/spring-beans/`, `family: 'legume'`, `species: 'beans'`). Spring beans hold the shared stage text (`TEXT`, `stageList()`), checks (`beanChecks()`) and colours; winter beans import them and override what differs.
  - Stage key: BBCH faba bean (Defra/APHA VCU appendix; ADAS/PGRO Bean YEN). No AHDB key exists. Record the most advanced stage, so: GS1x leaf checkpoints give way to GS5x once buds show; winter beans' GS21/GS22 (basal side shoots) replace spring's GS14/GS16; GS3x (extended internodes) is a readout. As for OSR, pods reach final length (GS7x) only after the last flowers close: a simplification.
  - Germination is hypogeal: the seed (and cotyledons) stays at sowing depth; the shoot (`epi` channel) grows up as a hook (`hook`). Two scale leaves (not counted) sit at the first two nodes, round the soil surface. The soil block is deepened for the deep-sown seed (`belowGround({ minShown })`).
  - Model: a square stem; leaves alternate in two ranks (`az0` turns the ranks off the camera axis); paripinnate leaves with 2 leaflets low down to 6 higher up (`LEAVES.leaflets`), stipules with a nectary spot. Each internode lengthens with the leaf above it (leaf clock `vL`).
  - Flowering: a raceme per leaf axil from `FLOWERING.first`; the `fl` channel is the flowering front in nodes (negative = bud stages), each flower is open for `FLOWERING.open` nodes, so the BBCH raceme counts (GS61/63/65) are counted. Pods only on the lowest flowers of the lowest nodes (`PODS.perNode`); the rest drop. `podFull`/`seed` work as for OSR; pods turn black from the bottom up.
  - Winter beans: basal side shoots from the scale-leaf nodes (`BRANCHES`), each with its own leaf clock (`start`, `rate`) and a timeline lag for flowering/pods/ripening that closes up by harvest. Seeded variation per shoot; the main stem is never varied.
  - Dimensions, first flowering node and pods per node are estimates (no UK figures found): check with an agronomist.
- **Spring crops in general:** sown in spring, fewer leaves, faster development. Make them the spring variant of the species (see above), with their own `params.js`/`keyframes.js`; don't reuse winter rows. With few leaves, tillering (GS21–GS24) has to fit between leaf 3 and the start of stem extension: set `appear` on the tiller defs.

## Reference material

- AHDB stage key: https://ahdb.org.uk/knowledge-library/the-growth-stages-of-cereals. Wheat growth guide pages are linked from `SOURCES` in the stage data.
- `reference/` holds AHDB stage illustrations and the node-counting diagram, downloaded for visual comparison. They are AHDB copyright: the folder is git-ignored and must not be shipped.
  - The images live at `https://projectblue.blob.core.windows.net/media/Default/Imported%20Publication%20Thumbs/AHDB%20Cereals%20%26%20Oilseeds/General/Growth%20stages/Cereal%20growth%20stage%20GSxx.PNG`.
  - The growth-stage page's HTML lists them (search it for `projectblue`).
  - AHDB publishes equivalent guides for barley and OSR.

## Debugging and visual review

- `window.__plant` in the browser has `crop`, `model`, `view`, `go(code, mode)`, `setT(t)`, `setMode(mode)`, `state`, `plantMesh` (a `BrassicaMesh` for OSR), `earMesh` (cereals), `camera` and `controls`.
- **Shared-code regression check:** before editing anything shared, capture a fingerprint of every stage × view for every crop in the browser: readout text, label texts, and a checksum of visible geometry positions in `plantMesh.group` and `earMesh.group`. Capture it again after the edit and `cmp` the two. Used for the crop-registry, views and OSR changes.
- **Contact sheets:** in Playwright, `eval` the function in `scripts/contact-sheet.js` with a list of stage codes and a view, then save the returned data URL with `python3 scripts/save-dataurl.py <evaluate-output.txt> out.png`. This is the fastest way to review the whole lifecycle; use one per view.
- **Close-ups:** set `__plant.state.goal.{target,height,width}` and `state.enteringMode = true`.
- **Overflow / poke-through:** transform instance vertices and compare their distance from `plantMesh.axes.get(id)` with the sheath radius at that height. Attribute each instance to its own shoot, because neighbouring tillers' ears sit within millimetres near the crown.
- **three.js gotchas already hit:**
  - InstancedMesh needs `instanceColor` created up front.
  - Resized BufferGeometries must be replaced, not edited in place. Both cause "vertex buffer not big enough".
  - Inside-out triangle winding shows up as wrong cut faces in clipped views.
  - The stem-view width exaggeration scales the whole plant group, so anything else in it (roots) gets stretched too. Roots are capped to short stubs in stem views for this reason.
  - Roots use a transparent material and the soil cut face doesn't write depth, so roots behind the cut still draw over it. Root tubes must face outwards (`up = side × t` in `roots-mesh.js`).

## Conventions

- Units are centimetres. Each shoot has an axis coordinate `s` measured from its base. The seed is 3.2 cm deep and the crown settles at 1.2 cm below the surface.
- Leaves are numbered from the base in code and from the top in UI text: flag, leaf 2, leaf 3, leaf 4 (UK convention).
- The stage shown is the last checkpoint passed, with "developing towards GSxx" between checkpoints. Fractional codes are never shown.
- Agronomic text and model dimensions are drafts until an agronomist has reviewed them. Say so in the UI (the info panel footer does), along with "not a substitute for professional advice, not endorsed by AHDB".
- Remote: `github.com/leckerstone-labs/growth-stage` (public). Commit locally; push only when asked.
