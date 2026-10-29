// The words of the diplomacy laid on the map (components/game/Heralds.tsx):
// the seals of the alliances, the heralds' letters, the banner of a
// betrayal (Banner.tsx) and the pennants of the news (Pennant.tsx).

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
  betrayed: (felon: string, victim: string) => `${felon} betrayed ${victim}`,
  attacks: (lord: string) => `${lord} strikes you`,
  coup: {
    troublemaker: (lord: string) => `${lord} sends a troublemaker at you`,
    archers: (lord: string) => `${lord} looses a volley at you`,
    fire: (lord: string) => `${lord} throws Greek fire at you`,
  },
  stopped: (lord: string) => `${lord} stopped your troublemaker`,
  roseAgainst: (lord: string) => `${lord} raised your land against you`,
  roseFrom: (lord: string) => `${lord} lost land to your rebels`,
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
  betrayed: (felon: string, victim: string) => `${felon} a trahi ${victim}`,
  attacks: (lord: string) => `${lord} t’attaque`,
  coup: {
    troublemaker: (lord: string) =>
      `${lord} envoie un causeur de troubles chez toi`,
    archers: (lord: string) => `${lord} tire une volée sur toi`,
    fire: (lord: string) => `${lord} lance le feu grégeois sur toi`,
  },
  stopped: (lord: string) => `${lord} a arrêté ton causeur de troubles`,
  roseAgainst: (lord: string) => `${lord} a soulevé ta terre contre toi`,
  roseFrom: (lord: string) => `${lord} a perdu sa terre à tes rebelles`,
}
