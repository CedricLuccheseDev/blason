"""What the boards draw with, in SVG on a 1440 x 900 board, in the map's own
hand: the inks and the faces, the glyphs, the wax seals and gilt medallions,
coins, lords' shields, the pointer; then the HUD's design system, mirrored
from the game (src/components/hud/): its type, its space, its sheet, its
button, its emblems."""
import json
import math
import os

INK = '#2b1e12'
PAPER = '#f6eedb'
SHADE = '#d9c49a'
SHADE_D = '#b89f6e'
GOLD = '#d9a41e'
GOLD_D = '#946512'
GOLD_L = '#f4d277'
GULES = '#b3302a'
GULES_D = '#741c16'
OK = '#2f7d3f'
PACT = '#3f7f4a'
CAPS = "'IM Fell English SC', Georgia, serif"
FELL = "'IM Fell English', Georgia, serif"
SANS = "'Alegreya Sans', 'Trebuchet MS', sans-serif"

GLYPHS = {
    'village': [('M3 21 V13 L7.5 8.5 L12 13 V21 Z', 0), ('M12 21 V11 L16.5 6.5 L21 11 V21 Z', 0), ('M6 21 V17 H9 V21 M15 14.5 H18', 1)],
    'castle': [('M2.5 21 V11 H5.2 V8 H7.9 V11 H10.6 V8 H13.4 V11 H16.1 V8 H18.8 V11 H21.5 V21 Z', 0), ('M2.5 16 H21.5 M8 11 V16 M16 11 V16 M12 16 V21', 1)],
    'market': [('M7.2 9.2 Q3 13.2 4.4 17.6 Q6 21.6 12 21.6 Q18 21.6 19.6 17.6 Q21 13.2 16.8 9.2 Z', 0), ('M8.6 9.2 L7 4.4 Q9.6 6.2 12 3.8 Q14.4 6.2 17 4.4 L15.4 9.2 Z', 0), ('M8 9.2 H16 M12 12.4 V18.6 M9.8 14 Q12 12.6 14.2 14 Q12 15.6 9.8 17.2 Q12 18.6 14.2 17.2', 1)],    'trouble': [('M10.6 21.5 L11.4 11 H12.6 L13.4 21.5 Z', 0), ('M8.5 11 H15.5 L14.5 8.5 H9.5 Z', 0), ('M12 1.8 Q16.6 5.4 14.6 8.5 H9.4 Q7.4 5.4 12 1.8 Z', 0)],
    'felon': [('M12 2.5 L20 5.6 V11.8 Q20 18.2 12 21.5 Q4 18.2 4 11.8 V5.6 Z', 0), ('M12.6 2.8 L10.6 8 L13.6 11.2 L10.4 15.2 L12 21.2', 1)],
    # The soldier of the battles (a helmet alone read as a little house).
    'helmet': [('M7.35 20.95 L16.95 1.45', 1), ('M16.95 1.45 L15.75 4.3 L18.3 3.1 Z', 0),
               ('M5.7 11.5 Q5.7 10.3 6.9 10.3 H11.4 Q12.6 10.3 12.6 11.5 V18.7 H5.7 Z', 0),
               ('M6.55 7.9 A2.6 2.6 0 1 0 11.75 7.9 A2.6 2.6 0 1 0 6.55 7.9 Z', 0), ('M6.15 7.75 Q9.15 3.25 12.15 7.75 Z', 0),
               ('M11.55 10.6 L16.05 10.6 L16.05 14.2 Q16.05 17.05 13.8 18.1 Q11.55 17.05 11.55 14.2 Z', 0),
               ('M7.2 18.1 L6.3 22.6 M10.95 18.1 L11.85 22.6', 1)],
    'sword': [('M12 2 L14 5.5 V15 H10 V5.5 Z', 0), ('M6.5 15 H17.5 M12 15 V20.5', 1), ('M10.5 21.5 A1.5 1.5 0 1 0 13.5 21.5 A1.5 1.5 0 1 0 10.5 21.5 Z', 0)],
    'hourglass': [('M6 2.5 H18 M6 21.5 H18', 1), ('M7.5 2.5 Q7.5 9 12 12 Q16.5 9 16.5 2.5 Z', 0), ('M7.5 21.5 Q7.5 15 12 12 Q16.5 15 16.5 21.5 Z', 0)],
    'links': [('M3 12 A4.5 4.5 0 0 1 7.5 7.5 H11 A4.5 4.5 0 0 1 11 16.5 H7.5 A4.5 4.5 0 0 1 3 12 Z', 1), ('M13 7.5 H16.5 A4.5 4.5 0 0 1 16.5 16.5 H13 A4.5 4.5 0 0 1 13 7.5 Z', 1)],
    'pitchfork': [('M12 21.5 V9 M7.5 3 V8 Q7.5 10 12 10 Q16.5 10 16.5 8 V3 M12 3 V10', 1)],
}


