"""Writes the fluid land's boards: one .dc.html per board for the canvas, and
a preview page per board that points at the local backgrounds. With no
argument, all of them."""
import json
import math
import os
import sys
from kit import *
from hud import *

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = json.load(open(f'{HERE}/assets.json')) if os.path.exists(f'{HERE}/assets.json') else {}
FONTS = 'https://fonts.googleapis.com/css2?family=Alegreya+Sans:wght@500;700;800;900&amp;family=IM+Fell+English:ital@0;1&amp;family=IM+Fell+English+SC&amp;display=swap'


def board(name, title, layers, alt='', w=1440, h=900, bg='#efe3c4'):
    """layers: list of ('img', bgname, alt) or ('svg', svg body) or ('html', raw)."""
    def body(local):
        parts = []
        for layer in layers:
            if layer[0] == 'img':
                src = f'../bg2/{layer[1]}.png' if local else ASSETS.get(layer[1], f'/_blob/{layer[1]}')
                style = layer[3] if len(layer) > 3 else 'position: absolute; inset: 0; width: 100%; height: 100%; display: block'
                parts.append(f'<img src="{src}" alt="{layer[2]}" style="{style}">')
            elif layer[0] == 'crop':
                _, name, alt_, x, y, cw, ch, ox, oy, r = layer
                src = f'../bg2/{name}.png' if local else ASSETS.get(name, f'/_blob/{name}')
                box = f'position: absolute; left: {x / w * 100:.3f}%; top: {y / h * 100:.3f}%; width: {cw / w * 100:.3f}%; height: {ch / h * 100:.3f}%; overflow: hidden; border-radius: {r / cw * 100:.2f}% / {r / ch * 100:.2f}%'
                pic = f'position: absolute; left: {-ox / cw * 100:.3f}%; top: {-oy / ch * 100:.3f}%; width: {1440 / cw * 100:.3f}%; display: block'
                parts.append(f'<div style="{box}"><img src="{src}" alt="{alt_}" style="{pic}"></div>')
            elif layer[0] == 'svg':
                parts.append(f'<svg viewBox="0 0 {w} {h}" aria-hidden="true" style="position: absolute; inset: 0; width: 100%; height: 100%">{defs()}{layer[1]}</svg>')
            else:
                parts.append(layer[1])
        return f'<div style="position: relative; width: 100%; aspect-ratio: {w} / {h}; overflow: hidden; background: {bg}">' + ''.join(parts) + '</div>'
    dc = f'''<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="{FONTS}">
<style>body{{margin:0}}{MOTION}</style>
</helmet>
{body(False)}
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{w},"height":{h}}}}}'>
class Component extends DCLogic {{
renderVals() {{
return {{}};
}}
}}
</script>
</body>
</html>
'''
    os.makedirs(f'{HERE}/out', exist_ok=True)
    open(f'{HERE}/out/{name}.dc.html', 'w').write(dc)
    open(f'{HERE}/out/{name}.html', 'w').write(f'<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="{FONTS}"><style>body{{margin:0;width:{w}px}}{MOTION}</style></head><body>{body(True)}<script>document.fonts.ready.then(()=>document.body.dataset.ready="1")</script></body></html>')


# The fluid land (cells.ts): the boards of the land taken tile by tile, the
# HUD on them as the game lays it out (hud.py, screen_hud).
C = json.load(open(f'{HERE}/cells/data.json')) if os.path.exists(f'{HERE}/cells/data.json') else {}
CF = C.get('facts', {})
MEC = CF.get('me', {}).get('color', ME_COLOR)
PAGE_BG = '#ece0c2'


def overlaps(a, b, pad=6):
    return not (a[2] + pad < b[0] or a[0] - pad > b[2] or a[3] + pad < b[1] or a[1] - pad > b[3])


def words(layer, avoid=()):
    """The lords' names and peasants at the hearts of their lands, with their badges, none under a piece of the HUD."""
    return ''.join(l['svg'] for l in layer['labels'] if not any(overlaps(l['box'], a) for a in avoid))


def my_standard(layer):
    mine = next((l for l in layer['labels'] if l['lord'] == 0), None)
    if not mine or not layer['heart']:
        return ''
    return standard(layer['heart'], MEC, right=(mine['box'][2] - mine['x']) + 18)


def caravans(layer):
    """The merchants on their roads (src/proto/trade.ts): a wagon 20 pixels high under its lord's pennant, jolting; mine at full ink, my road ahead dotted in my colour; the others' a little paler."""
    out = []
    for c in layer.get('caravans', []):
        if c['me']:
            out.append(''.join(f'<circle cx="{d["x"]}" cy="{d["y"]}" r="{c["dot"]}" fill="{MEC}" fill-opacity="0.7"/>' for d in c['dots']))
    for i, c in enumerate(layer.get('caravans', [])):
        out.append(f'<g opacity="{1 if c["me"] else 0.72}"><g class="jolt" style="animation-delay:{i * 0.13:.2f}s"><g transform="translate({c["x"]} {c["y"]})">{wagon(c["color"], 1.25, 1 if c["right"] else -1)}</g></g></g>')
    return ''.join(out)


