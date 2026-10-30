import type { ReactNode } from 'react'

// A setting's controls, of the HUD's matter (« les fleches sont toutes
// petites et je suis sur on peut faire + moderne »): its choices side by side
// on one plate, the one chosen in gold, a click on another takes it; or a
// count between two wide buttons, less and more. Each part tall enough for
// a finger; read only, the value alone.

// norm-ok: a plate of the game's own matter, as Act's (Act.tsx).
const PLATE =
  'pointer-events-auto flex w-full overflow-hidden rounded-md border-[1.5px] border-quill shadow-lift'
const PART =
  'min-h-11 flex-1 cursor-pointer whitespace-nowrap px-2 font-words text-hud-m hud-press border-l border-quill/40 first:border-l-0'

/** The choices side by side, the one chosen in gold. */
export function Choices<T extends string | number>({
  name,
  options,
  value,
  onPick,
}: Readonly<{
  name: string
  options: ReadonlyArray<{ value: T; label: ReactNode }>
  value: T
  /** None for whoever may only read it. */
  onPick?: (value: T) => void
}>) {
  return (
    <div role="radiogroup" aria-label={name} className={PLATE}>
      {options.map((o) => {
        const chosen = o.value === value
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={chosen}
            disabled={!onPick}
            onClick={() => onPick?.(o.value)}
            className={`${PART} ${chosen ? 'bg-gilt text-quill' : 'bg-vellum text-quill/75 hover:bg-shade hover:text-quill'} disabled:cursor-default`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/** A count between less and more, kept within its bounds; its figure written in at once, its most said beside it (« il faut cliquer sur 15 pour ecrire directement avec le max affiché »). */
export function Stepper({
  name,
  value,
  least,
  most,
  onCount,
  less,
  more,
  of,
}: Readonly<{
  name: string
  value: number
  least: number
  most: number
  /** None for whoever may only read it. */
  onCount?: (value: number) => void
  less: string
  more: string
  /** The most, as said beside the figure. */
  of: string
}>) {
  const count = (n: number) =>
    onCount?.(Math.max(least, Math.min(most, Math.round(n))))
  const step = (by: number, label: string, sign: string) => (
    <button
      type="button"
      aria-label={`${name} : ${label}`}
      title={label}
      disabled={!onCount || value + by < least || value + by > most}
      onClick={() => count(value + by)}
      className={`${PART} max-w-16 bg-vellum text-hud-l text-quill hover:bg-shade disabled:cursor-default disabled:opacity-35`}
    >
      {sign}
    </button>
  )
  return (
    <div role="group" aria-label={name} className={PLATE}>
      {step(-1, less, '−')}
      <label className="flex flex-1 items-center justify-center gap-2 border-l border-quill/40 bg-vellum">
        <input
          type="number"
          min={least}
          max={most}
          value={value}
          readOnly={!onCount}
          aria-label={name}
          onChange={(e) => {
            const n = Number(e.target.value)
            if (e.target.value !== '' && Number.isFinite(n)) count(n)
          }}
          onFocus={(e) => e.target.select()}
          className="hud-figure w-14 bg-transparent text-right text-hud-l text-quill [appearance:textfield] focus-visible:outline-2 focus-visible:outline-gilt-deep [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="hud-note text-hud-s text-lead-deep">{of}</span>
      </label>
      {step(1, more, '+')}
    </div>
  )
}