def num(v):
    return str(v) if v < 10000 else f'{v:,}'.replace(',', '\u2009')


def glyph(name, cx, cy, size, fill=PAPER, stroke=INK, sw=1.7, opacity=1):
    k = size / 24
    parts = ''.join(
        f'<path d="{d}" fill="{"none" if open_ else fill}" stroke="{stroke}" stroke-width="{sw / k:.2f}" stroke-linejoin="round" stroke-linecap="round"/>'
        for d, open_ in GLYPHS[name])
    return f'<g transform="translate({cx - 12 * k:.1f} {cy - 12 * k:.1f}) scale({k:.3f})" opacity="{opacity}">{parts}</g>'


def text(x, y, s, size, font=SANS, weight=800, fill=INK, anchor='middle', halo=None, hw=None, italic=False, ls=0, opacity=1):
    h = f' stroke="{halo}" stroke-width="{hw or size * 0.28:.1f}" stroke-linejoin="round" paint-order="stroke"' if halo else ''
    it = ' font-style="italic"' if italic else ''
    sp = f' letter-spacing="{ls}"' if ls else ''
    nums = ' style="font-variant-numeric: lining-nums tabular-nums"' if font == SANS else ''
    return f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}" font-family="{font}" font-weight="{weight}" font-size="{size}"{it}{sp}{nums} fill="{fill}"{h} opacity="{opacity}">{s}</text>'


def defs():
    return f'''<defs>
<filter id="lift" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="2.2" stdDeviation="2.2" flood-color="{INK}" flood-opacity="0.38"/></filter>
<filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur in="SourceAlpha" stdDeviation="6" result="b"/><feFlood flood-color="{GOLD_L}" flood-opacity="0.95"/><feComposite in2="b" operator="in" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="sheet" x="-10%" y="-20%" width="120%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="{INK}" flood-opacity="0.35"/></filter>
<pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="{INK}" stroke-opacity="0.22" stroke-width="1"/></pattern>
</defs>'''


def width_of(s, size, font=SANS):
    per = 0.5 if font == SANS else 0.6 if font == CAPS else 0.46
    return len(s) * size * per


def medallion(cx, cy, r, icon, lifted=False):
    """A work: a parchment disc ringed with gold, its drawing in ink; glowing when in hand."""
    f = 'glow' if lifted else 'lift'
    return (f'<g filter="url(#{f})"><circle cx="{cx}" cy="{cy}" r="{r}" fill="{PAPER}" stroke="{INK}" stroke-width="2"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r - 4}" fill="none" stroke="{GOLD}" stroke-width="2.6"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r - 5.6}" fill="none" stroke="{INK}" stroke-width="0.8"/>'
            + glyph(icon, cx, cy + 0.5, r * 1.12, sw=1.8) + '</g>')


def seal(cx, cy, r, icon, color=GULES, lifted=False, edge=None):
    """A wax seal, its drawing pressed into it; glowing when in hand."""
    pts = []
    for i in range(22):
        a = i / 22 * math.tau
        rr = r * (1 + 0.06 * math.sin(i * 2.7) + 0.04 * math.cos(i * 1.3))
        pts.append(f'{cx + math.cos(a) * rr:.1f},{cy + math.sin(a) * rr:.1f}')
    dark = edge or GULES_D
    f = 'glow' if lifted else 'lift'
    return (f'<g filter="url(#{f})"><polygon points="{" ".join(pts)}" fill="{color}" stroke="{dark}" stroke-width="1.6" stroke-linejoin="round"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r * 0.74}" fill="none" stroke="{dark}" stroke-width="2"/>'
            f'<path d="M{cx - r * 0.55:.1f} {cy - r * 0.35:.1f} Q{cx - r * 0.3:.1f} {cy - r * 0.72:.1f} {cx + r * 0.15:.1f} {cy - r * 0.72:.1f}" fill="none" stroke="#fff" stroke-opacity="0.28" stroke-width="2.4" stroke-linecap="round"/>'
            + glyph(icon, cx, cy + 0.5, r * 1.0, fill='#f0d9c4', stroke=dark, sw=1.7) + '</g>')


