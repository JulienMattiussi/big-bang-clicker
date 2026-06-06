# Big Bang Clicker - Agent File

## Description du projet

Jeu incrémental (clicker / idle) **narratif** racontant l'histoire de
l'univers, du Big Bang jusqu'à une ville-univers qui ré-explose pour tout
recommencer (prestige / New Game+). Le joueur traverse plusieurs **ères**,
chacune apportant un nouveau geste de jeu, les ères débloquées cohabitant en
arrière-plan.

Application **100% front-end**, sans backend : sauvegarde en `localStorage`,
export/import de la progression en JSON. Interface **français par défaut**,
anglais proposé.

> Documentation de conception dans [`docs/`](./docs) :
> [GAME-DESIGN](./docs/GAME-DESIGN.md), [PHASES](./docs/PHASES.md),
> [SCIENCE](./docs/SCIENCE.md), [UI-UX](./docs/UI-UX.md),
> [ARCHITECTURE](./docs/ARCHITECTURE.md), [NARRATIVE](./docs/NARRATIVE.md),
> [ROADMAP](./docs/ROADMAP.md).
> En cas de doute sur le gameplay ou la chronologie, ces documents font foi.

---

## Stack technique

| Outil | Usage |
|---|---|
| React 19 + TypeScript | UI |
| Vite | Build / dev server |
| Tailwind CSS v4 | Styles (via `@tailwindcss/vite`, pas de config JS) |
| Zustand | État global (jeu, sauvegarde, paramètres, i18n) |
| Vitest + Testing Library | Tests unitaires et composants |
| Playwright | Tests e2e |
| Prettier | Formatage |
| ESLint (typescript-eslint) | Linting |

Choix validés : voir la section "Décisions" plus bas et
[GAME-DESIGN.md](./docs/GAME-DESIGN.md).

---

## Architecture (cible)

> Principe directeur : **data-driven**. Le moteur de jeu est générique ; les
> ères, ressources, générateurs et upgrades sont décrits en **données**, pas
> en code. Ajouter une ère doit coûter surtout du contenu, pas de la logique.

État actuel (le moteur existe ; le contenu des ères et l'UI de jeu arrivent
en phase D) :

```
src/
├── lib/                  # Logique pure, zéro React (entièrement testée)
│   ├── types.ts          # Era, Resource, Generator, Converter, Upgrade, Crisis, GameState...
│   ├── engine.ts         # Tick : production, conversion bornée, coûts, achats, Complexité
│   ├── graph.ts          # Réseau de ressources : flux nets, dépendances, tri topologique
│   ├── crises.ts         # Crises : risque, déclenchement, effets régression/rebond
│   ├── prestige.ts       # Échos + reset New Game+
│   ├── save.ts           # État initial, sérialisation versionnée + migrations, idle, export/import
│   └── format.ts         # Notation abrégée des grands nombres
├── data/
│   ├── index.ts          # defs : GameDefs (vide pour l'instant)
│   └── eras/             # Une description par ère (à venir, phase D+)
├── store/
│   └── gameStore.ts      # État de jeu + actions (tick, click, achats, persist)
│                         # (settingsStore à venir : dark mode, plafond idle)
├── i18n/                 # i18n custom (FR source de vérité, EN typé complet)
│   ├── types.ts          # Locale, TranslationKey (dérivée du FR), Translations
│   ├── i18nStore.ts      # Store Zustand + persistance
│   ├── useTranslation.ts # hook t()
│   └── translations/     # fr.ts (source), en.ts, index.ts
├── hooks/
│   └── useTick.ts        # Boucle de jeu + autosauvegarde
├── components/           # Par domaine ; un composant par fichier
│   ├── ui/               # Primitives (Button, Panel, Number...) (à venir)
│   ├── game/             # Ressources, usines, upgrades, scène d'ère (à venir)
│   └── layout/           # Coquille, navigation, paliers ; ex : LanguageSwitch.tsx
└── App.tsx               # Navigation par état (pas de router)
tests/
├── helpers.ts            # Helpers partagés (makeState...) - éviter la duplication
├── unit/                 # Vitest - logique pure (engine, graph, crises, prestige, save, format)
├── component/            # Vitest + Testing Library (App, LanguageSwitch, useTick)
└── e2e/                  # Playwright (smoke)
```

---

## Contraintes techniques

