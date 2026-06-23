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
| Knip | Détection des fichiers / exports / dépendances inutilisés |

Choix validés : voir la section "Décisions" plus bas et
[GAME-DESIGN.md](./docs/GAME-DESIGN.md).

---

## Architecture (cible)

> Principe directeur : **data-driven**. Le moteur de jeu est générique ; les
> ères, ressources, générateurs et convertisseurs sont décrits en **données**,
> pas en code. Ajouter une ère générique coûte surtout du contenu. **Exception
> assumée** : une ère dotée d'un widget interactif portant sa mécanique (ex : le
> tableau périodique, `components/game/widgets/PeriodicTable.tsx` + `interactive.ts`)
> demande aussi un composant. Voir [GAME-DESIGN](./docs/GAME-DESIGN.md) section 7.

État actuel : jouable de bout en bout (moteur, 19 ères, prestige, crises,
widgets interactifs sur-mesure pour la plupart des ères, galets de l'infini,
fond de scène par palier, modales d'évènements). Arborescence :

```
src/
├── lib/                  # Logique pure, zéro React (entièrement testée)
│   ├── types.ts          # Types du domaine (Era + layout, Resource, Generator, Converter, Crisis, MetaUpgrade, GameState...)
│   ├── engine/           # Moteur découpé par préoccupation (barrel index.ts, API stable `@/lib/engine`) : cost, eras (palier/déblocage), multipliers (galets/mémoire/rebonds dérivés), rates (débits single-source), complexity, actions (achats/clic/conversion), tick ; gèle la production des ressources touchées par une crise active et bloque le palier tant qu'elle n'est pas résolue
│   ├── graph.ts          # Flux nets réels + alertes (ressources en déclin / production à zéro), dépendances, tri
│   ├── reveal.ts         # Dévoilement progressif (machines / ressources)
│   ├── events.ts         # Évènements narratifs déclenchés (transitions, crises, tuto)
│   ├── crises.ts         # Crises : risque, déclenchement, régression/rebond
│   ├── prestige.ts       # Échos + reset New Game+
│   ├── meta.ts           # Méta-upgrades de prestige
│   ├── save.ts           # État initial, sérialisation versionnée (SAVE_VERSION = 7) + migrations, idle, export/import ; enveloppe SIGNÉE (intégrité) : rejet de toute save non signée ou modifiée
│   ├── integrity.ts      # Empreinte légère (cyrb53 + sel) anti-triche de save : ralentisseur, pas inviolable (jeu front-end open source)
│   ├── format.ts         # Notation abrégée des grands nombres
│   ├── galets.ts         # Galets de l'infini : découverte (palier OU widget), galets affectant générateur/convertisseur/Complexité
│   ├── memory.ts         # Mini-jeu de mémoire (ère 7+) : déblocage, coût (10% Complexité), 3 niveaux par ère (×2/×4/×8) ; helpers purs partagés avec le sim
│   └── inventory.ts      # Sac à dos : déblocage (apparition d'une ressource) + ressources connues groupées par ère
├── data/                 # Contenu data-driven (modifiable sans toucher au moteur)
│   ├── eras/             # Toutes les ères via factory.ts (buildEra) : cosmos (e1-5), life, civilization, space, transcendence ; easing tardif (LATE_FROM, prod ↑ / conso ↓ composées) à partir de l'ère 12 seulement
│   ├── crises.ts         # Définitions de crises
│   ├── metaUpgrades.ts   # Définitions des méta-upgrades
│   ├── galets.ts         # Définitions des galets de l'infini (collectibles conservés au prestige)
│   └── index.ts          # defs : GameDefs (agrégation typée)
├── store/                # Stores Zustand : gameStore (persisté ; sauve aussitôt les actions de progression discrètes) ; feedbackStore, clickPulse, eventStore, galetStore, crisisStore, endgameStore (modale de fin) ; highlightStore (factory) + memoryStore/inventoryStore/rebirthStore (signaux d'atterrissage de bouton dérivés de la factory) ; tous transitoires sauf gameStore
├── i18n/                 # i18n custom (FR source de vérité, EN typé complet) ; locale persistée en localStorage
├── hooks/                # useTick (boucle + autosauvegarde), useEvents (modales), useGalets (découverte), useMilestone (jauge/bouton de palier), useArrivalReward (récompense d'arrivée d'ère), useSimLoop (boucle d'animation locale d'un widget), usePageHidden (pause hors onglet), useEndgame (arme la crise de fin en ère 19), useCrisisWin (séquence de victoire partagée des mini-jeux de crise), useFlipIntro (atterrissage FLIP partagé des boutons mémoire/sac/renaissances)
├── components/           # Par domaine ; un composant par fichier
│   ├── ui/               # Primitives (Button, Panel, Icon, IconBadge, AlertBadge, FloaterLayer...) ; helper introRect.ts + FlipIntroClone (clone animé partagé, cf. useFlipIntro)
│   ├── art/              # GRAPHISME exclusivement : glyphs/ (icônes custom du registre Icon), illustrations (Galet, Sauropod, OrganismGlyph, PartGlyph, CrisisCreatures, CrisisScene, ChainReactionScene, UniverseCityScene)
│   ├── game/             # Ressources, machines, paliers, badges, galets ; modales d'évènements (EventModal + EventHero, layout « hero » partagé typé) ; crise (CrisisBanner, CrisisGame plein écran + crisisWorld.ts, ResourceCrisisBadge, mini-jeux ExtinctionGame/RevoltGame/SpiceGame/SurviveGame/GasLeakGame via useCrisisWin) ; fin de jeu (EndGameModal, RebirthButton/RebirthModal) ; jeu de mémoire (MemoryFeature/MemoryGame/MemoryCards/memoryDeck/Answer42+EraSymbolCluster, police Neogen) ; inventaire (InventoryButton/InventoryModal) ; helper eraTitle.ts (titre « Ère N : ... »)
│   │   └── widgets/      # Widgets d'ère : passifs + 10+ interactifs (BohrAtom, StarNursery, PeriodicTable, AccretionDisk, MoleculeBuilder, PetriDish, SingularityWidget de fin...) routés par interactive.ts ; clic d'ère via useEraMechanic ; helpers svgCoords.ts, StarField.tsx
│   └── layout/           # Coquille, navigation d'ères, EraTransition (glissement), SceneBackground (dispatcher) + scenes/ (un fichier de fond par palier + shared.ts/Defs.tsx), GaletReceptacle ; eraLayout.ts (disposition de page par ère, EraLayoutName) ; LanguageSwitch, SaveMenu
└── App.tsx               # Navigation par état (pas de router)
tests/
├── helpers.ts            # Helpers partagés (makeState) - éviter la duplication
├── unit/                 # Vitest - logique pure
├── component/            # Vitest + Testing Library
└── e2e/                  # Playwright (smoke)
sim/                      # Harnais de simulation d'équilibrage (exclu de make check)
├── profiles.ts           # Profils de joueur (minimal, idle, casual, active, optimal)
├── simulate.ts           # Boucle de simulation headless (temps/palier, retours arrière, activation)
├── run.sim.ts            # Écrit un snapshot daté par `make sim` (sim/results/<runId>/), élague les vieux
└── viewer/               # Visualisation comparée ; superpose plusieurs snapshots successifs (make sim-view)
```

---

## Contraintes techniques

- **100% front-end** : aucun appel serveur, pas de backend, pas d'API distante.
- **Pas de SSR** : Vite SPA uniquement. Ne pas introduire Next.js ou Remix.
- **Alias `@/`** pointe vers `src/`. Toujours l'utiliser pour les imports
  internes, jamais de chemins relatifs `../../`.
- **Tailwind v4** : `@import 'tailwindcss'` dans le CSS, pas de
  `tailwind.config.js`. Classes utilitaires par défaut.
- **Thèmes centralisés** : un thème par palier d'UI (cosmos, life,
  civilization, space, transcendence), défini dans `src/theme.css` via
  `@theme inline` + variables CSS basculées par `data-tier`. Les composants
  utilisent **uniquement les jetons sémantiques** (`bg-bg`, `bg-surface`,
  `text-fg`, `text-muted`, `text-accent`, `border-border`, `text-octarine`) :
  **jamais de couleur en dur**. CSS brut limité à `index.css` (reset) et
  `theme.css`.
