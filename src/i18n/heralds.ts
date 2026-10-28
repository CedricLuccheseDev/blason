// The words of the diplomacy laid on the map (components/game/Heralds.tsx):
// the seals of the alliances, the heralds' letters, the banner of a
// betrayal and the pennants of the news.

export const heraldsEn = {
  pact: (lord: string, left: string) => `Alliance with ${lord}, ${left} left`,
  renew: (lord: string) => `Renew the alliance with ${lord}`,
  press: 'press the seal',
  yourTurn: (lord: string) => `${lord} pressed, your turn`,
  waiting: (lord: string) => `${lord}’s turn`,
  offer: (lord: string) => `${lord} offers an alliance`,
  breakSeal: 'break the seal',
  tapSeal: 'tap the seal',
  letter: (lord: string) => `${lord}’s letter: break the seal`,
  offers: 'offers you his alliance',
  seal: 'Seal',
  refuse: 'Refuse',
}

export type HeraldsMessages = typeof heraldsEn

export const heraldsFr: HeraldsMessages = {
  pact: (lord: string, left: string) => `Alliance avec ${lord}, encore ${left}`,
  renew: (lord: string) => `Renouveler l’alliance avec ${lord}`,
  press: 'presse le sceau',
  yourTurn: (lord: string) => `${lord} a pressé, à toi`,
  waiting: (lord: string) => `à ${lord} de presser`,
  offer: (lord: string) => `${lord} propose l’alliance`,
  breakSeal: 'brise le sceau',
  tapSeal: 'touche le sceau',
  letter: (lord: string) => `Le pli de ${lord} : briser le sceau`,
  offers: 't’offre son alliance',
  seal: 'Sceller',
  refuse: 'Refuser',
}
