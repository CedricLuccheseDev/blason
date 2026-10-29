# Blason

Jeu de stratégie médiéval en ligne, inspiré d'OpenFront : vingt seigneurs, joueurs et bots, sur une terre
redessinée à chaque partie, prise tuile par tuile ; des paysans qui tiennent la terre et qu'on lève en armées,
l'or qui paie les constructions posées librement, des alliances courtes, des félons et des marchands. Dans le
navigateur.

**La doctrine** (Cédric, 28/10) : « un jeu qui prend plusieurs briques des rts complexes, mais en simplifié rapide et
fun. Et agréable visuellement ». Chaque règle et chaque écran se jugent à cette aune.

Phase actuelle : **la terre fluide**, sur `/play` contre dix-neuf bots ; l'accueil (`/`) est fait comme celui d'OpenFront,
la partie publique en cours de pose où « Jouer » entre aussitôt, le solo et les parties privées. Le jeu des fiefs, premier modèle, est retiré du dépôt (son dernier
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
    `grid.ts` les tuiles ; `setup.ts` ce dont une partie est faite, en un objet (`GameSetup`, dans `types.ts` : la
    graine et sa terre, le mode, l'ouverture, les sièges, chacun son équipe et son bot ou personne), que le livre de
    l'hôte remplira, que le relais passera sans le lire et dont `createGame(grid, setup)` fait la partie, ses
    préréglages (seul, des bots, la partie publique sans bot), sa lecture bornée par `SETUP_LIMITS` et sa terre
    (`landOf`) ; `land.ts` la terre de la partie et les paysans ; `opening.ts` l'ouverture, les étendards plantés où l'on veut et les terres données autour à la fin du compte, et les sièges vides (sans bot ni personne : pas de seigneur, ni étendard ni terre, sauf si une personne le prend pendant l'ouverture, `takeSeat`) ; `muster.ts` la levée aux villages
    et la marche ; `course.ts` le chemin d'une armée, par l'entrée qui la mène le plus vite au clic, marche et traversée
    comptées (acté le 29/10), celui même que la visée dessine ; `war.ts` les armées ; `battle.ts` les batailles entre armées ; `volleys.ts` les flèches des châteaux ;
    `enclosure.ts` les terres encerclées ;
    `works.ts` les constructions ; `diplomacy.ts` les alliances et les félons ; `caravans.ts` les marchands ;
    `step.ts` le pas et la victoire ; `rules.ts` tous les chiffres (`RULES`) ; `types.ts` l'état et les ordres.
  - `bots/` : `bot.ts` (guerre, constructions, expansion) et `talk.ts` (diplomatie), joueurs comme les autres.
  - Tests : la pureté (`purity.test.ts`), le déterminisme et la guerre (`war.test.ts`), les parties dorées
    (`golden.test.ts` : trois parties de bots, leurs empreintes relevées une fois et écrites en dur ; une refonte qui
    garde le jeu les garde), la victoire (`victory.test.ts`), le setup (`setup.test.ts`), la diplomatie et les
    marchands (`diplomacy.test.ts`), l'ouverture (`opening.test.ts`), les sièges vides (`seats.test.ts`), les coups (`coups.test.ts`), les flèches des châteaux
    (`volleys.test.ts`), le générateur (`map/generate.test.ts`).
- `scripts/arena.ts` : l'arène (`npm run arena -- [parties] [joueurs]`), des parties de bots sans écran. Elle dit si
  le jeu tourne ; le plaisir et la lisibilité se jugent en jouant. `scripts/census.ts`, le recensement
  (`npm run census -- [graine]`) : une partie de bots, et toutes les trois minutes la terre, les constructions,
  les paysans et l'or du premier et du seigneur médian ; on y règle les chiffres (`LAND=… VILLAGE=…` pour en essayer d'autres).
- `src/render/` : le rendu (PixiJS) et les gestes, qui ne décident rien. `client.ts` monte une partie, `session.ts`
  la fait tourner dans la page, `scene.ts` empile les calques ; chaque terre tracée en lignes autour de ses tuiles et
  repassée à la plume (`regions.ts`, `trace.ts`, `pen.ts`, le ruban `layers/borders.ts`), comme les planches ; la
  carte gagne du détail en zoomant, par paliers de pixels par tuile (`ground/detail.ts`) : le décor (`ground/`,
  collines, bois, champs, rivières) peint par morceaux de seize tuiles gardés par palier et multiplié dans le lavis,
  les constructions à trois niveaux (`art/works.ts`) et leur vie (`layers/life.ts`) ; la carte dézoomée est celle du
  stratège, acté le 29/10 (« map dézoomée = map stratégique : tout doit être compréhensible super rapidement et
  facilement, et aéré ; map zoomée = map micro-gestion et spectacle, on peut s'amuser plus mais il faut que ça reste
  lisible ») : les constructions y rétrécissent plus vite que la carte en petites marques, celles des autres
  s'effacent (leurs marchés d'abord, les routes en tiennent lieu), les sceaux des villages et les chantiers des
  autres ne reviennent qu'en zoomant ; les noms des seigneurs y restent lisibles, 16 px au moins et à pleine encre,
  et ne s'effacent qu'avec une terre trop petite à l'écran pour les porter (`layers/labels.ts`) ; `camera.ts` la
  caméra du joueur ; `summary.ts` ce que lit le HUD, une fois par seconde.
- `src/components/hud/` : **le système du HUD**. Toute pièce de l'écran est faite de ses briques, jamais de mesures
  à elle : quatre tailles (15, 18, 22, 28, rien sous 15, acté le 29/10 : « La police texte toute petite là elle est
  dure à lire ») par quatre rôles (`.hud-word`, `.hud-name`, `.hud-note` en italique à pleine encre, `.hud-figure`),
  l'espace sur les pas 4, 8, 12, 16 et 24 ; une échelle, `--hud` (`app.css`), 1 sur téléphone et petit écran,
  1,2 à partir de 1280 × 640 : le texte, l'espace (dans `.hud`) et les dessins grandissent ensemble, les mesures
  s'écrivent une fois, telles que dessinées ; une matière, le feuillet (`Sheet.tsx`) ; un bouton de 44 px
  (`Act.tsx`) ; la bulle d'aide au survol de chaque pièce, son nom et ce qu'elle fait avec ses chiffres, posée au-dessus de toute la page (`Hint.tsx`, 29/10 « ajoute des helpers ») ; le chiffre et son icône (`Figure.tsx`) ; écus, sceaux, médaillons, touches et insignes de
  rapport (`Emblem.tsx`, `StandingBadge` : l'allié en vert `pact`, des maillons ; l'ennemi en gueules, une épée ;
  le félon, l'écu brisé sur gueules ; la forme dit avant la couleur, les mêmes qu'à côté des noms sur la carte) ;
  un mouvement unifié, acté le 28/10 (« chaque élément hud interactif soit animé ... des animations unifiés ») :
  une courbe (`ease-hud`), deux durées (120 ms pour ce qu'on touche, 200 ms pour ce qui apparaît), deux rôles
  (`.hud-press`, `.hud-enter`), rien sous `prefers-reduced-motion` ; `useCompact` donne la forme compacte des
  pièces sur téléphone, debout ou couché ; rien ne sort de l'écran ni ne se pose sur une autre pièce, à toute
  taille dès 1024 × 600 (acté le 29/10, « les hud sortent de l'écran ») : `useFit` mesure la place qu'une pièce a
  et la fait plus compacte quand elle manque (la barre rapproche ses pièces, puis passe sur des lignes comme sur
  téléphone ; la course garde son chiffre seul), `useSize` tient dans l'écran ce qui se place à
  la souris ou sur la carte (`useBeside` : le cartouche et le menu du clic droit, au-dessus de la barre, passent de
  l'autre côté de la souris, et sur téléphone au-dessus de la barre ; les mots d'un pli ; un fanion vole vers la
  gauche près du bord droit). La mise en page en HTML, le SVG pour les seuls
  objets dessinés.
- `src/components/game/` : le HUD de la partie, **sans fond depuis le 29/10** (« le HUD repensé », Concept) : six
  places à une seule marge (`Places.tsx`), le nom du jeu en haut à gauche, la course et le temps dessous en haut au
  centre (`Race.tsx`), les royaumes en haut à droite, les cinq premiers et moi, tous au clic (`Realms.tsx`), moi en
  bas à gauche (`Purse.tsx`), toutes les actions sur une ligne en bas au centre (`Bar.tsx`), mes campagnes en bas à
  droite (`Campaign.tsx`) ; tout flotte en lettres de la carte, claires cernées d'encre (`.hud-afloat`, `--hud-ink`),
  et le haut ou le bas de l'écran ne s'assombrit que quand la souris s'en approche (`Shades.tsx`). Ce qui suit
  décrit les pièces d'avant, dont le dessin a changé : (la liste des seigneurs en haut à gauche, en bandes : tous ceux encore
  debout, une ligne fine chacun lavée de sa couleur aussi loin que sa terre va contre celle du premier, le seigneur
  visé éclairé dans la liste (acté le 29/10, « ok les bandes ») ; la course sur une ligne,
  une trahison criée à tous sous la course sur une banderole de gueules (`Banner.tsx`), le coin haut droit laissé à
  la carte ; aucun lien tiré entre alliés sur la carte (la frontière verte, l'insigne à côté du nom et la liste le
  disent), le sceau d'une de mes alliances n'y paraît que dans ses dernières secondes, à côté du nom de mon allié,
  un clic pour la renouveler (`PactSeal.tsx`), les offres en plis scellés du héraut sur ma terre, un clic les ouvre
  pour valider, en vert, ou refuser, en gueules (acté le 29/10, « utilise des mots plus simples : "valider" en vert
  et "refuser" en rouge ») (`HeraldLetter.tsx`), au bord de l'écran avec une flèche hors de vue (`Heralds.tsx`, le
  rendu dit où par `heralds.ts`, `envoys.ts` et `besideOf` dans `places.ts`) ; une alliance trahie claque entre
  les deux capitales, devant tous (`layers/pacts.ts`, `art/snap.ts`) ; les nouvelles en fanions plantés là où elles
  arrivent (`Pennant.tsx`, `notes.ts` ; une offrande reçue, sur la terre de celui qui la donne, avec son or ; mes alliances proposées, conclues ou finies, là aussi, bien que la carte les montre, 29/10 « continue les notifs même si on affiche les alliances sur la map »), la
  barre en bas, resserrée (acté le 29/10, « ok go » sur la maquette) : la bourse dedans, puis les quatre armées en
  sceaux sur une ligne, celui des mercenaires en or, payés en or, à part d'un coup d'œil (`ARMY_WAX`), sous chaque sceau son chiffre comme le prix sous une construction, la part des paysans qu'une levée prend, l'or des mercenaires (29/10, « affiche les % en dessous des chevauchées »), seule l'armée
  en main nommée sous la ligne avec ses hommes ; les constructions en médaillons et les coups en losanges cerclés
  de gueules, leur emblème, leur touche et leur prix seuls, leur nom sous la souris ; touches 1 à 4 les armées, 5 à
  7 les constructions, 8, 9 et 0 les coups ; ce qui ne se paie pas à demi-encre ; sur téléphone la même sur des
  lignes ; le cartouche près de la souris, ce qu'un clic gauche envoie, l'armée en main et ses hommes, et sur la
  terre d'un autre seigneur qu'un clic droit ouvre le reste (`Cursor.tsx`) ; le clic droit là ouvre à côté de la
  souris son menu en liste courte (acté le 29/10, « dans le clic droit rajoute les boutons attaquer / alliance /
  offrande », dessiné « en liste courte ») : un petit feuillet, son écu et son nom, puis une ligne fine par acte,
  son médaillon cerclé de sa couleur, son mot et son chiffre : Attaquer, les hommes de l'armée en main, envoyée là
  comme d'un clic gauche (pas chez un allié) ; Alliance, le mot dit ce qu'elle fait maintenant (proposer, valider,
  renouveler, rompre en gueules ; « demandée » et endormie quand on l'a proposée) ; Offrande, l'or qu'elle
  donnerait (`LordMenu.tsx`, ses lignes `lordMenu.ts`) ; Échap, un clic ailleurs ou la souris partie loin le
  ferment, sans qu'aucune armée parte de ce clic (`render/pin.ts`)), et ses dessins SVG (`svg/`).
- `src/routes/index.tsx` : l'accueil, fait comme celui d'OpenFront dans nos matières (acté le 28/10, « Fais un
  système comme openfront en adapté pour nous pour la home »), allégé le 29/10 (« la partie en arrière-plan est de
  trop je pense, et le layout peut être mieux fait ») : plus de partie de bots derrière, la page du jeu seule, son
  parchemin, son cadre et une rose des vents pâle dans le coin (`Ornaments.tsx`). Le nom du jeu seul (sa ligne
  viendra avec les titres et les mots, « retire la catchline », 29/10) ; la partie publique en héros, une grosse carte comme celle d'OpenFront dont le corps est la terre de
  la partie en cours de pose, celle même où elle se joue, tirée de sa graine quand le navigateur a un moment et
  dessinée en petit (`src/render/sketch.ts`, gardée pour la partie par `ahead.ts`), son titre, le temps qui reste
  pour la rejoindre et ses places posés dessus en cartouches, « Jouer » dans son coin, et un clic n'importe où sur la terre y entre aussi (acté le 29/10, « on peut cliquer sur la carte directement ») ; puis deux boutons
  courts égaux : « Créer une partie », qui entre aussitôt dans le jeu, la partie à l'arrêt et le livre de la partie
  ouvert (acté le 29/10, « créer une partie doit envoyer directement dans le lobby », le solo n'étant qu'une partie
  créée sans inviter personne ; `GameBook.tsx`, `BookParts.tsx` : la terre, sa taille ou une autre, les bots, leur
  niveau, les équipes, la pose, « Lancer la partie » ; puis le menu de l'hôte, « Recommencer », « Quitter » ;
  `hostSetup` dans le moteur ; le livre ouvre une salle au relais et en donne le code, « Inviter », les amis venus s'assoient après l'hôte et, lancée avec eux, la partie part en ligne pour tous avec les réglages du livre, seule elle se joue dans la page), et « Rejoindre avec un code » (les parties privées, le code à cinq signes). À leur droite le Journal, un
  feuillet de ses derniers articles, la date, le titre et la première ligne, en Alegreya Sans à pleine encre pour
  qu'il se lise (29/10, « met le journal à droite des cases »). En bas, discrets, le joueur à gauche (son écu et
  « Seigneur » en attendant les profils), le pied du site au milieu, toujours au bas de l'écran ; sur téléphone et
  sur un écran étroit, tout empilé, le Journal sous les boutons. Tout est fait des pièces du HUD.
  **Pas de salon d'attente** (acté le 29/10, « comme dans openfront ne fait pas de lobby en attente ») : le relais
  tient toujours une partie publique dans son ouverture, de 30 secondes en ligne, lancée dès qu'elle s'ouvre,
  **sans aucun bot** (acté le 29/10, « en ligne il faut 0 bot », « le matchmaking classique il ne doit pas ajouter
  de bot ») : jusqu'à vingt personnes, chacun pour soi, sur une terre standard ; « Jouer » y entre aussitôt sur le
  premier siège libre, avec les tours déjà joués à rattraper, pour planter son étendard ; un siège que personne ne
  prend reste vide, sans seigneur, ni étendard ni terre. Plus personne n'entre dans les 5 dernières secondes : la
  partie continue avec ceux qui sont venus et la suivante s'ouvre ; vide, elle est abandonnée et une nouvelle terre
  la remplace ; seul, personne ne gagne : l'ouverture recommence sur la même terre, son étendard toujours planté
  (le relais lui redit `begin` et rejoue son dernier ordre d'étendard au premier tour), et la carte de l'accueil
  dit qu'un seigneur attend (`waiting`). Celui qui part laisse son seigneur à l'abandon : sa terre à prendre, ses
  paysans la défendent, aucun bot ne la reprend (`server/rooms.ts`, `server/room.ts`) ; l'accueil la lui demande (`GET /public`) toutes les secondes et demie tant que la page est
  visible (`useUpcoming.ts`). `src/components/home/` (`Home.tsx`, `PublicCard.tsx` et sa terre `LandPlate.tsx`,
  `SoloSettings.tsx`, `PrivateRoom.tsx`, `useRoom.ts` la ligne vers le relais, `useUpcoming.ts`). La terre de la
  prochaine partie solo s'y prépare (`src/render/ahead.ts`) ; une partie en ligne commencée y passe à
  `/play?online` (`src/render/online.ts`, `remote.ts` qui la joue au rythme des tours du relais).
- `src/i18n/` : les mots, en français et en anglais, par section (`home`, `game`, `race`, `menu`, `errors`).
- `design/mockups/` : les sources des planches, tirées d'une partie du jeu (`cells.ts`) ; leurs pièces suivent les
  jetons du HUD (`kit.py`).
- `design/maquette/` : **la maquette, calquée sur le jeu lui-même** (décidé le 29/10, « une vraie maquette … calquée
  exactement pareille que le site ») : le front se dessine d'abord là, en propositions côte à côte, puis se code.
  `npm run maquette` (`scripts/maquette.ts`) joue une partie de bots sans écran et en sauve les moments
  (`public/saves/`, que `/play?save=<nom>` montre figés, `src/render/save.ts`) ; `capture.mjs` les ouvre dans Chrome à
  chaque taille d'écran (`moments.mjs`) et prend à part la carte (une image) et le HUD (son balisage), avec la CSS du
  jeu ; `build.mjs` les remonte dans `maquette.html`, chaque cadre le jeu au pixel près, et à côté les propositions
  (`proposals/`), écrites dans les classes du jeu : celle qu'on retient est déjà son code. `npm run planches`
  (`planches.mjs`, demandé le 29/10, « une belle maquette du jeu pro ») en fait les planches d'un studio, onze pages
  de 1920 × 1080 dans la matière du jeu : chaque moment en grand, le téléphone à côté, des notes en français tirées
  jusqu'aux pièces qu'elles nomment (`boards.mjs`, `board.js`), et le système d'interface dessiné par les composants
  du jeu (`pieces.tsx`) ; la commande reprend tout du jeu (`take.mjs`) et les exporte dans le vault
  (`Maquette/`, `Maquette.md`), si bien qu'elles suivent le jeu après chaque changement.
- Pas de Convex pour l'instant (projet créé en `--no-backend`) : il viendra pour les comptes et les classements. Le
  serveur de jeu est sa propre brique, un relais en lockstep comme celui d'OpenFront (`server/`, le Concept, « Les
  briques »).

## Surface de jeu

- **Joué d'abord sur ordinateur**, dans le navigateur ; livré en PWA ; le mobile viendra ensuite.
- **La direction artistique, actée** (Concept, section 3) : une carte dessinée à l'encre sur un
  manuscrit (parchemin, lavis de la couleur de chaque seigneur, lignes de côte, cadre et page autour,
  jamais de fond noir ou gris), et une interface faite d'objets de ce monde (écu, parchemins, rubans,
  sceaux, or), jamais de panneaux de site ni de copie d'OpenFront. Deux écritures : Vollkorn et ses
  petites capitales pour les noms et les mots (acté le 29/10, « Go la C » : l'IM Fell English, trop dure à lire,
  ne dessine plus que le nom du jeu, comme une marque), Alegreya Sans pour les chiffres. Chaque élément sert, se comprend d'un coup
  d'œil par un nouveau joueur et reste à l'échelle de la terre.
- **La carte à deux échelles, actée le 29/10** (« map dézoomé = map stratégique. tout doit etre compréhensible
  super rapidement et facilement et aéré. map zoomé = map micro gestion et spectacle, on peut s'amusé plus mais il
  faut que ça reste lisible ») : de loin, seulement ce qui sert à décider (terres, noms et chiffres, fronts,
  alliances, armées), avec de l'air ; de près, le détail et la vie, toujours lisibles.
- **Accent** : l'or héraldique, `#8a5f0f`.

## Outillage partagé (cl-plugin)

- La norme vit dans `$CL_PLUGIN/NORM.md` (`~/Perso/cl-plugin/NORM.md`) : la
  lire avant tout travail d'interface ou d'architecture.
- **Avant d'implémenter une capacité** (auth, stockage, env...), consulter
  `$CL_PLUGIN/patterns/` : si une recette éprouvée existe, elle prime sur la
  redécouverte. Si le travail contredit un pattern, corriger le pattern.
