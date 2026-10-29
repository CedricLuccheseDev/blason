import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { Act, Tap } from '../../src/components/hud/Act'
import {
  CoupEmblem,
  KeyCap,
  WorkEmblem,
  SealEmblem,
  Shield,
  StandingBadge,
} from '../../src/components/hud/Emblem'
import { Figure } from '../../src/components/hud/Figure'
import {
  Caption,
  GAP,
  Inline,
  Line,
  Panel,
  Ruled,
  Stack,
  Tag,
} from '../../src/components/hud/Layout'
import {
  Call,
  Fine,
  Heading,
  Name,
  Note,
  Title,
  Word,
} from '../../src/components/hud/Text'
import { Defs } from '../../src/components/game/svg/kit'
import { dictionaries } from '../../src/i18n'
import type { CSSProperties, ReactNode } from 'react'

// The interface's pieces for the maquette's board of the HUD's system
// (boards.mjs, « Le système d'interface »), drawn by the game's own
// components with their own classes, so that the board shows them as the
// game draws them: the words by their level (Text.tsx), the spaces by what
// they part and the sheets they are laid in (Layout.tsx), the colours as the
// game's CSS holds them, the emblems, the button in its tones. capture.mjs imports it in a page of the game served by Vite and
// keeps its markup (captures/pieces.html); the board lays it out with the
// bar taken from a capture. Its own layout is written in
// styles, as the game's CSS is made from the game's sources alone.

const t = dictionaries.fr

const column: CSSProperties = { display: 'flex', flexDirection: 'column' }
const row: CSSProperties = { display: 'flex', alignItems: 'center' }

function Part({
  title,
  children,
  slot,
}: Readonly<{ title: string; children?: ReactNode; slot?: string }>) {
  return (
    <section data-slot={slot} style={{ ...column, gap: 12 }}>
      <h2 className="font-caps text-hud-l leading-none text-quill">{title}</h2>
      {children}
    </section>
  )
}

/** A piece and its name under it. */
function Named({
  name,
  children,
}: Readonly<{ name: string; children: ReactNode }>) {
  return (
    <figure style={{ ...column, alignItems: 'center', gap: 4, margin: 0 }}>
      {children}
      <figcaption className="hud-note">{name}</figcaption>
    </figure>
  )
}

/** The words' levels, each its component, what it is for and its size as drawn. */
const LEVELS = [
  [Title, 'Title', 'le titre d’une page', 28, t.book.yours],
  [Heading, 'Heading', 'le titre d’une pièce', 22, t.book.lords],
  [Call, 'Call', 'le seul message d’une pièce', 22, t.book.launch],
  [Word, 'Word', 'un mot, un bouton', 18, t.book.another],
  [Name, 'Name', 'le nom d’un seigneur', 18, 'Azur'],
  [Note, 'Note', 'une aide, une ligne sous une pièce', 15, t.book.next],
  [Fine, 'Fine', 'une ligne d’une liste serrée', 15, 'Sinople'],
] as const

/** The words by their level, and the figures by their size. */
function Words() {
  return (
    <Part title="Les mots, par leur niveau">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '84px auto 32px',
          justifyContent: 'start',
          alignItems: 'baseline',
          columnGap: 20,
          rowGap: 10,
        }}
      >
        {LEVELS.map(([Level, name, use, px, sample]) => (
          <span key={name} className="contents">
            <span className="hud-figure text-hud-s" style={{ opacity: 0.6 }}>
              {name}
            </span>
            <span style={{ ...column, gap: 2 }}>
              <Level>{sample}</Level>
              <Note>{use}</Note>
            </span>
            <span className="hud-figure text-hud-s" style={{ opacity: 0.6 }}>
              {px}
            </span>
          </span>
        ))}
      </div>
      <div style={{ ...row, gap: 20 }}>
        <Figure icon="coins" size="l" tone="gilt">
          1 250
        </Figure>
        <Figure icon="soldier" size="m">
          340
        </Figure>
        <Figure size="s">25 %</Figure>
        <span className="hud-note">les chiffres, 22, 18 et 15</span>
      </div>
      <p className="hud-note" style={{ margin: 0 }}>
        Telles que dessinées ; sur un grand écran, tout grandit d’un cinquième.
      </p>
    </Part>
  )
}