def coin(cx, cy, r):
    return (f'<g><circle cx="{cx}" cy="{cy}" r="{r}" fill="{GOLD}" stroke="{INK}" stroke-width="{max(0.9, r * 0.14):.2f}"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r * 0.68:.2f}" fill="none" stroke="{GOLD_D}" stroke-width="{max(0.6, r * 0.12):.2f}"/>'
            f'<path d="M{cx - r * 0.5:.1f} {cy - r * 0.2:.1f} Q{cx - r * 0.3:.1f} {cy - r * 0.6:.1f} {cx + r * 0.1:.1f} {cy - r * 0.6:.1f}" fill="none" stroke="{GOLD_L}" stroke-width="{max(0.6, r * 0.16):.2f}" stroke-linecap="round"/></g>')


def coins(cx, cy, r):
    return coin(cx - r * 0.35, cy + r * 0.45, r) + coin(cx + r * 0.35, cy + r * 0.2, r) + coin(cx, cy - r * 0.25, r)


def heater(x, y, w, h):
    return f'M{x:.1f} {y:.1f} H{x + w:.1f} V{y + h * 0.46:.1f} Q{x + w:.1f} {y + h * 0.84:.1f} {x + w / 2:.1f} {y + h:.1f} Q{x:.1f} {y + h * 0.84:.1f} {x:.1f} {y + h * 0.46:.1f} Z'


def chevron(x, y, w, h):
    return f'<path d="M{x:.1f} {y + h * 0.66:.1f} L{x + w / 2:.1f} {y + h * 0.3:.1f} L{x + w:.1f} {y + h * 0.66:.1f} L{x + w:.1f} {y + h * 0.84:.1f} L{x + w / 2:.1f} {y + h * 0.48:.1f} L{x:.1f} {y + h * 0.84:.1f} Z"/>'

_uid = [0]


def ecu(x, y, w, h, tincture, level=None, filt='lift'):
    """A lord's shield and its chevron. With a level, its tincture fills it like a vessel: his peasants against what his land feeds."""
    _uid[0] += 1
    cid = f'ecu{_uid[0]}'
    path = heater(x, y, w, h)
    out = [f'<g filter="url(#{filt})">' if filt else '<g>',
           f'<clipPath id="{cid}"><path d="{path}"/></clipPath>',
           f'<path d="{path}" fill="{PAPER}"/>']
    if level is None:
        out.append(f'<path d="{path}" fill="{tincture}"/>')
    else:
        top = y + h * (1 - level)
        out.append(f'<g clip-path="url(#{cid})"><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="url(#hatch)"/>'
                   f'<path d="M{x - 2} {top:.1f} Q{x + w * 0.25:.1f} {top - 3:.1f} {x + w / 2:.1f} {top:.1f} T{x + w + 2:.1f} {top:.1f} V{y + h + 2} H{x - 2} Z" fill="{tincture}"/></g>')
    out.append(f'<g clip-path="url(#{cid})" fill="{PAPER}" fill-opacity="{0.92 if level is None else 0.55}">{chevron(x, y, w, h)}</g>')
    out.append(f'<path d="{path}" fill="none" stroke="{INK}" stroke-width="{max(1.4, w * 0.04):.1f}" stroke-linejoin="round"/>')
    out.append('</g>')
    return ''.join(out)


def cursor(x, y, s=1.0):
    return (f'<g transform="translate({x} {y}) scale({s})" filter="url(#lift)"><path d="M0 0 L0 22 L5.5 16.5 L9.5 25 L13 23.4 L9 15 L16.5 15 Z" fill="{PAPER}" stroke="{INK}" stroke-width="1.6" stroke-linejoin="round"/>'
            f'<path d="M2 4 L2 15" stroke="{GOLD}" stroke-width="1.4"/></g>')


