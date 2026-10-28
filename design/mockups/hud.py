"""The fluid land's HUD (after src/components/proto/) and what it draws on the map (after src/proto/): the soldiers, the wagons, the fights and their pills, the aim, the standard, the works."""
import math
from kit import *


ME_COLOR = '#2f6db5'

#: How the map moves: the fights jostle in their dust struck with sparks, the fresh edge of a pocket throbs, the wagons jolt, my standard bobs and waves.
MOTION = '''
.throb{animation:throb .9s ease-in-out infinite}
@keyframes throb{0%,100%{opacity:1}50%{opacity:.5}}
.jostle{animation:jostle .45s ease-in-out infinite alternate}
@keyframes jostle{from{transform:translate(0,0)}to{transform:translate(var(--dx),var(--dy))}}
.spark{transform-box:fill-box;transform-origin:center;animation:spark .9s ease-out infinite;opacity:0}
@keyframes spark{0%{opacity:0;transform:scale(.2)}15%{opacity:1;transform:scale(1)}55%{opacity:0;transform:scale(1.6)}100%{opacity:0}}
.dust{transform-box:fill-box;transform-origin:center;animation:dust 1.5s ease-out infinite;opacity:0}
@keyframes dust{0%{opacity:.55;transform:scale(.4)}100%{opacity:0;transform:scale(1.9)}}
.jolt{animation:jolt .45s ease-in-out infinite alternate}
@keyframes jolt{from{transform:translateY(0)}to{transform:translateY(-0.8px)}}
.bob{animation:bob 2.2s ease-in-out infinite}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
.wave{animation:wave 2.6s ease-in-out infinite}
@keyframes wave{0%,100%{transform:skewY(0deg)}50%{transform:skewY(-4deg)}}
@media (prefers-reduced-motion: reduce){.wave,.throb,.jostle,.spark,.dust,.bob,.jolt{animation:none!important;opacity:1}}
'''


def soldier(x, y, color, facing, s):
    """A soldier of the battles, as the game draws him: his feet at (x, y), facing right (1) or left (-1)."""
    return (f'<g transform="translate({x:.1f} {y:.1f}) scale({facing * s:.3f} {s:.3f})">'
            f'<path d="M-1.3 -0.4 L-1.9 2.6 M1.2 -0.4 L1.8 2.6" stroke="{INK}" stroke-width="1.1" stroke-linecap="round"/>'
            f'<path d="M-1.2 1.5 L5.2 -11.5" stroke="#65492f" stroke-width="0.7" stroke-linecap="round"/>'
            f'<path d="M5.2 -11.5 L4.4 -9.6 L6.1 -10.4 Z" fill="#8a8f96" stroke="{INK}" stroke-width="0.35"/>'
            f'<rect x="-2.3" y="-5.6" width="4.6" height="5.6" rx="1.3" fill="{color}" stroke="{INK}" stroke-width="0.7"/>'
            f'<circle cx="0" cy="-7.2" r="1.75" fill="#e8d9c0" stroke="{INK}" stroke-width="0.55"/>'
            f'<path d="M-2 -7.3 Q0 -10.3 2 -7.3 Z" fill="#8a8f96" stroke="{INK}" stroke-width="0.5"/>'
            f'<path d="M1.6 -5.4 L4.6 -5.4 L4.6 -3 Q4.6 -1.1 3.1 -0.4 Q1.6 -1.1 1.6 -3 Z" fill="{color}" stroke="{INK}" stroke-width="0.6"/>'
            f'<path d="M3.1 -5.2 L3.1 -0.8" stroke="{PAPER}" stroke-width="0.6" stroke-linecap="round"/></g>')


def wagon(color, s, facing=1):
    """A caravan as the game draws it: a mule pulls a covered wagon heavy with gold, a pennant in its lord's colour; its wheels on (0, 0)."""
    return (f'<g transform="scale({facing * s:.3f} {s:.3f})">'
            f'<path d="M9 -3 L8.6 0.6 M12.6 -3 L13 0.6" stroke="{INK}" stroke-width="0.9" stroke-linecap="round"/>'
            f'<ellipse cx="10.8" cy="-4.2" rx="3.2" ry="1.9" fill="#7a5a3c" stroke="{INK}" stroke-width="0.6"/>'
            f'<path d="M13.2 -5.2 L15.6 -7.6 L16.6 -6.4 L14.4 -3.8 Z" fill="#7a5a3c" stroke="{INK}" stroke-width="0.6" stroke-linejoin="round"/>'
            f'<path d="M5.4 -3.4 L8.2 -4.4" stroke="{INK}" stroke-width="0.6"/>'
            f'<rect x="-6" y="-5.4" width="11.6" height="3.6" rx="0.6" fill="#8a6440" stroke="{INK}" stroke-width="0.7"/>'
            f'<path d="M-5.4 -5.4 Q-0.2 -12.6 5 -5.4 Z" fill="#efe3c4" stroke="{INK}" stroke-width="0.7"/>'
            f'<circle cx="-2.6" cy="-6.8" r="1.2" fill="#e0b23a" stroke="{INK}" stroke-width="0.45"/><circle cx="0.4" cy="-7.2" r="1.3" fill="#e0b23a" stroke="{INK}" stroke-width="0.45"/>'
            f'<path d="M-0.2 -9.8 L-0.2 -15.4" stroke="{INK}" stroke-width="0.6"/>'
            f'<path d="M-0.2 -15.4 L4.6 -14.2 L-0.2 -12.6 Z" fill="{color}" stroke="{INK}" stroke-width="0.45"/>'
            + ''.join(f'<circle cx="{x}" cy="-1.6" r="1.8" fill="#8a6440" stroke="{INK}" stroke-width="0.7"/><path d="M{x - 1.6} -1.6 L{x + 1.6} -1.6 M{x} -3.2 L{x} 0" stroke="{INK}" stroke-width="0.35"/>' for x in (-3.4, 3))
            + '</g>')