/** The spaces by what they part, each named, never a number. */
const SPACES = [
  ['hair', 'une icône et son chiffre'],
  ['line', 'les lignes d’une pièce'],
  ['part', 'les parties d’une pièce'],
  ['piece', 'les pièces d’un coin'],
  ['group', 'les groupes'],
] as const

function Spaces() {
  return (
    <Part title="Les espaces, par ce qu’ils séparent">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '52px 28px 36px auto',
          alignItems: 'center',
          columnGap: 14,
          rowGap: 8,
        }}
      >
        {SPACES.map(([name, use]) => {
          const px = 4 * Number(GAP[name].replace('gap-', ''))
          return (
            <span key={name} className="contents">
              <span className="hud-figure text-hud-s" style={{ opacity: 0.6 }}>
                {name}
              </span>
              <span
                aria-hidden="true"
                className="bg-gilt"
                style={{ width: px, height: 14 }}
              />
              <span className="hud-figure text-hud-s">{px}</span>
              <span className="hud-note">{use}</span>
            </span>
          )
        })}
      </div>
    </Part>
  )
}

/** The game's colours, by their names in the CSS, with what each says. */
const COLOURS = [
  ['vellum', 'Vélin', 'les feuillets'],
  ['quill', 'Encre', 'les mots, les traits'],
  ['gilt', 'Or', 'ce qui agit'],
  ['gilt-deep', 'Or profond', 'sous le pointeur'],
  ['gules', 'Gueules', 'la guerre, le manque'],
  ['pact', 'Sinople', 'l’alliance'],
  ['shade', 'Ombre', 'le pli, le rouleau'],
  ['wax', 'Cire', 'les mots sur gueules'],
  ['accent', 'Accent', 'le site autour'],
] as const

function Colours() {
  const value = (name: string) =>
    getComputedStyle(document.documentElement)
      .getPropertyValue(`--color-${name}`)
      .trim()
  return (
    <Part title="Les couleurs">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, auto)',
          gap: '14px 24px',
        }}
      >
        {COLOURS.map(([name, word, use]) => (
          <div key={name} style={{ ...row, gap: 10 }}>
            <span
              aria-hidden="true"
              className="rounded-md border-[1.5px] border-quill"
              style={{
                width: 40,
                height: 40,
                flex: 'none',
                background: `var(--color-${name})`,
              }}
            />
            <span style={column}>
              <span className="hud-word">{word}</span>
              <span className="hud-note">{use}</span>
              <span className="hud-figure text-hud-s" style={{ opacity: 0.7 }}>
                {value(name)}
              </span>
            </span>
          </div>
        ))}
      </div>
    </Part>
  )
}

const ARMIES = [
  ['raid', 'sword'],
  ['host', 'soldier'],
  ['ban', 'pitchfork'],
] as const
const WORKS = ['village', 'market', 'castle'] as const
const COUPS = [
  ['archers', 'bow'],
  ['troublemaker', 'torch'],
  ['trebuchet', 'trebuchet'],
] as const
/** Azur, the first lord's colour: an army in hand is raised in it. */
const AZURE = '#2f6db5'
const SHIELDS = ['#2f6db5', '#c0392b', '#3e8e41', '#d9a41e', '#7b3f8c']

function Emblems() {
  const line: CSSProperties = { ...row, gap: 16, alignItems: 'flex-start' }
  return (
    <Part title="Les emblèmes">
      <div style={line}>
        {ARMIES.map(([army, icon], i) => (
          <Named key={army} name={t.game.armies[army]}>
            <SealEmblem
              icon={icon}
              color={i === 1 ? AZURE : 'var(--color-vellum)'}
              held={i === 1}
            />
          </Named>
        ))}
        {WORKS.map((work) => (
          <Named key={work} name={t.game.works[work]}>
            <WorkEmblem icon={work} />
          </Named>
        ))}
        {COUPS.map(([coup, icon]) => (
          <Named key={coup} name={t.game.coups[coup]}>
            <CoupEmblem icon={icon} />
          </Named>
        ))}
      </div>
      <div style={{ ...row, gap: 28, marginTop: 8 }}>
        <div style={{ ...row, gap: 10, alignItems: 'flex-end' }}>
          <Shield color={SHIELDS[0]} size="l" />
          {SHIELDS.slice(1).map((colour) => (
            <Shield key={colour} color={colour} size="m" />
          ))}
          <Shield color={SHIELDS[0]} size="m" level={0.4} />
          <Shield color={SHIELDS[0]} size="s" />
        </div>
        <div style={{ ...column, gap: 8 }}>
          <span style={{ ...row, gap: 8 }}>
            <StandingBadge standing="ally" size="m" />
            <span className="hud-word">{t.lord.allied}</span>
          </span>
          <span style={{ ...row, gap: 8 }}>
            <StandingBadge standing="foe" size="m" />
            <span className="hud-word">{t.lord.atWar}</span>
          </span>
          <span style={{ ...row, gap: 8 }}>
            <StandingBadge standing="felon" size="m" />
            <span className="hud-word">{t.lord.felon}</span>
          </span>
        </div>
        <div style={{ ...column, gap: 10 }}>
          <span style={{ ...row, gap: 6 }}>
            <KeyCap k="1" />
            <KeyCap k="2" />
            <KeyCap k="3" />
          </span>
        </div>
      </div>
    </Part>
  )
}

