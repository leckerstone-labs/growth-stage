# Growth Stage

An animated 3D guide to crop growth stages. Scrub through a plant's life, read the stage code,
see what changes and the feature to check, and compare it with the plant in front of you.

**Try it:** https://growthstage.leckerstonelabs.com · **Project page:**
https://leckerstonelabs.com/projects/growth-stage

- Winter and spring wheat, winter and spring two-row barley, spring and winter oats (Zadoks GS05–GS92),
  winter and spring oilseed rape (BBCH key as used by AHDB, GS05–GS89), winter and spring field beans (BBCH
  faba bean key as used by Defra/APHA and Bean YEN, GS05–GS97).
- Inspection views: stem and node cutaway, collar and ligule, ear or panicle and grain, oilseed
  rape pods, bean flowers, pods and seed.
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
| Crops | `src/crops/<crop>/` | Per crop: stage text and timeline positions (`stages.js`), key states (`keyframes.js`), dimensions (`params.js`) and stage rules (`checks.js`). Registered in `src/crops/index.js`; picked with `?crop=<id>` or the header picker. Winter and spring forms of a species (same stage key) are variants: the picker lists species, with a Winter/Spring toggle beside it. |
| Key states | `src/crops/<crop>/keyframes.js` | One row of numbers per checkpoint (leaf clock, internode lengths, ear position, flowering, grain…). Interpolated with a monotone spline so nothing shrinks or overshoots between checkpoints. |
| Morphology | `src/model/morphology.js`, `src/model/brassica.js`, `src/model/legume.js` | Turns key states into a plant. Cereals: shoots, nodes, nested leaf sheaths, collars, blades, ear. Oilseed rape: seedling, leaf midribs, internodes, racemes and every flower/pod. Field beans: hypogeal seedling, square stem, compound leaves, axillary racemes, every flower and pod, basal side shoots. Pure maths — also used by `npm run check`. |
| Roots | `src/model/roots.js`, `src/render/roots-mesh.js` | Root systems for every crop from each crop's `ROOTS` (in `params.js`): fibrous (seminal then nodal roots, as in cereals) or a taproot with laterals (oilseed rape, field beans), with nitrogen-fixing nodules for beans. |
| Rendering | `src/render/*.js` | three.js geometry (merged meshes, instanced ear parts), materials, grain and pod close-ups. |
| Soil | `src/render/soil.js`, `src/views/below-ground.js` | The cut-away soil block, its depth and the plant-view framing, shared by every crop. |
| Views | `src/views/cereal.js`, `src/views/brassica.js`, `src/views/legume.js` | Per crop family: geometry for each inspection view, readouts, labels and camera framing. |
| UI | `src/main.js`, `src/ui/overlay.js` | Timeline, header, camera, render loop; live labels and measurement brackets. |
| PWA | `src/pwa.js`, `sw.js`, `manifest.webmanifest` | Offline caching, update toast, install button. See [Installable app](#installable-app-pwa). |

### Botanical rules the model follows

- From GS05: seed at 3.2 cm, seminal roots, coleoptile to the surface (GS09), first leaf through its tip (GS10); the sub-crown internode lifts the crown to 1.2 cm below the surface. The plant view shows the soil as a cut-away block.

### Soil and roots (every crop)

- A **Roots** toggle (beside the zoom buttons, plant view only; off by default) chooses how much is shown. Off: every root is cut short at 6 cm (about the rooting depth at emergence, so a seedling's seed, radicle and first roots look the same either way) in a shallow block (10 cm, deeper for deep-sown beans), so the plant fills the frame; the readout still gives the rooting depth. On: the whole root system, as described below. The choice is remembered in the browser, and `?roots=1` / `?roots=0` sets it from the URL (kept when switching crop).
- With the toggle on, every crop's plant view shows the same cut-away soil block: the far half of the surface and a vertical cut face, deepening as the plant grows (9 cm for a seedling, up to 26 cm for a full-grown plant). The oilseed rape leaves view, which looks straight down, shows the whole surface instead.
- Roots are drawn at true scale in the block and thin out at its bottom; real roots go far deeper, so the readout gives the rooting depth and a label says how far the roots continue. With a tall plant in frame, roots are drawn thicker than life so they stay visible (the readout says so).
- Cereals: seminal roots from the seed (five for wheat, six for barley), then nodal (crown) roots from the crown from about the three-leaf stage, two per leaf up to 20, all branching, most root length in the topsoil. Rooting depth follows the AHDB wheat growth guide: main roots grow about 12 mm/day in autumn, 6 in winter and 18 in spring; about 1 m deep by GS31 and about 1.5 m (up to 2 m) by flowering. AHDB gives no separate barley figures, so winter barley uses the same depths. Spring barley roots less deeply: about 1 m by flowering (illustrative: AHDB's spring root growth rate of ~18 mm/day over the two months from emergence to flowering), with up to 14 crown roots. Spring wheat likewise: about 1.1 m by flowering (illustrative), up to 14 crown roots.
- Oilseed rape: a taproot that thickens at the top with the root collar, with laterals that get shorter with depth (root length density falls with depth, AHDB project PR402). The depths (about 45 cm at GS30, about 1.2 m by the end of flowering) are illustrative: AHDB gives no oilseed rape rooting-depth benchmark.
- Field beans: a strong taproot with laterals, most of them near the top, and pink-brown nitrogen-fixing nodules on the upper roots from about the third leaf (Bean YEN takes the fourth node as the start of nodulation). Rooting depth about 0.8 m (spring) to 1 m (winter) by the end of flowering: illustrative, between SaskPulse's ~0.6 m average and AgroAtlas's 0.8–1.5 m. The seed is sown deep (8 cm spring, 10 cm winter in the model), so the soil block is deeper for beans.

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
- Oats: the ligule is drawn a little larger than life (about 4 mm).
- Field beans: flowers about 1.15× life size, and in the Flowers and Pods views the leaves at the nodes being inspected are cut back to stubs so the racemes show (the readout says so).
- Plant view: roots of a large plant are drawn thicker than life, and only the top of the root system (down to the bottom of the soil block) is shown; the readout says so and gives the real rooting depth.

### Spring wheat

`?crop=spring_wheat`, or Wheat in the header picker and then Spring. The same stage key and text as winter wheat, with the wording about winter replaced. AHDB has no spring wheat growth guide; benchmarks: AHDB Recommended List 2022/23 (spring wheats 72–80 cm without PGR, against 82–95 cm for winter wheats), the AHDB wheat guide (later sowing means fewer leaves), NDSU Extension (most spring wheats make 8 main-stem leaves; North American, so a guide only) and an agronomist's advice in Farmers Weekly (drilled from late winter to April, tillers less than winter wheat, about 600 ears/m² from 325–400 seeds/m²). Differences from winter wheat:

- 8 main-stem leaves: leaves 1–3 on the crown, leaf 4 on the base node, leaves 5–8 on nodes 1–4.
- Upright from the start (no prostrate winter habit). Tillers appear in quick succession between leaf 3 and the start of stem extension; three die during stem extension and booting, leaving 2 ear-bearing shoots (about 600 ears/m²).
- About 69 cm final height (10 cm below the winter wheat model, as in the RL), 44% of it at GS39. A slightly smaller ear: 8 cm and 19 spikelets (estimates; optional `EAR.spikelets`).
- Shallower roots (see above).

### Winter barley (two-row)

`?crop=winter_barley` or the header picker. Benchmarks from the AHDB barley growth guide: ~14 main-stem leaves, 4 nodes (5 internodes), ~87 cm final height with ~43% of it at GS39, 3 ear-bearing shoots per plant, 24 grains per ear. Differences from wheat:

- Large, hairless auricles that wrap round the stem and cross over; a small flag leaf.
- Two-row ear: one fertile spikelet per rachis node (two rows of grain) with small sterile side spikelets.
- Awns (~12 cm) grow bundled inside the boot and show above the flag ligule at GS49, before the ear tip (GS51).
- Flowering happens inside the florets, so no anthers are drawn; the readout says so.
- Ripe ears hang over (the top of the peduncle bends ~140°).
- Hulled, spindle-shaped grain with an awn stub; paler leaves and pale straw ripening colours.

### Spring barley (two-row)

`?crop=spring_barley`, or Barley in the header picker and then Spring. The same stage key and text as winter barley, with the wording about winter replaced. Benchmarks: AHDB barley growth guide (spring varieties 10–20 cm shorter than winter ones, 57% of final height at flag leaf emergence, fewer tillers, 19–24 grains per ear, 82 °C days per leaf against 108) and the Teagasc Spring Barley Guide (Irish benchmark crops: 8 main-stem leaves (7–9), the top four on the extended stem, 59 cm, about 4 shoots per plant at the peak falling to about 3 ears). Differences from winter barley:

- 8 main-stem leaves: leaves 1–3 on the crown, leaf 4 on the base node, leaves 5–8 on nodes 1–4.
- Upright from the start (no prostrate winter habit). Tillers appear in quick succession between leaf 3 and the start of stem extension; two die during stem extension, leaving 3 ear-bearing shoots.
- About 70 cm final height (between the AHDB and Teagasc figures), 53% of it at GS39; 21 grains per ear.
- Shallower roots (see above).

### Oats (spring and winter)

`?crop=spring_oats` / `?crop=winter_oats`, or Oats in the header picker and then Spring or Winter. AHDB has no oat growth guide, so the benchmarks come from the Opti-Oat *Oat Growth Guide* (2019; UK trials, spring cv. Canyon, winter cv. Mascani; not an AHDB publication), which uses the same Zadoks key. Identification features are from AHDB's wild-oat page. Differences from wheat and barley:

- A **panicle** (`render/panicle-mesh.js`, `EAR.type: 'panicle'`, laid out by `PANICLE` in `params.js`): six whorls of branches on the rachis (Opti-Oat: 5–7, often about four branches), fewer spikelets per whorl towards the top (about 75% on the bottom three), large papery glumes round two florets, spikelets hanging on pedicels. 22 spikelets (44 grains, spring) and 24 (48 grains, winter; benchmark 47). In the boot it is folded up and squeezed into the flag-leaf sheath (checked numerically); each whorl spreads once it is clear of the ligule, the branch tips droop as the grain fills, and the rachis arches over as it ripens.
- No GS49 (oats are effectively awnless); GS51 is the first spikelet of the panicle, measured from the flag-leaf ligule as for ears. GS91 (grain hard, difficult to divide) replaces GS89, as in the Opti-Oat key.
- Flowering runs from the top of the panicle down, lower floret first; only half the florets push their anthers out.
- No auricles; a large, membranous, finely toothed ligule. Hairless leaves that twist anticlockwise (wheat and barley clockwise). Paler, bluish-green leaves; panicles ripen to pale straw.
- Six internodes (five nodes on the extended stem, the peduncle longest). Hulled, slender grain with green husk ripening to cream.
- Spring oats: 9 main-stem leaves, upright, the main shoot plus two tillers (one dies), 46 cm to the flag ligule at GS39, 70/91 cm (ligule/panicle top) at GS59, 108 cm final.
- Winter oats: 11 leaves, prostrate over winter, three tillers (two die), 45 cm at GS39, 65/93 cm at GS59, 104 cm final. The text adds the winter benchmarks (overwinter survival, dates).
- Shoot counts follow the Opti-Oat benchmarks (spring about 1.7 shoots per plant at GS31 and 1.4 panicles at harvest; winter about 3 and 2), so spring oats have no GS23/GS24 checkpoints and winter oats no GS24.
- Estimates, to be measured on real crops: leaf numbers and every leaf, sheath, panicle and spikelet dimension; three seminal roots and a wider crown-root spread; rooting depths (about 1 m by flowering for spring oats, 1.6 m for winter oats, read loosely from the Opti-Oat charts).

### Winter oilseed rape

`?crop=winter_oilseed_rape` or the header picker. Uses the AHDB BBCH key (GS05–GS89). Views: Plant, Leaves (from above, numbered for counting), Stem (extended internodes ≥ 1 cm), Buds (green bud to full flower), Pods, and Seed (an opened mid-raceme pod with seed colour).

- Epigeal germination: the hooked hypocotyl lifts the cotyledons; kidney-shaped notched cotyledons, then stalked, lobed, glaucous rosette leaves in a 2/5 spiral. The oldest leaves die back as new ones form.
- Overwinter rosette (GS30) with a thickening root collar and taproot. Stem extension in spring, with clasping, stalkless upper stem leaves.
- Buds hidden by the youngest leaves (GS50), visible from above (GS51), raised clear (GS53), separate on the main raceme then side racemes (GS55/57), yellow bud (GS59).
- Flowers open from the bottom of each raceme upwards. Petals fall and pods lengthen behind the flowering front. BBCH percentages (flowers open, pods at final size, pods ripe) are counted from the model's flower positions.
- Seeds ripen bottom-up: the GS83 seed colours by thirds match AHDB's swathing guide. About 225 pods per plant (AHDB: 6,000–8,000 pods/m² at 25–40 plants/m²); final height about 127 cm (AHDB: 100–160 cm).
- Eight side racemes, one from each stem-leaf axil (smaller and later lower down), each lagging the main raceme.

### Spring oilseed rape

`?crop=spring_oilseed_rape`, or Oilseed rape in the header picker with the Winter/Spring toggle. Same AHDB BBCH key and views as winter oilseed rape, whose stage text it reuses with spring overrides. AHDB has little on spring crops beyond sowing (February–April, at least 40–50 plants/m²), so timings come from Canadian and Ontario spring canola guides (Canola Council, Field Crop News, Bayer).

- No overwintering rosette: 13 main-stem leaves (7 in a short, more upright rosette, 6 on the stem; Canola Council: 9–30), buds forming and the stem extending at about seven leaves (Bayer: by the six-leaf stage). No GS19 checkpoint: "9 or more leaves" is reached only after a more advanced stage applies.
- Five side racemes (Ontario: 3–7), about 135 pods per plant and about 106 cm final height. The main stem is 59% of its final length at yellow bud (Canola Council: 30–60% just before flowering).
- Estimates, to be checked on UK crops: height (AHDB's descriptive list scores spring varieties fairly short but gives no cm), pods per plant, every leaf and internode dimension, the thinner root collar, and rooting depth (about 1 m by the end of flowering).

### Field beans (winter and spring)

`?crop=winter_beans` / `?crop=spring_beans`, or Field beans in the header picker with the Winter/Spring toggle. AHDB has no bean growth-stage key, so this uses the BBCH faba bean key as reproduced in the Defra/APHA field bean VCU protocol and ADAS/PGRO Bean YEN guidance. Views: Plant, Nodes (leaves and scale leaves numbered for counting), Flowers, Pods (main stem) and Seed (an opened mid-stem pod with seeds at true size).

- Hypogeal germination: the seed stays at sowing depth; the shoot grows up as a hook and straightens at emergence. Two scale leaves at the first two nodes are not counted; leaf 1 is at the third node.
- Square, hollow stem; alternate leaves in two ranks; paripinnate leaves with no tendril, two leaflets on the first leaves rising to six; stipules with a dark nectary spot.
- Principal stages overlap; the most advanced is recorded. Spring beans: leaf checkpoints GS10–GS16, then bud stages from GS50. Winter beans overwinter at about three leaves (GS13) and grow two basal side shoots in spring (GS21, GS22). Extended internodes (GS3x) are a readout.
- A short raceme in each leaf axil from leaf 7 (spring) or leaf 6 (winter) up: estimates, as no UK first-flowering-node figure was found. White flowers with purple-veined standards and black-blotched wings open from the lowest node up; the BBCH raceme counts (GS61/63/65) are counted from the model. Only the lowest flowers of the lowest six or seven nodes set pods (1–2 per node); the rest drop.
- Pods lengthen lowest first (GS7x), are held up when young and swing out as they fill, then blacken from the bottom up (GS8x). Seeds go from green to buff with a black hilum. Leaves die and blacken from the bottom; stems darken last (GS9x).
- Spring: one stem, about 85 cm, 12 pods. Winter: three stems, about 105 cm, 18 pods. Heights, leaf and pod sizes and pods per node are illustrative.

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

Illustrative and **not yet agronomically reviewed**. Field bean dimensions, first flowering node and pods per node are estimates (no AHDB or UK benchmarks were found). Oilseed rape dimensions and timings are illustrative values checked against the AHDB OSR benchmarks above (spring oilseed rape against Canadian spring canola guides). Barley dimensions are illustrative values tuned to the AHDB (and, for spring barley, Teagasc) benchmarks above. Oat dimensions are illustrative values tuned to the Opti-Oat benchmarks above. Wheat dimensions are typical UK winter wheat values, tuned against AHDB benchmarks (≈34 cm at GS39, ≈69 cm to ear base after flowering, ~20 spikelets, ~48 grains/ear). Spring wheat leaf sizes, ear size and timing within the season are estimates.

## Roadmap

Ideas, not promises. Suggestions and pull requests are welcome.

- **More crops:** six-row barley.
- **Link to a stage:** a button that copies a link to the current crop, stage and view, for sharing or reporting problems.
- **Agronomic review:** work through review comments and remove the draft label stage by stage.
- **Field notes:** optionally record an observation (date, predominant stage and range, notes, photo) on the device, without needing an account.
- **Phone polish:** a better layout for landscape phones, and tuning the timeline picker on real devices.
