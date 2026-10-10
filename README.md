# Growth Stage

An animated 3D guide to crop growth stages. Scrub through a plant's life, read the stage code,
see what changes and the feature to check, and compare it with the plant in front of you.

**Try it:** https://growthstage.leckerstonelabs.com · **Project page:**
https://leckerstonelabs.com/projects/growth-stage

- Winter wheat and winter two-row barley (Zadoks GS05–GS92), winter oilseed rape (BBCH key as
  used by AHDB, GS05–GS89).
- Inspection views: stem and node cutaway, collar and ligule, ear and grain, oilseed rape pods.
- A Progressive Web App: install it on a phone and it works offline in the field.
- Three.js, plain ES modules, no build step for development (three.js is vendored in `vendor/`).

> **Draft content.** The stage text and model dimensions are illustrative and still being
> reviewed. This is not a substitute for professional agronomic advice and is not endorsed by
> AHDB. Corrections are welcome: see [CONTRIBUTING.md](CONTRIBUTING.md).

Built by [Leckerstone Labs](https://leckerstonelabs.com). MIT licence (see [LICENSE](LICENSE)).

## Run

```sh
npm run serve        # http://localhost:8642  (python3, caching disabled)
npm run check        # verifies the model meets the AHDB stage rules at every checkpoint
npm run build-site   # builds dist/ (what gets published)
```

The app opens at the crop's final stage (`?gs=<code>` opens another). Keys: ← / → previous/next stage, space play/pause. Drag to rotate, scroll/pinch to zoom.

## How it fits together

| Layer | File | What it holds |
|---|---|---|
| Crops | `src/crops/<crop>/` | Per crop: stage text and timeline positions (`stages.js`), key states (`keyframes.js`), dimensions (`params.js`) and stage rules (`checks.js`). Registered in `src/crops/index.js`; picked with `?crop=<id>` or the header picker. |
| Key states | `src/crops/<crop>/keyframes.js` | One row of numbers per checkpoint (leaf clock, internode lengths, ear position, flowering, grain…). Interpolated with a monotone spline so nothing shrinks or overshoots between checkpoints. |
| Morphology | `src/model/morphology.js`, `src/model/brassica.js` | Turns key states into a plant. Cereals: shoots, nodes, nested leaf sheaths, collars, blades, ear. Oilseed rape: seedling, leaf midribs, internodes, racemes and every flower/pod. Pure maths — also used by `npm run check`. |
| Roots | `src/model/roots.js`, `src/render/roots-mesh.js` | Root systems for every crop from each crop's `ROOTS` (in `params.js`): fibrous (seminal then nodal roots, as in cereals) or a taproot with laterals (oilseed rape), with optional nodules for legumes. |
| Rendering | `src/render/*.js` | three.js geometry (merged meshes, instanced ear parts), materials, grain and pod close-ups. |
| Soil | `src/render/soil.js`, `src/views/below-ground.js` | The cut-away soil block, its depth and the plant-view framing, shared by every crop. |
| Views | `src/views/cereal.js`, `src/views/brassica.js` | Per crop family: geometry for each inspection view, readouts, labels and camera framing. |
| UI | `src/main.js`, `src/ui/overlay.js` | Timeline, header, camera, render loop; live labels and measurement brackets. |
| PWA | `src/pwa.js`, `sw.js`, `manifest.webmanifest` | Offline caching, update toast, install button. See [Installable app](#installable-app-pwa). |

### Botanical rules the model follows

- From GS05: seed at 3.2 cm, seminal roots, coleoptile to the surface (GS09), first leaf through its tip (GS10); the sub-crown internode lifts the crown to 1.2 cm below the surface. The plant view shows the soil as a cut-away block.

### Soil and roots (every crop)

- Every crop's plant view shows the same cut-away soil block: the far half of the surface and a vertical cut face, deepening as the plant grows (9 cm for a seedling, up to 26 cm for a full-grown plant). The oilseed rape leaves view, which looks straight down, shows the whole surface instead.
- Roots are drawn at true scale in the block and thin out at its bottom; real roots go far deeper, so the readout gives the rooting depth and a label says how far the roots continue. With a tall plant in frame, roots are drawn thicker than life so they stay visible (the readout says so).
- Cereals: seminal roots from the seed (five for wheat, six for barley), then nodal (crown) roots from the crown from about the three-leaf stage, two per leaf up to 20, all branching, most root length in the topsoil. Rooting depth follows the AHDB wheat growth guide: main roots grow about 12 mm/day in autumn, 6 in winter and 18 in spring; about 1 m deep by GS31 and about 1.5 m (up to 2 m) by flowering. AHDB gives no separate barley figures, so barley uses the same depths.
- Oilseed rape: a taproot that thickens at the top with the root collar, with laterals that get shorter with depth (root length density falls with depth, AHDB project PR402). The depths (about 45 cm at GS30, about 1.2 m by the end of flowering) are illustrative: AHDB gives no oilseed rape rooting-depth benchmark.

- Main shoot has 11 leaves; leaves are numbered down from the flag leaf (flag, leaf 2, 3, 4) as in UK advice. Leaves 1–6 sit on the crown, leaf 7 on the base node, leaves 8–11 on nodes 1–4.
- Each blade emerges rolled from the sheath of the leaf below and unrolls; its ligule becomes visible when it is fully emerged.
- Internodes elongate in sequence; the AHDB node rule (1st node above ≥1 cm internode, later nodes above ≥2 cm) is what the stem view measures and labels.
- Only parts that exist at a stage are built: visible leaves plus ~2.5 primordia inside the shoot; future leaves are absent and rotted lower leaves drop out.
- Sheaths are sized from what is inside them (one wall per layer), so the pseudostem thickens as leaves are added and the boot swells because the ear is inside the flag-leaf sheath (not a hand-drawn bulge). The stem thickens as each internode elongates.
- Ear emergence is measured from the flag-leaf ligule (GS51 tip visible, GS55 half, GS59 base clear).
- Flowering starts mid-ear and spreads up and down; spent anthers fade and some stay trapped.
- Senescence runs bottom-up (and tip-first within a leaf); two late tillers die during stem extension.
- Tillers (and oilseed rape side branches) are not copies of each other: each gets a little seeded variation in direction, lean, curvature, size, timing and leaf shape (`src/model/random.js`). It is fixed per plant, so every reload and frame shows the same plant; `?seed=<number>` draws a different one. The main shoot and main raceme are never varied, because `npm run check` measures them.

### Deliberate exaggerations (flagged in the UI where relevant)

- Stem view widens tall shoots (×1–4) so nodes stay legible.
- Anthers ~1.6× thicker, ligule and auricles slightly larger than life.
- Collar view bends the inspected blade back to expose the ligule, as you would in the field.
- Plant view: roots of a large plant are drawn thicker than life, and only the top of the root system (down to the bottom of the soil block) is shown; the readout says so and gives the real rooting depth.

### Winter barley (two-row)

`?crop=winter_barley` or the header picker. Benchmarks from the AHDB barley growth guide: ~14 main-stem leaves, 4 nodes (5 internodes), ~87 cm final height with ~43% of it at GS39, 3 ear-bearing shoots per plant, 24 grains per ear. Differences from wheat:

- Large, hairless auricles that wrap round the stem and cross over; a small flag leaf.
- Two-row ear: one fertile spikelet per rachis node (two rows of grain) with small sterile side spikelets.
- Awns (~12 cm) grow bundled inside the boot and show above the flag ligule at GS49, before the ear tip (GS51).
- Flowering happens inside the florets, so no anthers are drawn; the readout says so.
- Ripe ears hang over (the top of the peduncle bends ~140°).
- Hulled, spindle-shaped grain with an awn stub; paler leaves and pale straw ripening colours.

### Winter oilseed rape

`?crop=winter_oilseed_rape` or the header picker. Uses the AHDB BBCH key (GS05–GS89). Views: Plant, Leaves (from above, numbered for counting), Stem (extended internodes ≥ 1 cm), Buds (green bud to full flower), Pods, and Seed (an opened mid-raceme pod with seed colour).

- Epigeal germination: the hooked hypocotyl lifts the cotyledons; kidney-shaped notched cotyledons, then stalked, lobed, glaucous rosette leaves in a 2/5 spiral. The oldest leaves die back as new ones form.
- Overwinter rosette (GS30) with a thickening root collar and taproot. Stem extension in spring, with clasping, stalkless upper stem leaves.
- Buds hidden by the youngest leaves (GS50), visible from above (GS51), raised clear (GS53), separate on the main raceme then side racemes (GS55/57), yellow bud (GS59).
- Flowers open from the bottom of each raceme upwards. Petals fall and pods lengthen behind the flowering front. BBCH percentages (flowers open, pods at final size, pods ripe) are counted from the model's flower positions.
- Seeds ripen bottom-up: the GS83 seed colours by thirds match AHDB's swathing guide. About 225 pods per plant (AHDB: 6,000–8,000 pods/m² at 25–40 plants/m²); final height about 127 cm (AHDB: 100–160 cm).
- Eight side racemes, one from each stem-leaf axil (smaller and later lower down), each lagging the main raceme.

## Installable app (PWA)

| File | Role |
|---|---|
| `manifest.webmanifest` | Name, colours, icons; makes the site installable. |
| `icons/` | `icon.svg` (rounded, also the favicon) and `icon-maskable.svg` (full-bleed, for Android masks and the iOS home screen) are the sources. The PNGs are rendered from them in Chromium with `scripts/render-icons.js` (a Playwright run-code snippet) and committed. `favicon.ico` is made from `icon-512.png` with ImageMagick. |
| `sw.js` | Service worker. Precaches every shipped file on install, then serves cache-first, so the app works offline. Page loads with any query (`?crop=…`) get the cached page. Old caches are deleted when a new version activates. |
| `src/pwa.js` | Registers the worker, shows the "Update available — Reload" toast, and the "Install app" button (Chrome/Edge/Android) or an "Add to Home Screen" hint (iOS) in the info panel footer. |
| `og-image.png` | 1200×630 link-preview image (wheat at GS65 with the title). A placeholder made from a screenshot. |

**Versions and updates.** `scripts/build-site.sh` stamps `dist/sw.js` with a version, a hash of every shipped file (names and contents, nothing else), and with the list of files to precache (everything in `dist/`). So `sw.js` changes exactly when what ships changes: a commit that only touches docs or scripts, or rebuilding the same code, gives a byte-identical `sw.js` and no update prompt. Browsers check `sw.js` on each visit (it is served `no-cache`), and the app also checks when it comes back to the foreground and hourly. The new version downloads in the background. The user then sees the toast, and Reload switches to it. If they ignore it, it applies the next time every tab or the installed app is closed and reopened.

**Development.** The worker is not registered on `localhost`/`127.0.0.1`, so `npm run serve` always shows your edits. Open a local page once with `?sw=1` to test it (remembered for that address until you open it with `?sw=0`; turning it off unregisters the worker). Unbuilt, `sw.js` has no version or precache list and simply caches files as they load. To test the real thing, build and serve `dist/` with `?sw=1`.

**Headers.** `build-site.sh` writes `dist/_headers`: `Cache-Control: no-cache` everywhere (browsers revalidate; offline use comes from the service worker), plus `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options` and a Content-Security-Policy. The CSP allows scripts only from the site itself, the inline import map in `index.html` (by its SHA-256 hash, computed at build time; the build fails if any other inline script appears) and Cloudflare Web Analytics. No `'unsafe-inline'` for scripts or styles.

## Status

Published at https://growthstage.leckerstonelabs.com.

Illustrative and **not yet agronomically reviewed**. Oilseed rape dimensions and timings are illustrative values checked against the AHDB OSR benchmarks above. Barley dimensions are illustrative values tuned to the AHDB barley benchmarks above. Wheat dimensions are typical UK winter wheat values, tuned against AHDB benchmarks (≈34 cm at GS39, ≈69 cm to ear base after flowering, ~20 spikelets, ~48 grains/ear).

## Roadmap

Ideas, not promises. Suggestions and pull requests are welcome.

- **More crops:** spring barley (and a six-row variety), spring oats (a panicle rather than an ear), spring oilseed rape.
- **Link to a stage:** a button that copies a link to the current crop, stage and view, for sharing or reporting problems.
- **Agronomic review:** work through review comments and remove the draft label stage by stage.
- **Field notes:** optionally record an observation (date, predominant stage and range, notes, photo) on the device, without needing an account.
- **Phone polish:** a better layout for landscape phones, and tuning the timeline picker on real devices.