function Buttons() {
  const nothing = () => {}
  return (
    <Part title="Le bouton">
      <div style={{ ...row, gap: 12, flexWrap: 'wrap' }}>
        <Act call onClick={nothing}>
          {t.book.launch}
        </Act>
        <Act onClick={nothing}>{t.home.create}</Act>
        <Act tone="pact" onClick={nothing}>
          {t.menu.alliance.accept}
        </Act>
        <Act tone="gules" onClick={nothing}>
          {t.menu.alliance.break}
        </Act>
        <Act tone="plain" onClick={nothing}>
          {t.book.close}
        </Act>
        <span className="opacity-50">
          <Act asleep onClick={nothing}>
            {t.game.works.castle}
          </Act>
        </span>
        <Tap onClick={nothing}>{t.book.more}</Tap>
      </div>
      <p className="hud-note" style={{ margin: 0 }}>
        Act, et call pour celui qu’un feuillet attend ; Tap, le léger.
      </p>
    </Part>
  )
}

/** The sheets and the bricks they are laid with: a panel, its head, its lines, its foot; a tag on the map. */
function Sheets() {
  const nothing = () => {}
  return (
    <Part title="Les feuillets">
      <div style={{ ...row, gap: 28, alignItems: 'flex-start' }}>
        <Panel gap="part" className="w-80">
          <Caption>
            <Shield size="s" color={AZURE} />
            <Heading>{t.book.lords}</Heading>
          </Caption>
          <Stack gap="hair">
            <Line name={<Note>{t.book.level}</Note>}>
              <Word>{t.book.levels.normal}</Word>
            </Line>
            <Line name={<Note>{t.book.opening}</Note>}>
              <Word>{t.book.seconds(10)}</Word>
            </Line>
          </Stack>
          <Ruled>
            <Act onClick={nothing}>{t.book.see}</Act>
          </Ruled>
        </Panel>
        <Stack gap="piece" align="start">
          <Tag>
            <Figure icon="coins" size="s" tone="gilt">
              +50
            </Figure>
          </Tag>
          <Inline gap="hair">
            <Note>Panel, Caption, Line, Ruled ; Tag sur la carte</Note>
          </Inline>
        </Stack>
      </div>
    </Part>
  )
}

/** The whole board's pieces, laid out in three columns on the board's 1792 by 784, the bar under them, filled from a capture. */
function Pieces() {
  return (
    <div
      className="hud"
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto auto 1fr',
        gap: '32px 56px',
        alignItems: 'start',
      }}
    >
      <Defs />
      <div style={{ ...column, gap: 28, gridRow: 'span 2' }}>
        <Words />
        <Spaces />
      </div>
      <div style={{ ...column, gap: 28 }}>
        <Sheets />
        <Buttons />
      </div>
      <div style={{ ...column, gap: 28 }}>
        <Emblems />
        <Colours />
      </div>
      <div style={{ gridColumn: '2 / -1' }}>
        <Part title="La barre" slot="bar" />
      </div>
    </div>
  )
}

/** The pieces' markup, as the game's components render it here. */
export function piecesMarkup(): string {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  flushSync(() => root.render(<Pieces />))
  const markup = host.innerHTML
  root.unmount()
  host.remove()
  return markup
}
