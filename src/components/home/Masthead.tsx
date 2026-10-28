import { Flourish } from './Ornaments'
import { Shield } from '~/components/hud/Emblem'
import { Sheet } from '~/components/hud/Sheet'
import { useMessages } from '~/i18n'

// The head of the home's column: the name of the game and its line; and the
// player, as OpenFront puts his name above everything: his shield and
// "Lord" for now, until profiles come.

export function Title() {
  const t = useMessages().home
  return (
    <header className="flex flex-col gap-1 text-center">
      {/* norm-ok: wordmark, not copy */}
      <h1 className="font-caps text-6xl leading-none text-quill max-sm:text-5xl">
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
    <Sheet className="flex items-center gap-3 px-4 py-2">
      <Shield color="var(--color-gilt)" size="m" />
      <span className="flex flex-col">
        <span className="hud-name">{t.lord}</span>
        <span className="hud-note">{t.lordLater}</span>
      </span>
    </Sheet>
  )
}