# The names the HUD gives the armies and the works.

LIGHT = '#fbf4e2'
ARMY_ICONS = {'raid': 'sword', 'host': 'helmet', 'ban': 'pitchfork'}
ARMY_NAMES = {'raid': 'Chevauchée', 'host': 'Ost', 'ban': 'Arrière-ban'}
WORK_NAMES = {'village': 'Village', 'castle': 'Château', 'market': 'Marché'}


# The fluid land's HUD, as the game lays it out (src/components/proto/), every
# piece a sheet of the design system (kit.py, after src/components/hud/), set
# in a grid kept 16 pixels from the edges of a 1440 x 900 screen: top left the
# purse and the allies under it; top centre the race, and under it the opening
# and the end; top right the letters; at the bottom the bar; the cartouche
# beside the pointer. Each piece returns its drawing and its box.

from collections import namedtuple

Piece = namedtuple('Piece', 'svg x y w h')
SCREEN_W, SCREEN_H = 1440, 900
COLUMN = 320
NBSP_PERCENT = ' %'


def thousands(n):
    """A count as the game writes it: thousands set apart by a six-per-em space."""
    return f'{n:,}'.replace(',', ' ')


def percent(n):
    return f'{n}{NBSP_PERCENT}'


def purse(h, color, x=EDGE, y=EDGE, w=COLUMN):
    """Top left (Purse.tsx): the shield filling with the peasants; the peasants over what the land feeds, and the gold, each with what it brings a second."""
    sw, sh = SHIELD['l'][0] + 2, SHIELD['l'][1] + 2
    inner = sh
    height = 2 * EDGE_BOX + 2 * PAD + inner
    out = [sheet(x, y, w, height),
           shield(x + EDGE_BOX + PAD, y + EDGE_BOX + PAD, color, 'l', level=min(1, h['peasants'] / max(1, h['cap'])))]
    gx = x + EDGE_BOX + PAD + sw + PAD
    gw = w - 2 * EDGE_BOX - 2 * PAD - sw - PAD
    rows = LINE[XL] + APART + LINE[L]
    gy = y + EDGE_BOX + PAD + (inner - rows) / 2
    growth = f'+{h["growth"]}/s' if h['growth'] > 0 else ''
    income = f'+{h["income"]}/s'
    col2 = max(measure(growth, S, 'sans'), measure(income, S, 'sans'))
    cx2 = gx + gw - col2
    svg, fw = figure(gx, gy, thousands(h['peasants']), XL, 'helmet')
    out.append(svg)
    out.append(line_text(gx + fw + measure(' ', M, 'sans') + 0.12 * M, gy + BASELINE[('sans', XL)] - BASELINE[('sans', M)], f'/ {thousands(h["cap"])}', M, 'sans', opacity=0.7))
    if growth:
        out.append(figure(cx2, gy + (LINE[XL] - LINE[S]) / 2, growth, S, tone='thrive')[0])
    r2 = gy + LINE[XL] + APART
    out.append(figure(gx, r2, thousands(h['gold']), L, 'coins')[0])
    out.append(figure(cx2, r2 + (LINE[L] - LINE[S]) / 2, income, S, tone='gilt')[0])
    return Piece(''.join(out), x, y, w, height)


def lord_sheet(x, y, w, lord, line, line_h, act_=None, aside=None):
    """A lord on a sheet (Pacts.tsx): his shield, his name and a figure beside it, a line under it, and what to do. `line(x, top, width)` draws the line, `aside(x, top)` the figure, 8 after the name, centred on its line."""
    sw, sh = SHIELD['m'][0] + 2, SHIELD['m'][1] + 2
    col_h = LINE[L] + TIGHT + line_h
    inner = max(sh, col_h, ACT_H if act_ else 0)
    height = 2 * EDGE_BOX + 2 * PAD + inner
    top = y + EDGE_BOX + PAD
    out = [sheet(x, y, w, height), shield(x + EDGE_BOX + PAD, top + (inner - sh) / 2, lord['color'], 'm')]
    cx = x + EDGE_BOX + PAD + sw + PAD
    right = x + w - EDGE_BOX - PAD
    if act_:
        aw = act_width(act_[0])
        right -= aw
        out.append(act(right, top + (inner - ACT_H) / 2, act_[0], act_[1]))
        right -= PAD
    ct = top + (inner - col_h) / 2
    out.append(lord_name(cx, ct, lord['name']))
    if aside:
        out.append(aside(cx + measure(lord['name'], L, 'italic') + APART, ct + (LINE[L] - LINE[S]) / 2))
    out.append(line(cx, ct + LINE[L] + TIGHT, right - cx))
    return Piece(''.join(out), x, y, w, height)


def ally_sheet(a, x, y, w=COLUMN):
    """Under the purse: a lord bound to me, the time the alliance has left, and in its last thirty seconds the button to renew it."""
    line = lambda lx, top, width: figure(lx, top, a['left'], S, 'links', tone='dim')[0]
    return lord_sheet(x, y, w, a, line, LINE[S], ('Renouveler', 'gilt') if a['renewable'] else None)


