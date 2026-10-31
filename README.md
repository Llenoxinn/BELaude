# BELaude

**Be loud. Be a laude.** A website for UP students: given your grades so far, it shows the GWA you need each semester to graduate with Latin honors, and tells you kindly if you can't.

Unofficial. Everything runs in the browser; grades never leave the device.

## Run it

```bash
npm install
npm run dev      # local dev server
npm test         # GWA math, results and program data tests
npm run build    # static site in dist/ (works on any static host)
```

## Where things live

- `src/lib/gwa.ts`: the math (required average, per-semester targets, scenarios). Tested in `tests/`.
- `src/data/rules.json`: honors cutoffs, GWA exclusions, regular load. Edit rules here, not in code.
- `src/data/programs/ucebu.json`: UP Cebu programs (units per semester), from the study plans in `prospectus/`. Copy `_template.json` to add a campus or program; `npm test` checks that the units add up.
- `scripts/braille.py`: builds the Braille dot art in `src/components/art.ts` from `scripts/sunflower.txt`.
- `docs/`: the plan, design notes and AI declaration.
