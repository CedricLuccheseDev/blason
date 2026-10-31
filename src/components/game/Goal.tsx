import { Figure } from '../hud/Figure'
import { GAP } from '../hud/Layout'
import { Note } from '../hud/Text'
import { minutes } from './format'
import type { Summary } from '~/render/client'
import { useMessages } from '~/i18n'

// The race in the lords' list (« tu met la victoire dans la popup seigneur
// avec la bar vertical sur toute la rangé des seigneurs pour indiqué a quel
// pourcentage il faut être pour gagner. Chaque seigneur a sa bar callé sur
// 100% »): under the list's head, what wins and when it drops; down every
// line, a gold rule at the share that wins, its flag over it, each lord's
// band as long as his share of the whole land, so that how far each is
// from winning reads at a glance.

/** Under the list's head: the share of the land that wins, and the time before it drops, if it will. */
export function GoalHead({ summary }: Readonly<{ summary: Summary }>) {
  const m = useMessages()
  const { needed, dropIn } = summary
  return (
    <span className={`flex items-center justify-between ${GAP.line}`}>
      <Note>{m.race.goal(needed)}</Note>
      {dropIn !== null && (
        <span title={m.race.dropsIn(minutes(dropIn))}>
          <Figure icon="hourglass" size="s">
            {minutes(dropIn)}
          </Figure>
        </span>
      )}
    </span>
  )
}

/** The gold rule down the lines at the share that wins, its flag over it; the lines' own left rule of 3 px kept out of the measure. */
export function GoalRule({ needed }: Readonly<{ needed: number }>) {
  const at = `calc(3px + (100% - 3px) * ${needed / 100})`
  return (
    <span
      aria-hidden="true"
      // norm-ok: the rule stands a little over the first line, where its flag flies.
      className="pointer-events-none absolute -top-2 bottom-0 z-10 border-l-2 border-gilt transition-[left] duration-(--duration-hud-enter) ease-hud motion-reduce:transition-none"
      style={{ left: at }}
    >
      <svg
        viewBox="0 0 11 8"
        className="absolute top-0 left-0 h-[calc(8px*var(--hud))] w-[calc(11px*var(--hud))]"
      >
        <path d="M0 0 L11 4 L0 8 Z" fill="var(--color-gilt)" />
      </svg>
    </span>
  )
}