def offer_sheet(o, x, y, w=COLUMN):
    """Top right, an emissary's letter: the lord who offers his alliance, the seconds the offer stands beside his name, his words as a note under it, and the button to accept it."""
    aside = lambda ax, top: figure(ax, top, f'{o["left"]} s', S, 'hourglass', tone='dim')[0]
    line = lambda lx, top, width: note(lx, top, 'propose une alliance')
    return lord_sheet(x, y, w, o, line, LINE[S], ('Accepter', 'gilt'), aside)


def stack(pieces, x, y, make):
    """Pieces stacked 8 apart from (x, y): returns their drawing and where the stack ends."""
    out = []
    for p in pieces:
        piece = make(p, x, y)
        out.append(piece.svg)
        y += piece.h + APART
    return ''.join(out), y - APART


RACE_LINE, RACE_END, RACE_TALL, RACE_Y = 360, 8, 28, 20


def race_x(share):
    return RACE_END + (RACE_LINE - 2 * RACE_END) * share / 100


def track(x, y, h, me_color):
    """The line of the race (Race.tsx): the shares in tens, mine in my colour, the leader's shield, the flag at the share that wins."""
    X = lambda p: x + race_x(p)
    Y = y + RACE_Y
    out = [f'<line x1="{X(0):.2f}" y1="{Y}" x2="{X(100):.2f}" y2="{Y}" stroke="{INK}" stroke-width="1"/>']
    for p in range(0, 101, 10):
        d = 3 if p % 50 else 5
        out.append(f'<line x1="{X(p):.2f}" y1="{Y - d}" x2="{X(p):.2f}" y2="{Y + d}" stroke="{INK}" stroke-width="1" stroke-opacity="0.6"/>')
    out.append(f'<path d="M{X(0):.2f} {Y} H{X(h["share"]):.2f}" stroke="{me_color}" stroke-width="4" stroke-linecap="round"/>')
    sx = X(h['needed'])
    out.append(f'<line x1="{sx:.2f}" y1="{y + 2}" x2="{sx:.2f}" y2="{Y + 6}" stroke="{INK}" stroke-width="1.5"/>'
               f'<path d="M{sx:.2f} {y + 2} L{sx + 14:.2f} {y + 6} L{sx:.2f} {y + 10} Z" fill="{GOLD}" stroke="{INK}" stroke-width="1" stroke-linejoin="round"/>')
    if h.get('rival', True):
        out.append(ecu(X(h['leader']['share']) - 6, Y - 8, 12, 15, h['leader']['color'], filt=None))
    out.append(ecu(X(h['share']) - 7, Y - 9, 14, 17, me_color, filt=None))
    return ''.join(out)


def race_sheet(h, me_color, cx=SCREEN_W / 2, y=EDGE):
    """Top centre: the clock, and the race to the share of the land that wins: my share, the leader's, the flag, and when it drops next."""
    rival = h.get('rival', True)
    you = f'Toi {percent(h["share"])}'
    leads = f'{h["leader"]["name"]} mène, {percent(h["leader"]["share"])}' if rival else ''
    right = f'pour gagner, baisse dans {h["dropIn"]}' if h['dropIn'] else f'pour gagner : {percent(round(h["needed"]))}'
    right_w = (ICON[S] + TIGHT if h['dropIn'] else 0) + measure(right, S)
    row_w = measure(you, S, 'sans') + (PAD + measure(leads, S) if leads else 0) + PAD + right_w
    col_w = max(RACE_LINE, row_w)
    clock_w = measure(h['clock'], L, 'sans')
    inner = RACE_TALL + TIGHT + LINE[S]
    w = 2 * EDGE_BOX + 2 * PAD + clock_w + PAD + 1 + PAD + col_w
    height = 2 * EDGE_BOX + 2 * PAD + inner
    x = cx - w / 2
    top = y + EDGE_BOX + PAD
    lx = x + EDGE_BOX + PAD
    out = [sheet(x, y, w, height), figure(lx, top + (inner - LINE[L]) / 2, h['clock'], L)[0]]
    rx = lx + clock_w + PAD
    out.append(upright_rule(rx, top, inner))
    col = rx + 1 + PAD
    out.append(track(col, top, h, me_color))
    row = top + RACE_TALL + TIGHT
    svg, yw = figure(col, row, you, S)
    out.append(svg)
    if leads:
        out.append(word(col + yw + PAD, row, leads, S))
    rx0 = col + col_w - right_w
    if h['dropIn']:
        out.append(icon('hourglass', rx0, row + (LINE[S] - ICON[S]) / 2, ICON[S]))
        rx0 += ICON[S] + TIGHT
    out.append(word(rx0, row, right, S))
    return Piece(''.join(out), x, y, w, height)


def opening_sheet(seconds, cx=SCREEN_W / 2, y=0, picking=True):
    """Under the race in the opening (ProtoScreen.tsx, Moment): the seconds left; choose where to start, and how."""
    title = 'Choisis où tu commences' if picking else 'Les autres seigneurs choisissent'
    hint = 'Clique une terre libre sur la carte, loin des villages'
    fig_w = measure(str(seconds), XL, 'sans')
    col_w = max(measure(title, L), measure(hint, S, 'italic') if picking else 0)
    col_h = LINE[L] + (TIGHT + LINE[S] if picking else 0)
    inner = max(LINE[XL], col_h)
    w = 2 * EDGE_BOX + 2 * GROUP + fig_w + EDGE + 1 + EDGE + col_w
    height = 2 * EDGE_BOX + 2 * EDGE + inner
    x = cx - w / 2
    top = y + EDGE_BOX + EDGE
    lx = x + EDGE_BOX + GROUP
    out = [sheet(x, y, w, height), figure(lx, top + (inner - LINE[XL]) / 2, str(seconds), XL)[0]]
    rx = lx + fig_w + EDGE
    out.append(upright_rule(rx, top, inner))
    ct = top + (inner - col_h) / 2
    out.append(word(rx + 1 + EDGE, ct, title, L))
    if picking:
        out.append(note(rx + 1 + EDGE, ct + LINE[L] + TIGHT, hint))
    return Piece(''.join(out), x, y, w, height)


