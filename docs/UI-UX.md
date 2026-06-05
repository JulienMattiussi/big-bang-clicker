# Big Bang Clicker - UI / UX

> Conception de l'interface : coquille stable, scènes d'ère, et surtout le
> pilier des **widgets iconiques interactifs** (un visuel familier et jouable
> par ère). Voir aussi [GAME-DESIGN.md](./GAME-DESIGN.md),
> [PHASES.md](./PHASES.md), [ARCHITECTURE.md](./ARCHITECTURE.md).
>
> Statut : **en cours**. Le design system et le concept de widgets iconiques
> sont posés. Le mapping précis widget <-> ère sera figé avec le redécoupage
> des phases (recherche scientifique en cours).

## 0. Exigence de qualité visuelle (principe transverse)

L'interface doit être **jolie, agréable, soignée et équilibrée**. Pour un jeu
qu'on regarde longtemps, ce n'est pas cosmétique : c'est central. Ce principe
guide chaque écran et chaque revue d'UI. Critères concrets (vérifiables) :

- **Hiérarchie visuelle claire** : l'oeil sait où regarder (taille, poids,
  couleur, espacement) ; l'action principale ressort.
- **Rythme et équilibre** : grille cohérente, espacements réguliers (échelle
  d'espacement), aucun panneau à l'étroit ni de vide maladroit ; la coquille en
  colonnes reste équilibrée à toutes les tailles.
- **Palette harmonieuse** : couleurs par palier accordées (voir section 4),
  contrastes suffisants (accessibilité), pas de couleurs criardes hors accents.
- **Typographie lisible** : tailles et interlignes confortables, nombres
  alignés et formatés (`format.ts`), libellés courts.
- **Feedback satisfaisant ("juice")** : un clic, un achat, un déblocage
  procurent un retour visuel net mais sobre ; animations utiles, jamais
  gratuites, respectant `prefers-reduced-motion`.
- **Densité maîtrisée** : malgré beaucoup de ressources/usines, l'écran ne
  sature pas (divulgation progressive, regroupements, états repliés).
- **Cohérence** : mêmes composants, mêmes marges, mêmes rayons partout ; le
  soin du détail (icônes, alignements, transitions de palier) est constant.
- **Responsive et accessible** : aussi soigné sur mobile que sur desktop ;
  navigable au clavier, contrastes et tailles respectés.

En cas de doute lors d'une revue : préférer la sobriété élégante au surchargé.

## 1. Pilier : des widgets iconiques interactifs

Chaque ère a, au centre de sa scène, un **élément visuel iconique et
reconnaissable** qui sert de **panneau de jeu interactif**. Ce n'est pas un
décor : c'est l'interface de la mécanique de l'ère. On clique dessus, on le
fait évoluer, il reflète l'état du jeu.

Objectifs :

- **Familiarité** : le joueur reconnaît immédiatement le visuel (un atome de
  Bohr, le tableau périodique, la Voie lactée...).
- **Pédagogie implicite** : la mécanique épouse la réalité représentée.
- **Renouvellement** : changer de widget = changer de "verbe" et de sensation,
  ce qui matérialise les transformations d'UI par paliers.
- **Mémorabilité** : chaque ère a une identité visuelle forte.

### 1.1 Catalogue de widgets (proposition, mapping provisoire)

| Widget iconique | Idée d'interaction | Ère(s) candidate(s) |
|---|---|---|
| **Soupe de plasma / jauge de température** qui se refroidit | cliquer pour dissiper l'énergie, voir les particules se figer | Big Bang (refroidir) |
| **Atome de Bohr** (noyau + électrons sur orbites) | assembler nucléons, capturer des électrons, couches qui se remplissent | Atomes |
| **Tableau de Mendeleïev** cliquable | débloquer/produire les éléments un par un, bonus par case, familles colorées | Atomes (et lourds via étoiles) |
| **Vue de la Voie lactée** (spirale, systèmes) | accréter de la matière, allumer des étoiles, cliquer des systèmes | Astres / sociétés spatiales |
| **Disque d'accrétion / collisions** | combiner poussière -> planétésimaux -> planètes | Corps astraux |
| **Vue en coupe d'un volcan / d'une planète** | gérer dégazage, atmosphère, océans (jauges sur une coupe) | Planète habitable |
| **Molécules en "boules et bâtons"** (ball-and-stick) | assembler atomes en molécules, monter en complexité (ARN, protéines) | Briques de la vie |
| **Cellule en coupe** (membrane, organites) | division, endosymbiose, ajout d'organites | Premières vies |
| **Arbre phylogénétique** | étendre des branches, débloquer des clades, gérer des extinctions | Plantes / Créatures / Évolution |
| **Frise / campement préhistorique** | débloquer feu, outils, langage (hotspots) | Intelligence |
| **Plan de cité / vue isométrique** | poser et améliorer des bâtiments | Sociétés |
| **Carte type "Risk"** (territoires) | commerce vs guerre, contrôle de zones, fronts | Relations inter-sociétés |
| **Arbre technologique** (tech tree) | rechercher et débloquer des noeuds | Technologies |
| **Étages de propulsion d'une fusée** | empiler/améliorer des étages, séquence de lancement | Conquête spatiale |
| **Carte galactique / sphère de Dyson** | coloniser des systèmes, méga-structures | Sociétés galactiques |
| **Toile cosmique / amas de galaxies** | relier des galaxies par des filaments, activer des noeuds | Sociétés intergalactiques |
| **Ville-univers / horloge cosmique** | unifier, jauge de complétude qui sature | Ville-univers |
| **Singularité / écran qui explose** | déclencher le prestige (transition spectaculaire) | Explosion |

Le mapping définitif sera arrêté après le redécoupage des ères. Un widget peut
réapparaître à une autre échelle (la Voie lactée à l'ère des astres puis à
l'ère spatiale).

### 1.2 Règles d'intégration des widgets

- **Reconnaissable sans expertise** : le visuel doit parler à tous ; les
  détails scientifiques exacts sont un bonus (infobulles), pas un prérequis.
- **Interactif, pas figé** : on clique, on glisse, ça réagit et ça reflète
  l'état réel du jeu (ressources, production).
- **Divulgation progressive** : le widget commence simple et se densifie au fur
  et à mesure des déblocages (le tableau périodique se remplit, l'arbre pousse).
- **Data-driven** : le contenu du widget vient des données du jeu (éléments,
  clades, territoires, noeuds tech), pas codé en dur. Voir
  [ARCHITECTURE.md](./ARCHITECTURE.md).
- **Dégradé gracieux** : sur petit écran ou en cas de perf limitée, une version
  compacte/simplifiée reste jouable.
- **Accessibilité** : chaque zone interactive a un équivalent texte/clavier ;
  ne pas dépendre uniquement de la couleur.

## 2. Coquille stable + scènes d'ère

L'application garde une **coquille** constante autour d'une **scène** centrale
qui change selon l'ère active.

```
┌───────────────────────────────────────────────────────────┐
│  Barre haute : titre de l'ère active · Complexité · Échos  │
├───────────┬───────────────────────────────────┬───────────┤
│ Ressources│                                   │ Upgrades /│
│ + flux    │      SCÈNE (widget iconique)      │ achats    │
│ nets      │      de l'ère active              │ de l'ère  │
│ (par ère) │                                   │           │
├───────────┴───────────────────────────────────┴───────────┤
│  Navigation entre ères débloquées (onglets / frise)        │
└───────────────────────────────────────────────────────────┘
```

- **Panneau ressources** : liste des ressources avec **production nette**
  (+entrées / -consommation), pour rendre lisible le réseau de combinaison.
- **Scène centrale** : le widget iconique de l'ère.
- **Panneau achats** : générateurs, convertisseurs, upgrades de l'ère.
- **Navigation** : la frise n'affiche **que les ères débloquées**
  (cohabitation) ; l'ère active reçoit le focus (léger bonus, voir
  [GAME-DESIGN.md](./GAME-DESIGN.md)). **Aucune ère future n'est montrée ni
  nommée** (principe anti-spoiler, voir GAME-DESIGN section 7.1) : pas de cases
  "à venir", pas de compteur d'ères totales, pas d'aperçu de la fin.

## 3. Paliers de transformation de l'UI

Décision validée : coquille stable **avec transformations profondes par
paliers**, plus marquées aux ères critiques.

| Palier (tier) | Ères (provisoire) | Identité visuelle | Transformation |
|---|---|---|---|
| COSMOS | Big Bang -> planète | noir spatial, particules, lueurs froides | base |
| VIVANT | apparition de la vie -> intelligence | matières organiques, palette chaude, arbre du vivant | **majeure** (1er grand basculement) |
| CIVILISATION | sociétés -> technologies | cartes, bâtiments, interface "humaine" | **majeure** (2e grand basculement) |
| SPATIAL | conquête -> ville-univers | cartes stellaires, panneaux de flotte | marquée |
| TRANSCENDANCE | explosion | contraction puis explosion -> prestige | spectaculaire |

Les deux transformations majeures (apparition de la vie ; apparition des
sociétés) modifient la mise en page, la palette et l'iconographie, pas
seulement les libellés. Les autres ères changent surtout leur scène/widget.

## 4. Design system

- **Thèmes centralisés (un par palier)** : tout le style passe par des **jetons
  sémantiques** définis dans `src/theme.css` via Tailwind v4 (`@theme inline` +
  variables CSS). Chaque palier (cosmos, vivant, civilisation, spatial,
  transcendance) est un **thème** qui redéfinit les variables ; basculer
  l'attribut `data-tier` re-thématise toute l'UI en dessous.
- **Jetons disponibles** : `bg-bg`, `bg-surface`, `text-fg`, `text-muted`,
  `text-accent` / `bg-accent`, `border-border`, `text-octarine` (couleur rare).
- **Règle stricte** : les composants utilisent **uniquement ces jetons**, jamais
  de couleur en dur ni de **CSS local répété**. Un motif de classes qui se
  répète devient un **composant réutilisable** (`components/ui/`). Le CSS brut se
  limite à `index.css` (reset) et `theme.css` (jetons/thèmes).
- **Transition douce** au changement de palier (sur les variables de couleur).
- **Dark mode** d'abord (thème cosmique sombre), clair en option.
- **Typo** : une police lisible pour l'UI, éventuellement une police d'accent
  pour le narratif. Pas de tiret long dans les textes (règle dépôt).
- **Composants UI primitifs** : `Button`, `Panel`, `Resource`, `Number`
  (formaté via `lib/format.ts`), `Tooltip`, `Tab`. Réutilisés partout.
- **Animations** : sobres et informatives (une combinaison réussie, un
  déblocage). Respecter `prefers-reduced-motion`.
- **Responsive** : desktop en 3 colonnes ; mobile en colonnes empilées avec la
  scène en avant et les panneaux en tiroirs/onglets.

## 5. Approche technique des widgets

- **SVG d'abord** pour les diagrammes (tableau périodique, atome de Bohr,
  molécules, arbre phylogénétique, carte Risk, fusée, coupe de volcan). Le SVG
  est accessible, stylable en CSS, et lié au state React.
- **Canvas / WebGL** réservé aux scènes denses ou animées (Voie lactée, champ
  de particules, beaucoup d'éléments mobiles).
- **Composants génériques réutilisables** : un même composant de **graphe de
  noeuds** peut servir aux molécules, à l'arbre phylogénétique, à l'arbre
  technologique et à la **visualisation du réseau de ressources**. Identifier
  ces réutilisations pour ne pas réécrire 16 widgets isolés.
- **Performance** : limiter les re-renders (sélecteurs Zustand fins),
  virtualiser/throttler les widgets denses, ne monter que le widget de l'ère
  active.
- **Données** : chaque widget lit une structure de données dédiée
  (`src/data/`), jamais des valeurs en dur.

## 6. À trancher plus tard

- Le mapping définitif widget <-> ère (après redécoupage des phases).
- Le niveau d'animation/illustration (du schématique au plus illustré).
- L'ordre d'implémentation des widgets (priorité au vertical slice : Big Bang +
  Atomes, donc jauge de refroidissement + atome de Bohr + tableau périodique).