- **Pas de CSS local répété** : un motif de classes répété devient un composant
  réutilisable (`components/ui/`), pas du copier-coller.
- **TypeScript strict** : `noUnusedLocals`, `noUnusedParameters`,
  `noUncheckedIndexedAccess` activés. Ne pas les désactiver.
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
  la fin). Verrouillé = caché, pas grisé-nommé. **Aussi à l'intérieur d'une
  ère** : machines et ressources se dévoilent une par une (`src/lib/reveal.ts`).
  Voir [GAME-DESIGN.md](./docs/GAME-DESIGN.md) section 7.1.
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
- `make check` doit passer (build + lint + typecheck + knip + tests unitaires).

### Checkup complet du projet

Un « checkup » (revue de santé globale, au-delà d'une tâche ponctuelle) couvre
les dimensions suivantes. À dérouler dans l'ordre ; chaque point est à corriger,
pas seulement à constater.

1. **Porte qualité** : `make check` vert (build + lint + typecheck + knip +
   tests). `make knip` signale fichiers, exports et dépendances inutilisés (à
   nettoyer, pas seulement constater). Le harnais de simulation (`sim/`) en est
   exclu ; le relancer (`make sim`) si l'équilibrage a bougé.
2. **Typographie** : aucun tiret long (`—`/`–`) dans le code, les chaînes, les
   commentaires, la doc (l'exemple de la règle dans cet AGENTS est la seule
   occurrence tolérée). Recherche : `grep -rnP "[\x{2014}\x{2013}]"`.
3. **Couleurs en dur** : les composants n'utilisent que les jetons sémantiques.
   Exceptions documentées et tolérées : badges d'alerte (`bg-red-500` /
   `bg-yellow-400`), bannière de crise et glow rouge danger (`EventHero`,
   `CrisisScene`, `#ef4444`), scrim de modale (`bg-black/60`), dégradé de
   température de `CoolingWidget`, **vert de la zone cible d'`AtmosphereBalance`**
   (`#22c55e`), **verts du feuillage du décor terrestre**
   (`scenes/LandScene` ère 10), **couleurs d'illustration des mini-jeux de crise**
   (fonds rouge sombre `#1a0d12`/`#140a0e`, flammes `#f59e0b`/`#fde68a`, ver
   d'épice `#e8a13a`, rouge danger `#ef4444` : `ExtinctionGame`, `RevoltGame`,
   `SpiceGame`, `GasLeakGame`, `art/CrisisCreatures`, `art/CrisisScene`,
   `art/ChainReactionScene`), et `theme.css` / `index.css` (CSS brut autorisé).
   Tout nouveau hex hors de ces cas est à remplacer par un jeton.
