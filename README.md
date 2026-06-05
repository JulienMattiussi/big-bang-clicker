# Big Bang Clicker

Un jeu incrémental (clicker / idle) **narratif** qui raconte l'histoire de
l'univers : du Big Bang à une ville-univers qui ré-explose pour tout
recommencer, en mieux.

Le joueur traverse plusieurs **ères** (refroidir l'univers, assembler les
atomes, former les astres, rendre une planète habitable, faire émerger la vie,
les créatures, l'intelligence, les sociétés, la conquête spatiale...), chacune
avec son propre geste de jeu. Les ères débloquées continuent de tourner en
arrière-plan, et une boucle de **prestige** rend chaque renaissance plus
puissante.

- 100% front-end, aucune donnée envoyée à un serveur.
- Sauvegarde automatique en `localStorage`, avec **export / import** de la
  progression.
- Français par défaut, anglais proposé.
- Contenu des ères "réalistes" fidèle à l'état actuel des connaissances
  scientifiques (voir [docs/SCIENCE.md](./docs/SCIENCE.md)).

## Statut

Conception **terminée** (voir `docs/`) et **échafaudage technique en place**
(Vite + React + TS + Tailwind + Zustand, lint/tests/Makefile, `make check`
passe). Prochaine étape : le moteur de jeu (voir [docs/ROADMAP.md](./docs/ROADMAP.md)).

## Documentation

| Document | Contenu |
|---|---|
| [docs/GAME-DESIGN.md](./docs/GAME-DESIGN.md) | Boucle de jeu, économie, prestige, équilibrage |
| [docs/PHASES.md](./docs/PHASES.md) | Les ères en détail |
| [docs/SCIENCE.md](./docs/SCIENCE.md) | Chronologie scientifique sourcée |
| [docs/NARRATIVE.md](./docs/NARRATIVE.md) | Anecdotes, easter eggs et références (catalogue vivant) |
| [docs/UI-UX.md](./docs/UI-UX.md) | Interface, paliers de transformation, design system |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Moteur data-driven, stores, sauvegarde |
| [docs/ROADMAP.md](./docs/ROADMAP.md) | Plan de conception et de développement |
| [AGENTS.md](./AGENTS.md) | Conventions techniques du projet |

## Démarrage

Via le `Makefile` (standard maison) :

```sh
make install   # installe les dépendances
make start     # lance le serveur de développement (http://localhost:1138)
make check     # build + lint + typecheck + tests unitaires
make fix       # format + lint
```

## Stack

React 19, Vite, TypeScript, Tailwind CSS v4, Zustand, Vitest, Playwright.
