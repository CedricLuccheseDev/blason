import { BRITAIN } from './atlas/britain'
import { EUROPE } from './atlas/europe'
import { FRANCE } from './atlas/france'
import { MEDITERRANEAN } from './atlas/mediterranean'
import { WORLD } from './atlas/world'
import type { Sheet, Strait } from './landmarks'
import type { MapSize } from '../rules'

// The maps of the Earth (atlas.ts reads them): each its sheet, baked from
// the world's heights (atlas/, scripts/atlas.ts), its own size and the lords
// it suits, its high ranges and the straits kept open. A map more is an
// entry here and its baked file.

export type Atlas = 'britain' | 'france' | 'mediterranean' | 'europe' | 'world'

type Entry = {
  sheet: Sheet
  /** The straits kept open, narrower than the cells: the shores either side never touch (« l'irlande est connecté a l'angleterre pareille pour le danemark et la suede », « l'espagne et le maroc aussi », « la corse la sardaigne l'italie »). */
  straits: ReadonlyArray<Strait>
  /** Its own size, the invented lands' measure (MAP_SIZES): no other of it. */
  size: MapSize
  /** The lords it suits, from the fewest to the most. */
  lords: readonly [number, number]
  /** Its high ranges, each a line along its crest, in degrees, longitude then latitude (« sur la map europe y'a pas les pyrénées »): the high mountains stand along them, where the land is high enough. */
  ranges: ReadonlyArray<ReadonlyArray<number>>
}

/** The ranges and straits several maps share, in degrees (ATLAS). */
const PYRENEES = [-1.8, 43.1, 0, 42.8, 1.5, 42.6, 2.9, 42.45]
const ALPS = [
  5.6, 44.1, 6.9, 44.6, 7, 45.8, 8, 46.3, 9.5, 46.5, 11, 46.9, 12.5, 47, 14,
  47.3, 15.5, 47.5,
]
const APENNINES = [
  8.8, 44.3, 11, 44, 12.6, 43.2, 13.5, 42.3, 14.5, 41.3, 15.8, 40.3, 16.2, 39.3,
]
const DINARIC = [14.5, 45.6, 16.5, 44, 18.5, 43, 19.8, 42.5]
const BALKAN = [22.5, 43.4, 24.5, 42.8, 26.5, 42.7]
const CAUCASUS = [37.5, 44, 40.5, 43.3, 43.5, 42.7, 45, 42.3, 48, 41.5]
const TAURUS = [29.5, 37, 32, 36.8, 35, 37.5, 38, 38, 41, 38.6]
const TELL_ATLAS = [-1, 35.3, 2, 36.2, 6, 36.4, 9, 36.6]
const HIGH_ATLAS = [-9.5, 30.8, -7.5, 31.2, -6, 31.6, -4.5, 32.3, -3, 32.8]
const CALAIS: Strait = [0.4, 50.4, 2.3, 51.4]
const NORTH_CHANNEL: Strait = [-6.4, 55.5, -5.2, 54.5]
const ST_GEORGE: Strait = [-5.9, 52.3, -5.4, 51.6]
const BONIFACIO: Strait = [8.9, 41.4, 9.5, 41.3]
const TUSCAN: Strait = [9.9, 43.3, 9.9, 42.0]
const MESSINA: Strait = [15.7, 38.3, 15.5, 37.9]
const GIBRALTAR: Strait = [-6.2, 35.95, -5.2, 36.05]
const BOSPORUS: Strait = [28.9, 40.9, 29.2, 41.3]
const DARDANELLES: Strait = [26.1, 40.0, 26.8, 40.5]
const KERCH: Strait = [36.5, 45.5, 36.6, 45.1]

export const ATLAS: Readonly<Record<Atlas, Entry>> = {
  britain: {
    sheet: BRITAIN,
    size: 'small',
    lords: [2, 8],
    ranges: [
      [-5.6, 56.6, -4.6, 56.9, -3.6, 57.0, -2.8, 57.1], // the Grampians
      [-5.3, 57.6, -4.8, 58.2], // the Northwest Highlands
      [-4.1, 53.2, -3.8, 52.8], // Snowdonia
    ],
    straits: [CALAIS, NORTH_CHANNEL, ST_GEORGE],
  },
  france: {
    sheet: FRANCE,
    size: 'standard',
    lords: [4, 16],
    ranges: [PYRENEES, ALPS],
    straits: [CALAIS, BONIFACIO],
  },
  mediterranean: {
    sheet: MEDITERRANEAN,
    size: 'large',
    lords: [10, 20],
    ranges: [
      PYRENEES,
      ALPS,
      APENNINES,
      DINARIC,
      BALKAN,
      TAURUS,
      TELL_ATLAS,
      HIGH_ATLAS,
      [35.7, 33.4, 36.1, 34.2, 36.4, 34.6], // Mount Lebanon
    ],
    straits: [
      GIBRALTAR,
      MESSINA,
      BONIFACIO,
      TUSCAN,
      BOSPORUS,
      DARDANELLES,
      KERCH,
    ],
  },
  europe: {
    sheet: EUROPE,
    size: 'large',
    lords: [12, 20],
    ranges: [
      PYRENEES,
      ALPS,
      APENNINES,
      DINARIC,
      [
        17.5, 49.4, 19.5, 49.3, 21.5, 49.2, 23.5, 48.3, 25, 47.5, 25.6, 46.2,
        25, 45.4, 23, 45.4, 22.4, 44.8,
      ], // the Carpathians
      BALKAN,
      [37.5, 44, 40.5, 43.3, 43.5, 42.7, 45, 42.3], // the Caucasus
      TAURUS,
      TELL_ATLAS,
    ],
    straits: [
      CALAIS,
      NORTH_CHANNEL,
      ST_GEORGE,
      [12.6, 56.2, 12.8, 55.2], // the Sund
      [10.9, 55.9, 11.1, 55.0], // the Great Belt
      [9.7, 55.7, 9.9, 55.1], // the Little Belt
      BONIFACIO,
      TUSCAN,
      MESSINA,
      GIBRALTAR,
      BOSPORUS,
      DARDANELLES,
      KERCH,
    ],
  },
  world: {
    sheet: WORLD,
    size: 'huge',
    lords: [16, 20],
    ranges: [
      [73, 35.5, 77, 34, 81, 30.5, 84, 28.5, 88, 27.8, 92, 27.8, 95, 29], // the Himalaya
      [68.5, 35, 71, 36, 74, 36.5], // the Hindu Kush
      [78, 36, 84, 36, 90, 36, 96, 35.5], // the Kunlun
      [70, 42, 76, 41.5, 80, 42, 86, 43], // the Tian Shan
      [
        -75, 10, -77, 4, -78, -2, -76, -10, -71, -16, -68, -22, -69, -30, -70,
        -36, -71, -42, -73, -50,
      ], // the Andes
      [-122, 59, -117, 53, -113, 49, -110, 45, -106, 40, -106, 36], // the Rockies
      ALPS,
      PYRENEES,
      CAUCASUS,
      [44, 37, 46, 35, 49, 32, 52, 30, 56, 28], // the Zagros
      HIGH_ATLAS,
      [37.5, 13, 38.5, 10, 39.5, 8], // the Ethiopian highlands
    ],
    straits: [
      [-169.5, 66.2, -168.3, 65.6], // the Bering
      GIBRALTAR,
      BOSPORUS,
      DARDANELLES,
      [43.2, 12.8, 43.5, 12.5], // the Bab-el-Mandeb
      [1.0, 50.6, 2.0, 51.2], // the Pas-de-Calais
    ],
  },
}
