# BELaude  (// be loud // be a laude //)

> A simple website for UP students who want to know: **"Given my grades so far, can I still graduate with Latin honors, and what do I need to get each semester?"**

Related files: [design.md](design.md) (visual design plan) and [ai-declaration.md](ai-declaration.md) (how AI was used)

Status: planning · Audience: UP students (launch target: UP Cebu) · Scope: landing page + one calculator tool

---

## 0. Unique selling point (USP)

**One-line USP:** *The only UP tool that tells you exactly what GWA to get each semester to graduate with Latin honors, and tells you kindly if you can't.*

**Tagline options** (pick one): "Be loud. Be a laude." / "Your roadmap to laude." / "Don't just compute your GWA. Plan it."

**Who it's for:** UP students (UP Cebu first) in the middle of their degree who wonder "can I still make it?"

**Why BELaude, not a regular GWA calculator**

| | Regular GWA calculators (including up-gwa) | BELaude |
|---|---|---|
| Question answered | "What is my GWA now?" | **"What do I need next to be a laude?"** |
| Direction | Looks back | **Looks forward** |
| Output | A number | **A semester-by-semester roadmap** with target GWAs that update after each sem |
| Rules | Generic or manual | **UP rules built in** (thresholds, NSTP/PE/HK exclusions, thesis, scholar standing) |
| Degree info | You type everything | **UP Cebu prospectus preloaded**, with a custom option for other campuses |
| If the goal is out of reach | Silence | **Honest, warm message** and the best realistic alternative |
| Privacy | Varies | **No account, no upload, no server.** Everything stays on your device |

**The five promises (the USP broken down)**
1. **Goal-first:** "Know your laude chances in about 60 seconds." Fewest possible inputs: program, batch, grades.
2. **Roadmap, not a verdict:** a target GWA for every remaining semester, in plain grades ("mostly 1.25 to 1.50"), recomputed after every semester.
3. **Honest and kind:** exact math, labeled assumptions, and comforting wording when a tier is out of reach. It never gives fake hope.
4. **Made for UP:** the rules, grading scale and prospectus data are UP's, not generic Philippine ones.
5. **Private by design:** your grades never leave your device.

**The hook feature: the "Laude Roadmap" card.** A clean shareable image: "My path to Magna: 1.42 or better for the next 5 sems." Students share these in group chats and org pages, which is the main way the site spreads. Make it good-looking and put the BELaude name on it.

