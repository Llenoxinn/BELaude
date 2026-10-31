# BELaude: Design Plan

Direction: **white-dominant, minimalist, editorial.** The UP brandbook palette appears as small, deliberate accents on a clean white page. It follows the "premium utilitarian minimalism" approach (document-like pages, thin borders, generous whitespace, almost no shadows). It is deliberately **not** a flashy, animation-heavy, trendy-landing-page style.

Principle: the page should feel like a calm, well-typeset UP document that happens to do math. Numbers and targets are the heroes; decoration is not.

---

## 1. Color

### 1.1 UP brandbook palette (from the print spec you shared)

| Brand color | Pantone (coated / uncoated) | Role in BELaude |
|---|---|---|
| **UP Maroon** | 1955C / 1955U | Main accent: key numbers, links, active states, focus ring, the target line on charts |
| **Forest Green** | 7484C / 7484U | "On track" and positive states, success, the safety-net tier |
| **Yellow (approximate gold)** | 1235C / 116U | "Stretch" and caution states, highlights. **Fill only, never text on white** |
| **Black** | Spot Black | Body text, primary buttons, borders of emphasis |

The brandbook gives print values (Pantone and CMYK), not screen values. The hex codes below are **working sRGB approximations** to be checked against the brandbook or sampled with an eyedropper from the official logo files before launch:

    --up-maroon:  #8B1335   /* working value, verify */
    --up-green:   #00573F   /* working value, verify */
    --up-gold:    #F5B21A   /* working value, verify */
    --up-black:   #111111

### 1.2 Usage ratio

White is the canvas, about 90 percent of every screen. Brand colors are scarce:

| Share | Use |
|---|---|
| ~90% | White and off-white surfaces, near-black text, hairline borders |
| ~7% | Maroon (the single accent per screen) |
| ~3% | Green and gold, for status only |

Rules:
- **No large color blocks or full-color sections.** No maroon hero, no green banner.
- **No gradients.** At most one very faint radial warm light spot behind the landing hero (opacity under 0.04).
- One accent per view: if maroon is the highlight, green and gold appear only as small status tints.

### 1.3 Tokens

Neutrals (warm):

    --bg:           #FFFFFF
    --surface:      #FFFFFF
    --surface-alt:  #FAF9F7    /* subtle bands, table headers */
    --border:       #EAEAEA    /* every card, divider, input */
    --text:         #111111
    --text-muted:   #6B6A66
    --text-faint:   #9A9893

Tints derived from the brand colors (low-saturation backgrounds for badges, callouts and table highlights; text uses the full color or near-black):

| Tint | Background | Text on it |
|---|---|---|
| Maroon tint | `#F8EAEE` | `#8B1335` |
| Green tint | `#E8F1EE` | `#00573F` |
| Gold tint | `#FCF4DC` | `#111111` (or `#6B4A00`) |

### 1.4 Semantic mapping

| Meaning | Look |
|---|---|
| Honors tier reachable / on track | Green tint badge |
| Stretch (needs near-perfect grades) | Gold tint badge |
| Selected, active, primary highlight, targets | Maroon |
| Out of reach (the sensitive state) | **Neutral gray** badge with maroon text. **Never red, never alarm styling** |
| Error in a form field | Maroon text and 1px maroon border, plus an icon and a text message (never color alone) |

### 1.5 Accessibility
- Body text 111111 on white is well above 4.5:1. Maroon on white should be checked (aim for 7:1 or higher for small text).
- **Gold text on white fails contrast.** Gold is for fills, dots and borders only; any text on gold uses near-black.
- Never communicate state by color alone: every status has a word or an icon.
- Visible focus ring: 2px maroon outline, 2px offset.

---

## 2. Typography

| Role | Font | Notes |
|---|---|---|
| Headings, big numbers, quotes | **Newsreader** (serif) | Matches the serif feel of the UP brandbook. Tight tracking (-0.02em), line-height 1.1 |
| Body, UI, buttons, tables | **Geist Sans** (fallback Helvetica Neue, system) | Clean, neutral |
| Grades, units, code, small labels | **Geist Mono** | Tabular numbers so columns line up |

Do not use Inter, Roboto or Open Sans. Use `font-variant-numeric: tabular-nums` for all grade and GWA figures.