# The HUD's design system, mirrored once from the game: its measures in
# src/components/hud/tokens.ts and src/styles/app.css, its pieces in
# src/components/hud/ (Sheet.tsx, Act.tsx, Figure.tsx, Emblem.tsx). The fluid
# land's pieces (hud.py) are built from these alone, so that a board lays out
# what the game lays out, to the pixel, on a 1440 x 900 screen.

WAX = '#f0d9c4'
#: Four sizes of type, none under 15, and the height of a line of each (--text-hud-*).
S, M, L, XL = 15, 18, 22, 28
LINE = {S: 18, M: 21.6, L: 25.3, XL: 28}
#: Where the baseline sits in its line, as Chrome sets it for each face.
BASELINE = {('fell', S): 13, ('fell', M): 15, ('fell', L): 18, ('fell', XL): 21,
            ('sans', S): 13, ('sans', M): 15, ('sans', L): 19, ('sans', XL): 22}
#: The steps of space, Tailwind's own: an icon and its figure (gap-1); the lines of a piece, pieces stacked (gap-2);
#: inside a sheet, the parts of a piece (p-3, gap-3); from the edge of the screen (p-4); between groups (gap-6).
TIGHT, APART, PAD, EDGE, GROUP = 4, 8, 12, 16, 24
STEPS = (TIGHT, APART, PAD, EDGE, GROUP)
#: An icon beside a figure, sized on its type; a lord's shield; a seal's or a medallion's radius, and what one in hand grows by.
ICON = {S: 16, M: 18, L: 22, XL: 24}
SHIELD = {'s': (16, 20), 'm': (28, 34), 'l': (52, 64)}
SEAL_R = {'s': 18, 'l': 26}
RAISE = 3
#: The sheet: an ink edge of 1.5 (laid out on one pixel at one pixel per pixel, as Chrome does), a gold rule 3 inside it,
#: rounded 6 (its rule 4), one shadow (filter "sheet": 0 2px 4px, ink at 35 %).
EDGE_W, EDGE_BOX, RULE_INSET, RADIUS, RULE_RADIUS = 1.5, 1, 3, 6, 4
#: The one button: 44 high, 16 inside on each side, its word in IM Fell; gold to act, the alliance's green to accept one,
#: gules to break or refuse, parchment for the rest.
ACT_H, ACT_PAD = 44, 16
TONES = {'gilt': (GOLD, INK), 'pact': (PACT, PAPER), 'gules': (GULES, WAX), 'plain': (PAPER, INK)}
#: A figure's tones: what cannot be had, or matters less, at 70 % ink.
FIGURE_TONES = {'ink': (INK, 1), 'dim': (INK, 0.7), 'thrive': (OK, 1), 'gilt': (GOLD_D, 1), 'gules': (GULES, 1), 'pact': (PACT, 1)}
#: A key cap: a lozenge in a box of 24.
KEY = 24
#: Each glyph's advance in thousandths of an em, measured in Chrome (IM Fell English upright and italic, Alegreya Sans 800
#: with tabular lining figures as .hud-figure sets them, IM Fell English SC): metrics.json.
_ADV = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'metrics.json')))
FACES = {'fell': (FELL, 400, False), 'italic': (FELL, 400, True), 'sans': (SANS, 800, False), 'caps': (CAPS, 400, False)}


def measure(s, size, face='fell'):
    """A line's width as Chrome lays it out at one pixel per pixel: each glyph's advance rounded, a figure's spaces widened by .12 em."""
    adv = _ADV[face]
    w = sum(round(adv.get(c, 500) * size / 1000) for c in s)
    if face == 'sans':
        w += 0.12 * size * sum(1 for c in s if c in ' \u00a0')
    return w


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def line_text(x, top, s, size, face='fell', fill=INK, opacity=1, anchor='start'):
    """One line of the HUD's type, its line box's top at `top`: words in IM Fell, figures in Alegreya Sans (tabular, spaces widened)."""
    family, weight, italic = FACES[face]
    y = top + BASELINE[('sans' if face == 'sans' else 'fell', size)]
    extra = ' font-style="italic"' if italic else ''
    if face == 'sans':
        extra += f' word-spacing="{0.12 * size:.2f}" style="font-variant-numeric: lining-nums tabular-nums"'
    op = f' opacity="{opacity}"' if opacity != 1 else ''
    return f'<text x="{x:.2f}" y="{y:.2f}" text-anchor="{anchor}" font-family="{family}" font-weight="{weight}" font-size="{size}"{extra} fill="{fill}"{op} xml:space="preserve">{esc(s)}</text>'


