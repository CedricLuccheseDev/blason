import { Figure, Icon } from '../hud/Figure'
import { Hint } from '../hud/Hint'
import { Inline, Panel, Stack } from '../hud/Layout'
import { Rule } from '../hud/Sheet'
import { Call, Note } from '../hud/Text'
import { ICON } from '../hud/tokens'
import { useCompact } from '../hud/useCompact'
import { useFit } from '../hud/useFit'
import { hex, minutes } from './format'
import { Ecu } from './svg/kit'
import { INK } from './svg/marks'
import type { Summary } from '~/render/client'
import { useMessages } from '~/i18n'

/** The race's line: its length, and the margin left at each end for a shield. */
const [LINE, END, TALL, Y] = [360, 8, 28, 20]
const X = (share: number) => END + ((LINE - 2 * END) * share) / 100

/** The line of the race: the shares in tens, mine filled in my colour, the shields, the flag at the share that wins. */
function Track({ summary }: Readonly<{ summary: Summary }>) {
  const { me, leader, needed } = summary
  const rival = leader && leader.key !== me?.key ? leader : null
  const sx = X(needed)
  return (
    <svg
      viewBox={`0 0 ${LINE} ${TALL}`}
      aria-hidden="true"
      className="h-7 w-full max-w-[360px]"
    >
      <line x1={X(0)} y1={Y} x2={X(100)} y2={Y} stroke={INK} strokeWidth="1" />
      {Array.from({ length: 11 }, (_, i) => i * 10).map((p) => (
        <line
          key={p}
          x1={X(p)}
          y1={Y - (p % 50 ? 3 : 5)}
          x2={X(p)}
          y2={Y + (p % 50 ? 3 : 5)}
          stroke={INK}
          strokeWidth="1"
          strokeOpacity="0.6"
        />
      ))}
      {me && (
        <path
          d={`M${X(0)} ${Y} H${X(me.share)}`}
          stroke={hex(me.color)}
          strokeWidth="4"
          strokeLinecap="round"
        />
      )}
      <line x1={sx} y1={2} x2={sx} y2={Y + 6} stroke={INK} strokeWidth="1.5" />
      <path
        d={`M${sx} 2 L${sx + 14} 6 L${sx} 10 Z`}
        fill="var(--color-gilt)"
        stroke={INK}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {rival && (
        <Ecu
          x={X(rival.share) - 6}
          y={Y - 8}
          w={12}
          h={15}
          color={hex(rival.color)}
        />
      )}
      {me && (
        <Ecu
          x={X(me.share) - 7}
          y={Y - 9}
          w={14}
          h={17}
          color={hex(me.color)}
        />
      )}
    </svg>
  )
}

/**
 * Top centre, on one thin line: the clock, the race to the share of the land
 * that wins (my share in my colour, the leader's shield, the flag at the
 * share to reach), and the share to reach or when it drops next, in words,
 * or its figure alone when the line lacks room (the words then under the
 * pointer). Who leads is read in the lords' list.
 */
export function Race({ summary }: Readonly<{ summary: Summary }>) {
  const m = useMessages()
  const { room, piece, step } = useFit(1)
  const compact = useCompact()
  // In the opening, the race not begun, its place says the count and what
  // to do (« la popup qui explique qu'il faut poser son étendard, mets ça
  // sur le header qui indique la victoire »).
  if (summary.opening !== null)
    return <Opening summary={summary} touch={compact} />
  const { needed, dropIn } = summary
  const words =
    dropIn === null ? m.race.toWin(needed) : m.race.dropsIn(minutes(dropIn))
  const figure = dropIn === null ? m.game.percent(needed) : minutes(dropIn)
  return (
    <div ref={room} className="flex w-full min-w-0 justify-center">
      <div ref={piece} className="w-max">
        <Hint
          title={m.hints.race.title}
          lines={[m.hints.race.line(needed), m.hints.race.drops]}
          under
        >
          <Panel gap="hair" className="w-80 items-center max-sm:w-auto">
            <div className="w-full max-sm:w-56">
              <Track summary={summary} />
            </div>
            <Inline gap="part">
              <Figure size="l">{minutes(summary.seconds)}</Figure>
              <span title={step ? words : undefined}>
                <Inline gap="hair">
                  {dropIn !== null && <Icon name="hourglass" size={ICON.s} />}
                  {step ? (
                    <Figure size="s">{figure}</Figure>
                  ) : (
                    <Note className="whitespace-nowrap">{words}</Note>
                  )}
                </Inline>
              </span>
            </Inline>
          </Panel>
        </Hint>
      </div>
    </div>
  )
}

/** The opening in the race's place: its count, and what the player does, before and after planting; a spectator watches them planted. On a phone, how a lord's menu opens without a right button. */
function Opening({
  summary,
  touch,
}: Readonly<{ summary: Summary; touch: boolean }>) {
  const m = useMessages()
  const { me, opening } = summary
  let [title, hint] = [m.game.others, '']
  if (me && !me.picked) [title, hint] = [m.game.choose, m.game.chooseHint]
  else if (me) [title, hint] = [m.game.planted, m.game.plantedHint]
  return (
    <div className="flex w-full min-w-0 justify-center">
      <Panel className="max-w-xl">
        <Inline gap="piece">
          <Figure size="xl">{opening}</Figure>
          <Rule />
          <Stack gap="hair">
            <Call>{title}</Call>
            {hint && <Note>{hint}</Note>}
            {touch && <Note>{m.menu.hintTouch}</Note>}
          </Stack>
        </Inline>
      </Panel>
    </div>
  )
}
