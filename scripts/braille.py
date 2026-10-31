"""Builds BELaude's Braille dot art into src/components/art.ts.

- The sunflower is the author's own Braille drawing (sunflower.txt), decoded to dots so it can be
  coloured by region and revealed bottom-up for the growth stages.
- The bell tower and laurel sprigs are rasterised here from simple shapes.

Usage: python braille.py sunflower.txt out.ts [preview.html]
"""
import json
import math
import sys

BASE = 0x2800
# Dot bit for (x, y) inside a 2x4 Braille cell
BIT = {(0, 0): 0, (0, 1): 1, (0, 2): 2, (1, 0): 3, (1, 1): 4, (1, 2): 5, (0, 3): 6, (1, 3): 7}


def decode(lines):
    rows, cols = len(lines), max(len(l) for l in lines)
    dots = [[False] * (cols * 2) for _ in range(rows * 4)]
    for r, line in enumerate(lines):
        for c, ch in enumerate(line.ljust(cols, chr(BASE))):
            code = ord(ch) - BASE
            if not 0 <= code < 256:
                continue
            for (x, y), b in BIT.items():
                if code >> b & 1:
                    dots[r * 4 + y][c * 2 + x] = True
    return dots


def encode(dots):
    h, w = len(dots), len(dots[0])
    out = []
    for r in range(0, h, 4):
        line = []
        for c in range(0, w, 2):
            code = 0
            for (x, y), b in BIT.items():
                if r + y < h and c + x < w and dots[r + y][c + x]:
                    code |= 1 << b
            line.append(chr(BASE + code))
        out.append(''.join(line))
    return out


class Canvas:
    def __init__(self, cols, rows):
        self.w, self.h = cols * 2, rows * 4
        self.d = [[False] * self.w for _ in range(self.h)]

    def dot(self, x, y):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < self.w and 0 <= y < self.h:
            self.d[y][x] = True

    def line(self, x0, y0, x1, y1):
        n = int(max(abs(x1 - x0), abs(y1 - y0)) * 2) + 1
        for i in range(n + 1):
            t = i / n
            self.dot(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)

    def poly(self, pts, closed=True):
        for a, b in zip(pts, pts[1:] + (pts[:1] if closed else [])):
            self.line(*a, *b)

    def ellipse(self, cx, cy, rx, ry, a0=0, a1=360, rot=0):
        n = int((rx + ry) * 4) + 8
        rr = math.radians(rot)
        for i in range(n + 1):
            a = math.radians(a0 + (a1 - a0) * i / n)
            x, y = rx * math.cos(a), ry * math.sin(a)
            self.dot(cx + x * math.cos(rr) - y * math.sin(rr), cy + x * math.sin(rr) + y * math.cos(rr))

    def lines(self):
        return encode(self.d)


def tones_for(lines, fn):
    return [''.join(fn(r, c, ch) for c, ch in enumerate(line)) for r, line in enumerate(lines)]


def sunflower_tone(r, c, ch):
    if ch == chr(BASE):
        return ' '
    if r >= 20:
        return 'g'
    if ((c - 30.5) / 9.5) ** 2 + ((r - 10.2) / 3.7) ** 2 <= 1:
        return 'm'
    return 'y'


