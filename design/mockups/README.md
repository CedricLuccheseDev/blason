# The mockups of Blason

The design canvas (claude.ai artifact `AbsDy161KxhbinWVxLNfv9`, a Design
canvas) is built from here. **Rule:** everything is decided on a board
first, and the game reproduces the board exactly, with the same pieces and
the same measures; a change made in the game goes back onto the board.

The canvas has two pages: **La terre fluide** (the land of fine tiles taken
as in OpenFront, the model of `proto/`), built from here, and **Archives, les
fiefs** (the boards of the fief model, now removed from the game). The
archived boards stay on the canvas as they were published and are no longer
rebuilt; their sources (`page.ts` and their builders in `boards.py`, `hud.py`
and `kit.py`) live at the git tag `fiefs-final`.

- `cells.ts` plays a game of the prototype (`proto/`, twenty bots, seed
  `cells-10`, seat 0 Azur stands for the player), stages a few moments (at
  1:48, while free domains still cover a fifth of the land: my Ost on a
  neighbour, my market sending its caravan, a neighbour offering his
  alliance, a traitor breaking with his ally; later, the three armies on the
  same click, a castle in hand) and writes the map's frames (`cells/*.svg`,
  drawn as `src/render/regions.ts` draws the land: free domains and their pale
  borders, the land a castle holds in stone, the green border with an ally)
  and what the boards lay over them (`cells/data.json`): the fights, the
  pills, the names and their badges, the caravans, the HUD as the game's own
  summary reads it (`src/render/summary.ts`). The home's frame is drawn for
  no one, as its spectator sees the game, and framed as `src/render/director.ts`
  frames the fiercest fight, right of the menu.
- `render.html` shows one frame on the parchment page (`?d=cells&f=<frame>`);
  a screenshot of it at 1440×900 is a board's background (`bg2/f-*.png`).
- `kit.py` (the inks and faces, the glyphs, seals, medallions, coins,
  shields; at its end the HUD's design system,
  mirrored once from `src/components/hud/tokens.ts`: four sizes of type and
  their baselines, five steps of space, the sheet, the button, the key cap,
  the emblems, each glyph's advance in `metrics.json` as Chrome measures it)
  and `hud.py` (what the map shows over its frame: the fights, the pills, the
  aim, the standard, the works; and the HUD's pieces, built on that system and
  laid out as
  `src/components/game/` lays them on a 1440×900 screen: the purse, the
  allies, the race, the opening and the end, the letters, the bar, the
  cartouche) draw everything laid over the map.
- `boards.py` writes each board (`out/<Board>.dc.html`), its background
  taken from `assets.json` (the artifact's uploaded images).
- `canvas.json` places the boards on the canvas, page by page.

## Rebuild the boards

```sh
# 1. frames and data (from the repo root)
npx tsx design/mockups/cells.ts design/mockups/cells cells-10
# 2. serve the folder, screenshot render.html?d=cells&f=<frame> at 1440×900 into bg2/f-<frame>.png
#    (main, pact, home, front1 to 3, aim, raid, host, ban, build)
python3 -m http.server 5288 --bind 127.0.0.1 --directory design/mockups
# 3. upload changed bg2/f-*.png as assets of the artifact, note their urls in assets.json
# 4. boards
cd design/mockups && python3 boards.py   # or some of: terre combat viser armees batir_fluid kit_fluid alliances home
# 5. publish out/*.dc.html with canvas.json to the artifact
```
