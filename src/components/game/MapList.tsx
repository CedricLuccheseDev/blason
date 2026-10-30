import { ATLAS_MAPS, MAP_SIZES, lordsFor, sizeOf } from '../../../engine'
import { GAP, Stack, Tag } from '../hud/Layout'
import { Fine, Name, Word } from '../hud/Text'
import type { Atlas, Book, Land, MapSize } from '../../../engine'
import { LandPlate } from '~/components/home/LandPlate'
import { useMessages } from '~/i18n'

// The lands of the book as cards, as OpenFront shows its maps (« je voudrais
// ici une liste de map affiché plutot qu'un selecteur, comme openfront »), in
// sections (« Fais des sections pour les maps »): the random lands, small,
// middling and great (« fais plutot une section pour les map random … un
// Aléatoire petit moyen et grand »), a click on the one chosen drawing
// another; the maps of the Earth; the lands of legend. Each its drawing, its
// size and the lords it suits, marked when it suits this game; the one chosen
// ringed in gold. The smallest first.

/** The random lands' sizes. */
const RANDOM: ReadonlyArray<MapSize> = ['small', 'standard', 'large']
/** The lands of legend, drawn by our own hand; the rest of the atlas is the Earth. */
const LEGENDS: ReadonlyArray<Atlas> = ['middle', 'westeros']

const bySize = (a: Land, b: Land) => MAP_SIZES[sizeOf(a)] - MAP_SIZES[sizeOf(b)]
const real = (maps: ReadonlyArray<Atlas>) =>
  maps.map((map): Land => ({ kind: 'real', map })).sort(bySize)

/** A land's name in the list. */
const keyOf = (land: Land) => (land.kind === 'real' ? land.map : land.size)

export function MapList({
  book,
  onPick,
  onAnother,
}: Readonly<{
  book: Book
  /** The land clicked; none for a guest, who reads the host's. */
  onPick?: (land: Land) => void
  /** Another random land at the chosen size. */
  onAnother?: () => void
}>) {
  const m = useMessages().book
  const sections: Array<[string, Array<Land>]> = [
    [m.randomLands, RANDOM.map((size): Land => ({ kind: 'drawn', size }))],
    [m.earthLands, real(ATLAS_MAPS.filter((a) => !LEGENDS.includes(a)))],
    [m.legendLands, real(LEGENDS)],
  ]
  return (
    <Stack gap="piece">
      {sections.map(([title, lands]) => (
        <section key={title}>
          <Stack gap="part">
            <h3 className="border-b border-gilt/50">
              <Word>{title}</Word>
            </h3>
            <div
              role="radiogroup"
              aria-label={title}
              className={`grid grid-cols-2 ${GAP.part}`}
            >
              {lands.map((land) => (
                <Card
                  key={keyOf(land)}
                  book={book}
                  land={land}
                  onPick={onPick}
                  onAnother={onAnother}
                />
              ))}
            </div>
          </Stack>
        </section>
      ))}
    </Stack>
  )
}

/** A land's card: its drawing, its name, its size and the lords it suits. */
function Card({
  book,
  land,
  onPick,
  onAnother,
}: Readonly<{
  book: Book
  land: Land
  onPick?: (land: Land) => void
  onAnother?: () => void
}>) {
  const m = useMessages().book
  const key = keyOf(land)
  const chosen = key === keyOf(book.land)
  const [least, most] = lordsFor(land)
  const lords = book.bots + (book.guests ?? 0) + 1
  const suits = lords >= least && lords <= most
  // The random land chosen, clicked again, is drawn anew.
  const again = chosen && land.kind === 'drawn' && onAnother
  const name = land.kind === 'drawn' ? m.random[land.size] : m.lands[land.map]
  return (
    <button
      type="button"
      role="radio"
      aria-checked={chosen}
      disabled={!onPick}
      onClick={() => (again ? onAnother() : onPick?.(land))}
      className={`hud-press text-left outline-offset-2 ${chosen ? 'outline-2 outline-gilt' : 'opacity-75 hover:opacity-100'} ${onPick ? 'cursor-pointer' : ''}`}
    >
      <Stack gap="hair">
        <LandPlate seed={book.seed} land={land} label={name} whole>
          {suits && (
            <span className="absolute top-1 right-1">
              <Tag>
                <Fine className="text-pact">{m.suited}</Fine>
              </Tag>
            </span>
          )}
          {again && (
            <span className="absolute bottom-1 left-1">
              <Tag>
                <Fine>{m.reroll}</Fine>
              </Tag>
            </span>
          )}
        </LandPlate>
        <Name>{name}</Name>
        <Fine>{m.cardLine(m.sizes[sizeOf(land)], least, most)}</Fine>
      </Stack>
    </button>
  )
}
