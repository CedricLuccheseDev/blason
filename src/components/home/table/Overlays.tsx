import type { Mode, Pick } from '~/table'
import { useMessages } from '~/i18n'

// The words laid on the table's things (src/table/overlays.ts lays each
// piece named by `data-ov` on its thing, every frame): the cards' faces,
// the seal's ribbon, the buttons over the round things and the board, the
// die's word, the player's card. Each button is the thing for the keyboard;
// the pointer reaches the thing itself, through them.

export type Touch = {
  act: (p: Pick) => void
  focus: (p: Pick | null) => void
}

/** A button over a thing, for the keyboard: Tab reaches it, Enter acts. */
function Hit({
  pick,
  label,
  touch,
  round = false,
  expanded,
}: Readonly<{
  pick: Pick
  label: string
  touch: Touch
  round?: boolean
  expanded?: boolean
}>) {
  return (
    <button
      type="button"
      className={round ? 'hit round' : 'hit'}
      aria-label={label}
      aria-expanded={expanded}
      onClick={() => touch.act(pick)}
      onFocus={() => touch.focus(pick)}
      onBlur={() => touch.focus(null)}
    />
  )
}

export function CardFace({
  mode,
  i,
  open,
  touch,
}: Readonly<{ mode: Mode; i: number; open: boolean; touch: Touch }>) {
  const t = useMessages().table
  const words = t.modes[mode]
  return (
    <div className="ovi" data-ov={`front-${i}`}>
      <div className="cf">
        <div className="nm">{words.name}</div>
        <div className="ln">{words.line}</div>
        <div className="ft">{words.foot}</div>
        <Hit
          pick={{ kind: 'card', i }}
          label={t.turn(words.name)}
          touch={touch}
          expanded={open}
        />
      </div>
    </div>
  )
}

/** The ribbon under the seal: Play, and what it plays; the seal's button. */
export function Ribbon({
  word,
  what,
  touch,
}: Readonly<{ word: string; what: string; touch: Touch }>) {
  const t = useMessages().table
  return (
    <>
      <div className="ovi" data-ov="play">
        <div className="rb">
          <span className="w">{word}</span>
          <span className="m">{what}</span>
        </div>
      </div>
      <div className="ovi" data-ov="seal">
        <Hit
          pick={{ kind: 'seal' }}
          label={t.playLabel(what)}
          touch={touch}
          round
        />
      </div>
    </>
  )
}

export function DieAndBoard({ touch }: Readonly<{ touch: Touch }>) {
  const t = useMessages().table
  return (
    <>
      <div className="ovi" data-ov="die">
        <Hit pick={{ kind: 'die' }} label={t.die} touch={touch} round />
      </div>
      <div className="ovi" data-ov="die-word">
        <span className="lbl" aria-hidden="true">
          {t.dieWord}
        </span>
      </div>
      <div className="ovi" data-ov="board">
        <div className="relative h-[328px] w-[500px]">
          <Hit pick={{ kind: 'board' }} label={t.watch} touch={touch} />
        </div>
      </div>
    </>
  )
}

/** The player's card: his shield (painted), and no more than is known of him. */
export function Profile() {
  const t = useMessages().table
  return (
    <div className="ovi" data-ov="tag">
      <div className="tg">
        <div className="who">
          <span className="nm">{t.profile}</span>
          <span className="lt">{t.profileLater}</span>
        </div>
      </div>
    </div>
  )
}
