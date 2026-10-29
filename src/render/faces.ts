// The faces the map writes with, waited for before a game is made: its
// names, figures and pills are cut from them once, so a face not yet loaded
// would be cut from its stand-in for the whole game.

/** The faces the map writes with: its names, figures and pills are cut from them once, so they must be there first. */
const FACES = [
  "900 64px 'Alegreya Sans'",
  "700 64px 'Alegreya Sans'",
  "64px 'Vollkorn SC'",
  "64px 'Vollkorn'",
]
/** How long to wait for them at most, in ms: past it, the game starts with what it has. */
const FACES_WAIT = 4000

/** The map's faces loaded, or the wait over: wait for it before mounting a game. */
export async function faces() {
  const wait = new Promise((done) => setTimeout(done, FACES_WAIT))
  const loads = Promise.all(FACES.map((face) => document.fonts.load(face)))
  await Promise.race([loads.catch(() => undefined), wait])
}