def pact_with(h, seat):
    """What binds me to a lord, and what a right click offers (Pact.tsx, pactWith)."""
    if any(a['seat'] == seat for a in h.get('allies', [])):
        return 'break'
    if any(o['seat'] == seat for o in h.get('offers', [])):
        return 'accept'
    if seat in h.get('asked', []):
        return 'asked'
    return 'ally'


def act_centre(x, y, h, lord, pact, entry=None, strikes=True):
    """Where the button of a pinned cartouche stands: for the pointer to rest on it."""
    w, hh, aw, pw, inner = cartouche_size(h, lord, pact, True, strikes)
    x0, y0 = cartouche_at(x, y, w, hh, entry)
    px = x0 + EDGE_BOX + PAD + (aw + PAD + 1 + PAD if strikes else 0)
    return px + pw / 2, y0 + EDGE_BOX + PAD + LINE[L] + APART + ACT_H / 2


def panel(bg, x, y, w, h, ox, oy, art, alt, uid):
    """A crop of a frame, at its own scale, framed in ink and gold like a miniature; what is laid over it clipped to it."""
    ox = max(0, min(1440 - w, ox))
    oy = max(0, min(900 - h, oy))
    lay = ('crop', bg, alt, x, y, w, h, ox, oy, 4)
    frame_ = (f'<rect x="{x - 6}" y="{y - 6}" width="{w + 12}" height="{h + 12}" fill="none" stroke="{INK}" stroke-width="2"/>'
              f'<rect x="{x - 2}" y="{y - 2}" width="{w + 4}" height="{h + 4}" fill="none" stroke="{GOLD}" stroke-width="2"/>')
    for qx, qy in ((x - 6, y - 6), (x + w + 6, y - 6), (x - 6, y + h + 6), (x + w + 6, y + h + 6)):
        frame_ += f'<path d="M{qx} {qy - 7} L{qx + 7} {qy} L{qx} {qy + 7} L{qx - 7} {qy} Z" fill="{GOLD}" stroke="{INK}" stroke-width="1.2"/>'
    clip = f'<clipPath id="pan{uid}"><rect x="{x}" y="{y}" width="{w}" height="{h}"/></clipPath><g clip-path="url(#pan{uid})"><g transform="translate({x - ox} {y - oy})">{art}</g></g>'
    return lay, frame_ + clip


def caption(x, y, head, lines):
    out = text(x, y, head, 19, font=CAPS, weight=400, anchor='start')
    for j, line in enumerate(lines):
        out += text(x, y + 24 + j * 20, line, 15, font=FELL, weight=400, italic=True, anchor='start', opacity=0.88)
    return out


def heading(title, sub, x=24, y=58):
    out = text(x, y, title, 30, font=CAPS, weight=400, anchor='start')
    for j, line in enumerate(sub):
        out += text(x, y + 30 + j * 21, line, 16, font=FELL, weight=400, italic=True, anchor='start', opacity=0.88)
    return out


def calm(layer, most=5):
    """A calmer map: my armies, and a few of the others', apart from each other."""
    shown = [a for a in layer['attacks'] if a['me']]
    for a in sorted((a for a in layer['attacks'] if not a['me']), key=lambda a: (a['target'] < 0, -a['men'])):
        if len(shown) >= most:
            break
        if all(math.hypot(a['pill']['x'] - b['pill']['x'], a['pill']['y'] - b['pill']['y']) > 220 for b in shown):
            shown.append(a)
    return shown


def screen(layer, hud_svg, boxes, extra=(), art=()):
    """A screen of the game over a frame: the armies, my standard, the caravans, the names clear of the HUD, then the HUD."""
    k = layer['k']
    svg = [attack_art(a, k, quiet=not a['me']) for a in calm(layer)]
    svg += list(art)
    svg.append(caravans(layer))
    svg.append(my_standard(layer))
    svg.append(words(layer, tuple(boxes) + tuple(extra)))
    return svg


def terre_board():
    m = C['main']
    h = m['hud']
    hov = m['hover']
    hud_svg, boxes = screen_hud(h, MEC)
    lord = {'name': hov['name'], 'color': hov['color']}
    cart = cartouche(hov['x'], hov['y'], h, MEC, lord=lord, pact=pact_with(h, hov['lord']), entry=hov['entry'])
    svg = screen(m, hud_svg, boxes, extra=((cart.x, cart.y, cart.x + cart.w, cart.y + cart.h),), art=[aim_marks(hov['entry'], hov, MEC)])
    svg += [hud_svg, cart.svg]
    board('Main', 'Blason, la terre', [('img', 'f-main', f'La terre entière à {h["clock"]}, dessinée comme sur un manuscrit : chaque seigneur un lavis de sa couleur, ses frontières à l’encre ; la terre encore libre partagée en domaines, chacun sa frontière pâle autour de son village ; la terre que tient un château teintée de pierre ; ma frontière avec mon allié en vert ; la mer intérieure et ses lignes de côte.'), ('svg', ''.join(svg))])