def word(x, top, s, size=M, opacity=1, fill=INK):
    """.hud-word: IM Fell, 18 unless said."""
    return line_text(x, top, s, size, 'fell', fill, opacity)


def lord_name(x, top, s):
    """.hud-name: a lord, IM Fell italic 22."""
    return line_text(x, top, s, L, 'italic')


def note(x, top, s):
    """.hud-note: a hint, IM Fell italic 15, at full ink as the rest."""
    return line_text(x, top, s, S, 'italic')


def icon(name, x, y, px):
    """An icon of `px` pixels, its box's corner at (x, y): a mark in ink on parchment, or a heap of coins."""
    c = px / 2
    if name == 'coins':
        return coins(x + c, y + c, px * 0.33)
    return glyph(name, x + c, y + c, px, sw=1.5)


def figure(x, top, s, size=M, glyph_=None, tone='ink'):
    """.hud-figure, its icon before it 4 apart, both at one of the four sizes, the icon centred on the line; returns (svg, width)."""
    fill, opacity = FIGURE_TONES[tone]
    out, w = [], 0
    if glyph_:
        px = ICON[size]
        out.append(icon(glyph_, x, top + (LINE[size] - px) / 2, px))
        w = px + TIGHT
    out.append(line_text(x + w, top, s, size, 'sans', fill))
    w += measure(s, size, 'sans')
    body = ''.join(out)
    return (f'<g opacity="{opacity}">{body}</g>' if opacity != 1 else body), w


def figure_width(s, size=M, glyph_=None):
    return (ICON[size] + TIGHT if glyph_ else 0) + measure(s, size, 'sans')


def sheet(x, y, w, h, rolled=None):
    """The HUD's one material: a sheet of parchment, an ink edge, a gold rule inside it, a little shadow under it; rolled at its sides as the bar's band ('sides'), or at its ends as the home's scroll ('ends')."""
    e = EDGE_W / 2
    r0 = EDGE_BOX + RULE_INSET + 0.5
    out = [f'<rect x="{x + e:.2f}" y="{y + e:.2f}" width="{w - EDGE_W:.2f}" height="{h - EDGE_W:.2f}" rx="{RADIUS - e:.2f}" fill="{PAPER}" stroke="{INK}" stroke-width="{EDGE_W}" filter="url(#sheet)"/>',
           f'<rect x="{x + r0:.2f}" y="{y + r0:.2f}" width="{w - 2 * r0:.2f}" height="{h - 2 * r0:.2f}" rx="{RULE_RADIUS - 0.5}" fill="none" stroke="{GOLD}" stroke-width="1"/>']
    if rolled == 'ends':
        for ry in (y + EDGE_BOX - 8, y + h - EDGE_BOX + 8 - 16):
            rx, rw = x + EDGE_BOX - 4, w - 2 * EDGE_BOX + 8
            out.append(f'<rect x="{rx + e:.2f}" y="{ry + e:.2f}" width="{rw - EDGE_W:.2f}" height="{16 - EDGE_W}" rx="{8 - e}" fill="{SHADE}" stroke="{INK}" stroke-width="{EDGE_W}"/>'
                       f'<rect x="{rx + EDGE_BOX + 4:.2f}" y="{ry + 8:.2f}" width="{rw - 2 * EDGE_BOX - 8:.2f}" height="1" fill="{SHADE_D}"/>')
    elif rolled:
        for rx in (x + EDGE_BOX - 8, x + w - EDGE_BOX + 8 - 16):
            ry, rh = y + EDGE_BOX - 4, h - 2 * EDGE_BOX + 8
            out.append(f'<rect x="{rx + e:.2f}" y="{ry + e:.2f}" width="{16 - EDGE_W}" height="{rh - EDGE_W:.2f}" rx="{8 - e}" fill="{SHADE}" stroke="{INK}" stroke-width="{EDGE_W}"/>'
                       f'<rect x="{rx + 8:.2f}" y="{ry + EDGE_BOX + 4:.2f}" width="1" height="{rh - 2 * EDGE_BOX - 8:.2f}" fill="{SHADE_D}"/>')
    return ''.join(out)