Scale (rem): 0.75 / 0.875 / 1 / 1.125 / 1.5 / 2.25 / 3.5. Hero number (the target GWA) is the largest thing on the results screen, set in the serif. Body line-height 1.6. Max line length 65 characters. Content width `max-w-4xl` (landing), `max-w-3xl` (calculator).

---

## 2b. Signature devices (inspired by Supabase Select 26)

Reference: https://select.supabase.com/ (viewed in the browser). It is a dark, developer-event page, so we do **not** copy its look. We borrow its *techniques* and re-skin them in white and UP colors. Do not copy its wordmark, artwork, or wording.

What the reference does well:
- A **stacked wordmark where each line sits on its own solid color block** (like a highlighter marker), with the last line inverted. Pixel-style monospace caps.
- **ASCII texture**: columns of brackets and symbols `(( <{[[()]]}> ))` used as decoration and as thumbnail backgrounds, plus small pixel bars.
- A **three-column header strip**: wordmark | one-line description with an arrow | an outlined mono-caps button.
- Cards where a **short title sits on highlighted blocks** over the image, with a plain title and muted names below.
- **Tiny mono labels** for metadata (date, place), muted gray, lots of space.

How BELaude uses each (kept minimal, white canvas):

| Device | BELaude version |
|---|---|
| Highlighted stacked wordmark | **BE LOUD / BE A / LAUDE** on three lines. Line 1 on UP Maroon with white text, line 2 on Forest Green with white text, line 3 white with a black border or on black. Used **only** in the hero and the share card. The "// be loud // be a laude //" slashes from your original name can appear as a small mono caption |
| ASCII texture | See **2c** for the sunflower and UP-themed motifs. Original idea: a single low-contrast strip built from **grade symbols** instead of random brackets: `1.00 1.25 1.50 1.75 2.00` repeating, or bracket nesting `(( <{[( 1.45 )]}> ))` that visually "tightens" toward the honors cutoff. Maroon and green at 15 to 25% opacity on white. Decorative only, `aria-hidden`, never behind text that must be read |
| Pixel bars | The **roadmap bars**: each remaining semester gets a row of block characters showing the target, for example `SEM 1  1.42  ■■■■■■■■□□`. Compact, scannable, and on-brand |
| Three-column header strip | Left: small stacked wordmark. Middle: one sentence ("Your grades so far, and what you need next.") with a down arrow. Right: outlined button "CHECK MY STANDING" in mono caps |
| Outlined mono-caps button | Secondary action style: 1px border, mono caps, letter-spacing 0.05em, maroon border and text on hover. The primary action stays solid black |
| Highlighted-title cards | The **results "tier cards"** (Magna, Cum laude): the tier name is set in mono caps on a solid tint block (maroon, green, gold), with the plain explanation and numbers underneath in muted text |
| Mono metadata labels | "UNITS", "TARGET GWA", "AS OF AY 2026-27" in small muted mono caps above values |

Guardrails so it stays minimalist:
- **Max two signature devices per screen.** Landing hero: wordmark plus one ASCII strip. Results: roadmap bars plus tier card. Calculator steps: none, just clean forms.
- Solid highlight blocks only on short text (wordmark, tier name, one status word). Never on paragraphs.
- No dark mode, no glow, no scanlines, no "hacker terminal" gimmicks: BELaude is calm and friendly, not a developer event.
- Gold block text is always near-black, per the contrast rule above.

Font for the pixel-style look: use one free pixel or mono face (for example **Departure Mono** or **VT323**; check the license before bundling) for the **wordmark, tier names and mono labels only**. Everything else stays Newsreader, Geist Sans and Geist Mono as planned.

Motion for these devices is planned in **section 6** (wordmark type-in, strip drift, bars filling, and more).

---

## 2c. ASCII motifs: sunflowers and UP elements

The ASCII texture from 2b is themed on things students associate with UP, drawn in plain ASCII (no emoji, no special glyphs) so it renders the same in any monospace font. Colors follow the palette: **petals gold, centers maroon, stems and leaves green**, outlines near-black, all on white.

### Sunflower (the main motif)

```
        \  |  /
     \   \ | /   /
    -- --( @@@ )-- --
     /   / | \   \
        /  |  \
           |
          _|_
```