def combat_board():
    fr = C['front']
    W, H, Y = 448, 560, 150
    xs = (24, 496, 968)
    layers, svg = [('html', '')], []
    svg.append(heading('Le front : une poche qui part d’un point',
                       ['L’armée entre par le point de la frontière le plus proche du clic, puis s’étend vers lui, trois tuiles par dixième de seconde au plus,',
                        'les plus proches du clic d’abord : la frontière avance d’un trait doux, jamais une longue ligne de combat.']))
    heads = [f'{fr[0]["seconds"]:.1f} s : elle entre en un point'.replace('.', ','),
             f'{fr[1]["seconds"]:.0f} s : la poche grandit vers le clic',
             f'{fr[2]["seconds"]:.0f} s : elle passe le clic et s’use']
    for i, f in enumerate(fr):
        a = f['attacks'][0] if f['attacks'] else None
        art = ''
        if a:
            art += attack_art(a, f['k'])
        art += f'<circle cx="{f["click"]["x"]}" cy="{f["click"]["y"]}" r="6" fill="none" stroke="{INK}" stroke-width="2" stroke-dasharray="3 2"/>'
        lay, s_ = panel(f'f-front{i + 1}', xs[i], Y, W, H, 720 - W / 2, 450 - H / 2 + 10, art, heads[i], i)
        layers.append(lay)
        svg.append(s_)
        men = a['men'] if a else 0
        tiles = a['tiles'] if a else 0
        lines = [[f'Mon Ost, {men} hommes, prend sa première tuile au plus près du clic ;', 'la mêlée se tient là où il mord, sa pastille au-dessus.'],
                 [f'{tiles} tuiles prises, {men} hommes encore ; le bord frais garde', 'un voile d’or tant que le lavis sèche.'],
                 [f'{tiles} tuiles prises : passé le clic, la poche s’arrondit ;', f'il reste {men} hommes, qui rentreront aux champs.']][i]
        svg.append(caption(xs[i], Y + H + 40, heads[i], lines))
    svg.append(text(24, 872, 'Chaque tuile coûte les hommes qui la tiennent : la part des paysans de son seigneur, trois fois plus près d’un château. Plus d’hommes vont plus loin, jamais plus vite.', 15, font=FELL, weight=400, italic=True, anchor='start', opacity=0.85))
    layers.append(('svg', ''.join(svg)))
    board('Combat', 'Blason, le front', layers, bg=PAGE_BG)


def viser_board():
    v = C['aim']
    h = v['hud']
    W, H, Y = 456, 560, 150
    xs = (24, 492, 960)
    layers, svg = [('html', '')], []
    svg.append(heading('Viser : le cartouche à côté de la souris',
                       ['Il se tient à côté du pointeur, du côté opposé à l’entrée de l’armée : il ne cache ni la terre visée ni le trait qui y mène.', 'L’anneau dit où l’armée entrera, le pointillé mène au clic.']))
    foe, free = v['foe'], v['free']
    lord = {'name': foe['name'], 'color': foe['color']}
    pact = pact_with(h, foe['lord'])
    # 1. Hovering a lord's land: the right half faint.
    c1 = cartouche(foe['x'], foe['y'], h, MEC, lord=lord, pact=pact, entry=foe['entry'])
    art1 = aim_marks(foe['entry'], foe, MEC) + c1.svg
    # 2. The right click sets the cartouche down where it was; the pointer goes to its button.
    c2 = cartouche(foe['x'], foe['y'], h, MEC, lord=lord, pact=pact, pinned=True, pointer=False, entry=foe['entry'])
    bx, by = act_centre(foe['x'], foe['y'], h, lord, pact, foe['entry'])
    art2 = c2.svg + cursor(bx + 4, by + 4)
    c3 = cartouche(free['x'], free['y'], h, MEC, entry=free['entry']) if free else None
    art3 = (aim_marks(free['entry'], free, MEC) + c3.svg) if free else ''
    spots = [(foe, c1, art1, 'Survoler la terre d’un seigneur'), (foe, c2, art2, 'Clic droit : il se pose'), (free or foe, c3 or c1, art3, 'Sur la terre libre')]
    for i, (at, c, art, head) in enumerate(spots):
        xs_ = [c.x, c.x + c.w, at['entry']['x']]
        ys_ = [c.y, c.y + c.h, at['entry']['y']]
        ox_, oy_ = (min(xs_) + max(xs_)) / 2 - W / 2, (min(ys_) + max(ys_)) / 2 - H / 2
        ox_, oy_ = max(0, min(1440 - W, ox_)), max(0, min(900 - H, oy_))
        inside_ = [l['svg'] for l in v['labels'] if l['box'][0] > ox_ + 4 and l['box'][2] < ox_ + W - 4 and l['box'][1] > oy_ + 4 and l['box'][3] < oy_ + H - 4 and not overlaps(l['box'], (c.x, c.y, c.x + c.w, c.y + c.h))]
        lay, s_ = panel('f-aim', xs[i], Y, W, H, ox_, oy_, ''.join(inside_) + art, head, 10 + i)
        layers.append(lay)
        svg.append(s_)
    label = PACTS[pact][0]
    caps = [['À gauche, à l’encre pleine, l’armée en main, ses hommes et son or :', 'ce qu’envoie le clic gauche. À droite, pâle, ce qu’ouvre le clic droit.'],
            ['Le cartouche se pose où le clic droit a été fait, tout à l’encre pleine ;', f'son bouton, « {label} », se presse. Échap ou un clic ailleurs le referme.'],
            ['Personne à qui s’allier : la gauche seule.', 'La milice d’un domaine libre tient plus fort autour de son village.']]
    for i, (_, _, _, head) in enumerate(spots):
        svg.append(caption(xs[i], Y + H + 40, head, caps[i]))
    layers.append(('svg', ''.join(svg)))
    board('Viser', 'Blason, viser', layers, bg=PAGE_BG)


