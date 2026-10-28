// The colours of the game's world, a map drawn on a manuscript: brown-black
// ink on parchment, each lord's land a wash of his colour, gold for what is
// mine, red for a fight and green for an alliance. Every other tone is muted earth, so that only a
// player's colour stands out.

/** Twenty heraldic colours, one per seat; their names live in the messages. */
export const PLAYERS = [
  { key: 'azure', color: 0x2f6db5 },
  { key: 'gules', color: 0xc0392b },
  { key: 'vert', color: 0x3e8e41 },
  { key: 'purpure', color: 0x7b3f8c },
  { key: 'or', color: 0xd9a41e },
  { key: 'sable', color: 0x3d3d45 },
  { key: 'orange', color: 0xe07b24 },
  { key: 'sky', color: 0x6fb6db },
  { key: 'sanguine', color: 0x8e2b2b },
  { key: 'apple', color: 0x8dbf4a },
  { key: 'rose', color: 0xd46a9e },
  { key: 'brown', color: 0x8a5a32 },
  { key: 'turquoise', color: 0x2a9d8f },
  { key: 'lavender', color: 0x9c8fd1 },
  { key: 'olive', color: 0x6f7a2e },
  { key: 'coral', color: 0xee8d7a },
  { key: 'navy', color: 0x24396b },
  { key: 'peacock', color: 0x1f7a99 },
  { key: 'plum', color: 0x5a2347 },
  { key: 'slate', color: 0x7c8b9a },
] as const

export type Heraldry = (typeof PLAYERS)[number]['key']

export const TONE = {
  ink: 0x2b1e12,
  page: 0xefe3c4,
  seaWash: 0xcdd6c2,
  seaLine: 0x8fa39a,
  gold: 0xd9a41e,
  goldLight: 0xf4d277,
  glint: 0xfff6cf,
  rampart: 0xd8ccae,
  wall: 0xe6dcc4,
  ember: 0xf08a2c,
  char: 0x2a1a10,
  amber: 0xf0a83a,
  fight: 0xe8432f,
  fightDark: 0x741c16,
  /** The border shared with an ally: a calm green, quieter than a fight's red. */
  pact: 0x3f7f4a,
  /** A traitor's badge, the heralds' gules (the HUD's --color-gules). */
  gules: 0xb3302a,
  outline: 0x3a2e22,
  /** The parchment far out from the map, browned at the page's edge. */
  edge: 0xdccba5,
  neutral: 0xe8e1cd,
  neutralPill: 0x6e665a,
  parchment: 0xf1e8d2,
  gain: 0x2f9e44,
  loss: 0xd6332b,
  white: 0xffffff,
  stone: 0xd9d1be,
  stoneDark: 0xb7ad97,
  /** A castle's rampart round the land it holds. */
  lead: 0x8d8574,
  slate: 0x6a635e,
  door: 0x4a3b2c,
  roofs: [0x8e5f48, 0x7d6650, 0x94704f, 0x73604e],
}

export function playerColor(owner: number): number {
  return owner >= 0 ? PLAYERS[owner % PLAYERS.length].color : TONE.neutral
}
