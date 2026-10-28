// The modes of play, one card each on the table, in the order they lie.
// Kept apart from the scene so that the home reads them without loading
// Three.js.

export const MODES = ['bots', 'online', 'private'] as const
export type Mode = (typeof MODES)[number]
