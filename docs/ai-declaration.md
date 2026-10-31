# AI Declaration

**Project:** BELaude (a website for UP students to plan toward Latin honors)
**Author:** llenoxinn (GitHub)
**Declaration date:** 2026-10-31
**Last updated:** 2026-10-31

This file states openly where AI was used in this project, what it did, and what the author is responsible for.

## 1. Tool used
- **Claude** (Anthropic), used through Claude Code. The configured model for the planning session was Claude Sonnet 5.5; the implementation session used Claude Opus 5.5.

## 2. What AI was used for (so far)
| Area | AI contribution | Human contribution |
|---|---|---|
| Project idea and goals | None. The idea, audience and flow are the author's | All of it |
| `plan.md` | Reorganized and expanded the author's notes: wrote the math section, scenarios, edge cases, tech stack comparison, milestone list and draft messaging | Set the direction, decided on no uploads, added NSTP/PE rules, the per-semester target requirement, the comforting messaging, shadcn, and the reference site |
| `design.md` | Drafted the design system and screen plan from the author's palette screenshot and style direction | Chose the UP brandbook palette, the white-dominant minimalist direction, and ruled out other styles |
| `ai-declaration.md` | Drafted from the facts of this session | Reviewed and approved |
| Research | Searched the web for UP honors rules and read a reference site (up-gwa.vercel.app) for ideas | Chose what to adopt |
| Application code and tests | Wrote the React/TypeScript site, the GWA and required-average math with its unit tests, the results visuals, and the script that builds the Braille dot art | Directed the scope and design, set the eligibility rules (no grade floor; 4.00/5.00 do not disqualify outside UP Visayas; delays are fine without an underload), supplied the sunflower drawing, reviews every change |
| Program data (`src/data/programs/ucebu.json`) | Extracted per-semester units from the UP Cebu study plans the author supplied (`prospectus/`) and checked each against the printed totals | Supplied the study plans; checks the extracted numbers against them |

Not yet done with AI (update this file if that changes): logo and brand assets. UI copy was drafted with AI from the plan and is reviewed by the author.

## 3. What AI did not do
- It did not access any student's grades or personal data. No one's grades were entered into the AI session.
- It did not decide what UP's rules are. Any rule in the plan is either published by UP (cited in `plan.md`) or marked **"verify"**.
- It did not copy code, text or branding from the reference site. That site was used only as inspiration for ideas.

## 4. Known limits of the AI-assisted material
- **Honors rules need verification.** Thresholds (1.20, 1.45, 1.75) come from published UP pages. Other conditions (minimum units in UP, grade floors, time-to-degree limits, how INC is treated) are unconfirmed and must be checked with the UP Cebu Office of the University Registrar.
- **Colors:** hex values in `design.md` are working approximations of the print palette (Pantone and CMYK), not official screen values.
- **Program data:** the UP Cebu units were extracted from the study plans the author supplied, not from memory, and every semester was checked against the printed totals. A human must still confirm them. Known issue: both Management study plans print 145 total units while their semesters add up to 148.
- AI can make mistakes in math, facts and summaries. See the next section.

## 5. How the output is verified
- The GWA and required-average formulas will be unit-tested against hand calculations and the author's own real grades before launch.
- All rules and data carry a "last verified" date and a source link.
- The author reviews every AI-assisted change before it is kept.

## 6. Privacy
- The finished site runs in the browser and stores data only on the user's device. No grades are sent to a server, to an AI service, or to the author.
- The site makes no use of AI at runtime. Results come from arithmetic, not from a model.

## 7. Responsibility
The author is responsible for the final content, code, data and design of BELaude, including anything drafted with AI. BELaude is an **unofficial** student-made tool. Final determination of honors rests with the University of the Philippines.

## 8. Short version
> BELaude is an unofficial tool made by a UP student. AI (Claude by Anthropic) assisted with planning, drafting and code; the author reviewed and is responsible for the result. The tool uses plain arithmetic, stores your data only on your device, and does not decide honors. Final honors are determined by UP.

## 9. Change log
| Date | Change |
|---|---|
| 2026-10-31 | First version. AI used for planning documents only. |
| 2026-10-31 | Implementation: AI wrote the application code and tests, and extracted program units from the author's study plans. This declaration lives in the repository only, not on the website. |
