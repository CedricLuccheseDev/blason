import { Flourish } from './Ornaments'
import { Shield } from '~/components/hud/Emblem'
import { useMessages } from '~/i18n'

// The head of the home, the name of the game (its line will come with the
// titles and the wording); and at its foot, quiet, the player: his shield
// and "Lord" for now, until profiles come.

export function Title() {
  return (
    <header className="flex flex-col gap-1 text-center">
      {/* norm-ok: wordmark, not copy */}
      <h1 className="font-mark text-6xl leading-none text-quill max-sm:text-5xl short:text-5xl">
        Blason
      </h1>
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
