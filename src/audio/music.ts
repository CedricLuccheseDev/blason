import { chance } from './chance'

// The music (Concept, « La musique »): pieces of the period by Kevin
// MacLeod (incompetech.com, CC BY 4.0, public/sounds/CREDITS.md), one after
// the other with a silence between, under the effects, streamed rather than
// held whole. The first is the one chosen; then the others, in an order
// drawn for each game, never the same twice running. Paused while the page
// is hidden; at the end of the game it fades out for the fanfare or the
// knell. A piece more is an entry here and its file.

export const PIECES: ReadonlyArray<string> = [
  'thatched-villagers',
  'minstrel-guild',
  'village-consort',
  'folk-round',
  'master-of-the-feast',
  'teller-of-the-tales',
  'achaidh-cheide',
  'pippin-the-hunchback',
]

/** Seconds before the first piece, and the silence between two, from the least to the most. */
const FIRST = 4
const SILENCE = [30, 75] as const
/** How long the music fades out at the end, in seconds (a time constant). */
const FADE = 0.8

/** The pieces after the first, in an order drawn anew. */
function drawn(): Array<string> {
  const rest = PIECES.slice(1)
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(chance() * (i + 1))
    ;[rest[i], rest[j]] = [rest[j], rest[i]]
  }
  return rest
}

/** The music playing into `out`, its first piece a moment after it is made. */
export function makeMusic(ctx: AudioContext, out: AudioNode) {
  const audio = new Audio()
  audio.preload = 'auto'
  const fade = ctx.createGain()
  ctx.createMediaElementSource(audio).connect(fade).connect(out)
  let queue = [PIECES[0], ...drawn()]
  let wait: ReturnType<typeof setTimeout> | undefined
  let over = false

  function next() {
    if (over) return
    const piece = queue.shift() ?? PIECES[0]
    if (queue.length === 0) queue = drawn().filter((p) => p !== piece)
    audio.src = `/sounds/${piece}.ogg`
    if (!document.hidden) void audio.play().catch(() => undefined)
  }

  function after(seconds: number) {
    clearTimeout(wait)
    wait = setTimeout(next, seconds * 1000)
  }

  audio.addEventListener('ended', () => {
    const [least, most] = SILENCE
    after(least + chance() * (most - least))
  })
  after(FIRST)

  return {
    /** The page hidden: the piece waits. */
    pause: () => audio.pause(),
    /** The page shown again: the piece goes on, unless it had ended. */
    resume() {
      if (audio.src && !audio.ended && !over)
        void audio.play().catch(() => undefined)
    },
    /** The end of the game: the music fades out, for good. */
    end() {
      over = true
      clearTimeout(wait)
      fade.gain.setTargetAtTime(0, ctx.currentTime, FADE)
    },
    stop() {
      over = true
      clearTimeout(wait)
      audio.pause()
      audio.removeAttribute('src')
    },
  }
}