def end_sheet(title, cx=SCREEN_W / 2, y=0, watch=False):
    """Under the race at the end: who won, or my fall; play again, or watch the end."""
    acts = [('Rejouer', 'gilt')] + ([('Regarder la fin', 'plain')] if watch else [])
    acts_w = sum(act_width(a) for a, _ in acts) + APART * (len(acts) - 1)
    w = 2 * EDGE_BOX + 2 * GROUP + max(measure(title, XL), acts_w)
    height = 2 * EDGE_BOX + 2 * EDGE + LINE[XL] + PAD + ACT_H
    x = cx - w / 2
    top = y + EDGE_BOX + EDGE
    out = [sheet(x, y, w, height), line_text(cx, top, title, XL, 'fell', anchor='middle')]
    ax = cx - acts_w / 2
    for a, tone in acts:
        out.append(act(ax, top + LINE[XL] + PAD, a, tone))
        ax += act_width(a) + APART
    return Piece(''.join(out), x, y, w, height)


ARMY_ORDER = ('raid', 'host', 'ban')
BAR_PIECE, BAR_PIECE_H = 128, KEY * 0 + 64 + TIGHT + LINE[M] + TIGHT + LINE[S] + APART
BAR_W = 2 * EDGE_BOX + 2 * GROUP + 6 * BAR_PIECE + PAD + 1 + PAD
BAR_H = 2 * EDGE_BOX + 2 * TIGHT + BAR_PIECE_H


def bar_piece(px, py, emblem, k, name, aside, figures, faint):
    """One piece of the bar (Bar.tsx): its emblem and key, its name, its figures, each line centred."""
    box = emblem_box('l')
    ex = px + (BAR_PIECE - box) / 2
    out = [emblem(ex, py), keycap(ex + box + PAD - KEY, py - TIGHT, k)]
    name_w = measure(name, M)
    aside_w = measure(aside, S, 'sans') if aside else 0
    row_w = name_w + (TIGHT + aside_w if aside else 0)
    ny = py + box + TIGHT
    nx = px + (BAR_PIECE - row_w) / 2
    out.append(word(nx, ny, name))
    if aside:
        base = ny + BASELINE[('fell', M)]
        out.append(figure(nx + name_w + TIGHT, base - BASELINE[('sans', S)], aside, S, tone='dim')[0])
    fy = ny + LINE[M] + TIGHT
    fw = sum(figure_width(t, S, g) for t, g, _ in figures) + APART * (len(figures) - 1)
    fx = px + (BAR_PIECE - fw) / 2
    for t, g, tone in figures:
        out.append(figure(fx, fy, t, S, g, tone)[0])
        fx += figure_width(t, S, g) + APART
    body = ''.join(out)
    return f'<g opacity="0.5">{body}</g>' if faint else body


def bar(h, color, army='host', work=None, cx=SCREEN_W / 2, bottom=SCREEN_H - EDGE):
    """At the bottom, on a sheet rolled at both ends: the three armies as wax seals, the one in hand raised in my colour, each with its share, its men and its gold; a gold rule; the three works as gilt medallions, the one in hand raised, each with its price, in gules when it cannot be paid. Keys 1 to 6. With a work in hand, the armies wait at half ink."""
    x = cx - BAR_W / 2
    y = bottom - BAR_H
    out = [sheet(x, y, BAR_W, BAR_H, rolled='sides')]
    py = y + EDGE_BOX + TIGHT
    px = x + EDGE_BOX + GROUP
    armies = {a['army']: a for a in h['armies']}
    for i, k in enumerate(ARMY_ORDER):
        a = armies[k]
        held = work is None and k == army
        out.append(bar_piece(px, py, lambda ex, ey, k=k, held=held: seal_emblem(ex, ey, ARMY_ICONS[k], color if held else PAPER, 'l', held),
                             i + 1, ARMY_NAMES[k], percent(a['share']),
                             [(thousands(a['men']), 'helmet', 'ink'), (thousands(a['gold']), 'coins', 'ink')], work is not None))
        px += BAR_PIECE
    rx = px + PAD
    out.append(upright_rule(rx, py + EDGE, BAR_PIECE_H - 2 * EDGE))
    my = py + BAR_PIECE_H / 2
    d = 5 * math.sqrt(2)
    out.append(f'<path d="M{rx + 0.5:.2f} {my - d:.2f} l{d:.2f} {d:.2f} l{-d:.2f} {d:.2f} l{-d:.2f} {-d:.2f} Z" fill="{GOLD}" stroke="{INK}" stroke-width="1"/>')
    px = rx + 1 + PAD
    for i, wk in enumerate(h['works']):
        held = work == wk['work']
        can = wk.get('can', wk['price'] <= h['gold'])
        out.append(bar_piece(px, py, lambda ex, ey, wk=wk, held=held: medallion_emblem(ex, ey, wk['work'], 'l', held),
                             i + 4, WORK_NAMES[wk['work']], None,
                             [(thousands(wk['price']), 'coins', 'ink' if can else 'gules')], not can and not held))
        px += BAR_PIECE
    return Piece(''.join(out), x, y, BAR_W, BAR_H)