- **100% front-end** : aucun appel serveur, pas de backend, pas d'API distante.
- **Pas de SSR** : Vite SPA uniquement. Ne pas introduire Next.js ou Remix.
- **Alias `@/`** pointe vers `src/`. Toujours l'utiliser pour les imports
  internes, jamais de chemins relatifs `../../`.
- **Tailwind v4** : `@import 'tailwindcss'` dans le CSS, pas de
  `tailwind.config.js`. Classes utilitaires par défaut.
- **Thèmes centralisés** : un thème par palier d'UI (cosmos, vivant,
  civilisation, spatial, transcendance), défini dans `src/theme.css` via
  `@theme inline` + variables CSS basculées par `data-tier`. Les composants
  utilisent **uniquement les jetons sémantiques** (`bg-bg`, `bg-surface`,
  `text-fg`, `text-muted`, `text-accent`, `border-border`, `text-octarine`) :
  **jamais de couleur en dur**. CSS brut limité à `index.css` (reset) et
  `theme.css`.
- **Pas de CSS local répété** : un motif de classes répété devient un composant
  réutilisable (`components/ui/`), pas du copier-coller.
- **TypeScript strict** : `noUnusedLocals`, `noUnusedParameters` activés. Ne
  pas les désactiver.
- **Moteur générique** : la logique de jeu ne connaît pas les ères en dur. Une
  ère est une donnée. Pas de `if (era === 'bigbang')` dans le moteur.
- **Réseau de ressources** : les ressources se combinent via des
  convertisseurs/recettes (entrées consommées -> sortie produite), décrits en
  données. Le moteur calcule les flux nets ; éviter les blocages durs (les
  ressources de base gardent toujours une production minimale). Voir
  [GAME-DESIGN.md](./docs/GAME-DESIGN.md) section 3.1.
