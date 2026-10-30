import { ATLAS_MAPS, MAP_SIZES, lordsFor, sizeOf } from '../../../engine'
import { GAP, Stack, Tag } from '../hud/Layout'
import { Fine, Name } from '../hud/Text'
import type { Book, Land } from '../../../engine'
import { LandPlate } from '~/components/home/LandPlate'
import { useMessages } from '~/i18n'

// The lands of the book as a list of cards, as OpenFront shows its maps (« je
// voudrais ici une liste de map affiché plutot qu'un selecteur, comme
// openfront »): each its drawing, its name, its size and the lords it suits,
// marked when it suits this game; the one chosen ringed in gold, a click on
// another chooses it. The smallest first.

/** The lands the book offers, the smallest first: the invented lands, small, middling and great (« Fais 3 map inventé petite moyenne grosse »), and the atlas's maps of the Earth. */
const LANDS: ReadonlyArray<Land> = [
  ...(['small', 'standard', 'large'] as const).map((size): Land => ({
    kind: 'drawn',
    size,
  })),
  ...ATLAS_MAPS.map((map): Land => ({ kind: 'real', map })),
].sort((a, b) => MAP_SIZES[sizeOf(a)] - MAP_SIZES[sizeOf(b)])

/** A land's name in the list. */
const keyOf = (land: Land) => (land.kind === 'real' ? land.map : land.size)

export function MapList({
  book,
  onPick,
}: Readonly<{
  book: Book
  /** The land clicked; none for a guest, who reads the host's. */
  onPick?: (land: Land) => void
}>) {
  const m = useMessages().book
  const lords = book.bots + (book.guests ?? 0) + 1
  return (
    <div
      role="radiogroup"
      aria-label={m.land}
      className={`grid grid-cols-2 ${GAP.part}`}
    >
      {LANDS.map((land) => {
        const key = keyOf(land)
        const chosen = key === keyOf(book.land)
        const [least, most] = lordsFor(land)
        const suits = lords >= least && lords <= most
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={chosen}
            disabled={!onPick}
            onClick={() => onPick?.(land)}
            className={`hud-press text-left outline-offset-2 ${chosen ? 'outline-2 outline-gilt' : 'opacity-75 hover:opacity-100'} ${onPick ? 'cursor-pointer' : ''}`}
          >
            <Stack gap="hair">
              <LandPlate
                seed={book.seed}
                land={land}
                label={m.lands[key]}
                whole
              >
                {suits && (
                  <span className="absolute top-1 right-1">
                    <Tag>
                      <Fine className="text-pact">{m.suited}</Fine>
                    </Tag>
                  </span>
                )}
              </LandPlate>
              <Name>{m.lands[key]}</Name>
              <Fine>{m.landLine(m.sizes[sizeOf(land)], least, most)}</Fine>
            </Stack>
          </button>
        )
      })}
    </div>
  )
}
