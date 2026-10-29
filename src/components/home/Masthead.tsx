import { Flourish } from './Ornaments'
import { Shield } from '~/components/hud/Emblem'
import { useMessages } from '~/i18n'

// The head of the home's column, the name of the game and its line; and at
// its foot, quiet, the player: his shield and "Lord" for now, until profiles
// come.

export function Title() {
  const t = useMessages().home
  return (
    <header className="flex flex-col gap-1 text-center">
      {/* norm-ok: wordmark, not copy */}
      <h1 className="font-caps text-6xl leading-none text-quill max-sm:text-5xl short:text-5xl">
        Blason
      </h1>
      <p className="hud-note text-hud-m">{t.tagline}</p>
      <Flourish />
    </header>
  )
}

export function Lord() {
  const t = useMessages().home
  return (
    <div className="flex min-h-11 items-center gap-2">
      <Shield color="var(--color-gilt)" size="m" />
      <span className="hud-name">{t.lord}</span>
    </div>
  )
}