- **Grands nombres** : tout affichage de nombre passe par `src/lib/format.ts`.
  Prévoir le dépassement (notation scientifique au-delà d'un seuil).
- **Sauvegarde versionnée** : tout changement de schéma de save ajoute une
  migration. Ne jamais casser une sauvegarde existante sans migration.
- **Pas de dépendances inutiles** : préférer des solutions custom légères pour
  la faible complexité (ex : i18n custom plutôt que i18next).

---

## Règles de développement

### Structure
- `src/lib/` : logique pure, zéro import React.
- `src/data/` : contenu et équilibrage (modifiable sans toucher au moteur).
- `src/store/` : stores Zustand uniquement.
- `src/hooks/` : hooks React uniquement.
- `src/i18n/` : tout le système de traduction.
- `src/components/` : organisé par domaine (`ui/`, `game/`, `layout/`), pas par
  type technique. Un composant par fichier. Barrel `index.ts` seulement pour
  les modules multi-fichiers.
- **Taille des fichiers** : viser < ~300 lignes ; au-delà, découper.

### Qualité du code
- **Factoriser, ne pas dupliquer** : extraire les helpers et composants
  réutilisables (ex : `tests/helpers.ts`, `components/ui/`). Pas de copier-coller.
- **Pas de code mort** : tout export doit être utilisé, ou testé s'il s'agit
  d'une API destinée à l'UI à venir. Supprimer le non utilisé.
- **Composants réutilisables séparés** : un composant = un fichier ; sortir des
  écrans tout bloc réutilisable (ne pas tout inliner dans `App`).
- **Commentaires utiles seulement** : expliquer le pourquoi / le non-évident et
  référencer les docs ; ne jamais paraphraser le code.

### Tests
- **Logique pure entièrement testée** (engine, graph, crises, prestige, save,
  format) ; on teste la mécanique, pas l'équilibrage (les nombres bougent).
- **Tests de composants** sur les interactions clés (rendu, i18n, achat,
  passage d'ère) via Testing Library.
- Helpers de test partagés dans `tests/helpers.ts`.

### i18n (bilingue, FR d'abord)
- **FR = langue source** (`translations/fr.ts`) d'où sont dérivées les clés
  typées ; **EN doit fournir toutes les clés** (sinon erreur de type).
- Tout texte affiché passe par `t(clé)`, jamais de chaîne en dur.
- **Références culturelles** : utiliser la formulation OFFICIELLE de chaque
  langue ; recréer les jeux de mots, ne pas traduire littéralement. Voir
  [NARRATIVE.md](./docs/NARRATIVE.md) (section Localisation).

### Principes produit (à respecter dans toute l'UI)
- **Découverte progressive (anti-spoiler)** : ne JAMAIS révéler dans l'UI les
  ères ou contenus non débloqués (pas de liste, de compteur total, d'aperçu de
  la fin). Verrouillé = caché, pas grisé-nommé. Voir
  [GAME-DESIGN.md](./docs/GAME-DESIGN.md) section 7.1.
- **Qualité visuelle** : interface jolie, agréable, soignée, équilibrée
  (hiérarchie, rythme, palette, feedback sobre, densité maîtrisée). Voir
  [UI-UX.md](./docs/UI-UX.md) section 0.
- **Accessibilité (à vérifier à CHAQUE étape)** : tout cliquable est un
  bouton/lien avec libellé accessible ; icônes décoratives en `aria-hidden` ;
  champs avec label ou `aria-label` ; **focus clavier visible** ; contrastes
  suffisants (y compris icônes sur fond d'accent) ; `lang` du document = langue
  courante ; barres de progression en `role="progressbar"` ; groupes/nav
  étiquetés ; ne jamais coder l'information par la seule couleur.
- **Automatisation** : clicker standard (clic -> générateurs/usines ->
  automatisation), pour garder la complexité ressentie constante. Voir
  GAME-DESIGN section 5.

### Qualité (avant de considérer une tâche terminée)
- `make check` doit passer (build + lint + typecheck + tests unitaires).

---

## Commandes (Makefile)

| Commande | Effet |
|---|---|
| `make install` | Installe les dépendances |
| `make start` | Lance le serveur de dev (http://localhost:1138) |
| `make build` | Build de production |
| `make lint` | ESLint |
| `make format` | Formate avec Prettier |
| `make typecheck` | Vérifie les types |
| `make test` | Tests unitaires (e2e : `make test-e2e`) |
| `make fix` | Format + lint |
| `make check` | build + lint + typecheck + tests unitaires |

---

## Décisions de conception (verrouillées)

- **Stack** : React 19 + Vite + Zustand + Tailwind (standard maison).
- **Économie** : réseau de ressources qui se combinent + méta-ressource
  (Complexité) + prestige final (Échos). Voir [GAME-DESIGN.md](./docs/GAME-DESIGN.md).
- **Découpage** : **20 ères** validées (dérivées de la chronologie réelle), avec
  cohabitation et chaînage inter-ères. Voir [PHASES.md](./docs/PHASES.md).
- **Automatisation** : usines/générateurs façon clicker standard (GAME-DESIGN 5).
- **Crises (régressions)** : effondrement partiel puis rebond amélioré, échos
  réduits de l'explosion finale (GAME-DESIGN 6).
- **Découverte progressive** : aucune ère future dévoilée dans l'UI (GAME-DESIGN 7.1).
- **UI** : coquille stable + **widgets iconiques interactifs** + transformations
  par paliers (marquées à l'apparition de la vie et des sociétés) + **exigence
  de qualité visuelle**. Voir [UI-UX.md](./docs/UI-UX.md).
- **Ton** : émerveillement scientifique + humour parsemé (chute comique finale) ;
  références renommées/parodiques, localisées FR/EN. Voir [NARRATIVE.md](./docs/NARRATIVE.md).
- **Science** : les ères réalistes respectent l'état des connaissances ; toute
  affirmation est sourcée dans [SCIENCE.md](./docs/SCIENCE.md). Le découpage
  des ères est dérivé de la chronologie réelle, pas l'inverse.
- **Port de dev** : 1138.

---

## Conventions globales du dépôt

- **Code en anglais** : commentaires, identifiants (ids de ressources,
  générateurs, convertisseurs, ères, crises, méta-upgrades), noms de variables
  et de fonctions. Ne jamais mélanger français et anglais dans le code. Seules
  les **valeurs de traduction** (`src/i18n/translations/fr.ts` / `en.ts`) sont
  localisées : c'est du contenu, pas du code. Les clés i18n suivent les ids
  anglais (`res.<id>`, `gen.<id>`...).
- **Commits** : pas de trailer `Co-Authored-By`. Auteur = le compte git de
  Julien uniquement.
- **Typographie** : ne jamais introduire de tiret long (em-dash `—` ou en-dash
  `–`) dans le code, les chaînes affichées, les commentaires ou la doc.
  Utiliser un tiret ASCII `-`, deux-points, parenthèses, ou reformuler.
