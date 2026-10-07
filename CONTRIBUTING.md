# Contributing

Thanks for helping improve Growth Stage. Agronomists, farmers and developers are all welcome.

## Reporting a problem with a stage

The most useful reports point at a specific crop and stage and say what is wrong with the
model or the text, ideally with a photo or a reference (AHDB guide page, Zadoks/BBCH key).
Open an issue and include the link from your address bar: it contains `?crop=` and the stage.

## Code changes

1. `npm run serve` and open http://localhost:8642. There is no build step.
2. Read `CLAUDE.md` (how the code is layered and the rules that keep the model looking
   right) and `README.md`.
3. After changing keyframes or morphology, `npm run check` must pass.
4. Keep stage text and dimensions in `src/crops/<crop>/`, never in rendering code.
5. Open a pull request describing what changed and how you checked it (screenshots help).

## Adding a crop

See "Adding another crop" in `CLAUDE.md`.

## Copyright

Don't add images or text copied from AHDB or other publishers. Cite and link sources in
`stages.js` instead. By contributing you agree your work is released under the MIT licence.
