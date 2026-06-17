# Big Bang Clicker - Roadmap

> Plan de conception puis de développement. Principe directeur : **valider le
> design d'abord, livrer une tranche verticale jouable ensuite, puis dérouler
> les ères une par une** sur un moteur générique data-driven.

## Phase A - Conception (en cours)

Objectif : un dossier de doc complet et validé avant d'écrire le moteur.

- [x] Décisions structurantes (stack, économie, UI, science, automatisation,
      crises, humour).
- [x] `docs/GAME-DESIGN.md` - boucle, économie réseau, automatisation, crises,
      prestige, ton/humour, équilibrage.
- [x] `docs/PHASES.md` - les 19 ères détaillées (découpage validé).
- [x] `docs/SCIENCE.md` - recherche sourcée (cosmologie vérifiée ; partie
      bio/anthropo marquée **à re-sourcer**).
- [x] `docs/UI-UX.md` - coquille stable, paliers, design system, widgets
      iconiques interactifs.
- [x] `docs/ARCHITECTURE.md` - moteur data-driven, modèle de données, stores,
      save/export, i18n.
- [x] **Re-sourcer** la partie biologique/anthropologique de SCIENCE.md (passe
      légère : dates de consensus mainstream + jalons débattus signalés).
- [ ] Revue et validation finale par le porteur du projet.

## Phase B - Fondations techniques (infra maison)

Objectif : un projet qui démarre, lint, teste et build, conforme au standard
de `./MyRepos`.

- [ ] Scaffold Vite + React 19 + TypeScript strict.
- [ ] Tailwind v4 (`@tailwindcss/vite`), alias `@/`.
- [ ] ESLint (typescript-eslint) + Prettier (config maison).
- [ ] Vitest + Testing Library ; Playwright pour l'e2e.
- [ ] `Makefile` (install/start/build/lint/format/typecheck/test/fix/check).
- [ ] `AGENTS.md` + `CLAUDE.md` + `README.md`.
- [ ] CI minimale (à aligner sur tes autres repos si tu en as une).

## Phase C - Moteur de jeu générique

Objectif : un moteur qui sait jouer **une** ère, piloté par des données.

- [x] Types du domaine (`src/lib/types.ts`) : Era, Resource, Generator,
      Converter, Crisis, GameState.
- [x] Moteur de tick (`engine.ts`) : production, conversions bornées,
      coûts géométriques, achats, Complexité.
- [x] `src/lib/format.ts` (notation abrégée des grands nombres).
- [x] Réseau de ressources (`graph.ts`) : flux nets, dépendances, tri topo.
- [x] Crises (`crises.ts`) : risque, déclenchement, régression/rebond.
- [x] Prestige (`prestige.ts`) : calcul des Échos, reset New Game+.
- [x] Store Zustand (`gameStore`) + boucle de tick (`useTick`).
- [x] Sauvegarde localStorage + idle hors-ligne + export/import versionné, avec
      empreinte d'intégrité (rejet d'une save modifiée ; cf. ARCHITECTURE 9).
- [x] Tests unitaires (moteur, graph, crises, prestige, save+intégrité, galets,
      inventaire, méta, mémoire) : on teste la mécanique, pas les nombres.
- [x] i18n bilingue (FR par défaut, EN proposé) : clés typées, store, hook,
      sélecteur de langue dans l'UI, persistance localStorage.
- [ ] Reste à venir : `settingsStore` (dark mode, plafond idle), et le
      remplissage des traductions au fil du contenu.

## Phase D - Tranche verticale (vertical slice)

Objectif : **2 ères jouables et reliées**, pour valider le fun et la
cohabitation avant de produire les 19.

- [x] Ère 1 (Refroidir) + Ère 2 (Recombinaison) jouables (data-driven).
- [x] Passage d'ère + cohabitation (la recombinaison consomme les nucléons de
      l'ère 1, qui doit continuer de tourner).
- [x] Méta-ressource Complexité fonctionnelle.
- [x] Coquille UI du tier COSMOS (GameShell, panneaux ressources/production,
      clic, onglets d'ères) + thème par palier via data-tier.
- [x] UI bilingue (FR/EN), primitives réutilisables (`ui/Button`, `ui/Panel`),
      curseur sur les cliquables, jetons de thème partout.
- [ ] Playtest et ajustement de l'équilibrage (chiffres encore bruts).
- [ ] (Plus tard) un palier de transformation visible nécessite une ère d'un
      autre tier (VIVANT) : à voir en phase E.

## Phase E - Déroulé des ères

Objectif : ajouter les ères par lots cohérents (par tier UI), en réutilisant
le moteur. Pour chaque ère : données, contenu narratif, mini-système éventuel,
traductions FR/EN, tests.

- [x] Tier COSMOS : ères 3 (premières étoiles & galaxies), 4 (forges
      stellaires), avec chaînage inter-ères (étoiles <- hydrogène, forges <-
      étoiles).
- [x] Widgets iconiques centraux (scène cliquable) : jauge de refroidissement,
      atome de Bohr, galaxie spirale, tableau périodique (SVG animés).
- [x] **Toutes les ères 5 à 19** créées (data-driven via fabrique `buildEra`),
      bilingues FR/EN, avec chaînage inter-ères et déblocage par Complexité.
      Thèmes par tier (cosmos/vivant/civilisation/spatial/transcendance) appliqués.
- [x] **Prestige** (ère 19, finale "Explosion") : bandeau "Renaissance",
      conversion en Échos, reset.
- [x] **Crises (régressions)** : extinction (e11), révolte de Starpacus
      (e13), crises de l'ère industrielle dont l'arme atomique (e15), première
      rencontre (e17) ; bandeau de crise + résolution.
- [x] Widget générique de repli + widgets dédiés à **chaque** ère (jauge,
      atome de Bohr, pépinière, tableau périodique, accrétion, molécules, Petri,
      balance, endosymbiose, assemblage, arbre, mémoire, cité, carte, inventions,
      fusée, relais à effet de masse, unification).
- [x] Mini-systèmes spécifiques (arbre phylogénétique, carte Risk...).
- [x] **Code 100% anglais** (ids, commentaires, clés i18n) ; seules les valeurs
      de traduction sont localisées.

## Phase F - Finition

- [~] Équilibrage : seuils abaissés (×~3,2 par ère) pour rendre l'arc
      franchissable ; reste à affiner finement en playtest.
- [x] **Méta-upgrades** (dépense des Échos) : multiplicateurs de production
      globaux permanents, persistants à travers les renaissances.
- [ ] Onboarding / tutoriel léger.
- [x] Accessibilité (passe faite : focus, aria, contrastes, lang, progressbar).
- [ ] Responsive mobile à peaufiner ; dark mode (déjà sombre par défaut) options.
- [x] Traduction EN complète (typage garantit la complétude des clés).
- [ ] (Optionnel) PWA, son, succès.
- [ ] Déploiement (statique).

## Principes de travail

- **Data-driven d'abord** : on ne code pas une ère "en dur", on la décrit en
  données et le moteur la joue. Ajouter une ère doit coûter surtout du contenu.
- **Tester le moteur, pas les nombres** : les tests valident la mécanique
  (coûts, production, save), pas l'équilibrage (qui bouge en permanence).
- **Petits incréments validables** : chaque phase de la roadmap produit
  quelque chose de démontrable.