Sunflower showing a result (the face holds the GWA target):

```
        \  |  /
      \  \ | /  /
     -- ( 1.45 ) --
      /  / | \  \
        /  |  \
           |
          _|_
```

**Growth as the progress indicator.** The sunflower grows as the student completes units. It replaces a plain progress bar on the results page and the share card:

```
  0 to 25%: seed        25 to 50%: sprout

        .                      \|/
       _|_                      |


  50 to 75%: bud        75 to 100%: bloom

      \ | /                  \  |  /
    -- (o) --              -- --( @@@ )-- --
      /|\                      / | \
       |                         |
      _|_                       _|_
```

(Stages are chosen by units done / total GWA-counted units. Final art to be redrawn cleanly when implementing.)

**Comforting state.** When honors is out of reach, show the same sunflower, still full and facing the light, with the line "Still growing." The art carries the warmth so the copy can stay short.

### Other UP-flavored elements

Abstract and simple, never a copy of an official logo or seal.

Oblation-style figure (arms raised, standing on a base), for the "Be loud" or hero moment:

```
      \   O   /
       \  |  /
          |
         / \
     ___/___\___
    |___________|
```

Columns and pediment (a classic "hall" silhouette), for section dividers or the FAQ header:

```
     ______________
    /______________\
    |  |  |  |  |  |
    |  |  |  |  |  |
   _|__|__|__|__|__|_
```

Tower (a campus bell-tower silhouette), for the footer:

```
       _
      /^\
     |[ ]|
     |[ ]|
     |___|
```

Laurel (a nod to "laude"), for the tier cards, drawn as two small sprigs framing the tier name:

```
   \\\\\\    MAGNA    //////
    \\\\\               /////
```

Texture strip (repeats horizontally, low opacity, decorative only):

```
 -{@}-   .  .   -{@}-   .   -{@}-  .  .  -{@}-
```

Grade-cutoff strip (replaces the random brackets from the reference; the pattern "tightens" toward the honors line):

```
 (( << { [ ( 1.75 ) ] } >> ))   (( << { [ ( 1.45 ) ] } >> ))   (( << { [ ( 1.20 ) ] } >> ))
```

### Rules for the ASCII art
- **Use sparingly:** one motif per screen, at most two on the landing page (hero sunflower plus footer tower or the column divider).
- **Decorative by default:** wrap in `<pre aria-hidden="true">`. Meaningful art (the growth sunflower) gets `role="img"` and a text label such as "Sunflower in bloom: 74 of 150 units completed".
- Use one monospace font for all art; test alignment in the real font at 360px width. Keep art under 40 characters wide on mobile, and hide wide strips on small screens.
- **Animation:** all ASCII motifs are animated, gently. See **section 6.3** for each motif's motion and 6.8 for the reduced-motion fallback.
- **Not official:** do not recreate the UP seal, logo, or any named official artwork; keep the shapes abstract. Landmarks should be generic silhouettes.
- **Campus pick:** since the launch target is UP Cebu, choose one or two UPC-specific landmarks for the footer art with the author, so it feels like home. Confirm what they look like before drawing them.

---

## 3. Layout and spacing

- Spacing scale on 4px steps. Section spacing large: 96 to 128px vertically on desktop, 64px on mobile.
- Cards: 1px solid `--border`, radius 8 to 12px, padding 24 to 40px, **no shadow**.
- Dividers over boxes: prefer thin horizontal rules to nested cards.
- **Mobile first.** Most students will open it on a phone: single column, 16px side gutters, tap targets at least 44px, grade selects usable with one thumb.
- Landing page can use one asymmetric bento grid for the three feature blurbs; the calculator is a single calm column.

---

## 4. Components (shadcn/ui, restyled)

shadcn is used as the base but **overridden** so it doesn't look like the default template:

