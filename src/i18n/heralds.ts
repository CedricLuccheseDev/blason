// The words of the diplomacy laid on the map (components/game/Heralds.tsx):
// the seals of the alliances, the heralds' letters, the banner of a
// betrayal (Banner.tsx) and the pennants of the news (Pennant.tsx).

export const heraldsEn = {
  pact: (lord: string, left: string) => `Alliance with ${lord}, ${left} left`,
  renew: (lord: string) => `Renew the alliance with ${lord}`,
  // In an alliance's last moments, under its seal: no one has asked to
  // renew yet, my ally has and it is my turn, or I have and he has not.
  press: 'click to renew',
  yourTurn: (lord: string) => `${lord} wants to renew`,
  waiting: (lord: string) => `waiting for ${lord}`,
  offer: (lord: string) => `${lord} offers an alliance`,
  accept: 'Accept',
  refuse: 'Refuse',
  betrayed: (felon: string, victim: string) => `${felon} betrayed ${victim}`,
  attacks: (lord: string) => `${lord} strikes you`,
  coup: {
    troublemaker: (lord: string) => `${lord} sends a troublemaker at you`,
    archers: (lord: string) => `${lord} looses a volley at you`,
    trebuchet: (lord: string) => `${lord}'s trebuchet aims at you`,
  },
  stopped: (lord: string) => `${lord} stopped your troublemaker`,
  roseAgainst: (lord: string) => `${lord} raised your land against you`,
  roseFrom: (lord: string) => `${lord} lost land to your rebels`,
  // Followed by the gold, in figures with its coins.
  offering: (lord: string) => `${lord} offers you`,
  pacts: {
    offered: (lord: string) => `${lord} offers an alliance`,
    made: (lord: string) => `Alliance made with ${lord}`,
    ended: (lord: string) => `Your alliance with ${lord} has ended`,
  },
}

export type HeraldsMessages = typeof heraldsEn

export const heraldsFr: HeraldsMessages = {
  pact: (lord: string, left: string) => `Alliance avec ${lord}, encore ${left}`,
  renew: (lord: string) => `Renouveler l’alliance avec ${lord}`,
  press: 'clique pour renouveler',
  yourTurn: (lord: string) => `${lord} veut renouveler`,
  waiting: (lord: string) => `en attente de ${lord}`,
  offer: (lord: string) => `${lord} propose une alliance`,
  accept: 'Valider',
  refuse: 'Refuser',
  betrayed: (felon: string, victim: string) => `${felon} a trahi ${victim}`,
  attacks: (lord: string) => `${lord} t’attaque`,
  coup: {
    troublemaker: (lord: string) =>
      `${lord} envoie un causeur de troubles chez toi`,
    archers: (lord: string) => `${lord} tire une volée sur toi`,
    trebuchet: (lord: string) => `Le trébuchet de ${lord} te vise`,
  },
  stopped: (lord: string) => `${lord} a arrêté ton causeur de troubles`,
  roseAgainst: (lord: string) => `${lord} a soulevé ta terre contre toi`,
  roseFrom: (lord: string) => `${lord} a perdu sa terre à tes rebelles`,
  offering: (lord: string) => `${lord} t’offre`,
  pacts: {
    offered: (lord: string) => `${lord} propose une alliance`,
    made: (lord: string) => `Alliance conclue avec ${lord}`,
    ended: (lord: string) => `L’alliance avec ${lord} a pris fin`,
  },
}
