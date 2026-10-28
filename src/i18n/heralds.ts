// The words of the diplomacy laid on the map (components/game/Heralds.tsx):
// the seals of the alliances, the heralds' letters, the banner of a
// betrayal and the pennants of the news.

export const heraldsEn = {
  pact: (lord: string, left: string) => `Alliance with ${lord}, ${left} left`,
  renew: (lord: string) => `Renew the alliance with ${lord}`,
  press: 'press the seal',
  yourTurn: (lord: string) => `${lord} pressed, your turn`,
  waiting: (lord: string) => `${lord}’s turn`,
}

export type HeraldsMessages = typeof heraldsEn

export const heraldsFr: HeraldsMessages = {
  pact: (lord: string, left: string) => `Alliance avec ${lord}, encore ${left}`,
  renew: (lord: string) => `Renouveler l’alliance avec ${lord}`,
  press: 'presse le sceau',
  yourTurn: (lord: string) => `${lord} a pressé, à toi`,
  waiting: (lord: string) => `à ${lord} de presser`,
}
