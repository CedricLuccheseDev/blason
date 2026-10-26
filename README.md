# Blason

Jeu de stratégie médiéval en ligne, inspiré d'OpenFront : une vingtaine de joueurs et de bots sur une
carte inventée à chaque partie, des villages qui deviennent bourgs puis cités, des alliances courtes et
des félons. Une partie finie en 15 à 20 minutes, dans le navigateur.

La conception (règles, monde, briques) vit dans le vault Obsidian : `1 - Projects/Blason/Concept.md` et
`1 - Projects/Blason/Blason.canvas`. Ces documents font foi.

## Stack

TanStack Start, Vite, Tailwind v4, TypeScript strict. Base canonique de cl-plugin (`/new-project`),
règles dans `~/Perso/cl-plugin/NORM.md`. La simulation du jeu vivra dans `engine/`, en TypeScript pur.

## Développer

```sh
npm install
npm run dev
npm test            # les tests
npm run lint        # tsc et ESLint
```
