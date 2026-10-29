import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { Act } from '../../src/components/hud/Act'
import {
  CoupEmblem,
  KeyCap,
  MedallionEmblem,
  RightClick,
  SealEmblem,
  Shield,
  StandingBadge,
} from '../../src/components/hud/Emblem'
import { Figure } from '../../src/components/hud/Figure'
import { Rule, Sheet } from '../../src/components/hud/Sheet'
import { Defs } from '../../src/components/game/svg/kit'
import { dictionaries } from '../../src/i18n'
import type { CSSProperties, ReactNode } from 'react'

// The interface's pieces for the maquette's board of the HUD's system
// (boards.mjs, « Le système d'interface »), drawn by the game's own
// components with their own classes, so that the board shows them as the
// game draws them: the four sizes of type in their four roles, the colours
// as the game's CSS holds them, the emblems, the button in its tones, the
// sheet. capture.mjs imports it in a page of the game served by Vite and
// keeps its markup (captures/pieces.html); the board lays it out with the
// bar and the lords' list taken from a capture. Its own layout is written in
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

const SIZES = [
  ['s', 15],
  ['m', 18],
  ['l', 22],
  ['xl', 28],
] as const

/** The four sizes, each in the four roles. */
function Type() {
  const cell: CSSProperties = { whiteSpace: 'nowrap' }
  return (
    <Part title="Les écritures">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '40px repeat(4, auto)',
          alignItems: 'baseline',
          columnGap: 20,
          rowGap: 8,
        }}
      >
        <span />
        <span className="hud-note">le mot</span>
        <span className="hud-note">le nom</span>
        <span className="hud-note">la note</span>
        <span className="hud-note">le chiffre</span>
        {SIZES.map(([size, px]) => (
          <Sizes key={size} size={size} px={px} cell={cell} />
        ))}
      </div>
      <p className="hud-note" style={{ margin: 0 }}>
        Telles que dessinées ; sur un grand écran, le texte, l’espace et les
        dessins grandissent ensemble d’un cinquième.
      </p>
    </Part>
  )
}

function Sizes({
  size,
  px,
  cell,
}: Readonly<{ size: string; px: number; cell: CSSProperties }>) {
  const text = `text-hud-${size}`
  return (
    <>
      <span className="hud-figure text-hud-s" style={{ opacity: 0.6 }}>
        {px}
      </span>
      <span className={`hud-word ${text}`} style={cell}>
        Ost
      </span>
      <span className={`hud-name ${text}`} style={cell}>
        Azur
      </span>
      <span className={`hud-note ${text}`} style={cell}>
        un clic
      </span>
      <span className={`hud-figure ${text}`} style={cell}>
        1 250
      </span>
    </>
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
  ['troublemaker', 'torch'],
  ['archers', 'bow'],
  ['fire', 'firepot'],
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
            <MedallionEmblem icon={work} />
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
          <RightClick />
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
        <Act onClick={nothing}>{t.home.public.join}</Act>
        <Act tone="pact" onClick={nothing}>
          {t.pacts.accept}
        </Act>
        <Act tone="gules" onClick={nothing}>
          {t.pacts.break}
        </Act>
        <Act tone="plain" onClick={nothing}>
          {t.camera.home}
        </Act>
        <span className="opacity-50">
          <Act asleep onClick={nothing}>
            {t.game.works.castle}
          </Act>
        </span>
      </div>
    </Part>
  )
}

function Sheets() {
  return (
    <Part title="Le feuillet">
      <div style={{ ...row, gap: 28, alignItems: 'flex-start' }}>
        <Sheet>
          <div style={{ ...column, gap: 4, padding: '12px 16px' }}>
            <span className="hud-word text-hud-l">{t.game.planted}</span>
            <span className="hud-note">Le feuillet, sa règle d’or</span>
          </div>
        </Sheet>
        <div style={{ padding: '0 8px' }}>
          <Sheet rolled="sides">
            <div style={{ ...row, gap: 12, padding: '8px 20px' }}>
              <Figure icon="coins" size="l" tone="gilt">
                1 250
              </Figure>
              <Rule />
              <Figure icon="soldier" size="l">
                3 400
              </Figure>
            </div>
          </Sheet>
        </div>
      </div>
    </Part>
  )
}

/** The whole board's pieces, laid out: the bar and the lords' list are given their places, filled from a capture. */
function Pieces() {
  return (
    <div
      className="hud"
      style={{
        display: 'grid',
        gridTemplateColumns: '560px 1fr 360px',
        gap: '36px 56px',
        alignItems: 'start',
      }}
    >
      <Defs />
      <div style={{ ...column, gap: 36 }}>
        <Type />
        <Colours />
      </div>
      <div style={{ ...column, gap: 36 }}>
        <Emblems />
        <Buttons />
        <Sheets />
      </div>
      <Part title="La liste des seigneurs" slot="lords" />
      <div style={{ gridColumn: '1 / -1' }}>
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