def armees_board():
    ar = C['armies']
    W, H, Y = 448, 470, 128
    xs = (24, 496, 968)
    layers, svg = [('html', '')], []
    svg.append(heading('Les trois armées : la même, en trois tailles',
                       ['10, 25 ou 50 % des paysans, payés un or l’homme. Le même clic sur la même terre : plus d’hommes vont plus loin, au même pas.']))
    for i, a in enumerate(ar):
        art = (f'<path d="{a["pocket"]}" fill="{GOLD_L}" fill-opacity="0.18" stroke="{GOLD_D}" stroke-width="2" stroke-dasharray="5 3.5" fill-rule="evenodd"/>'
               f'<circle cx="{a["entry"]["x"]}" cy="{a["entry"]["y"]}" r="7" fill="{MEC}" stroke="{INK}" stroke-width="1.6"/>'
               f'<circle cx="{a["click"]["x"]}" cy="{a["click"]["y"]}" r="6" fill="none" stroke="{INK}" stroke-width="2"/>')
        lay, s_ = panel(f'f-{a["army"]}', xs[i], Y, W, H, 720 - W / 2, 450 - H / 2, art, ARMY_NAMES[a['army']], 20 + i)
        layers.append(lay)
        svg.append(s_)
        r = next(x for x in a['ready']['armies'] if x['army'] == a['army'])
        sx, sy = xs[i], Y + H + 18
        svg.append(seal_emblem(sx, sy, ARMY_ICONS[a['army']], MEC if a['army'] == 'host' else PAPER, 's'))
        tx = sx + emblem_box('s') + APART
        svg.append(word(tx, sy + 2, ARMY_NAMES[a['army']], L))
        svg.append(text(tx, sy + 44, f'{r["share"]} % des paysans : {a["men"]} hommes, {a["men"]} or ;', 15, font=FELL, weight=400, italic=True, anchor='start', opacity=0.88))
        svg.append(text(tx, sy + 64, f'{a["tiles"]} tuiles prises en {a["seconds"]:.0f} secondes', 15, font=FELL, weight=400, italic=True, anchor='start', opacity=0.88))
    svg.append(bar(ar[0]['ready'], MEC, army='host').svg)
    layers.append(('svg', ''.join(svg)))
    board('Armees', 'Blason, les trois armées', layers, bg=PAGE_BG)


def batir_fluid_board():
    b = C['build']
    h, k = b['hud'], b['k']
    g = b['ghost']
    hud_svg, boxes = screen_hud(h, MEC, work='castle')
    # A castle in hand over my land (src/proto/layers.ts): its circle in my colour, its drawing on the tile at 85 %.
    art = [f'<circle cx="{g["x"]}" cy="{g["y"]}" r="{b["castleR"]}" fill="{MEC}" fill-opacity="0.1" stroke="{MEC}" stroke-width="1.6"/>',
           f'<g opacity="0.85">{work_mark("castle", g["x"], g["y"], k)}</g>',
           cursor(g['x'] + 6, g['y'] + 4)]
    svg = screen(b, hud_svg, boxes, extra=((g['x'] - 30, g['y'] - 30, g['x'] + 40, g['y'] + 40),), art=art)
    svg.append(hud_svg)
    board('Construire', 'Blason, bâtir', [('img', 'f-build', 'Ma terre de près : mes villages dans leurs champs, mes châteaux et la terre qu’ils tiennent teintée de pierre, mes marchés ; un château en main, dessiné là où il se posera, son cercle dans ma couleur.'), ('svg', ''.join(svg))])


