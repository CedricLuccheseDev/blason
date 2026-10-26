# Blason

Jeu de stratégie médiéval en ligne, inspiré d'OpenFront : une vingtaine de joueurs et de bots sur une
carte inventée à chaque partie, des villages qui deviennent bourgs puis cités, des alliances courtes et
des félons. Une partie finie en 15 à 20 minutes, dans le navigateur.

Phase actuelle : **la première brique, la simulation** (`engine/`) et son banc d'essai (`sim/`, l'arène).
Pas encore d'écran de jeu : l'application est la base canonique de la norme.

## Sources de vérité (dans le vault Obsidian)

- Concept : `/mnt/gdrive/1 - Projects/Blason/Concept.md` (les règles, le monde, la section « Les briques » ;
  chaque décision avec les mots de Cédric)
- Canvas : `/mnt/gdrive/1 - Projects/Blason/Blason.canvas`
- Maquettes : https://claude.ai/artifact/AbsDy161KxhbinWVxLNfv9 (privé)

Ces documents font foi : une règle se discute et se valide avant d'y être inscrite, et n'est codée
qu'ensuite. Le code ne tranche rien seul.

## Comment on travaille

- **Brique par brique.** Chaque brique introduit un composant : son rôle, les options, le choix retenu et
  pourquoi, puis la construction. Cédric veut apprendre l'architecture : expliquer avant de coder.
- **Une question à la fois**, avec une recommandation ; être critique en joueur ; rester simple et nerveux
  comme OpenFront, sans empiler les règles.
- **« Node » est le mot interne** (code, documents). À l'écran, le joueur voit « fief ».
- **Construit de zéro.** OpenFront (AGPL-3.0) se lit pour comprendre, il ne se recopie jamais.

## L'architecture

- `engine/` : la simulation, en TypeScript pur, qui n'importe ni React, ni Convex, ni rien du navigateur
  ou du serveur, pour tourner à l'identique des deux côtés. Déterministe : hasard tiré d'une graine,
  nombres entiers, jamais l'horloge. 10 pas par seconde. L'état, six ordres, un pas ; la carte se
  reconstruit depuis sa graine.
- `sim/` : l'arène. Des bots simples jouent des parties entières sans écran et mesurent la durée d'une
  partie (cible : 15 à 20 minutes), la part du premier à la 10e minute, le moment où les neutres ont
  disparu, et si la partie finit à 80 % ou par la baisse du seuil.
- Pas de Convex pour l'instant (projet créé en `--no-backend`) : il viendra avec le site, pour les
  comptes et les classements. Le serveur de jeu en temps réel sera sa propre brique.

## Surface de jeu (NORM, Game surfaces)

- **Joué d'abord sur ordinateur**, dans le navigateur ; livré en PWA.
- **L'interface** est moderne et sobre, posée sur un monde dessiné : le monde au ras du sol, en tons de
  terre éteints, et la vue large en aplats de couleur. Le monde porte seul la direction artistique.
- **Accent** : l'or héraldique, `#8a5f0f`.

## Outillage partagé (cl-plugin)

- La norme vit dans `$CL_PLUGIN/NORM.md` (`~/Perso/cl-plugin/NORM.md`) : la
  lire avant tout travail d'interface ou d'architecture.
- **Avant d'implémenter une capacité** (auth, stockage, env...), consulter
  `$CL_PLUGIN/patterns/` : si une recette éprouvée existe, elle prime sur la
  redécouverte. Si le travail contredit un pattern, corriger le pattern.
