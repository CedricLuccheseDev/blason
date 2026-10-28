// One setting of a game, its few values side by side as plates, the one
// chosen in gold: a group of radio buttons, walked with the arrows.

export type Option<T extends string> = { value: T; word: string; line: string }

// norm-ok: the plates of the HUD's button (Act.tsx), the game's own material.
const PLATE =
  'hud-press flex min-h-11 cursor-pointer flex-col justify-center gap-1 rounded-md border-[1.5px] border-quill bg-vellum px-3 py-2 hover:bg-shade has-checked:bg-gilt has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-gilt-deep'

export function Choice<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: Readonly<{
  legend: string
  name: string
  options: ReadonlyArray<Option<T>>
  value: T
  onChange: (value: T) => void
}>) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="hud-note mb-2">{legend}</legend>
      <div className="grid grid-cols-3 gap-2">
        {options.map((o) => (
          <label key={o.value} className={PLATE}>
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={o.value === value}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            <span className="hud-word">{o.word}</span>
            <span className="hud-note leading-tight">{o.line}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