RULES = ['Un seul ordre pour proposer, accepter ou renouveler : le clic droit sur sa terre, ou la lettre qu’il t’envoie.',
         'Une alliance dure 5 minutes ; on la renouvelle dans ses 30 dernières secondes, si les deux le demandent. Une offre attend 20 secondes.',
         'Deux alliés ne se frappent jamais : leurs armées en marche l’un contre l’autre rentrent chez elles.',
         'Rompre marque le félon 30 secondes : sa terre tient deux fois moins bien, et tous voient son écu brisé.',
         'Chaque marché envoie une caravane toutes les 10 secondes au marché le plus proche d’un autre seigneur, par sa terre, celle de ses alliés et la terre libre.',
         'À l’arrivée, elle paie les deux marchés, d’autant plus que la route est longue, deux fois plus entre alliés ; un ennemi qui prend une tuile de sa route la pille.']


def alliances_board():
    """The alliances and the merchants: a screen at the middle of the game, then the cartouche's four faces and the rules."""
    p = C['pact']
    h = p['hud']
    offer = p['offer']
    H = 1400
    hud_svg, boxes = screen_hud(h, MEC)
    lord = {'name': offer['name'], 'color': offer['color']}
    cart = cartouche(offer['x'], offer['y'], h, MEC, lord=lord, pact=pact_with(h, offer['lord']), pinned=True, pointer=False, entry=offer['entry'])
    bx, by = act_centre(offer['x'], offer['y'], h, lord, pact_with(h, offer['lord']), offer['entry'])
    svg = screen(p, hud_svg, boxes, extra=((cart.x, cart.y, cart.x + cart.w, cart.y + cart.h),))
    svg += [hud_svg, cart.svg, cursor(bx + 4, by + 4)]
    # Under the screen: the cartouche's four faces, and the rules.
    y0 = 960
    svg.append(f'<rect x="0" y="900" width="1440" height="{H - 900}" fill="{PAGE_BG}"/>')
    svg.append(f'<line x1="0" y1="900" x2="1440" y2="900" stroke="{INK}" stroke-width="2"/>')
    svg.append(text(24, y0, 'Alliances et marchands', 30, font=CAPS, weight=400, anchor='start'))
    svg.append(text(24, y0 + 28, 'Le cartouche porte l’alliance : pâle au survol, posé par un clic droit, son bouton dit ce qui nous lie.', 16, font=FELL, weight=400, italic=True, anchor='start', opacity=0.88))
    plain, ally = p['plain'], p['ally']
    faces = []
    if plain:
        pl = {'name': plain['name'], 'color': plain['color']}
        faces.append(('Au survol', 'la droite pâle, une souris', lambda x, y: cartouche(x, y, h, MEC, lord=pl, pact='ally', entry={'x': x - 1, 'y': y - 1})))
        faces.append(('Clic droit : il se pose', '« Alliance » propose', lambda x, y: cartouche(x, y, h, MEC, lord=pl, pact='ally', pinned=True, pointer=False, entry={'x': x - 1, 'y': y - 1})))
    faces.append(('Il t’a écrit', '« Accepter » scelle l’alliance', lambda x, y: cartouche(x, y, h, MEC, lord=lord, pact='accept', pinned=True, pointer=False, entry={'x': x - 1, 'y': y - 1})))
    if ally:
        al = {'name': ally['name'], 'color': ally['color']}
        faces.append(('Sur la terre d’un allié', 'la droite seule ; « Rompre » le trahit', lambda x, y: cartouche(x, y, h, MEC, lord=al, pact='break', pinned=True, pointer=False, strikes=False)))
    fx = 64
    for head_, sub_, make in faces:
        c = make(fx - CART_DX, y0 + 70 - CART_DY)
        svg.append(c.svg)
        svg.append(text(fx, y0 + 70 + c.h + 30, head_, 18, font=CAPS, weight=400, anchor='start'))
        svg.append(text(fx, y0 + 70 + c.h + 52, sub_, 15, font=FELL, weight=400, italic=True, anchor='start', opacity=0.85))
        fx += c.w + 40
    ry = y0 + 300
    for j, r in enumerate(RULES):
        svg.append(f'<path d="M32 {ry + j * 24 - 10} l5 5 l-5 5 l-5 -5 Z" fill="{GOLD}" stroke="{INK}" stroke-width="1"/>')
        svg.append(text(46, ry + j * 24, r, 15.5, font=FELL, weight=400, italic=True, anchor='start'))
    tr = p.get('traitor')
    alt = f'Ma terre de près à {h["clock"]} : ma frontière avec {ally["name"] if ally else "mon allié"} en vert, les chaînons sur son nom ; l’écu brisé de {tr["name"] if tr else "un félon"}, qui vient de rompre avec {tr["betrayed"] if tr else "son allié"} ; les caravanes sur leurs routes, la mienne et ses points dans ma couleur.'
    style = f'position: absolute; left: 0; top: 0; width: 100%; height: {900 / H * 100:.3f}%; display: block'
    board('Alliances', 'Blason, alliances et marchands', [('img', 'f-pact', alt, style), ('svg', ''.join(svg))], h=H, bg=PAGE_BG)


