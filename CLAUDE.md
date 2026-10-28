# Blason

Jeu de stratégie médiéval en ligne, inspiré d'OpenFront : vingt seigneurs, joueurs et bots, sur une terre
redessinée à chaque partie, prise tuile par tuile ; des paysans qui tiennent la terre et qu'on lève en armées,
l'or qui paie les constructions posées librement, des alliances courtes, des félons et des marchands. Dans le
navigateur.

Phase actuelle : **la terre fluide**, sur `/play` contre dix-neuf bots ; l'accueil (`/`) est un écran titre avec
une partie de bots filmée derrière le menu. Le jeu des fiefs, premier modèle, est retiré du dépôt (son dernier
état est à l'étiquette git `fiefs-final`). Le dépôt est fait pour devenir public, comme celui d'OpenFront : code
rangé, documenté en anglais (`README.md`, `docs/`, `CONTRIBUTING.md`), sous licence AGPL-3.0.

## Sources de vérité (dans le vault Obsidian)

- Concept : `/mnt/gdrive/1 - Projects/Blason/Concept.md` (les règles, le monde, la section « Les briques » ;
  chaque décision avec les mots de Cédric)
- Canvas : `/mnt/gdrive/1 - Projects/Blason/Blason.canvas`
- Maquettes : https://claude.ai/artifact/AbsDy161KxhbinWVxLNfv9 (privé)

Ces documents font foi : une règle se discute et se valide avant d'y être inscrite, et n'est codée
qu'ensuite. Le code ne tranche rien seul. Le dépôt en porte la version publique, en anglais :
`docs/RULES.md` (les règles et leurs chiffres) et `docs/ARCHITECTURE.md` ; une règle qui change les met à jour
dans le même commit.

## Comment on travaille

- **Brique par brique.** Chaque brique introduit un composant : son rôle, les options, le choix retenu et
  pourquoi, puis la construction. Cédric veut apprendre l'architecture : expliquer avant de coder.
- **Une question à la fois**, avec une recommandation ; être critique en joueur ; rester simple et nerveux
  comme OpenFront, sans empiler les règles.
- **Construit de zéro.** OpenFront (AGPL-3.0) se lit pour comprendre, il ne se recopie jamais.
- **Une architecture SOLID, acté le 27/10** (« Rajoute en règle qu'on instaure une architecture SOLID ») : le code
  est fait de modules et de fonctions plus que de classes, et les cinq principes s'y lisent ainsi.
  - **S, une responsabilité** : un module fait une chose et son nom la dit (`war.ts` la guerre, `caravans.ts` les
    marchands, `Sheet.tsx` le feuillet). Une règle vit dans la simulation, un dessin dans le rendu, un mot dans
    `i18n/`, un chiffre dans `rules.ts` ; jamais deux à la fois.
  - **O, ouvert à l'extension, fermé à la modification** : on ajoute en étendant une table, pas en ajoutant des
    branches (`RULES`, les armées et les constructions par leur nom, les jetons du HUD) ; une construction ou une
    armée de plus ne doit toucher que ses données et son dessin.
  - **L, la substitution** : ce qui joue passe par le même contrat ; un bot est un joueur comme un autre, il lit le
    même état et envoie les mêmes ordres (`Order`), si bien qu'un joueur humain, un bot ou demain un joueur distant
    se remplacent l'un l'autre sans que la simulation le sache.
  - **I, des interfaces étroites** : chaque consommateur reçoit le type qui lui suffit (le rendu lit un `Summary`,
    pas l'état entier ; une pièce du HUD reçoit ses chiffres, pas la partie).
  - **D, l'inversion des dépendances** : les dépendances vont vers la simulation, jamais l'inverse. Le moteur ne
    dépend de rien ; le rendu et l'interface ne passent que par `engine/index.ts`, son contrat ; la session reçoit
    ses joueurs (humain, bots) de l'extérieur. Les règles d'architecture (`.dependency-cruiser.cjs`) et le test de
    pureté le font respecter.

## L'architecture

Le détail vit dans `docs/ARCHITECTURE.md` ; ici, la carte et ce qui ne se devine pas.

- `engine/` : la simulation, la partie entière, pure et déterministe (hasard tiré d'une graine, nombres entiers en
  millièmes, `UNIT`, jamais l'horloge, 10 pas par seconde). Son seul contrat est `engine/index.ts` : hors du moteur,
  on n'importe rien d'autre (`.dependency-cruiser.cjs`), et le moteur n'importe rien de l'app.
  - `map/` le générateur de carte (une graine, la même terre partout ; ses cellules s'appellent encore `fiefs`) ;
    `grid.ts` les tuiles ; `land.ts` les domaines libres, le départ, les paysans et l'or ; `war.ts` les armées ;
    `works.ts` les constructions ; `diplomacy.ts` les alliances et les félons ; `caravans.ts` les marchands ;
    `step.ts` le pas et la victoire ; `rules.ts` tous les chiffres (`RULES`) ; `types.ts` l'état et les ordres.
  - `bots/` : `bot.ts` (guerre, constructions, expansion) et `talk.ts` (diplomatie), joueurs comme les autres.
  - Tests : la pureté (`purity.test.ts`), le déterminisme et la guerre (`war.test.ts`), la diplomatie et les
    marchands (`diplomacy.test.ts`), le générateur (`map/generate.test.ts`).
- `scripts/arena.ts` : l'arène (`npm run arena -- [parties] [joueurs]`), des parties de bots sans écran. Elle dit si
  le jeu tourne ; le plaisir et la lisibilité se jugent en jouant.
- `src/render/` : le rendu (PixiJS) et les gestes, qui ne décident rien. `client.ts` monte une partie, `session.ts`
  la fait tourner dans la page, `scene.ts` empile les calques ; chaque terre tracée en lignes autour de ses tuiles et
  repassée à la plume (`regions.ts`, `trace.ts`, `pen.ts`), comme les planches ; `camera.ts` la caméra du joueur,
  `director.ts` celle du spectateur ; `summary.ts` ce que lit le HUD, une fois par seconde.
- `src/components/hud/` : **le système du HUD**. Toute pièce de l'écran est faite de ses briques, jamais de mesures
  à elle : quatre tailles (13, 16, 20, 28) par quatre rôles (`.hud-word`, `.hud-name`, `.hud-note`, `.hud-figure`),
  l'espace sur les pas 4, 8, 12, 16 et 24 ; une matière, le feuillet (`Sheet.tsx`) ; un bouton de 44 px
  (`Act.tsx`) ; le chiffre et son icône (`Figure.tsx`) ; écus, sceaux, médaillons et touches (`Emblem.tsx`). La
  mise en page en HTML, le SVG pour les seuls objets dessinés.
- `src/components/game/` : le HUD de la partie (la bourse, les alliés, la course, les lettres, la barre, le
  cartouche près de la souris), et ses dessins SVG (`svg/`).
- `src/routes/index.tsx` : l'accueil, comme l'écran titre d'un jeu ; le menu sur un parchemin roulé (Jouer,
  Regarder, le Journal ; flèches et Entrée), derrière une partie de bots (`src/components/home/Spectacle.tsx`)
  filmée par le réalisateur ; la terre de la prochaine partie s'y prépare (`src/render/ahead.ts`).
- `src/i18n/` : les mots, en français et en anglais, par section (`home`, `game`, `race`, `pacts`, `errors`).
- `design/mockups/` : les sources des planches, tirées d'une partie du jeu (`cells.ts`) ; leurs pièces suivent les
  jetons du HUD (`kit.py`).
- Pas de Convex pour l'instant (projet créé en `--no-backend`) : il viendra pour les comptes et les classements. Le
  serveur de jeu sera sa propre brique, un relais en lockstep comme celui d'OpenFront (le Concept, « Les briques »).

## Surface de jeu

- **Joué d'abord sur ordinateur**, dans le navigateur ; livré en PWA ; le mobile viendra ensuite.
- **La direction artistique, actée** (Concept, section 3) : une carte dessinée à l'encre sur un
  manuscrit (parchemin, lavis de la couleur de chaque seigneur, lignes de côte, cadre et page autour,
  jamais de fond noir ou gris), et une interface faite d'objets de ce monde (écu, parchemins, rubans,
  sceaux, or), jamais de panneaux de site ni de copie d'OpenFront. Deux écritures : IM Fell English
  pour les noms et les mots, Alegreya Sans pour les chiffres. Chaque élément sert, se comprend d'un coup
  d'œil par un nouveau joueur et reste à l'échelle de la terre.
- **Accent** : l'or héraldique, `#8a5f0f`.

## Outillage partagé (cl-plugin)

- La norme vit dans `$CL_PLUGIN/NORM.md` (`~/Perso/cl-plugin/NORM.md`) : la
  lire avant tout travail d'interface ou d'architecture.
- **Avant d'implémenter une capacité** (auth, stockage, env...), consulter
  `$CL_PLUGIN/patterns/` : si une recette éprouvée existe, elle prime sur la
  redécouverte. Si le travail contredit un pattern, corriger le pattern.
