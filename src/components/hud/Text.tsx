import type { ReactNode } from 'react'

// The HUD's words, by their level, each its one size and its one hand
// (« il faut une règle très précise de hiérarchie dans le design system,
// chaque taille de texte doit être la même en fonction de sa hiérarchie, dans
// le jeu aussi »). No piece sets a size of its own: it says what its words
// are. The figures have theirs in Figure.tsx, on the same steps.

type Words = Readonly<{
  /** Tone, alignment, truncation: anything but a size or a space. */
  className?: string
  children: ReactNode
}>

/** A title, a page's or a piece's: small capitals, 28. */
export function Title({ className = '', children }: Words) {
  return (
    <span
      className={`font-caps text-hud-xl leading-tight text-quill ${className}`}
    >
      {children}
    </span>
  )
}

/** A piece's heading, a card's or a group's name: small capitals, 22. */
export function Heading({ className = '', children }: Words) {
  return (
    <span
      className={`font-caps text-hud-l leading-tight text-quill ${className}`}
    >
      {children}
    </span>
  )
}

/** A word of the HUD, what a piece says or a button is called: 18. */
export function Word({ className = '', children }: Words) {
  return <span className={`hud-word ${className}`}>{children}</span>
}

/** A lord's name, written as names are: italic, 18. */
export function Name({ className = '', children }: Words) {
  return <span className={`hud-word italic ${className}`}>{children}</span>
}

/** A hint, a line under a piece: italic, 15, at full ink. */
export function Note({ className = '', children }: Words) {
  return <span className={`hud-note ${className}`}>{children}</span>
}

/** A word of a dense list, a lord's line among twenty: 15, upright. */
export function Fine({ className = '', children }: Words) {
  return <span className={`hud-word text-hud-s ${className}`}>{children}</span>
}

/** A big word, one piece's whole message (a button that launches, the opening's order): 22. */
export function Call({ className = '', children }: Words) {
  return <span className={`hud-word text-hud-l ${className}`}>{children}</span>
}