def kit_fluid_board():
    """The HUD's design system: its type, its space, its material, its button, its emblems, every piece, and what it draws on the land."""
    H = 1290
    hm = C['main']['hud']
    hp = C['pact']['hud']
    svg = [f'<rect width="1440" height="{H}" fill="{PAGE_BG}"/>']
    svg.append(text(40, 56, 'Le HUD de Blason, un système', 32, font=CAPS, weight=400, anchor='start'))
    rules = ['Une seule matière, la feuille de parchemin ; un seul bouton ; quatre tailles de texte ; l’espace pris sur cinq pas.',
             'Chaque pièce se range dans une grille tenue à 16 pixels des bords ; rien ne se chevauche, rien ne se place à la main.',
             'Ce qui touche la terre s’y dessine, à son échelle ; aux bords, ce qui n’a pas de lieu.']
    for j, r in enumerate(rules):
        svg.append(f'<path d="M48 {78 + j * 24} l5 5 l-5 5 l-5 -5 Z" fill="{GOLD}" stroke="{INK}" stroke-width="1"/>')
        svg.append(text(62, 88 + j * 24, r, 15.5, font=FELL, weight=400, italic=True, anchor='start'))

    def head(x, y, t):
        return text(x, y, t, 19, font=CAPS, weight=400, anchor='start')

    def tag_(x, y, t):
        return text(x, y, t, 13, font=FELL, weight=400, italic=True, anchor='start', opacity=0.75)
    # The type: four roles, four sizes.
    y = 190
    svg.append(head(40, y, 'Le texte : quatre rôles'))
    roles = [(word(40, y + 18, 'Chevauchée, Accepter'), 'mot : IM Fell 16'),
             (lord_name(40, y + 54, 'Céleste'), 'nom : IM Fell italique 20'),
             (note(40, y + 94, 'clic : attaquer'), 'note : IM Fell italique 13, à 70 %'),
             (figure(40, y + 124, f'{thousands(1281)}', XL, 'helmet')[0], 'chiffre : Alegreya Sans 800, 13, 16, 20, 28')]
    for j, (s_, t_) in enumerate(roles):
        svg.append(s_)
        svg.append(tag_(250, y + 32 + [0, 38, 74, 112][j], t_))
    fx = 40
    for size in (S, M, L):
        s_, w_ = figure(fx, y + 166, thousands(1281), size, 'coins')
        svg.append(s_)
        fx += w_ + GROUP
    svg.append(tag_(fx, y + 180, 'mille, une espace fine de six'))
    # The space: five steps.
    x0 = 560
    svg.append(head(x0, y, 'L’espace : cinq pas'))
    uses = ['une icône et son chiffre', 'les lignes d’une pièce, les pièces d’un coin', 'dans la feuille, entre ses parties', 'depuis le bord de l’écran', 'entre les groupes']
    for j, (st, u) in enumerate(zip(STEPS, uses)):
        yy = y + 24 + j * 30
        svg.append(f'<rect x="{x0}" y="{yy}" width="{st}" height="16" fill="{GOLD}" stroke="{INK}" stroke-width="1"/>')
        svg.append(text(x0 + 34, yy + 13, str(st), 15, weight=800, anchor='start'))
        svg.append(tag_(x0 + 62, yy + 13, u))
    # The material and the button.
    x0 = 960
    svg.append(head(x0, y, 'La feuille, et le bouton'))
    svg.append(sheet(x0, y + 20, 200, 84))
    svg.append(tag_(x0 + 212, y + 38, 'bord d’encre 1,5, arrondi 6'))
    svg.append(tag_(x0 + 212, y + 58, 'filet d’or à 3 du bord'))
    svg.append(tag_(x0 + 212, y + 78, 'une ombre, 2 sous la feuille'))
    svg.append(tag_(x0 + 212, y + 98, 'dedans, 12 de chaque côté'))
    ax = x0
    for label, tone, g_ in (('Alliance', 'gilt', 'links'), ('Rompre', 'gules', 'links'), ('Regarder la fin', 'plain', None)):
        svg.append(act(ax, y + 124, label, tone, g_))
        ax += act_width(label, g_) + APART
    svg.append(tag_(x0, y + 188, 'or pour agir, gueules pour rompre, parchemin pour le reste ; 44 de haut'))
    # The emblems at their fixed sizes.
    y = 420
    svg.append(head(40, y, 'Les emblèmes, à taille fixe'))
    ex = 40
    for size in ('s', 'm', 'l'):
        w_, h_ = SHIELD[size]
        svg.append(shield(ex, y + 20 + (66 - h_ - 2), MEC, size, level=0.7 if size == 'l' else None))
        ex += w_ + 2 + PAD
    ex += PAD
    svg.append(seal_emblem(ex, y + 38, 'sword', MEC, 's'))
    ex += emblem_box('s') + PAD
    svg.append(seal_emblem(ex, y + 22, 'pitchfork', PAPER, 'l'))
    ex += emblem_box('l') + PAD
    svg.append(seal_emblem(ex, y + 22, 'helmet', MEC, 'l', held=True))
    ex += emblem_box('l') + PAD
    svg.append(medallion_emblem(ex, y + 22, 'market', 'l'))
    ex += emblem_box('l') + PAD
    svg.append(keycap(ex, y + 42, 4))
    ex += KEY + PAD
    svg.append(right_click(ex, y + 39))
    svg.append(tag_(40, y + 112, 'écus 16, 28, 52 ; sceaux et médaillons de rayon 18 et 26, levés de 3 en main ; la touche ; le clic droit'))
    # The pieces, each where the game puts it.
    y = 560
    svg.append(head(40, y, 'Les pièces'))
    pu = purse(hm, MEC, 40, y + 16)
    svg.append(pu.svg)
    ally_ = dict(hp['allies'][0]) if hp.get('allies') else {'name': 'Prune', 'color': '#5a2347', 'left': '0:24', 'renewable': True, 'seat': 18}
    al = ally_sheet(ally_, 40, pu.y + pu.h + APART)
    svg.append(al.svg)
    svg.append(tag_(40, al.y + al.h + 20, 'en haut à gauche : ma bourse, puis mes alliés'))
    of_ = hm['offers'][0] if hm.get('offers') else {'name': 'Céleste', 'color': '#6fb6db', 'left': 17, 'seat': 7}
    lt = offer_sheet(of_, 40, al.y + al.h + 36)
    svg.append(lt.svg)
    svg.append(tag_(40, lt.y + lt.h + 20, 'en haut à droite : les lettres'))
    rc = race_sheet(hm, MEC, cx=400 + 223, y=y + 16)
    svg.append(rc.svg)
    op = opening_sheet(7, cx=rc.x + rc.w / 2, y=rc.y + rc.h + APART)
    svg.append(op.svg)
    svg.append(tag_(rc.x, op.y + op.h + 20, 'en haut au centre : la course, et dessous l’ouverture puis la fin'))
    en = end_sheet('Ton royaume est tombé', cx=rc.x + rc.w / 2, y=op.y + op.h + 36, watch=True)
    svg.append(en.svg)
    lord = {'name': C['facts']['hoverLord']['name'], 'color': C['facts']['hoverLord']['color']}
    c1 = cartouche(924, y + 16 - CART_DY, hm, MEC, lord=lord, pact='ally', entry={'x': 0, 'y': 0}, pointer=True)
    svg.append(c1.svg)
    c2 = cartouche(924, c1.y + c1.h + APART - CART_DY + 28, hm, MEC, lord=lord, pact='accept', pinned=True, pointer=False, entry={'x': 0, 'y': 0})
    svg.append(c2.svg)
    svg.append(tag_(c1.x, c2.y + c2.h + 20, 'à côté de la souris : le cartouche, pâle puis posé'))
    b = bar(hm, MEC, cx=720, bottom=1050)
    svg.append(b.svg)
    svg.append(tag_(b.x, b.y + b.h + 22, 'en bas : la barre, trois armées (1 à 3), une règle d’or, trois constructions (4 à 6)'))
    # On the land.
    y = 1118
    svg.append(head(40, y, 'Sur la terre'))
    cy = y + 62

    def wash(x, yy, r, color, op=0.5):
        return f'<circle cx="{x}" cy="{yy}" r="{r}" fill="{color}" fill-opacity="{op}" stroke="{INK}" stroke-width="1.2" stroke-dasharray="1.2 3.4" stroke-linecap="round"/>'
    cells = []
    x = 90
    fake = {'x': x, 'y': cy + 6, 'ox': -0.2, 'oy': 0.98, 'ca': MEC, 'cd': '#8dbf4a', 'ra': 5, 'rd': 3, 'seed': 3}
    cells.append(('une armée qui mord', wash(x, cy, 46, '#8dbf4a') + f'<clipPath id="kv1"><circle cx="{x}" cy="{cy}" r="45"/></clipPath><path clip-path="url(#kv1)" d="M{x - 46} {cy + 16} Q{x} {cy - 20} {x + 46} {cy + 16} L{x + 46} {cy + 46} L{x - 46} {cy + 46} Z" fill="{MEC}" fill-opacity="0.55"/>' + clash(fake, 4.6) + pill(x, cy - 34, 195, MEC, 0.85)))
    x = 260
    cells.append(('viser : l’entrée, le trait', wash(x, cy, 46, '#8dbf4a') + f'<clipPath id="kv2"><circle cx="{x}" cy="{cy}" r="45"/></clipPath><rect clip-path="url(#kv2)" x="{x - 46}" y="{cy + 16}" width="92" height="30" fill="{MEC}" fill-opacity="0.55"/>' + aim_marks({'x': x - 16, 'y': cy + 16}, {'x': x + 12, 'y': cy - 20}, MEC)))
    x = 430
    cells.append(('village', wash(x, cy, 46, MEC, 0.55) + work_mark('village', x, cy + 4, 2.6)))
    x = 600
    cells.append(('château, sa terre en pierre', wash(x, cy, 46, MEC, 0.55) + f'<circle cx="{x}" cy="{cy}" r="38" fill="#b7ad97" fill-opacity="0.22"/>' + work_mark('castle', x, cy + 4, 2.6)))
    x = 770
    cells.append(('marché', wash(x, cy, 46, MEC, 0.55) + work_mark('market', x, cy + 4, 2.8)))
    x = 940
    cells.append(('un allié : vert, chaînons', f'<clipPath id="kv6"><circle cx="{x}" cy="{cy}" r="46"/></clipPath><g clip-path="url(#kv6)"><rect x="{x - 46}" y="{cy - 46}" width="46" height="92" fill="{MEC}" fill-opacity="0.55"/><rect x="{x}" y="{cy - 46}" width="46" height="92" fill="#5a2347" fill-opacity="0.45"/></g><circle cx="{x}" cy="{cy}" r="46" fill="none" stroke="{INK}" stroke-width="1.2" stroke-dasharray="1.2 3.4"/><path d="M{x} {cy - 46} Q{x + 4} {cy - 20} {x - 2} {cy} T{x} {cy + 46}" fill="none" stroke="#2f7d3f" stroke-opacity="0.9" stroke-width="3" stroke-linecap="round"/>' + kit_badge(x + 22, cy - 18, 'links')))
    x = 1110
    cells.append(('un félon : l’écu brisé', wash(x, cy, 46, '#d9a41e') + kit_badge(x, cy, 'felon')))
    x = 1280
    road = [(x - 40, cy + 14), (x - 14, cy + 4), (x + 12, cy - 4), (x + 38, cy - 14)]
    cells.append(('ma caravane, sa route', wash(x, cy, 46, '#dccb9e', 0.42) + ''.join(f'<circle cx="{px_}" cy="{py_}" r="2.4" fill="{MEC}" fill-opacity="0.7"/>' for px_, py_ in road[1:]) + f'<g transform="translate({x - 30} {cy + 12})">{wagon(MEC, 2.2, 1)}</g>'))
    for head_, art in cells:
        svg.append(art)
    for j, (head_, art) in enumerate(cells):
        cxs = [90, 260, 430, 600, 770, 940, 1110, 1280][j]
        svg.append(text(cxs, cy + 70, head_, 14, font=FELL, weight=400, italic=True, opacity=0.85))
    board('Kit', 'Blason, le kit du HUD', [('svg', ''.join(svg))], h=H, bg=PAGE_BG)


