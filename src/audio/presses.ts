import type { Cue } from './cues'

// The interface heard: a light click on each piece pressed, a dull knock on
// one that cannot be had now (aria-disabled), a sheet unfolded when a drawer
// opens (aria-expanded), wherever the player presses, in the game and on the
// home page alike. Read from the page itself, so
// that no piece of the HUD has to say it.

/** What a press is: what the player clicks, the map aside. */
const PRESSED = 'button, a, [role="button"]'

/** Listens to the presses on the page, each played as its cue; the call returned stops it. */
export function listenPresses(play: (cue: Cue) => void): () => void {
  function press(e: PointerEvent) {
    if (!(e.target instanceof Element)) return
    const pressed = e.target.closest(PRESSED)
    if (!pressed) return
    const short = pressed.getAttribute('aria-disabled') === 'true'
    play(short ? 'refused' : 'press')
  }
  // A drawer opened by the pointer passing as well as by a press.
  const unfolds = new MutationObserver((changes) => {
    for (const { target } of changes)
      if (
        target instanceof Element &&
        target.getAttribute('aria-expanded') === 'true'
      )
        play('unfold')
  })
  unfolds.observe(document.body, {
    subtree: true,
    attributeFilter: ['aria-expanded'],
  })
  window.addEventListener('pointerdown', press)
  return () => {
    unfolds.disconnect()
    window.removeEventListener('pointerdown', press)
  }
}