**What this means for priorities**
- **Must-have for v1** (these deliver the USP): required average, per-semester targets, rolling updates, best/worst scenarios, the comforting messages, UP rules built in, UPC prospectus for at least a few programs.
- **Nice-to-have** (don't let these delay launch): scholar badges, Laude Roadmap share card, what-if sliders, simulation-based odds.
- **Don't build:** file uploads, accounts, a backend, ads.

**Defensibility** (why someone can't just copy it in a weekend): verified UP rules, curated UPC prospectus data, and the tone of the results. Keep the data and rules in open JSON files so other campuses can contribute, which builds the community around the tool.

**How to know the USP works (simple measures):** a student gets a roadmap in under 2 minutes; they understand their target without asking anyone; people share their roadmap card. Test with 5 classmates before launch and ask: "What would you do with this result?"

---

## 1. What changed from the first draft

| Original idea | Revised decision | Why |
|---|---|---|
| Users upload their prospectus file | **No uploads.** Users type in total units (and optionally units per semester) | Parsing PDFs/Excel is fragile, slow to build, and prospectuses differ a lot. Typing 2-3 numbers is faster and more reliable. |
| Prediction in Python | **No backend at all.** All math runs in the browser (TypeScript/JS) | The core is weighted-average arithmetic. A server adds hosting cost and a privacy concern (grades are personal) for no benefit. |
| User must know semester GWA | User can enter **either** the semester GWA **or** each course's grade and units, and BELaude computes the GWA | Many students don't know their exact sem GWA. |
| "Prediction" | Split into **exact math** (what you need) and **scenarios** (what is likely) | Required grades are certain arithmetic. Only the "likely outcome" is an estimate, so label them separately and be honest about it. |

Kept as-is: pick campus and degree program, preloaded UP Cebu prospectus data, a custom option for other campuses or students who don't trust the dataset, best-case and worst-case scenarios, prioritising the highest honors tier still reachable.

---

## 2. Honors rules BELaude must encode (UP)

Thresholds (weighted average grade needed for Latin honors, confirmed on UP's published rules):

| Honor | GWA required |
|---|---|
| Summa cum laude | **1.20 or better** |
| Magna cum laude | **1.45 or better** |
| Cum laude | **1.75 or better** |

Exact ranges used by the reference site (good for the UI): Summa 1.0000 to 1.2000, Magna 1.2001 to 1.4500, Cum laude 1.4501 to 1.7500. Use 4 decimal places in comparisons so a 1.4501 doesn't get rounded into magna.

Semestral standing (nice extra, shown per completed semester): University Scholar 1.45 or better, College Scholar 1.75 or better, Honor Roll 2.00 or better. These need a regular load (normally 15 units) or an underload permit; midyear terms have no minimum. Verify against the UPC rules before showing them.

Other conditions that affect eligibility. **These are not all confirmed. Verify each with the UP Cebu Office of the University Registrar before launch**, and keep them in one editable config file (`rules.json`), not hard-coded.

- Grades of 4.00 or 5.00 in required courses disqualify you (stated in UP Visayas rules; confirm the UPC wording and whether INC counts).
- A minimum number of units must be taken in residence in UP (the exact figure was not found; commonly cited as two-thirds of required units).
- Possible grade floor (for example no grade below 2.50) and possible time-to-degree limit ("4+ years" may disqualify). **Unconfirmed, ask the registrar.**
- **Courses excluded from the GWA:** NSTP, PE / HK, and Residency (confirmed by the user, and matching the up-gwa reference site). Also excluded there: qualitative grades (P, F, S, U) and courses numbered 199, 299 and 399. **Special case:** for SP/Thesis courses (190, 200, 300, 400) a passing S counts for the full units at the grade equivalent (their example: 3 units of S plus 3 units of 1.75 count as 6 units of 1.75). Verify these with the Registrar. Original note: **NSTP and PE are NOT counted in the GWA**. They are marked `countsInGWA: false` in the data and the UI says so: "Don't include NSTP or PE units in your total."
- UP has been discussing changes to its Latin honors system. Show a "rules last verified: <date>" line on the result page.

Because several rules are unconfirmed, the result screen shows an **eligibility checklist** next to the GWA math, with warnings such as "Check with the Registrar" rather than a hard yes or no.

---

## 3. The math (exact, no AI needed)

Definitions
- `T` = total GWA-counted units in the degree (**excluding NSTP and PE**)
- `U` = units already completed (graded), `P` = grade points so far = sum of (grade x units)
- `R = T - U` = units remaining
- `thr` = honors threshold (1.20 / 1.45 / 1.75)

**Average grade you must get on all remaining units:**

    required_avg = (thr x T - P) / R

- If `required_avg < 1.00`: that tier is **no longer possible** (best grade in UP is 1.00).
- If `required_avg` is 1.00 to 1.10: technically possible but nearly perfect. Flag as "extremely hard".
- If `required_avg > 5.00`: the tier is already **locked in** (cannot be lost by GWA alone; note other disqualifiers still apply).

**Worked example** (T = 150, finished 60 units at an average of 1.50, so P = 90, R = 90):

| Tier | Required average on remaining 90 units |
|---|---|
| Summa (1.20) | (180 - 90) / 90 = **1.00** (every grade must be 1.00) |
| Magna (1.45) | (217.5 - 90) / 90 = **1.42** |
| Cum laude (1.75) | (262.5 - 90) / 90 = **1.92** |

**Best possible final GWA** = (P + 1.00 x R) / T (all remaining grades are 1.00).
**Worst GWA that still keeps a tier** = the `required_avg` above.

**Per-semester targets (the main output).** For every remaining semester, the result screen says plainly: **"In Sem X you need a GWA of at least Y to stay on track for Magna."** Remaining units are split across the remaining semesters using the program's units per semester (or the user's own).

Example (same numbers as above: T = 150, P = 90, 90 units left over 5 semesters of 18 units):

| Semester | Units | Magna target GWA | Cum laude target GWA |
|---|---|---|---|
| 3rd yr, 1st sem | 18 | 1.42 or better | 1.92 or better |
| 3rd yr, 2nd sem | 18 | 1.42 or better | 1.92 or better |
| 4th yr, 1st sem | 18 | 1.42 or better | 1.92 or better |
| 4th yr, 2nd sem | 18 | 1.42 or better | 1.92 or better |
| Last sem | 18 | 1.42 or better | 1.92 or better |

Three ways to show it:
1. **Even split** (above): the same target every sem, equal to `required_avg`.
2. **Rolling targets**: recomputed after every semester. If you get 1.25 this sem, the next targets relax automatically; if you get 1.75, they tighten. Show "target for this coming sem" prominently and the rest in smaller text.
3. **Flexible budget**: if the user wants a heavy sem to balance a light one, let them type their own GWA for some semesters and the app recalculates the rest. Example: "If you get 1.25 next sem, the remaining semesters only need 1.46."

Also translate the target into plain grades, since grades come in steps of 0.25: "1.42 is roughly a mix of 1.25s and 1.50s. Aim for mostly 1.25 to 1.50 with no grade worse than 2.00." Show a small grade-mix suggestion for the target.

**Priority rule:** show the highest tier that is still mathematically possible as the main target (say Magna), then show the next tier down as the "safety net" (Cum laude). If Summa is possible only with all 1.00, show it greyed out as "theoretical".

---

## 4. Scenarios (the "prediction")

Honest framing: this is arithmetic plus simple assumptions, not a forecast. Each scenario assumes a grade level for the remaining units:

| Scenario | Assumption for remaining units | Output |
|---|---|---|
| Best case | All 1.00 | Lowest GWA you could possibly finish with |
| Optimistic | Your best semester GWA so far continues | Final GWA and tier |
| Likely | Your current cumulative average, or the average of your last 2 semesters | Final GWA and tier |
| Pessimistic | Last-2-sem average gets worse by 0.25 | Final GWA and tier |
| Worst case that still gets honors | Exactly `required_avg` | The "cliff": minimum performance to hold on |
| Worst case overall | All 3.00 (or a user-chosen grade) | Final GWA, shows what honors would be lost |

Display: a simple chart of GWA trajectory per semester plus the target line, and a small table of the scenarios above. A "what-if" slider ("what if I average 1.50 from here?") is a good v1.1 feature.

Later idea (not v1): a lightweight simulation that samples semester GWAs from the user's own past variation, to show "about X% chance of Magna". Still runs in the browser. Only add it if it can be explained honestly to the user.

---

## 4b. When honors is out of reach: the messaging

Tone: honest, warm, never fake-hopeful, never doom. The result screen picks one of four states and always leads with what *is* still possible. Do not use red alarm styling for "not possible".

| State | What the user sees (draft copy) |
|---|---|
| **Top tier reachable** | "Magna is still in your hands. You need an average of 1.42 from here. Here's your sem-by-sem plan." |
| **Only a lower tier reachable** | "Magna is out of reach from here, and that's okay. Cum laude is still very much possible: you need 1.92 or better, which is a realistic average. Here's how to get there." |
| **Tier hanging on a thread** (needs almost all 1.00s) | "This one is a stretch: it would take nearly perfect grades. It's possible, so the choice is yours. Cum laude is the safer target and still a real achievement." |
| **No honors reachable** | "Latin honors isn't in the numbers anymore, and it's okay to feel disappointed. It's hard work that counts, and your degree and what you've learned stay with you. Here's the best GWA you can still finish with, and what a strong finish looks like." Then show: best possible final GWA, realistic final GWA, and a note that honors is one measure, not the whole story. |

Rules for the copy:
- Always show a concrete next step or number, even in the no-honors state (for example "finishing with 1.9 or better is still a strong result").
- Never claim a chance that the math does not support. Comfort and honesty go together.
- Add a line pointing to the Registrar for official determination, and mention that some disqualifiers (a failing grade, for instance) may still change the outcome.
- Optional: a soft "talk to someone" nudge (adviser, friends, or UP Cebu counseling) when the user is in the no-honors state. Verify the exact office name and contact before adding it.

---

## 5. User flow

1. **Landing page.** One-line pitch, "Check my standing" button, short explainer of UP honors thresholds, privacy note ("everything stays on your device").
2. **Program.** Choose campus and degree program.
   - UP Cebu: preloaded from the online prospectus (total units, units per semester, course list). Show "Data source and date" and an **Edit** link.
   - Other / "I'd rather use my own": enter total units, number of semesters, and optionally units per semester by typing them in. No file upload.
3. **Batch.** Enter the year you entered UP (for example 2024). The app lists the semesters that should be done by now. For a 2024-2025 batch in 1st sem AY 2026-2027, that is 1st and 2nd sem of 2024-25 and 2025-26 completed; current sem 2026-27 1st optional. Allow adding extra semesters or a midyear term, and allow LOA, shifting, or a 5th year.
4. **Grades per semester.** For each completed semester, choose:
   - **Option A:** enter the semester GWA and units, or
   - **Option B:** "I don't know my GWA": enter each course with grade and units. The app computes the semester GWA and shows the working. NSTP and PE rows are greyed out and skipped.
   Prefill course lists from the prospectus when available. Grades dropdown: 1.00, 1.25, 1.50, 1.75, 2.00, 2.25, 2.50, 2.75, 3.00, 4.00, 5.00, INC, DRP. Handle INC/DRP/4.00/5.00 explicitly (see edge cases).
5. **Results.** Target tier, required average and per-semester targets, the best/worst scenarios, the eligibility checklist, and a shareable summary image (optional, v1.1).

---

## 5b. Inspiration: up-gwa.vercel.app

Reviewed https://up-gwa.vercel.app/ (UP GWA Calculator and Honors Tracker by an individual developer). It is a **look-back** tool: you enter grades and it shows your current GWA and standing. BELaude is a **look-forward** tool: it tells you what you need next. So the two are complementary, and BELaude should borrow good ideas, not copy the site's content, code, wording or branding.

**What to borrow (ideas)**
- Semestral vs Cumulative modes: BELaude's grade-by-grade entry is the same idea. A student's cumulative GWA from entered semesters feeds the forecast.
- **Export / Import JSON** for backup, since data lives in the browser only. Show a clear "Your data stays on this device. Back it up!" note.
- A short **FAQ** section on the page that explains the rules (what counts in the GWA, what's excluded, regular load). Put it right under the calculator.
- Plain, direct, student-friendly wording.
- A deep **UP maroon** accent (the reference uses about #8B1335) with a clean, neutral layout. Pick your own shade and logo.
- A social-share preview image (1200 x 630) so links look good when shared in group chats.

**What to do differently**
- The goal-based output: required GWA per semester, scenarios, and the comforting messaging. None of this is on the reference site.
- No promo block for services on the tool page; keep the page focused. A small "made by" footer line is enough.
- Explain the grade scale and how to enter courses right in the UI (the reference doesn't make this obvious): placeholder text, examples, and a "how it works" three-step strip.
- Handle INC and DRP explicitly (the reference doesn't).

**Extra input features to add because of it**
- Qualitative grades (P, F, S, U) accepted but excluded from the GWA, with SP/Thesis S handling.
- Course-number rules (199/299/399 excluded) applied automatically when a course code is entered.
- Per-semester scholar standing badge (University Scholar, College Scholar, Honor Roll).

---

## 6. Data design

- `programs/ucebu.json`: list of degree programs. Each has `name`, `totalUnits`, `gwaCountedUnits`, `semesters[]` with `courses[]` (`code`, `title`, `units`, `countsInGWA`; false for NSTP and PE), `source` (prospectus URL), `retrievedOn`.
- `rules.json`: honors thresholds, excluded course types, disqualifying grades, `lastVerified`.
- User state lives in `localStorage` only. Add "Export / import as JSON" so students can save progress. No accounts, no server, no analytics on grades.
- Data entry for prospectuses is the biggest manual cost. Start with **3-5 UPC programs** (the ones you know best or can verify), then add more. Add a "Report an error in this prospectus" link (GitHub issue or a Google Form).

---

## 7. Tech stack decision

**Recommended: Vite + React + TypeScript (or Svelte if you prefer a lighter, simpler syntax), fully static.**

| Option | Verdict |
|---|---|
| Vite + React + shadcn/ui | Best fit. Huge ecosystem, lots of help online, deploys anywhere free, and shadcn gives polished components fast. |
| Svelte (SvelteKit or Vite) | Also great and less boilerplate. Pick this if you want to learn it. |
| Blazor WASM | Works, but large first download and slow load on a phone with mobile data. Skip. |
| Python backend | **Not needed.** The math is a one-line formula. Skip unless you later want heavy simulation (and even then JS can do it). |

- UI: **shadcn/ui** (built on Tailwind and Radix) for the form inputs, select dropdowns, tabs, cards, tooltips, dialogs, alerts and tables. It fits the grade-entry forms and the results cards well, and the components live in your own code so you can restyle them. Note: shadcn is React-first, so it pairs with the Vite + React choice. If you go Svelte, use the community port shadcn-svelte instead.
- Styling: Tailwind. Charts: shadcn's chart component (wraps Recharts), or plain SVG.
- Testing: unit tests (Vitest) for the GWA and required-average functions. This matters most since the math is the product.
- Hosting: Cloudflare Pages, Netlify, Vercel or GitHub Pages (all free). Mobile-first layout, since most students will use a phone.

Suggested structure:

    BELaude/
      plan.md
      src/
        lib/gwa.ts          # pure functions: semesterGwa, cumulative, requiredAvg, scenarios
        lib/rules.ts        # loads rules.json, eligibility checks
        data/programs/*.json
        data/rules.json
        components/ui/      # shadcn/ui components (button, select, card, tabs, table...)
        components/         # ProgramPicker, SemesterInput, GradeTable, Results, ScenarioTable
        pages/              # Landing, Calculator
      tests/gwa.test.ts

---

## 8. Edge cases to handle

- Semester with a **different unit load** than the prospectus (overload, underload, dropped course).
- **INC**: treat as pending. Prompt "enter expected grade" and exclude from the total until entered.
- **DRP / W**: excluded from GWA.
- **4.00 or 5.00 / failed course**: warn that honors may be lost; a retaken course may need special handling (verify the rule).
- **Shiftees, transferees, cross-enrollees, LOA, midyear/summer terms**, **units credited from elsewhere**.
- **Students past 4 years**: the plan should not assume four years. Total semesters comes from the program plus the user.
- NSTP and PE courses: always excluded from the GWA and from `T`. If a user enters them by mistake, ignore them and show a small note. Tooltip: "NSTP and PE don't count toward your GWA."
- Rounding: UP rounds GWA in a specific way for honors. Confirm whether to truncate or round, and test it.
- Invalid input: blank, units <= 0, grade outside the scale, total units less than units already completed.
- Impossible or already-locked states should read clearly ("Magna is out of reach, but Cum laude needs an average of 1.62 from here").

---

## 9. Milestones

1. **Confirm rules** with the UPC registrar or the student handbook (Section 2 list). Write `rules.json`.
2. **Math core** (`gwa.ts` plus tests). Check the worked example above and your own real GWA.
3. **Calculator UI** with manual units entry and GWA-or-grades per semester.
4. **Scenarios and results screen**, with the eligibility checklist.
5. **UPC prospectus data** for the first few programs.
6. **Landing page**, mobile polish, accessibility pass.
6b. **Motion pass**: ASCII art animations, results sequence, reduced-motion support (see design.md section 6).
7. **Soft launch** to a few classmates, fix confusing spots, then share in UPC student groups.
8. **Laude Roadmap share card** (the growth hook), right after launch feedback.

---

## 10. Open questions for you

1. Which program(s) should be preloaded first? (Start with yours.)
2. Is a one-semester-at-a-time results view enough, or do you want the full 4-year trajectory chart on day one?
3. Do you want a shareable result card (image) in v1, or later?
4. Should the site be open-source (GitHub) so other campuses can contribute their prospectus JSON files?
5. Disclaimer wording: "BELaude is an unofficial tool. Final honors are determined by UP."

---

## 11. Sources checked

- Supabase Select 26 page (visual inspiration for design.md): https://select.supabase.com/
- UP GWA Calculator and Honors Tracker (design and rules inspiration): https://up-gwa.vercel.app/
- UP Visayas graduation requirements (honors thresholds, no 4 or 5 in prescribed courses): https://our.upv.edu.ph/index.php/academics/graduation/graduation-requirements
- Coverage of UP's Latin honors criteria and proposed review: https://republicasiamedia.com/generation/up-eyes-changes-on-latin-honors-criteria
- UP Cebu Office of the University Registrar (for confirming UPC-specific rules): https://our.upcebu.edu.ph