def sprout(h, w):
    """A seedling where the stem meets the ground: short stem, two small leaves."""
    cv = Canvas(w // 2, h // 4)
    x, base = 26, h - 3
    cv.line(x, base, x, base - 14)
    cv.ellipse(x - 5, base - 13, 5, 2.2, rot=-25)
    cv.ellipse(x + 5, base - 15, 5, 2.2, rot=25)
    cv.line(x - 9, base + 1, x + 9, base + 1)
    return cv.d


def bud_layer(h, w):
    """A closed bud where the drawing's stem meets the head, with sepals and petal tips."""
    cv = Canvas(w // 2, h // 4)
    cx, cy = 45, 63
    cv.ellipse(cx, cy, 7, 11, rot=15)
    cv.ellipse(cx, cy + 1, 3.5, 7, rot=15)
    cv.line(cx - 1, cy + 15, cx - 9, cy + 4)  # sepals
    cv.line(cx - 1, cy + 15, cx + 8, cy + 6)
    cv.line(cx - 1, cy + 15, cx - 1, cy + 19)
    for dx in (-3, 0, 3):  # petal tips peeking out
        cv.line(cx + dx + 2, cy - 10, cx + dx * 1.8 + 3, cy - 16)
    return cv.d


def growth_frames(dots):
    """Seedling; the drawing's stem and leaves; the same with a closed bud; the full sunflower."""
    h, w = len(dots), len(dots[0])
    cut = int(h * 0.5)
    young = [[v if y >= cut else False for v in row] for y, row in enumerate(dots)]
    bud = [[a or b for a, b in zip(r1, r2)] for r1, r2 in zip(young, bud_layer(h, w))]

    def bud_tone(r, c, ch):
        if ch == chr(BASE):
            return ' '
        return 'y' if r <= 14 else 'g'

    frames = []
    for layer, tone in ((sprout(h, w), sunflower_tone), (young, sunflower_tone), (bud, bud_tone), (dots, sunflower_tone)):
        lines = encode(layer)
        frames.append({'lines': lines, 'tone': tones_for(lines, tone)})
    return frames


def tower():
    cv = Canvas(22, 15)  # 44 x 60 dots
    cx = 22
    cv.poly([(cx, 1), (cx - 7, 15), (cx + 7, 15)])  # spire
    cv.line(cx, 1, cx, -2)
    cv.poly([(cx - 8, 15), (cx + 8, 15), (cx + 8, 50), (cx - 8, 50)])  # body
    cv.ellipse(cx, 22, 4, 4)  # clock
    cv.line(cx, 22, cx, 19)
    cv.line(cx, 22, cx + 2, 23)
    for top in (31, 40):  # arched windows
        cv.ellipse(cx, top + 2, 2.5, 2.5, 180, 360)
        cv.line(cx - 2.5, top + 2, cx - 2.5, top + 6)
        cv.line(cx + 2.5, top + 2, cx + 2.5, top + 6)
        cv.line(cx - 2.5, top + 6, cx + 2.5, top + 6)
    cv.poly([(cx - 3, 50), (cx - 3, 44.5), (cx + 3, 44.5), (cx + 3, 50)], closed=False)  # door
    cv.poly([(cx - 12, 54), (cx - 12, 50), (cx + 12, 50), (cx + 12, 54)], closed=False)  # steps
    cv.line(0, 54, cv.w - 1, 54)  # ground
    lines = cv.lines()

    def tone(r, c, ch):
        if ch == chr(BASE):
            return ' '
        return 'm' if 4 <= r <= 6 and 8 <= c <= 13 else 's'

    return {'lines': lines, 'tone': tones_for(lines, tone)}


def laurel(right=False):
    cv = Canvas(6, 3)  # 12 x 12 dots: a curved sprig with leaves
    pts = [(10 - 9 * t, 11 - 9 * t + 3 * math.sin(math.pi * t)) for t in [i / 20 for i in range(21)]]
    for a, b in zip(pts, pts[1:]):
        cv.line(*a, *b)
    for t in (0.25, 0.5, 0.75, 0.95):
        x, y = 10 - 9 * t, 11 - 9 * t + 3 * math.sin(math.pi * t)
        cv.ellipse(x - 1.5, y - 1.2, 1.6, 0.9, rot=-35)
        cv.ellipse(x + 1.0, y + 1.0, 1.6, 0.9, rot=-35)
    d = cv.d
    if right:
        d = [row[::-1] for row in d]
    return encode(d)


class Scene:
    """A dot canvas with a colour tone per dot and a pen width, for bolder footer art."""

    def __init__(self, cols, rows):
        self.w, self.h = cols * 2, rows * 4
        self.d = [[False] * self.w for _ in range(self.h)]
        self.t = [[' '] * self.w for _ in range(self.h)]
        self.tone, self.pen = 'k', 2

    def dot(self, x, y):
        x0, y0 = int(round(x)), int(round(y))
        for dx in range(self.pen):
            for dy in range(self.pen):
                X, Y = x0 + dx, y0 + dy
                if 0 <= X < self.w and 0 <= Y < self.h:
                    self.d[Y][X] = True
                    self.t[Y][X] = self.tone

    def line(self, x0, y0, x1, y1):
        n = int(max(abs(x1 - x0), abs(y1 - y0)) * 2) + 1
        for i in range(n + 1):
            k = i / n
            self.dot(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k)

    def poly(self, pts, closed=True):
        for a, b in zip(pts, pts[1:] + (pts[:1] if closed else [])):
            self.line(*a, *b)

    def arc(self, cx, cy, rx, ry, a0=0, a1=360):
        n = int((rx + ry) * 6) + 12
        for i in range(n + 1):
            a = math.radians(a0 + (a1 - a0) * i / n)
            self.dot(cx + rx * math.cos(a), cy + ry * math.sin(a))

    def stamp(self, dots, tones, ox, oy):
        for y, row in enumerate(dots):
            for x, v in enumerate(row):
                if v and 0 <= x + ox < self.w and 0 <= y + oy < self.h:
                    self.d[y + oy][x + ox] = True
                    self.t[y + oy][x + ox] = tones[y][x]

    def frame(self):
        lines = encode(self.d)
        tone_rows = []
        for r in range(0, self.h, 4):
            row = []
            for c in range(0, self.w, 2):
                seen = [self.t[r + y][c + x] for (x, y) in BIT if r + y < self.h and c + x < self.w and self.d[r + y][c + x]]
                row.append(max(set(seen), key=seen.count) if seen else ' ')
            tone_rows.append(''.join(row))
        return {'lines': lines, 'tone': tone_rows}


def shrink(dots, factor, keep=2):
    """Downsample the sunflower: a dot survives if `keep` source dots fall in its block. Tones by majority."""
    h, w = len(dots), len(dots[0])
    out, tones = [], []
    for y in range(0, h - factor + 1, factor):
        row, trow = [], []
        for x in range(0, w - factor + 1, factor):
            hits = [(x + dx, y + dy) for dy in range(factor) for dx in range(factor) if dots[y + dy][x + dx]]
            row.append(len(hits) >= keep)
            ts = [sunflower_tone(py // 4, px // 2, 'x') for px, py in hits]
            trow.append(max(set(ts), key=ts.count) if ts else ' ')
        out.append(row)
        tones.append(trow)
    return out, tones


def sunflower(sc, cx, cy, disk, petal, ground, lean=0):
    """A small line-drawn sunflower: outlined petals round a seeded disk, a curved stem, two leaves."""
    pen, tone = sc.pen, sc.tone
    # stem first, so the head draws over its top
    sc.tone, sc.pen = 'g', 2
    top = cy + disk + 2
    steps = 24
    for i in range(steps):
        a, b = i / steps, (i + 1) / steps
        xa = cx + lean * math.sin(math.pi * a)
        xb = cx + lean * math.sin(math.pi * b)
        sc.line(xa, top + (ground - top) * a, xb, top + (ground - top) * b)
    sc.pen = 1
    mid = top + (ground - top) * 0.55
    sc.arc(cx - petal * 0.9, mid, petal * 0.9, petal * 0.38, 0, 360)  # leaves as outlined ovals
    sc.arc(cx + petal * 0.9 + lean * 0.3, mid + petal * 0.9, petal * 0.9, petal * 0.38, 0, 360)
    # petals: outlined ovals pointing out from the disk
    sc.tone = 'y'
    for k in range(12):
        a = 2 * math.pi * k / 12
        d = disk + petal * 0.55
        px, py = cx + d * math.cos(a), cy + d * math.sin(a)
        n = 28
        for i in range(n + 1):
            t = 2 * math.pi * i / n
            ex, ey = petal * 0.55 * math.cos(t), petal * 0.22 * math.sin(t)
            sc.dot(px + ex * math.cos(a) - ey * math.sin(a), py + ex * math.sin(a) + ey * math.cos(a))
    # disk: a thick maroon ring with seeds inside
    sc.tone, sc.pen = 'm', 2
    sc.arc(cx - 0.5, cy - 0.5, disk, disk)
    sc.pen = 1
    for sx in range(-int(disk) + 2, int(disk) - 1, 2):
        for sy in range(-int(disk) + 2, int(disk) - 1, 2):
            if sx * sx + sy * sy < (disk - 1.5) ** 2:
                sc.dot(cx + sx, cy + sy)
    sc.pen, sc.tone = pen, tone


def footer_scene(dots):
    """The footer: a campus bell tower between two of the author's sunflowers, on a strip of grass."""
    sc = Scene(50, 18)  # 100 x 72 dots
    cx, ground = 40, 68
    sc.tone, sc.pen = 'k', 2
    sc.line(cx, 0, cx, 5)  # finial
    sc.poly([(cx, 5), (cx - 10, 20), (cx + 10, 20)])  # spire
    sc.pen = 1
    for yy, half in ((11, 4), (16, 7.5)):  # roof courses
        sc.line(cx - half, yy, cx + half, yy)
    sc.pen = 2
    sc.poly([(cx - 10, 24), (cx + 10, 24), (cx + 10, 61), (cx - 10, 61)])  # body
    sc.line(cx - 13, 22, cx + 13, 22)  # cornice
    sc.tone = 'm'
    sc.arc(cx, 33, 5.5, 5.5)  # clock
    sc.pen = 1
    sc.line(cx, 33, cx, 29.5)
    sc.line(cx, 33, cx + 3, 34.5)
    sc.tone = 'k'
    for top in (42,):  # arched window
        sc.arc(cx, top + 3, 3.5, 3.5, 180, 360)
        sc.line(cx - 3.5, top + 3, cx - 3.5, top + 9)
        sc.line(cx + 3.5, top + 3, cx + 3.5, top + 9)
        sc.line(cx - 4.5, top + 9, cx + 4.5, top + 9)
    sc.pen, sc.tone = 2, 'm'
    sc.arc(cx, 57, 4, 4, 180, 360)  # door
    sc.line(cx - 4, 57, cx - 4, 61)
    sc.line(cx + 4, 57, cx + 4, 61)
    sc.tone = 'k'
    sc.line(cx - 14, 63, cx + 14, 63)  # steps
    sc.line(cx - 17, 66, cx + 17, 66)
    sc.tone = 'g'
    sc.line(0, ground, sc.w - 1, ground)  # ground
    sc.pen = 1
    for gx in range(3, sc.w - 2, 7):  # grass
        sc.line(gx, ground, gx - 1, ground - 3)
        sc.line(gx + 1, ground, gx + 2, ground - 2)
    sunflower(sc, 83, 20, disk=5, petal=7, ground=ground, lean=-3)  # tall one, right of the tower
    sunflower(sc, 11, 40, disk=3.5, petal=5, ground=ground, lean=2)  # young one, left
    return sc.frame()


if __name__ == '__main__':
    src = [l for l in open(sys.argv[1], encoding='utf-8').read().split('\n') if l.strip()]
    width = max(len(l) for l in src)
    src = [l.ljust(width, chr(BASE)) for l in src]
    dots = decode(src)
    assert encode(dots) == src, 'Braille round trip failed'
    bloom = {'lines': src, 'tone': tones_for(src, sunflower_tone)}
    growth = growth_frames(dots)
    data = {
        'SUNFLOWER': bloom,
        'GROWTH': growth,
        'TOWER': footer_scene(dots),
        'LAUREL_LEFT': laurel(),
        'LAUREL_RIGHT': laurel(right=True),
    }
    ts = [
        '// Generated by scripts/braille.py. The sunflower is the author\'s own Braille drawing.',
        '// tone codes: y gold petals, m maroon seed disk, g green stem and leaves, s muted outline.',
        '',
        'export interface ArtFrame {',
        '  lines: string[]',
        '  tone: string[]',
        '}',
        '',
        '/** Centre of the seed disk in the sunflower, in character cells (for overlaying a number). */',
        f'export const DISK_CENTRE = {{ row: 10.2, col: 30.5, rows: {len(src)}, cols: {width} }}',
        '',
    ]
    for name, value in data.items():
        kind = 'ArtFrame[]' if name == 'GROWTH' else 'ArtFrame' if isinstance(value, dict) else 'string[]'
        ts.append(f'export const {name}: {kind} = {json.dumps(value, ensure_ascii=False, indent=2)}')
        ts.append('')
    open(sys.argv[2], 'w', encoding='utf-8').write('\n'.join(ts))
    if len(sys.argv) > 3:
        col = {'y': '#E0A000', 'm': '#8B1335', 'g': '#00573F', 's': '#6B6A66', 'k': '#111111'}
        def pre(frame, size):
            rows = []
            for line, tone in zip(frame['lines'], frame['tone']):
                rows.append(''.join(f"<span style='color:{col[t]}'>{ch}</span>" if t != ' ' else ch for ch, t in zip(line, tone)))
            return f"<pre style='font-size:{size}px'>" + '\n'.join(rows) + '</pre>'
        html = ["<html><head><meta charset='utf-8'><style>@font-face{font-family:BR;src:url('br.woff2')}"
                "body{margin:20px;display:flex;flex-wrap:wrap;gap:20px;align-items:flex-end;background:#fff}"
                "pre{font-family:BR;line-height:1;margin:0}div{border:1px solid #eee;padding:10px}</style></head><body>"]
        html.append('<div>' + pre(bloom, 12) + '</div>')
        for g in growth:
            html.append('<div>' + pre(g, 5) + '</div>')
        html.append('<div>' + pre(data['TOWER'], 10) + '</div>')
        lv = {'lines': data['LAUREL_LEFT'], 'tone': [''.join('g' if ch != chr(BASE) else ' ' for ch in l) for l in data['LAUREL_LEFT']]}
        rv = {'lines': data['LAUREL_RIGHT'], 'tone': [''.join('g' if ch != chr(BASE) else ' ' for ch in l) for l in data['LAUREL_RIGHT']]}
        html.append('<div style="display:flex;gap:8px;align-items:center">' + pre(lv, 12) + '<b>MAGNA</b>' + pre(rv, 12) + '</div>')
        open(sys.argv[3], 'w', encoding='utf-8').write(''.join(html) + '</body></html>')
    print('ok', len(src), 'rows x', width, 'cols')
