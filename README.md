# BELaude

**Be loud. Be a laude.**

Most GWA calculators tell you where you stand. BELaude tells you where to go next.

Tell it your program and the grades you have so far. It works out the semester GWA you need, one semester at a time, to graduate Summa, Magna or Cum laude at the University of the Philippines. It also tells you honestly when an honor is out of reach, and what you can still get.

**Live site: [belaude.vercel.app](https://belaude.vercel.app/)**

- **For UP students.** UP Cebu study plans are built in. Students from other campuses can enter their program's total units themselves.
- **Private.** No sign-up. Everything runs in your browser, and your grades never leave your device.
- **Unofficial.** Made by a UP student. Final honors are determined by UP.

## Tech stack

<p>
  <a href="https://react.dev"><img src="https://skillicons.dev/icons?i=react" alt="React" height="48" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://skillicons.dev/icons?i=ts" alt="TypeScript" height="48" /></a>
  <a href="https://vite.dev"><img src="https://skillicons.dev/icons?i=vite" alt="Vite" height="48" /></a>
  <a href="https://tailwindcss.com"><img src="https://skillicons.dev/icons?i=tailwind" alt="Tailwind CSS" height="48" /></a>
  <a href="https://vercel.com"><img src="https://skillicons.dev/icons?i=vercel" alt="Vercel" height="48" /></a>
  <a href="https://www.python.org"><img src="https://skillicons.dev/icons?i=py" alt="Python" height="48" /></a>
</p>

| What | Used for |
| --- | --- |
| React 19 + TypeScript | The app |
| Vite | Dev server and static build |
| Tailwind CSS 4 | Styling |
| Radix UI, Phosphor Icons | Tabs and popovers, icons |
| Vitest | Tests for the GWA math, results and program data |
| Web3Forms | In-app reports and feedback, sent to the developer by email |
| Vercel | Hosting |
| Python + Pillow | Scripts that draw the Braille dot art (only needed to redraw it) |

## What it does

- Pick your program and batch, and enter each finished semester's GWA, or each course.
- See the semester GWA you need for Summa, Magna or Cum laude, semester by semester.
- Graduates can check BELaude's final GWA against their transcript.
- Save a shareable roadmap card. It has no name and no grades on it.

## Run it locally

You need [Node.js](https://nodejs.org) 22 or newer and Git.

```bash
git clone https://github.com/Llenoxinn/BELaude.git
cd BELaude
npm install
npm run dev
```

Open the address it prints (usually http://localhost:5173).

### Optional: turn on reports

The "Report an error" and "Send feedback" popups send through [Web3Forms](https://web3forms.com). Without a key the site works normally, but those popups say reports can't be sent yet.

1. Get a free access key at web3forms.com.
2. Copy `.env.example` to `.env.local` and paste the key:
   ```
   VITE_WEB3FORMS_KEY=your-access-key
   ```
3. Restart `npm run dev`.

`.env.local` is gitignored, so the key stays out of the repo.

## Scripts

```bash
npm run dev        # local dev server
npm test           # GWA math, results and program data tests
npm run typecheck  # TypeScript only
npm run build      # typecheck, then the static site in dist/
npm run preview    # serve the built site locally
```

## Deploy

On Vercel, import the repo. It detects Vite, builds with `npm run build` and serves `dist/`. Add `VITE_WEB3FORMS_KEY` under **Settings → Environment Variables** and redeploy, since the key is read at build time. Every push to `main` redeploys.

The build is a plain static site with hash routes (`#/calculator`), so any static host works.

## Where things live

- `src/lib/gwa.ts`: the math (required average, per-semester targets, scenarios). Tested in `tests/`.
- `src/lib/results.ts`: turns your semesters into the results page, and checks that the units add up.
- `src/data/rules.json`: honors cutoffs, GWA exclusions, regular load. Edit rules here, not in code.
- `src/data/programs/ucebu.json`: UP Cebu programs (units per semester), from the study plans in `prospectus/`.
- `scripts/braille.py`: builds the sunflower dot art in `src/components/art.ts` from `scripts/sunflower.txt`.
- `scripts/photo_braille.py`: turns the photos in `src/assets/images/` into the footer's dot art (`src/components/campus.ts`).
- `docs/`: the plan, design notes and AI declaration.

## Add a program or campus

1. Put the official study plan PDF in `prospectus/`.
2. Add the program to `src/data/programs/ucebu.json`, or copy `_template.json` for a new campus. List each semester's units without NSTP and PE.
3. Add its total to `tests/programs.test.ts` and run `npm test`. The test checks the units add up.

Found a wrong number? Use "Report an error" on the program step of the [live site](https://belaude.vercel.app/), or open an issue.