HOME_MENU = (40, 24, 340, SCREEN_H - 2 * 24)
HOME_PAD_X, HOME_PAD_Y = 32, 40
CAPS_BASE_60 = 46


def home_menu(version, author, tagline, chosen=0):
    """The home's menu (src/routes/index.tsx), on a scroll of parchment rolled at both ends, 40 from the left and 24 from the top and the bottom: the gold shield, the name, the tagline, a gold rule and its lozenge; the entries, walked with the arrows, the one chosen gilt, pushed 8 aside, a gold lozenge before it; the version and the author at the foot."""
    x, y, w, h = HOME_MENU
    cx = x + EDGE_BOX + HOME_PAD_X
    cw = w - 2 * EDGE_BOX - 2 * HOME_PAD_X
    top = y + EDGE_BOX + HOME_PAD_Y
    bottom = y + h - EDGE_BOX - HOME_PAD_Y
    out = [sheet(x, y, w, h, rolled='ends'), shield(cx, top, GOLD, 'l')]
    t = top + SHIELD['l'][1] + 2 + PAD
    out.append(f'<text x="{cx:.2f}" y="{t + CAPS_BASE_60:.2f}" font-family="{CAPS}" font-size="60" fill="{INK}">Blason</text>')
    t += 60 + PAD
    lines = wrap(tagline, M, cw, 'italic')
    for i, line in enumerate(lines):
        out.append(line_text(cx, t + i * LINE[M], line, M, 'italic', opacity=0.7))
    t += LINE[M] * len(lines) + PAD + PAD
    d = 5 * math.sqrt(2)
    out.append(f'<rect x="{cx:.2f}" y="{t:.2f}" width="{cw:.2f}" height="1" fill="{GOLD}"/>'
               f'<path d="M{cx + cw / 2:.2f} {t + 0.5 - d:.2f} l{d:.2f} {d:.2f} l{-d:.2f} {d:.2f} l{-d:.2f} {-d:.2f} Z" fill="{GOLD}" stroke="{INK}" stroke-width="1"/>')
    header_end = t + 1
    entries = [('Jouer', None, XL, 0), ('Regarder une partie', None, XL, 0), ('Le jeu des fiefs', 'l’ancienne version', L, GROUP), ('Journal', None, L, 0)]
    list_h = sum(ACT_H + gap for _, _, _, gap in entries) + APART * (len(entries) - 1)
    foot = bottom - LINE[S]
    ty = header_end + 40 + (foot - header_end - 2 * 40 - list_h) / 2
    for i, (label, aside, size, gap) in enumerate(entries):
        ty += gap
        on = i == chosen
        ex = cx + (APART if on else 0)
        ink = GOLD_D if on else INK
        if on:
            q = 12 * math.sqrt(2) / 2
            out.append(f'<path d="M{ex + 6:.2f} {ty + ACT_H / 2 - q + 0.75:.2f} l{q - 0.75:.2f} {q - 0.75:.2f} l{-(q - 0.75):.2f} {q - 0.75:.2f} l{-(q - 0.75):.2f} {-(q - 0.75):.2f} Z" fill="{GOLD}" stroke="{INK}" stroke-width="1.5"/>')
        tx = ex + 12 + PAD
        lt = ty + (ACT_H - LINE[size]) / 2
        out.append(line_text(tx, lt, label, size, 'fell', fill=ink))
        if aside:
            out.append(line_text(tx + measure(label, size) + APART, lt + BASELINE[('fell', size)] - BASELINE[('fell', S)], aside, S, 'italic', opacity=0.7))
        ty += ACT_H + APART
    out.append(figure(cx, foot, version, S, tone='dim')[0])
    out.append(line_text(cx + measure(version, S, 'sans') + EDGE, foot, author, S, 'italic', opacity=0.7))
    return Piece(''.join(out), x, y, w, h)


PACTS = {'ally': ('Alliance', 'gilt'), 'accept': ('Accepter', 'gilt'), 'break': ('Rompre', 'gules'), 'asked': ('Proposée', None)}
CART_DX, CART_DY = 24, 20


def cartouche_size(h, lord=None, pact='ally', pinned=False, strikes=True):
    """The cartouche's width and height (Cursor.tsx, Pact.tsx)."""
    army = next(a for a in h['armies'] if a['army'] == 'host')
    seal_box = emblem_box('s')
    aw = max(seal_box + APART + measure(ARMY_NAMES['host'], L),
             figure_width(thousands(army['men']), L, 'helmet') + PAD + figure_width(thousands(army['gold']), L, 'coins'),
             measure('clic : attaquer', S, 'italic')) if strikes else 0
    ah = seal_box + APART + LINE[L] + APART + LINE[S] if strikes else 0
    pw = ph = 0
    if lord:
        label, tone = PACTS[pact]
        row_w = (20 + APART if not pinned else 0) + SHIELD['s'][0] + 2 + APART + measure(lord['name'], L, 'italic')
        row_h = 30 if not pinned else LINE[L]
        pw = max(row_w, act_width(label, 'links') if tone else measure(label, S, 'italic'))
        ph = row_h + APART + (ACT_H if tone else LINE[S])
    inner_w = aw + (PAD + 1 + PAD if strikes and lord else 0) + pw
    inner_h = max(ah, ph)
    return 2 * EDGE_BOX + 2 * PAD + inner_w, 2 * EDGE_BOX + 2 * PAD + inner_h, aw, pw, inner_h