def upright_rule(x, y, h):
    """A rule between the parts of a sheet, upright, in ink at 30 %."""
    return f'<rect x="{x:.2f}" y="{y:.2f}" width="1" height="{h:.2f}" fill="{INK}" fill-opacity="0.3"/>'


def act_width(label, glyph_=None):
    return 2 * EDGE_BOX + 2 * ACT_PAD + (ICON[M] + APART if glyph_ else 0) + measure(label, M, 'fell')


def act(x, y, label, tone='gilt', glyph_=None, w=None, asleep=False):
    """The HUD's one button: a plate on the sheet, an ink edge, its word in IM Fell 18, 44 high; its content centred."""
    w = w or act_width(label, glyph_)
    bg, ink = TONES[tone]
    e = EDGE_W / 2
    out = [f'<rect x="{x + e:.2f}" y="{y + e:.2f}" width="{w - EDGE_W:.2f}" height="{ACT_H - EDGE_W}" rx="{RADIUS - e}" fill="{bg}" stroke="{INK}" stroke-width="{EDGE_W}" filter="url(#sheet)"/>']
    inner = act_width(label, glyph_) - 2 * EDGE_BOX - 2 * ACT_PAD
    cx = x + (w - inner) / 2
    if glyph_:
        out.append(glyph(glyph_, cx + ICON[M] / 2, y + ACT_H / 2, ICON[M], fill=PAPER if tone == 'plain' else bg, stroke=ink, sw=1.5))
        cx += ICON[M] + APART
    out.append(line_text(cx, y + (ACT_H - LINE[M]) / 2, label, M, 'fell', fill=ink))
    return ''.join(out)


def keycap(x, y, k):
    """A key of the keyboard in its lozenge, in a box of 24."""
    c = KEY / 2
    d = (KEY - 6) / 2 * math.sqrt(2) - EDGE_W / 2
    return (f'<path d="M{x + c:.2f} {y + c - d:.2f} L{x + c + d:.2f} {y + c:.2f} L{x + c:.2f} {y + c + d:.2f} L{x + c - d:.2f} {y + c:.2f} Z" fill="{PAPER}" stroke="{INK}" stroke-width="{EDGE_W}"/>'
            + line_text(x + c, y + (KEY - LINE[S]) / 2, str(k), S, 'sans', anchor='middle'))


def shield(x, y, color, size='m', level=None):
    """A lord's shield and its chevron, in its box (2 wider and higher than the shield); with a level, his colour fills it."""
    w, h = SHIELD[size]
    return ecu(x + 1, y + 1, w, h, color, level=level, filt=None)


def emblem_box(size='l'):
    """The box a seal or a medallion sits in, room left for it to rise."""
    return 2 * (SEAL_R[size] + RAISE) + 6


def seal_emblem(x, y, glyph_, color, size='l', held=False):
    """A wax seal in its box; raised and glowing when in hand."""
    c = emblem_box(size) / 2
    r = SEAL_R[size] + (RAISE if held else 0)
    return seal(x + c, y + c - (RAISE if held else 0), r, glyph_, color=color, edge=INK, lifted=held)


def medallion_emblem(x, y, glyph_, size='l', held=False):
    """A work's gilt medallion in its box; raised and glowing when in hand."""
    c = emblem_box(size) / 2
    r = SEAL_R[size] + (RAISE if held else 0)
    return medallion(x + c, y + c - (RAISE if held else 0), r, glyph_, lifted=held)


def right_click(x, y):
    """A mouse with its right button lit, 20 by 30: what a right click opens."""
    return (f'<g transform="translate({x:.2f} {y:.2f})"><rect x="1" y="1" width="18" height="28" rx="9" fill="{PAPER}" stroke="{INK}" stroke-width="1.5"/>'
            f'<path d="M10 1 V12 H19 V10 A9 9 0 0 0 10 1 Z" fill="{GOLD}" stroke="{INK}" stroke-width="1"/>'
            f'<path d="M1 12 H19" stroke="{INK}" stroke-width="1"/></g>')


def wrap(s, size, width, face='fell'):
    """Words broken into lines no wider than `width`, as a browser breaks them."""
    lines, cur = [], ''
    for w_ in s.split(' '):
        nxt = f'{cur} {w_}' if cur else w_
        if cur and measure(nxt, size, face) > width:
            lines.append(cur)
            cur = w_
        else:
            cur = nxt
    return lines + [cur]