def home_board():
    """L'accueil (src/routes/index.tsx): behind, a game the twenty bots play, the spectator's camera on its fiercest fight, centred right of the menu; on the left, the menu on its scroll, the first entry chosen."""
    hm = C['home']
    version = 'v' + json.load(open(f'{HERE}/../../package.json'))['version']
    menu = home_menu(version, 'Cédric Lucchese', 'Un jeu de stratégie médiéval : vingt seigneurs, une terre redessinée à chaque partie.')
    box = (menu.x - 4, menu.y - 8, menu.x + menu.w + 4, menu.y + menu.h + 8)
    svg = [attack_art(a, hm['k'], quiet=True) for a in calm(hm)]
    svg.append(caravans(hm))
    svg.append(words(hm, (box,)))
    svg.append(menu.svg)
    fight = hm['fight']
    board('Accueil', 'Blason, l’accueil', [('img', 'f-home', f'Une partie que jouent les vingt bots, vue par la caméra du spectateur : elle cadre le combat le plus âpre, l’Ost de {fight[0]} sur la terre de {fight[1]}, au milieu de l’écran à droite du menu.'), ('svg', ''.join(svg))])


def kit_badge(x, y, which):
    """A badge by a lord's name, as on the map: a white disc, the links or the broken shield."""
    k = 20 / 35
    parts = ''.join(f'<path d="{d}" fill="{"none" if o else "#f1e8d2"}" stroke="{INK}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>' for d, o in GLYPHS[which])
    return f'<g transform="translate({x} {y}) scale({k:.4f})"><circle r="17.3" fill="#ffffff" stroke="{INK}" stroke-width="1.9"/><g transform="translate(-12 -12)">{parts}</g></g>'


if __name__ == '__main__':
    which = sys.argv[1:] or ['terre', 'combat', 'viser', 'armees', 'batir_fluid', 'kit_fluid', 'alliances', 'home']
    for w in which:
        globals()[f'{w}_board']()
    print('ok', which)