def cartouche_at(x, y, w, h, entry=None):
    """Beside the pointer, on the side away from where the army would enter."""
    e = entry or {'x': x - 1, 'y': y - 1}
    right = e['x'] <= x
    below = e['y'] <= y
    return (x + CART_DX if right else x - CART_DX - w), (y + CART_DY if below else y - CART_DY - h)


def cartouche(x, y, h, color, lord=None, pact='ally', pinned=False, entry=None, strikes=True, pointer=True):
    """Beside the pointer over another's land, away from where the army would enter: a sheet whose left, at full ink, is the army in hand, what a left click sends, and whose right is the lord and the alliance to offer, accept or break, faint until a right click sets it down. Over free land the left alone; over an ally's land the right alone."""
    w, hh, aw, pw, inner = cartouche_size(h, lord, pact, pinned, strikes)
    x0, y0 = cartouche_at(x, y, w, hh, entry)
    out = [sheet(x0, y0, w, hh)]
    top = y0 + EDGE_BOX + PAD
    lx = x0 + EDGE_BOX + PAD
    if strikes:
        army = next(a for a in h['armies'] if a['army'] == 'host')
        sb = emblem_box('s')
        out.append(seal_emblem(lx, top, ARMY_ICONS['host'], color, 's'))
        out.append(word(lx + sb + APART, top + (sb - LINE[L]) / 2, ARMY_NAMES['host'], L))
        r2 = top + sb + APART
        svg, fw = figure(lx, r2, thousands(army['men']), L, 'helmet')
        out.append(svg + figure(lx + fw + PAD, r2, thousands(army['gold']), L, 'coins')[0])
        out.append(note(lx, r2 + LINE[L] + APART, 'clic : attaquer'))
        lx += aw + PAD
        if lord:
            out.append(upright_rule(lx, top, inner))
            lx += 1 + PAD
    if lord:
        label, tone = PACTS[pact]
        g = []
        row_h = 30 if not pinned else LINE[L]
        rx = lx
        if not pinned:
            g.append(right_click(rx, top))
            rx += 20 + APART
        sw, sh = SHIELD['s'][0] + 2, SHIELD['s'][1] + 2
        g.append(shield(rx, top + (row_h - sh) / 2, lord['color'], 's'))
        g.append(lord_name(rx + sw + APART, top + (row_h - LINE[L]) / 2, lord['name']))
        if tone:
            g.append(act(lx, top + row_h + APART, label, tone, 'links', w=pw, asleep=not pinned))
        else:
            g.append(note(lx, top + row_h + APART, label))
        body = ''.join(g)
        out.append(body if pinned else f'<g opacity="0.4">{body}</g>')
    if pointer:
        out.append(cursor(x, y))
    return Piece(''.join(out), x0, y0, w, hh)


def screen_hud(h, color, army='host', work=None, offers=True, allies=True, moment=None):
    """The whole HUD of a 1440 x 900 screen, as ProtoScreen.tsx lays it: returns its drawing and the boxes it covers."""
    out, boxes = [], []
    p = purse(h, color)
    out.append(p.svg)
    end = p.y + p.h
    if allies and h.get('allies'):
        svg, end = stack(h['allies'], EDGE, end + APART, lambda a, x, y: ally_sheet(a, x, y))
        out.append(svg)
    boxes.append((EDGE, EDGE, EDGE + COLUMN, end))
    r = race_sheet(h, color)
    out.append(r.svg)
    end = r.y + r.h
    if moment:
        m = moment(end + APART)
        out.append(m.svg)
        boxes.append((m.x, m.y, m.x + m.w, m.y + m.h))
    boxes.append((r.x, r.y, r.x + r.w, r.y + r.h))
    if offers and h.get('offers'):
        svg, end = stack(h['offers'], SCREEN_W - EDGE - COLUMN, EDGE, lambda o, x, y: offer_sheet(o, x, y))
        out.append(svg)
        boxes.append((SCREEN_W - EDGE - COLUMN, EDGE, SCREEN_W - EDGE, end))
    b = bar(h, color, army, work)
    out.append(b.svg)
    boxes.append((b.x - 8, b.y - 4, b.x + b.w + 8, b.y + b.h + 4))
    return ''.join(out), boxes


def aim_marks(entry, click, color):
    """What a click would do: where the army would enter, ringed in my colour, a dotted line from there to the place aimed at, ringed in ink."""
    return (f'<line x1="{entry["x"]}" y1="{entry["y"]}" x2="{click["x"]}" y2="{click["y"]}" stroke="{color}" stroke-width="2.4" stroke-dasharray="3.5 4" stroke-linecap="round"/>'
            f'<circle cx="{entry["x"]}" cy="{entry["y"]}" r="7" fill="{color}" stroke="{INK}" stroke-width="1.6"/>'
            f'<circle cx="{click["x"]}" cy="{click["y"]}" r="6" fill="none" stroke="{INK}" stroke-width="2"/>')


MELEE_UNIT = 0.2