4. **i18n** : parité stricte FR/EN (même nombre de clés), tout texte via `t()`,
   aucune chaîne affichée en dur.
5. **Accessibilité** (voir la checklist « Principes produit » ci-dessus) :
   cliquables = boutons/liens étiquetés, focus clavier visible (y compris les
   cibles SVG `role="button"` : prévoir un `strokeWidth` + `focus-visible:`),
   icônes décoratives `aria-hidden`, alertes jamais portées par la seule
   couleur, `progressbar` correctement balisées, `lang` du document à jour.
6. **Qualité du code** : factorisation / déduplication (un motif répété devient
   un helper `src/lib` ou `src/hooks`, ou un composant `components/ui/`), pas de
   code mort (export non importé et non testé), fichiers < ~300 lignes.
7. **Commentaires** : utiles seulement (le pourquoi / le non-évident) ; supprimer
   ceux qui paraphrasent le code.
8. **Icônes uniques** : un même glyphe ne représente JAMAIS deux entités
   différentes. Chaque icône (onglet d'ère, ressource, générateur...) est propre
   à une seule chose ; en cas de collision, changer l'un des deux (en général
   l'onglet d'ère, en gardant la ressource = l'objet littéral). Exception : les
   ressources à symbole chimique (`symbol`) affichent leur **symbole** (C, He,
   Si...), pas leur glyphe `icon`, donc ne créent pas de doublon visuel. Pour
   vérifier : extraire tous les `icon:` des données d'ères et confirmer l'unicité
   (en ignorant les ressources à `symbol`).
9. **Documentation** : AGENTS.md (arborescence, règles), `docs/` et `README.md`
   reflètent l'état réel du code (nouvelles ères, widgets, systèmes).

---

## Commandes (Makefile)

| Commande | Effet |
|---|---|
| `make install` | Installe les dépendances |
| `make start` | Lance le serveur de dev (http://localhost:1138) |
| `make build` | Build de production |
| `make lint` | ESLint |
| `make knip` | Détecte fichiers / exports / dépendances inutilisés |
| `make format` | Formate avec Prettier |
| `make typecheck` | Vérifie les types |
| `make test` | Tests unitaires (e2e : `make test-e2e`) |
| `make fix` | Format + lint |
| `make check` | build + lint + typecheck + knip + tests unitaires |
| `make sim` | Lance les simulations d'équilibrage (génère `sim/results/*.json`) |
| `make sim-view` | Affiche l'URL du visualiseur graphique (nécessite `make start`) |

---

## Décisions de conception (verrouillées)

- **Stack** : React 19 + Vite + Zustand + Tailwind (standard maison).
- **Économie** : réseau de ressources qui se combinent + méta-ressource
  (Complexité) + prestige final (Échos). Voir [GAME-DESIGN.md](./docs/GAME-DESIGN.md).
- **Découpage** : **19 ères** (dérivées de la chronologie réelle), avec
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
