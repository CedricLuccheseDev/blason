import type { Bus } from './mix'

// The sounds that tell the player what he does not look at, and give weight
// to what he does (Concept, « Les sons qui informent »): each made of one or
// two layers played together, each one file of public/sounds/ or a family of
// takes to turn between, its bus (audio/mix.ts), how loud, and how soon it may
// sound again. Each is a hit, a second or so, the end of the game hardly more
// (« c'est surtout des hit que l'on veut pour que ça reste digeste »). A sound
// more is an entry here and its file, nothing else.

export type Cue =
  | 'muster'
  | 'alarm'
  | 'herald'
  | 'pact'
  | 'parting'
  | 'betrayal'
  | 'build'
  | 'gold'
  | 'victory'
  | 'defeat'
  | 'clash'
  | 'volley'
  | 'stone'
  | 'press'
  | 'refused'
  | 'shout'
  | 'fall'
  | 'launch'
  | 'torch'
  | 'hammer'
  | 'plant'
  | 'tick'
  | 'start'

type Layer = {
  /** Its file in public/sounds/, without the extension; a family of takes, the first the one heard unless the cue turns. */
  file: string | ReadonlyArray<string>
  /** Seconds after the cue begins. */
  delay?: number
}

export type CueSpec = {
  layers: ReadonlyArray<Layer>
  /** Where it plays; the cues that tell the player something unless said. */
  bus?: Bus
  /** Turns between its family's takes, never the same twice running (« on verra si on tourne entre les samples de même famille »). */
  turn?: boolean
  /** Its loudness, 0 to 1. */
  gain: number
  /** Seconds before it may sound again; heard in between, it is dropped. */
  again: number
  /** A cry to all: the other sounds fall while it passes. */
  cry?: boolean
  /** The end of the game: everything else falls silent for good. */
  last?: boolean
}

export const CUES: Record<Cue, CueSpec> = {
  /** My army leaves: a war horn. */
  muster: { layers: [{ file: 'horn' }], gain: 0.7, again: 1 },
  /** An army or a coup comes for me: the tocsin, an alarm bell rung fast. */
  alarm: { layers: [{ file: 'tocsin' }], gain: 0.8, again: 4 },
  /** A herald's letter, an alliance offered or an offering given: parchment unfolded, a hand bell. */
  herald: {
    layers: [{ file: 'parchment' }, { file: 'handbell', delay: 0.3 }],
    gain: 0.7,
    again: 2,
  },
  /** An alliance of mine made: a seal pressed in wax, a lute chord. */
  pact: {
    layers: [{ file: 'wax' }, { file: 'lute', delay: 0.2 }],
    gain: 0.7,
    again: 2,
  },
  /** An alliance of mine come to its end unbroken: a low oud phrase. */
  parting: { layers: [{ file: 'oud' }], gain: 0.6, again: 2 },
  /** A betrayal, cried to all: a sword drawn, a dark timpani stroke. */
  betrayal: {
    layers: [{ file: 'sword' }, { file: 'timpani', delay: 0.12 }],
    gain: 0.9,
    again: 2,
    cry: true,
  },
  /** A work of mine laid: two hammer blows on wood. */
  build: { layers: [{ file: 'mallet' }], gain: 0.6, again: 0.5 },
  /** A caravan come to my market: a pile of coins. */
  gold: { layers: [{ file: 'coins' }], gain: 0.5, again: 3 },
  /** A medieval fanfare. */
  victory: { layers: [{ file: 'fanfare' }], gain: 0.9, again: 0, last: true },
  /** The knell, a tolling bell. */
  defeat: { layers: [{ file: 'knell' }], gain: 0.9, again: 0, last: true },
  /** Up close, two armies at grips: a clash of swords, now and then. */
  clash: {
    layers: [{ file: ['clash-1', 'clash-2', 'clash-3'] }],
    bus: 'world',
    turn: true,
    gain: 0.7,
    again: 0.7,
  },
  /** Up close, a castle's volley or the archers' coup: arrows loosed. */
  volley: {
    layers: [{ file: ['volley-1', 'volley-2', 'volley-3'] }],
    bus: 'world',
    turn: true,
    gain: 0.6,
    again: 0.8,
  },
  /** A piece of the HUD pressed: a light wooden click (« Le hud aussi doit avoir des petits sons aux clics »). */
  press: {
    layers: [{ file: ['press-1', 'press-2', 'press-3'] }],
    bus: 'ui',
    gain: 0.6,
    again: 0.05,
  },
  /** A piece of the HUD that cannot be had now, pressed: a dull knock. */
  refused: {
    layers: [{ file: 'refused-1' }],
    bus: 'ui',
    gain: 0.6,
    again: 0.2,
  },
  /** Up close, the men of an army fighting: a cry now and then. */
  shout: {
    layers: [{ file: ['shout-1', 'shout-2', 'shout-3', 'shout-4'] }],
    bus: 'world',
    turn: true,
    gain: 0.45,
    again: 1.6,
  },
  /** Up close, an army fallen to its last man. */
  fall: {
    layers: [{ file: ['fall-1', 'fall-2', 'fall-3'] }],
    bus: 'world',
    turn: true,
    gain: 0.5,
    again: 1,
  },
  /** Up close, a trebuchet loosing its stone. */
  launch: {
    layers: [{ file: 'launch-1' }],
    bus: 'world',
    gain: 0.7,
    again: 0.5,
  },
  /** Up close, a troublemaker setting out, his torch lit. */
  torch: {
    layers: [{ file: ['torch-1', 'torch-2'] }],
    bus: 'world',
    turn: true,
    gain: 0.6,
    again: 0.5,
  },
  /** Up close, a work rising: a blow of a hammer now and then. */
  hammer: {
    layers: [{ file: ['hammer-1', 'hammer-2', 'hammer-3'] }],
    bus: 'world',
    turn: true,
    gain: 0.45,
    again: 0.9,
  },
  /** My standard planted, or moved, in the opening: its cloth in the wind. */
  plant: { layers: [{ file: 'plant-1' }], gain: 0.6, again: 0.3 },
  /** The opening's last seconds, one stroke of a drum each. */
  tick: { layers: [{ file: ['tick-1', 'tick-2'] }], gain: 0.5, again: 0.8 },
  /** The opening over, the game begun: a long horn. */
  start: { layers: [{ file: 'start-1' }], gain: 0.8, again: 5 },
  /** Up close, a trebuchet's stone come down. */
  stone: {
    layers: [{ file: ['stone-1', 'stone-2', 'stone-3'] }],
    bus: 'world',
    turn: true,
    gain: 0.8,
    again: 0.5,
  },
}
