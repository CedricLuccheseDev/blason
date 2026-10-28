// The legal notice (LCEN), apart from the main dictionaries to keep them
// light. Blason is a personal, non-professional project: under article 6
// III-2 of the LCEN its publisher may stay unnamed to the public, his
// identity given to the host, so no postal address is shown. Everything it
// states must stay true of the code: the third parties it names are those
// the browser really contacts.
export interface LegalContent {
  title: string
  sections: Array<{ heading: string; body: Array<string> }>
}

export const legalEn: LegalContent = {
  title: 'Legal notice',
  sections: [
    {
      heading: 'Publisher',
      body: [
        'Blason is a personal, non-professional project. As the law allows a non-professional publisher (article 6 III-2 of the French LCEN), its publisher has given his identity to the host named below.',
        'Contact: cedric.lucchese.1999@gmail.com',
        'Publication director: Cédric Lucchese',
      ],
    },
    {
      heading: 'Hosting',
      body: [
        'Hostinger International Ltd., 61 Lordou Vironos Street, 6023 Larnaca, Cyprus (hostinger.com). The server is located in the European Union.',
      ],
    },
    {
      heading: 'Personal data',
      body: [
        'Blason has no accounts, no advertising and no audience measurement. A game is played entirely in your browser: the map, the bots and every move are computed on your machine, and nothing of your game is sent to our server.',
        'This site sets no cookie and stores nothing in your browser: the language follows the one your browser asks for.',
        'Fonts are served by Google Fonts (Google Ireland Ltd), which receives your IP address when the page loads.',
        'If a page fails, the error message, its trace and the address of the page are sent to our server with your browser’s user agent, so that the failure can be fixed; they are kept in the server logs for a limited time.',
        'Like any web server, the hosting infrastructure logs requests (IP address, user agent) for security and diagnostics, for a limited time.',
        'To exercise your rights (access, rectification, erasure…), write to the contact address above. You may also lodge a complaint with the CNIL (cnil.fr).',
      ],
    },
    {
      heading: 'Intellectual property',
      body: [
        'The game’s code, its drawings included, is free software under the GNU Affero General Public License v3.0. The texts are © Cédric Lucchese unless stated otherwise. The fonts, IM Fell English and Alegreya Sans among them, are under the SIL Open Font License.',
      ],
    },
  ],
}

export const legalFr: LegalContent = {
  title: 'Mentions légales',
  sections: [
    {
      heading: 'Éditeur',
      body: [
        "Blason est un projet personnel, non professionnel. Comme la loi le permet à un éditeur non professionnel (article 6 III-2 de la LCEN), son éditeur a communiqué son identité à l'hébergeur ci-dessous.",
        'Contact : cedric.lucchese.1999@gmail.com',
        'Directeur de la publication : Cédric Lucchese',
      ],
    },
    {
      heading: 'Hébergement',
      body: [
        "Hostinger International Ltd., 61 Lordou Vironos Street, 6023 Larnaca, Chypre (hostinger.fr). Le serveur est situé dans l'Union européenne.",
      ],
    },
    {
      heading: 'Données personnelles',
      body: [
        "Blason n'a ni compte, ni publicité, ni mesure d'audience. Une partie se joue entièrement dans votre navigateur : la carte, les bots et chaque coup sont calculés sur votre machine, et rien de votre partie n'est envoyé à notre serveur.",
        'Ce site ne dépose aucun cookie et ne garde rien dans votre navigateur : la langue suit celle que demande votre navigateur.',
        'Les polices sont servies par Google Fonts (Google Ireland Ltd), qui reçoit votre adresse IP au chargement de la page.',
        "Si une page échoue, le message d'erreur, sa trace et l'adresse de la page sont envoyés à notre serveur avec le user agent de votre navigateur, pour que la panne soit corrigée ; ils restent dans les journaux du serveur pour une durée limitée.",
        "Comme tout serveur web, l'hébergement journalise les requêtes (adresse IP, user agent) à des fins de sécurité et de diagnostic, pour une durée limitée.",
        "Pour exercer vos droits (accès, rectification, effacement…), écrivez à l'adresse de contact ci-dessus. Vous pouvez aussi saisir la CNIL (cnil.fr).",
      ],
    },
    {
      heading: 'Propriété intellectuelle',
      body: [
        'Le code du jeu, ses dessins compris, est un logiciel libre sous licence GNU Affero General Public License v3.0. Les textes sont © Cédric Lucchese, sauf mention contraire. Les polices, dont IM Fell English et Alegreya Sans, sont sous licence SIL Open Font License.',
      ],
    },
  ],
}