def clash(c, k, seed=1):
    """A fight where an army bites, as src/game/layers/melee.ts draws it: two ranks face to face across the bulge, each man lunging on his own beat, in a cloud of dust struck with sparks. At the land's scale (k pixels a map unit)."""
    import random
    rng = random.Random(c['seed'] * 31 + seed)
    u = MELEE_UNIT * k
    ox, oy = c['ox'], c['oy']
    ax, ay = -oy, ox
    out = []
    width = max(c['ra'], c['rd']) * 10
    for d in range(6):
        drift = (d / 6) * 2 - 1
        x = c['x'] + (ax * drift * width * 0.6) * u
        y = c['y'] + (ay * drift * width * 0.6 - (1 - abs(drift)) * 6) * u
        out.append(f'<circle class="dust" style="animation-delay:{rng.random() * 1.5:.2f}s" cx="{x:.1f}" cy="{y:.1f}" r="{(7 + (d % 3) * 3) * u:.1f}" fill="#b59a72" fill-opacity="0.4"/>')
    men = []
    for side, (n, color) in enumerate(((c['ra'], c['ca']), (c['rd'], c['cd']))):
        sign = 1 if side == 0 else -1
        facing = 1 if ox * -sign >= 0 else -1
        for i in range(n):
            depth = 7 + (i % 2) * 7
            lateral = (i - (n - 1) / 2) * 10
            x = c['x'] + (ox * sign * depth + ax * lateral) * u
            y = c['y'] + (oy * sign * depth + ay * lateral) * u
            dx, dy = -ox * sign * 4 * u, -oy * sign * 4 * u
            men.append((y, f'<g class="jostle" style="--dx:{dx:.1f}px;--dy:{dy:.1f}px;animation-delay:{rng.random() * 0.45:.2f}s">{soldier(x, y, color, facing, 22 / 13 * u)}</g>'))
    out += [m for _, m in sorted(men)]
    for i in range(3):
        v = (rng.random() - 0.5) * width * u
        x, y = c['x'] + ax * v, c['y'] + ay * v - 9 * u
        r = 3 * u
        out.append(f'<g class="spark" style="animation-delay:{i * 0.3:.2f}s" stroke="{GOLD_L}" stroke-width="{max(0.8, 1.1 * u):.1f}" stroke-linecap="round"><line x1="{x - r:.1f}" y1="{y:.1f}" x2="{x + r:.1f}" y2="{y:.1f}"/><line x1="{x:.1f}" y1="{y - r:.1f}" x2="{x:.1f}" y2="{y + r:.1f}"/></g>')
    return ''.join(out)


def light_soldier(x, y, k):
    """The soldier of the pills and the names, light and inked: his feet at (x, y)."""
    return (f'<g transform="translate({x:.1f} {y:.1f}) scale({k:.3f})"><path d="M-1.3 -0.4 L-1.9 2.6 M1.2 -0.4 L1.8 2.6" stroke="{INK}" stroke-width="1.3" stroke-linecap="round"/><path d="M-1.2 1.5 L5.2 -11.5" stroke="{INK}" stroke-width="1.1" stroke-linecap="round"/><path d="M5.2 -11.5 L4.4 -9.6 L6.1 -10.4 Z" fill="{LIGHT}" stroke="{INK}" stroke-width="0.5"/><rect x="-2.3" y="-5.6" width="4.6" height="5.6" rx="1.3" fill="{LIGHT}" stroke="{INK}" stroke-width="0.9"/>'
            f'<circle cx="0" cy="-7.2" r="1.75" fill="{LIGHT}" stroke="{INK}" stroke-width="0.8"/><path d="M-2 -7.3 Q0 -10.3 2 -7.3 Z" fill="{INK}"/><path d="M1.6 -5.4 L4.6 -5.4 L4.6 -3 Q4.6 -1.1 3.1 -0.4 Q1.6 -1.1 1.6 -3 Z" fill="{LIGHT}" stroke="{INK}" stroke-width="0.8"/></g>')


def pill(x, y, men, color, scale=1.0):
    """An army's men in a pill of its lord's colour over where it fights: a soldier and his men."""
    s = scale
    label = num(men)
    w = (width_of(label, 14) * 1.05 + 40) * s
    x0 = x - w / 2
    return (f'<g filter="url(#lift)"><rect x="{x0:.1f}" y="{y - 13 * s:.1f}" width="{w:.1f}" height="{26 * s:.1f}" rx="{13 * s:.1f}" fill="{color}" stroke="{INK}" stroke-width="1.6"/></g>'
            + light_soldier(x0 + 15 * s - 1.9 * 18 / 14 * s, y + 4.5 * 18 / 14 * s, 18 / 14 * s)
            + text(x0 + 28 * s, y + 5 * s, label, 14 * s, weight=900, fill=LIGHT, anchor='start', halo=INK, hw=3 * s))


def attack_art(a, k, pills=True, quiet=False):
    """An army on the map: the band it took last, still wet with gold; its fights along the bulge; its pill."""
    out = []
    if a.get('band'):
        out.append(f'<path class="throb" d="{a["band"]}" fill="{GOLD_L}" fill-opacity="0.3" stroke="none"/>')
    out += [clash(c, k) for c in a['clashes']]
    if pills and a['men'] > 0:
        out.append(pill(a['pill']['x'], a['pill']['y'], a['men'], a['color'], 0.9 if quiet else 1.0))
    return ''.join(out)


def standard(heart, color, right=60):
    """Where I am, at a glance: my standard planted beside my name and peasants, its cloth stirring."""
    x, y = heart['x'] + right, heart['y'] - 6
    hgt = 40
    return (f'<g class="bob"><line x1="{x:.1f}" y1="{y:.1f}" x2="{x:.1f}" y2="{y - hgt:.1f}" stroke="{INK}" stroke-width="2" stroke-linecap="round"/><circle cx="{x:.1f}" cy="{y - hgt:.1f}" r="2.4" fill="{GOLD}" stroke="{INK}" stroke-width="1"/>'
            f'<g class="wave" style="transform-origin:{x:.1f}px {y - hgt + 2:.1f}px">' + ecu(x + 1, y - hgt + 3, 20, 25, color) + '</g></g>')