- Radius token `--radius: 0.5rem` (8px). Replace default heavy shadows with none.
- Primary button: solid `#111111`, white text, radius 6px, no shadow, hover `#333333`, active `scale(0.98)`. Secondary: white with 1px border. A maroon button only for the one main action per screen if needed (for example "See my roadmap").
- Inputs and selects: 1px border, 40px tall, maroon focus ring, mono font for numbers.
- Badges: pill, uppercase, small, wide tracking, using the tints in 1.3.
- Tables: no vertical lines, hairline row dividers, mono numbers, right-aligned numeric columns.
- Tabs, Accordion (FAQ): borderless, only a bottom border per item, plus/minus toggle.
- Stepper for the calculator: simple numbered steps with a thin progress line, maroon for the current step.
- **Icons: Phosphor (regular or bold, one weight everywhere).** shadcn ships with Lucide by default; swap it out. No emoji anywhere in the UI or copy.
- Tooltips for terms like GWA, INC, NSTP, with plain-language text.

---

## 5. Key screens

### 5.1 Landing page (one page, short)
1. **Header strip (three columns):** small stacked wordmark | one-line description with a down arrow | outlined mono-caps button "CHECK MY STANDING". Links: How it works, FAQ.
2. **Hero:** the stacked highlighted wordmark (see 2b), a large serif headline (the chosen tagline), one sentence of explanation, one primary button ("Check my standing"), a note "No sign-up. Your grades stay on your device." Maybe a faint example roadmap card beside it (static, not a screenshot of a real student).
3. **How it works:** three numbered steps in a row (Pick your program, Add your grades, Get your roadmap).
4. **Why BELaude:** the USP as three short blocks (looks forward, built for UP, kind and honest).
5. **Honors thresholds:** a small clean table of summa, magna and cum laude with GWA ranges.
6. **FAQ:** accordion (what counts in GWA, what's excluded, is my data saved, is this official).
7. **Footer:** unofficial-tool disclaimer, link to the AI declaration, feedback link.

### 5.2 Calculator (stepper)
Steps: Program, Batch, Grades, Results. Each step is one card with one decision. Autosave to the device with a quiet "Saved on this device" note and Export/Import buttons. Grade-by-grade entry is a compact table: Course, Units, Grade. NSTP and PE rows appear greyed with the note "Not counted in GWA".

### 5.3 Results (the main screen)
Order, top to bottom:
1. **Status sentence** in the serif (examples in plan.md section 4b), with one small tier badge.
2. **Big number**: "Aim for 1.42 or better each semester" in the serif at a large size, with the tier name small above it.
3. **Roadmap table**: one row per remaining semester with units, target GWA (mono, maroon), and a grade-mix hint.
4. **Trajectory chart**: simple line chart, past semesters in black, target line in maroon dashed, thin green band showing the honors zone. No gridline clutter.
5. **Scenarios table**: best, optimistic, likely, pessimistic, worst-that-still-works.
6. **Eligibility checklist** with "check with the Registrar" items.
7. **Actions**: Save roadmap card (image), Export data.

### 5.4 Out-of-reach state
Calm and gentle: neutral gray badge, serif sentence with warm wording, then the best realistic outcome as a normal-looking card. No red, no warning icon, no exclamation marks.

### 5.5 Share card ("Laude Roadmap")
1200 x 630, white, hairline border, serif headline ("My path to Magna"), the target number large in maroon, a mini roadmap list, a small green or gold status dot, and the BELaude wordmark at the bottom. No student name or grades shown by default.

---

## 6. Motion plan

Goal: the site feels **alive but calm**, like a sunflower slowly turning toward light. Motion explains what changed, rewards progress, and gives the ASCII art personality. It never blocks input, never loops loudly, and always has a still fallback.

### 6.1 Principles
1. **Meaningful:** every animation shows cause and effect (a step changed, a target updated, progress grew) or adds quiet character (ASCII art).
2. **Soft and short:** most motion is 150 to 600ms. Ambient art motion is slow (6 to 20s loops).
3. **One star at a time:** at most one prominent animation in view; the rest rest.
4. **Cheap:** animate only `transform` and `opacity`. No layout-shifting animation. 60fps on a mid-range phone.
5. **Optional:** everything is off under `prefers-reduced-motion: reduce`, and the page is complete without it.

### 6.2 Motion tokens

| Token | Value | Use |
|---|---|---|
| `--dur-fast` | 150ms | hover, press, focus |
| `--dur-base` | 300ms | small state changes, tabs |
| `--dur-slow` | 600ms | section reveals, results entry |
| `--dur-ambient` | 8 to 20s | ASCII drift and sway |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | entries |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | transitions between states |
| `--stagger` | 60 to 80ms | lists, rows, wordmark lines |

### 6.3 ASCII art animations (the signature)

| Motif | Animation | How |
|---|---|---|
| **Stacked wordmark** (BE LOUD / BE A / LAUDE) | Lines "type in" one after another on first load: each block's background wipes in left to right, then its text appears (about 350ms per line, 120ms between). Loops never. | CSS `clip-path` or `transform: scaleX()` on the block with `transform-origin: left`, plus staggered opacity |
| **Hero sunflower** | Slow **sway**: rotates about 1.5 degrees around the base, 8s ease-in-out infinite alternate. The face brightens slightly as the page loads | CSS transform on the `<pre>` |
| **Sunflower growth stages** (progress) | When the result appears, the flower **grows from seed to its current stage**, frame by frame: swap between the pre-drawn ASCII frames about every 250ms until it reaches the right stage, then rest. Re-grows only when data changes | Small frame array swapped with a timer, or CSS `steps()` on a sprite-like stack of lines. Cap at 8 to 10 frames |
| **Sunflower with GWA face** | The face number "rolls in": digits settle from `0.00` to the target over about 700ms (once), then stay still | Short timer, tabular-nums so width never jumps |
| **"Still growing" state** (honors out of reach) | The flower does a gentle **sunward lean** once, then holds a very slow sway. No sad or shaking motion, ever | CSS transform |
| **Texture strip** (`-{@}-` pattern, grade-cutoff strip) | Slow horizontal **drift** (30 to 60s per loop) at 15 to 25% opacity; the grade-cutoff strip's brackets "tighten" slightly toward the honors number on scroll | CSS translate on a wide `<pre>`, pointer-events none |
| **Columns / tower / Oblation figure** | On scroll into view, drawn **line by line, bottom to top** (like building up), 60ms per line | Staggered opacity per line |
| **Laurel sprigs** | Sprigs slide in from both sides to frame the tier name when a tier card appears | translateX plus opacity |
| **Pixel bar rows** (roadmap) | Each bar **fills left to right** with block characters, rows staggered 80ms. When a target changes (rolling update), the bar animates from the old length to the new one | Update character count with a short timer, or scaleX on a bar element |
| **Random "twinkle"** | Occasionally (every 6 to 10s) one ASCII character in the strip swaps to a neighbor for a moment. Subtle, off on mobile low-power | Timer with a tiny set of swaps |

Rules: ASCII animations live in `aria-hidden` elements; anything meaningful keeps its text label; no ASCII art animates while the user is typing in a form on the same screen.

### 6.4 Page-level motion

| Area | Motion |
|---|---|
| **Page load** | Wordmark types in, then the headline fades up (translateY 12px to 0, 600ms), then the button and note, staggered 80ms |
| **Scroll reveals** | Each section fades up once when it enters the viewport (IntersectionObserver, never a scroll listener). Cards in a grid stagger by index |
| **How it works (3 steps)** | Step numbers light up in maroon one by one as you scroll past them, with a thin line connecting them that draws down |
| **Thresholds table** | Rows reveal in sequence; the maroon "you are here" marker slides to the user's GWA on the results page |
| **FAQ accordion** | Smooth height reveal (use grid-rows 0fr to 1fr), plus/minus rotates 90 degrees, 250ms |
| **Navigation** | Header gets a hairline border when scrolled, no big shrink animation |

### 6.5 Calculator and results

| Moment | Motion |
|---|---|
| **Step to step** | The outgoing card slides 16px and fades, the next slides in (about 300ms). The stepper's progress line extends and the new step number fills maroon |
| **Adding or removing a course row** | Row slides down and fades in; removing collapses it. Never jumps the layout |
| **Typing a grade** | The row's computed value updates with a quick 150ms fade. The semester GWA badge gently pulses once when it changes |
| **Validation error** | A short horizontal nudge (4px, 2 cycles, 200ms) on the field plus the text message |
| **Autosave** | "Saved on this device" fades in for 1.5s and out |
| **Results arrival** (a choreographed 1.5s sequence, played once) | 1) status sentence fades up, 2) tier badge pops in (scale 0.96 to 1), 3) big target number rolls in, 4) sunflower grows to its stage, 5) roadmap bars fill row by row, 6) chart line draws from left to right (stroke-dashoffset), 7) scenario table rows fade in |
| **What-if / rolling update** | When the user changes a semester's GWA, only the affected targets animate: old number crossfades to new, bars slide to the new length, the chart line morphs smoothly. Nothing else on the page moves |
| **Tier card state change** | When a tier flips (for example magna becomes "out of reach"), the badge color cross-fades to neutral and the laurel sprigs relax; the cum laude card gently becomes the main one. Calm, never dramatic |
| **Share card** | Preview fades in; download button shows a brief check mark. The exported image itself is static |