def work_mark(kind, x, y, s=1.0):
    """A work drawn as on the map, for the kit: a village of houses in its fields, a castle, a market."""
    out = []
    if kind == 'village':
        for i in range(6):
            a = i / 6 * math.tau + 0.4
            cx, cy = x + math.cos(a) * 11 * s, y + math.sin(a) * 8 * s
            out.append(f'<g transform="translate({cx:.1f} {cy:.1f}) rotate({math.degrees(a) + 90:.0f}) scale({s:.2f})" stroke="{INK}" stroke-opacity="0.45" stroke-width="0.45">' + ''.join(f'<line x1="-3.4" y1="{-1.5 + j}" x2="3.4" y2="{-1.5 + j}"/>' for j in range(4)) + '</g>')
        hs = [(-4.6, -2.6, 3.4, 2.3), (5.6, -1.2, 3.2, 2.2), (-6.2, 1, 3.8, 2.5), (-1.6, 1.4, 3.9, 2.6), (3.4, 1.9, 3.5, 2.4)]
        g = []
        for n, (hx, hy, w, h) in enumerate(sorted(hs, key=lambda q: q[1])):
            g.append(f'<rect x="{hx - w / 2}" y="{hy - h}" width="{w}" height="{h}" fill="#e6dcc4" stroke="#3a2e22" stroke-width="0.3"/><polygon points="{hx - w / 2 - 0.4},{hy - h} {hx - w / 2 + 0.8},{hy - h - h * 0.9} {hx + w / 2 - 0.8},{hy - h - h * 0.9} {hx + w / 2 + 0.4},{hy - h}" fill="{["#8e5f48", "#7d6650", "#94704f", "#73604e"][n % 4]}" stroke="#3a2e22" stroke-width="0.3"/>')
        g.append(f'<rect x="-0.4" y="-8.6" width="2.2" height="6.4" fill="#d9d1be" stroke="#3a2e22" stroke-width="0.3"/><polygon points="-0.7,-8.6 0.7,-12 2.1,-8.6" fill="#6a635e" stroke="#3a2e22" stroke-width="0.3"/>')
        out.append(f'<g transform="translate({x} {y}) scale({0.95 * s:.2f})"><ellipse cx="0" cy="1" rx="9.5" ry="2.66" fill="{INK}" fill-opacity="0.16"/>{"".join(g)}</g>')
    elif kind == 'castle':
        R = 5.6 * s
        out.append(f'<ellipse cx="{x}" cy="{y + 4.6 * s:.1f}" rx="{7.5 * s:.1f}" ry="{2 * s:.1f}" fill="{INK}" fill-opacity="0.16"/>')
        out.append(f'<ellipse cx="{x}" cy="{y}" rx="{R:.1f}" ry="{R * 0.8:.1f}" fill="none" stroke="{INK}" stroke-width="{2.4 * s:.1f}"/><ellipse cx="{x}" cy="{y}" rx="{R:.1f}" ry="{R * 0.8:.1f}" fill="none" stroke="#d8ccae" stroke-width="{1.5 * s:.1f}"/>')
        out += [f'<rect x="{x + math.cos(i / 6 * math.tau + 0.3) * R - 1.3 * s:.1f}" y="{y + math.sin(i / 6 * math.tau + 0.3) * R * 0.8 - 1.6 * s:.1f}" width="{2.6 * s:.1f}" height="{2.8 * s:.1f}" fill="#d8ccae" stroke="{INK}" stroke-width="{0.45 * s:.2f}"/>' for i in range(6)]
        out.append(f'<rect x="{x - 2 * s:.1f}" y="{y - 4.4 * s:.1f}" width="{4 * s:.1f}" height="{5 * s:.1f}" fill="#d8ccae" stroke="{INK}" stroke-width="{0.5 * s:.2f}"/><path d="M{x - 2.4 * s:.1f} {y - 4.4 * s:.1f} L{x} {y - 7 * s:.1f} L{x + 2.4 * s:.1f} {y - 4.4 * s:.1f} Z" fill="#6a635e" stroke="{INK}" stroke-width="{0.45 * s:.2f}"/>')
    else:
        def stall(sx, sy):
            return (f'<rect x="{sx - 2.4 * s:.1f}" y="{sy - 1.8 * s:.1f}" width="{4.8 * s:.1f}" height="{2.2 * s:.1f}" fill="#e6dcc4" stroke="{INK}" stroke-width="{0.35 * s:.2f}"/>'
                    f'<path d="M{sx - 3 * s:.1f} {sy - 1.8 * s:.1f} L{sx - 2 * s:.1f} {sy - 3.8 * s:.1f} H{sx + 2 * s:.1f} L{sx + 3 * s:.1f} {sy - 1.8 * s:.1f} Z" fill="{GULES}" stroke="{INK}" stroke-width="{0.35 * s:.2f}"/>')
        out.append(f'<ellipse cx="{x}" cy="{y + 4.4 * s:.1f}" rx="{7 * s:.1f}" ry="{1.8 * s:.1f}" fill="{INK}" fill-opacity="0.16"/>')
        out.append(stall(x - 3.6 * s, y - 0.6 * s) + stall(x + 3.4 * s, y - 1.4 * s))
        out += [f'<circle cx="{x + dx * s:.1f}" cy="{y + dy * s:.1f}" r="{1.2 * s:.1f}" fill="{GOLD}" stroke="{INK}" stroke-width="{0.3 * s:.2f}"/>' for dx, dy in ((-1.6, 3.2), (0.6, 3.6), (2.6, 3), (-0.4, 2.2), (1.6, 2))]
    return ''.join(out)