### 6.6 Micro-interactions
- Buttons: hover darkens (150ms), press scales to 0.98. Outlined buttons draw their border color to maroon.
- Cards: border darkens slightly on hover; no lift, no shadow.
- Links: underline draws from left to right.
- Selects and inputs: focus ring fades in (maroon, 150ms). Grade dropdown options highlight with a soft tint.
- Tooltips: fade and rise 4px.
- Copy / export buttons: label swaps to "Copied" with a fade.

### 6.7 Implementation
- Default: **CSS transitions and keyframes**, `IntersectionObserver` for reveals, small `requestAnimationFrame` or `setTimeout` loops for ASCII frame swaps.
- Optional: **Motion** (the framer-motion successor) for step transitions, layout transitions in the roadmap table and the rolling-update morphs. Keep the bundle small; lazy-load it.
- Shared `useReveal()` hook and a `<Reveal index={n}>` wrapper so staggering is consistent.
- Chart line draw: SVG `stroke-dasharray` and `stroke-dashoffset`.
- Pause all ambient animation when the tab is hidden (`document.visibilityState`) and when the art is off-screen.
- Test on a low-end phone; if frame rate drops, ambient ASCII motion turns off automatically.

### 6.8 Reduced motion and accessibility
- Under `prefers-reduced-motion: reduce`: no typing, drifting, sway, growth, roll-in or chart drawing. Content appears immediately at its final state. The sunflower shows its final stage as a still image. Keep only instant hover and focus feedback.
- Provide a small "Reduce motion" toggle in the footer as well, remembered on the device, in case the OS setting isn't set.
- No flashing and nothing faster than 3 changes per second.
- Motion never carries information alone: the number and the text always say the same thing.

### 6.9 Motion checklist
- [ ] Every animation uses only transform or opacity
- [ ] Reduced-motion and the toggle both work and the page is complete without motion
- [ ] Results sequence under 2 seconds and skippable (any click or key skips to the end)
- [ ] ASCII art pauses off-screen and when the tab is hidden
- [ ] Tested at 360px on a mid-range phone, no jank
- [ ] The comforting state has no sad or alarming motion

---

## 7. Copy and tone
- Plain, warm, student-friendly. Short sentences. Taglish only if you decide to, and then consistently.
- Honest numbers first, then encouragement. No hype words and no fake urgency.
- No emoji, no exclamation-heavy text, no "AI-powered" claims (nothing here is AI; it's arithmetic).
- Labels say what the thing is ("Units this semester", not "Enter value").

---

## 8. Imagery
Mostly none. Allowed: a few hairline line illustrations or a faint UP-flavored pattern at very low opacity, and the share card. No stock photos of graduating students. **Logo caution:** do not use the official UP seal or logo in BELaude's branding in a way that suggests an official UP product. Use the colors, not the seal, and keep the "unofficial tool" line in the footer.

---

## 9. Implementation notes
- Define colors as CSS variables on `:root` and map them in `tailwind.config` and shadcn's theme tokens (`--primary`, `--ring`, `--border`, `--muted`).
- Load Newsreader, Geist Sans and Geist Mono with `font-display: swap`.
- Dark mode: not in v1. Plan the tokens so a dark theme can be added later.
- Chart: shadcn chart (Recharts) with custom colors from the tokens above.
- Test at 360px width and in grayscale to check that no meaning relies on color.

## 10. Design checklist before launch
- [ ] Hex values checked against the official brandbook or logo files
- [ ] Gold never used as text on white
- [ ] One accent color per screen
- [ ] No shadows, gradients, or emoji
- [ ] Icons all one family and weight (Phosphor)
- [ ] Out-of-reach screen reviewed by a few classmates for tone
- [ ] Works on a 360px phone and with keyboard only
