# Big Bang Clicker - Game Design

> Document de conception du jeu. Définit la boucle de gameplay, le modèle
> économique unifié, le système de prestige et les principes d'équilibrage.
> Voir aussi [PHASES.md](./PHASES.md), [UI-UX.md](./UI-UX.md),
> [ARCHITECTURE.md](./ARCHITECTURE.md), [SCIENCE.md](./SCIENCE.md).

## 1. Pitch

Un jeu incrémental (clicker / idle) qui raconte l'histoire de l'univers, du
Big Bang jusqu'à une ville-univers qui ré-explose pour tout recommencer, en
mieux. Le joueur traverse 19 ères, chacune apportant un nouveau geste de jeu
(un "verbe"), tout en faisant cohabiter les ères déjà débloquées.

Références assumées : **Cell to Singularity** (même thème évolutif),
**Universal Paperclips** (renouvellement des mécaniques par actes),
**Antimatter Dimensions** (couches d'automatisation et prestige).

## 2. Boucle de gameplay (core loop)

```
        clic (verbe de l'ère)
                │
                ▼
        ressource locale  ──►  générateurs (production auto)
                │                      │
                │                      ▼
                │              convertisseurs (recettes)
                ▼                      │
        Complexité (méta) ◄───────────┘
                │
                ▼
        seuil atteint ──► nouvelle ère débloquée (nouveau verbe)
                │
                ▼
     ... 19 ères ... ──► ère 19 : explosion ──► PRESTIGE (New Game+)
```

Chaque ère est une instance du même moteur générique : une ressource locale,
des générateurs qui la produisent automatiquement, des convertisseurs qui
combinent les ressources, et une contribution à la méta-ressource commune.

## 3. Modèle économique (hybride + réseau de ressources)

Le cœur économique repose sur **de multiples ressources qui se combinent** en
ressources de plus en plus élaborées (complexité croissante). À cela
s'ajoutent une méta-ressource de progression et une monnaie de prestige.

### 3.1 Ressources multiples et combinatoires

Plutôt qu'une seule ressource par ère, le jeu manipule **plusieurs ressources
par ère**, organisées en un **réseau (graphe orienté) de combinaison** : les
ressources de bas niveau se combinent pour produire des ressources de plus
haut niveau.

- **Ressources de base** : produites directement (au clic ou par des
  générateurs). Ex : quarks, protons, hydrogène.
- **Ressources combinées** : produites par des **convertisseurs** (ou
  "recettes") qui **consomment** une ou plusieurs ressources d'entrée pour
  produire une ressource de sortie. Ex : `proton + neutron -> deutérium`,
  puis `deutérium + ... -> hélium`.
- Une ressource de sortie peut redevenir une **entrée** d'une combinaison plus
  avancée : on construit ainsi des **chaînes de production** qui s'allongent et
  se ramifient au fil du jeu.

Pourquoi c'est central :

- **Fun** : gérer des flux qui s'entrecroisent (équilibrer entrées/sorties,
  débloquer une nouvelle combinaison) est plus riche qu'un seul compteur.
- **Fidélité scientifique** : la matière se complexifie réellement par
  combinaison (nucléosynthèse, chimie, biochimie, biologie...). Le graphe de
  ressources peut suivre les vraies chaînes (voir [SCIENCE.md](./SCIENCE.md)).
- **Cohabitation forcée** : une combinaison d'une ère avancée consomme des
  ressources d'ères antérieures, donc les anciennes ères restent utiles et
  doivent continuer de tourner (voir section 4).

### 3.1bis Chaînes inter-ères

Le graphe de ressources **traverse les ères**. La sortie d'une ère est
souvent l'entrée d'une autre :

```
quarks ─► protons/neutrons ─► H, He (BBN) ─► [étoiles] ─► C, O, Fe... (éléments lourds)
        ─► molécules simples ─► acides aminés / nucléotides ─► protéines / ARN
        ─► protocellules ─► cellules ─► tissus ─► organismes ─► ...
```

Conséquence de design : débloquer une ère ne "remplace" pas la précédente,
elle **ajoute un étage** au réseau qui s'appuie sur les étages du dessous.

### 3.1ter Garde-fous (anti-frustration)

Un réseau de ressources peut vite devenir illisible ou se bloquer. Règles :

- **Introduction progressive** : peu de ressources au début, on en ajoute au
  rythme des ères. Ne jamais exposer tout le graphe d'un coup.
- **Pas de blocage dur** : les ressources de base gardent toujours une
  production minimale (au clic au pire), pour ne jamais se retrouver coincé.
- **Frontière active limitée** : à un instant donné, le joueur gère un nombre
  raisonnable de combinaisons "vivantes" ; les étages anciens tendent à
  s'automatiser (générateurs/convertisseurs auto).
- **Lisibilité** : visualiser les flux (production nette par ressource :
  +entrées / -consommation). Voir [UI-UX.md](./UI-UX.md).

### 3.2 Méta-ressource : la Complexité

La **Complexité** est le fil conducteur qui traverse toutes les ères. Elle se
gagne surtout en **réalisant des combinaisons** : plus une ressource est haute
dans le graphe (plus sa chaîne de production est profonde), plus elle rapporte
de Complexité. Le thème et la mécanique coïncident : la complexité émerge de la
combinaison. Elle suit la production **réelle** : tout multiplicateur de sortie
(mémoire, galets, rebond de crise, méta-upgrades de prestige) accélère donc la
Complexité **autant que** le stock. La Complexité :

- est la **monnaie de progression** : franchir un palier d'ère coûte de la
  Complexité (et/ou exige un seuil de ressource locale) ;
- est **persistante** entre ères (elle ne se reset pas au passage d'ère) ;
- sert de **monnaie de franchissement** : passer un palier d'ère exige un seuil
  de Complexité (elle n'est toutefois pas dépensée, cf. section 8). Le mini-jeu de
  mémoire (section 3.4) en mise une part comme puits optionnel.

### 3.3 Monnaie de prestige : les Échos

Au terme de l'ère 19 (la ville-univers se contracte puis explose), le joueur
déclenche un **nouveau Big Bang**. Tout est remis à zéro (ressources locales,
générateurs, convertisseurs, ères) SAUF les **Échos**. La séquence de fin est
détaillée en [PHASES.md](./PHASES.md) (ère 19).

Le joueur gagne **1 Écho par renaissance** (gain forfaitaire, crédité au moment
de l'effondrement pour être dépensable aussitôt). Chaque Écho achète **un** bonus
permanent (méta-upgrade) ; la modale de fin présente quatre choix mutuellement
finançables au fil des renaissances :

| Choix | Effet |
|---|---|
| Production globale | ×2 sur toute la production |
| Mémoire cosmique | ×1,5 sur la Complexité |
| Puissance des clics | ×2 sur le rendement du widget cliqué |
| Puissance des galets | ×2 sur l'effet de chaque galet (amplifie aussi les galets réducteurs) |

Les Échos et les méta-upgrades sont **conservés** d'une renaissance à l'autre :
c'est le New Game+ augmenté.

### 3.4 Mini-jeu de mémoire (puits de Complexité optionnel)

Débloqué à l'**ère 8** (première oxydation), puis disponible dans chaque ère.
Un jeu de **concentration** (cartes-ressources à apparier) que l'on tente en
misant **10% de la Complexité** courante. Le réussir **double** (cumulable) la
production de la **ressource principale de l'ère courante**.

Chaque ère peut être boostée **trois fois** (×2 -> ×4 -> ×8), via trois niveaux
de difficulté croissante :

| Niveau | Cartes | À apparier | Erreurs | Symboles distincts |
|---|---|---|---|---|
| 1 | 21 | triplets (3) | 15 | 7 |
| 2 | 42 | paires (2) | 25 | 21 |
| 3 | 42 | triplets (3) | 30 | 14 |

Le niveau 1 reste petit (7 symboles) pour **ne pas exposer des ressources qui
n'existent pas encore** trop tôt (anti-spoiler). Le **42** est la Réponse (clin
d'oeil H2G2, voir [NARRATIVE.md](./NARRATIVE.md)) ; le 21 en est la moitié
(« la moitié de la mémoire de l'univers »).

### 3.5 Sac à dos (inventaire global)

Outil de **vue d'ensemble** débloqué en milieu de partie (à l'apparition d'une
ressource donnée, par défaut les microbes de l'ère 7), introduit par une modale
d'annonce. Il liste **toutes les ressources connues**, groupées par ère
(colonnes teintées par palier), avec leur **quantité en temps réel** et un badge
« ! » si la ressource est en déclin ou figée. Cliquer une ressource **saute à
sa page de production**. Respecte l'anti-spoiler : **jamais** de ressource non
encore découverte (voir 7.1).

## 4. Cohabitation des ères

Décision clé : **les ères débloquées continuent de tourner en arrière-plan.**

- Une fois une ère débloquée, ses générateurs produisent même quand le joueur
  regarde une autre ère (production idle).
- Le joueur **navigue** entre ses ères actives via des onglets/scènes (voir
  [UI-UX.md](./UI-UX.md)).
- **Chaînage inter-ères** : c'est le mécanisme par défaut, porté par le réseau
  de ressources (section 3.1). La sortie d'une ère est l'entrée d'une autre
  (ex : les atomes de l'ère 2 alimentent les convertisseurs stellaires de
  l'ère 3). Donc une ère ancienne doit continuer de produire pour alimenter les
  ères récentes ; détail des chaînes dans [PHASES.md](./PHASES.md).
- L'ère "active" (celle qu'on regarde) reçoit un léger bonus de focus pour
  récompenser l'attention sans pénaliser l'idle.

## 5. Automatisation et usines

L'**automatisation** est le moteur du genre idle, et un pilier de ce jeu : des
**usines** (machines, automates) cliquent et combinent **à la place du
joueur**, et s'améliorent sans cesse. Elles ont un **double rôle** :

- **Complexification** : une usine est elle-même un objet à construire,
  optimiser et **enchaîner** (des usines qui alimentent d'autres usines). Elle
  ajoute une couche d'optimisation et participe au réseau de ressources
  (section 3.1) en consommant et produisant.
- **Simplification** : elle automatise une mécanique que le joueur a **déjà
  maîtrisée au clic**, libérant son attention pour la nouvelle frontière. C'est
  le mécanisme qui rend supportables 19 ères en cohabitation.

### 5.1 Automatisation progressive (par ère)

Chaque ère suit le même rythme, ce qui garde la **complexité ressentie à peu
près constante** même si le système global grossit :

1. **Manuel** : on découvre le verbe de l'ère au clic.
2. **Premières usines** : elles automatisent partiellement le verbe et les
   conversions.
3. **Optimisation** : monter les niveaux des générateurs et convertisseurs
   (chaque niveau accroît leur débit), et arbitrer lesquels prioriser.
4. **Automatisation de l'automatisation** : des gestionnaires font tourner (et
   parfois améliorer) seules les usines des ères anciennes.

### 5.2 Vocabulaire et lien technique

Le modèle est celui d'un **clicker standard** : clic manuel, puis générateurs
qui produisent tout seuls, achat automatique, et gestionnaires qui automatisent
les paliers anciens (façon Cookie Clicker / Adventure Capitalist). On reprend
ces conventions éprouvées plutôt que de réinventer.

"Usine" est le terme **joueur**. Techniquement, une usine est un **générateur**
(produit une ressource) ou un **convertisseur** (applique une recette) doté de
**niveaux** que l'on achète pour augmenter son débit (voir
[ARCHITECTURE.md](./ARCHITECTURE.md)). Le
clic manuel reste possible mais devient marginal une fois l'ère automatisée.

### 5.3 Garde-fous

- L'automatisation ne doit pas rendre le jeu **passif au point d'ennuyer** : il
  reste toujours des décisions (quoi améliorer en priorité, comment équilibrer
  les flux entrées/sorties). Voir section 3.1ter.
- La **frontière active** demande de l'attention ; le passé est automatisé. On
  ne doit jamais avoir à micro-gérer manuellement une ère ancienne.
- Débloquer une automatisation peut être une **récompense** (jalon, méta-upgrade
  de prestige), pas un acquis gratuit.

## 6. Régressions, crises et rebonds

Au-delà du prestige final (section 3.3), le jeu intègre des **régressions
locales** : des **crises** qui font reculer le joueur sur une ère, mais
débouchent sur un redémarrage **changé et amélioré**. C'est un "mini-prestige"
thématique, à l'échelle d'une ère.

**Cohérence thématique** : ces crises sont des **échos réduits de l'explosion
finale** (ère 19). Le motif "effondrement puis renaissance augmentée" se répète
de façon fractale tout au long du jeu : la complexité progresse par cycles de
rupture et de rebond, pas en ligne droite. (Le nom de la monnaie de prestige,
les Échos, prend ici tout son sens.)

### 6.1 Structure d'une crise (4 temps)

1. **Montée du risque** : une jauge de tension s'accumule par
   **sur-exploitation** d'une ressource. Elle reste **dormante** tant que la
   ressource n'a pas dépassé un **plancher** (pas de crise sur une ressource à
   peine développée), puis monte sur l'**excès** au-dessus de ce plancher.
   Toujours **télégraphiée**.
2. **Déclenchement** : à un seuil scripté, par choix du joueur, ou de façon
   probabiliste au-delà d'un seuil.
3. **Régression** : perte **partielle** (une ressource s'effondre, la
   production chute). Jamais une perte totale ni un cul-de-sac. Tant que la
   crise n'est pas résolue, la **production des ressources touchées est gelée**
   et le **passage à l'ère suivante est bloqué** : porte **temporaire** (toujours
   résolvable), pas un mur définitif.
4. **Rebond** : reconstruction puis **amélioration permanente** : un
   multiplicateur de production durable (qui, comme tous les multiplicateurs,
   accélère aussi la Complexité - cf. section 3.2), une ressource transformée, ou
   un changement narratif/structurel.

### 6.2 Règles

- **Bénéfice net positif à terme** (comme un prestige) : on perd à court terme,
  on gagne durablement. Sinon le joueur se sent puni.
- **Télégraphié, jamais punitif au hasard** : la jauge de risque est visible ;
  pas de coup de malchance pur. Idéalement, c'est une **décision** (pousser
  l'exploitation pour aller plus vite en assumant le risque).
- **Obligatoire ou émergent** : certaines crises sont des passages quasi obligés
  (narratifs), d'autres naissent des choix du joueur.
- **Ton** : adapté au sujet (l'arme atomique est grave ; d'autres crises peuvent
  être plus légères, cf. section 12).

### 6.3 Exemples (détaillés par ère dans [PHASES.md](./PHASES.md))

- **Extinction de masse** (ère 11) : un clade domine (ex : les dinosaures) puis
  disparaît dans une extinction ; au rebond, une branche jusque-là mineure
  explose en diversité (ex : les mammifères) et ouvre une voie meilleure.
- **Esclavage** (ère 13) : l'esclave est une ressource sur-exploitée ; au-delà
  d'un seuil, révolte (menée par un certain Starpacus), la société éclate ; les
  ex-esclaves deviennent des citoyens (ressource meilleure), la société repart
  améliorée.
- **Arme atomique** (ère 15) : la course à l'armement fait monter le risque ;
  une bombe éclate, forte régression ; les survivants refondent une société plus
  avancée et résiliente.
- **Crise écologique** (ère 15) : l'industrialisation et la sur-exploitation
  font monter la pollution ; au seuil, effondrement écologique (régression) ;
  une transition durable relance sur des bases plus efficaces et résilientes.
- **Soulèvement IA** (ère 15) : une IA toute-puissante se retourne contre ses
  créateurs (crise `machineRebellion`) ; un alignement relance sur de meilleures
  bases.
- **Krach économique** (ère 15) et **bug de l'an 2000** (ère 15) : deux crises
  industrielles supplémentaires, même schéma régression -> rebond.
- **Première rencontre** (ère 17) : des créatures hostiles (`encounter`) ; la
  vaincre octroie le **galet de la Force**.
- **Cartel de l'épice** (ère 18) : planète Salakis, vers de vase (`spice`) ;
  mini-jeu de réorientation de conduits.
- **Fuite de gaz** (ère 19, finale) : crise **ingagnable** (`gasLeak`) qui
  déclenche la réaction en chaîne menant au nouveau Big Bang (voir 3.3).

> Aucune crise n'est rattachée à l'ère 16 dans la version finale (l'idée d'une
> « navette qui explose » n'a pas été retenue). Toutes les crises ci-dessus sont
> implémentées (`src/data/crises.ts`).

### 6.4 Résolution interactive (mini-jeux plein écran)

Une crise se **surmonte par un mini-jeu plein écran** plutôt que par un simple
bouton. Plusieurs sont implémentés et partagent la même séquence de victoire
(hook `useCrisisWin`) : **extinction** (`ExtinctionGame`), **révolte**
(`RevoltGame`), **survie** générique des crises industrielles (`SurviveGame`),
**épice** (`SpiceGame`), et la **fuite de gaz** finale ingagnable (`GasLeakGame`).
Exemple de référence, l'**extinction de masse** :

- **Déclenchement** : risque ∝ excès de **faune** au-dessus d'un plancher.
- **Annonce** : modale dramatique (illustration d'impact) dont le bouton
  **« Affronter »** lance le widget.
- **Mini-jeu** : des météores tombent sur toute la largeur ; on **clique les
  créatures** (rats, raptors) pour les faire plonger dans un terrier. Sauver
  **50 créatures** surmonte la crise.
- **Effets** : régression (faune **et** flore ×0.2) puis rebond (×20) ; pendant
  la crise, faune/flore gelées et palier bloqué. Une **modale « Renaissance »**
  conclut.
- **Lisibilité** : un badge sur les ressources touchées (crâne pendant, étincelles
  après) résume la situation ; le décor (sauropodes) disparaît au déclenchement.

## 7. Renouvellement : un verbe par ère

Pour éviter le "même bouton, autres mots", chaque grande ère introduit un
geste de jeu distinct. **Le widget iconique de l'ère PORTE cette mécanique**
(il n'est pas décoratif) : c'est l'élément interactif central. Un widget peut
revenir et se complexifier d'une ère à l'autre (ex : un tableau de Mendeleïev
simple, puis plus riche). Détail dans [PHASES.md](./PHASES.md).

> Mécanique technique : **toute recette (convertisseur) est à la fois manuelle
> et automatisable**. Un clic applique une recette (`manualConvert`, moteur) :
> c'est le **moyen manuel d'obtenir une ressource** (bouton "Produire", ou les
> cases d'un widget comme le tableau périodique). Acheter des niveaux
> l'**automatise** (elle tourne alors au tick), façon clicker (cliquer puis
> automatiser). Prototype : le tableau périodique de l'ère 4 (cases cliquables
> qui fusionnent les éléments légers en lourds, dévoilées progressivement ;
> automatisation achetable dans le panneau des forges).

Vue d'ensemble :

> Découpage validé à 19 ères (dérivé de [SCIENCE.md](./SCIENCE.md)). Détail
> complet (ressources, widgets, science) dans [PHASES.md](./PHASES.md).

| Ère (`id`) | Thème | Verbe central |
|----:|-------|---------------|
| 1 | Big Bang & refroidissement | Refroidir |
| 2 | Recombinaison (premiers atomes) | Capturer les électrons |
| 3 | Premières étoiles & galaxies | Effondrer / allumer |
| 4 | Forges stellaires (éléments lourds) | Forger (Mendeleïev) |
| 5 | Système solaire & Terre | Accréter / faire entrer en collision |
| 6 | Terre habitable + briques de la vie | Stabiliser & synthétiser |
| 7 | Premières vies (procaryotes) | Répliquer / diviser |
| 8 | Photosynthèse & Grande Oxydation | Oxygéner |
| 9 | Eucaryotes & endosymbiose | Fusionner / complexifier |
| 10 | Multicellularité & Cambrien | Assembler des organismes |
| 11 | Conquête des terres (plantes, animaux) | Faire évoluer / peupler |
| 12 | Intelligence (préhistoire) | Apprendre / innover |
| 13 | Sociétés (néolithique, villes) | Organiser / bâtir |
| 14 | Relations inter-sociétés | Négocier / conquérir |
| 15 | Technologies | Rechercher / inventer |
| 16 | Conquête spatiale | Lancer / explorer |
| 17 | Voyage intergalactique | Coloniser / fédérer / relier les galaxies |
| 18 | Ville-univers (grande unification) | Unifier / englober |
| 19 | Explosion (nouveau Big Bang) | Contracter (effondrement -> prestige) |

## 8. Progression et déblocage

- Chaque ère a une **condition de passage** vers la suivante : un seuil de
  Complexité (ou de ressource). **Franchir un palier est une action manuelle**
  (bouton "Franchir le palier") qui débloque l'ère, mais **ne dépense pas** la
  Complexité : aucune ère ne se débloque automatiquement (le cap ci-dessous
  évite la cascade). La Complexité **ne recule que sur les évènements
  régressifs** (crises).
- **Cap** : la Complexité ne dépasse jamais le coût du prochain palier. Une fois
  ce palier atteint, elle est gelée tant qu'on ne l'a pas franchi (rien ne
  s'accumule passivement par-dessus).
- **Décroissance par ère** (`COMPLEXITY_ERA_DECAY = 50`) : la Complexité gagnée
  vient quasi exclusivement de l'ère la plus récente. Chaque ère antérieure
  rapporte ÷50 (÷2500 deux ères plus tôt, etc.) : les ères passées deviennent
  négligeables, il faut donc jouer l'ère courante pour remplir la jauge. Les
  ressources anciennes restent produites (elles alimentent les recettes), mais
  ne contribuent quasiment plus à la Complexité.
- Le passage **n'efface pas** l'ère précédente (cohabitation).
- Certaines ères débloquent des **mécaniques bonus** (mini-systèmes) décrites
  dans [PHASES.md](./PHASES.md), à introduire progressivement pour ne pas
  noyer le joueur.
- **Easing tardif (à partir de l'ère 12 seulement)** : les seuils croissent en
  ×3,16/ère, et après l'ère 11 les gros boosts annexes (galets ≤ ère 10, rebond de
  crise ≤ ère 11) ne s'appliquent plus. Pour éviter la divergence ("éternité"), le
  factory applique aux ères >= `LATE_FROM` une production ↑ et une consommation ↓
  **composées par ère** (`LATE_PROD`/`LATE_CONSUMPTION`). Les ères 1-11 restent
  strictement intactes. Calibré via `make sim`.
- **Accélérateur de skill (constellation Simon, ère 12)** : reproduire une
  séquence de 10 idées **double la Complexité de l'ère** (cumulable, plafonné à
  `MAX_COMPLEXITY_BOOST` clears, soit ×32). Levier actif, réservé aux joueurs qui
  maîtrisent le mini-jeu ; persisté en compteur, multiplicateur dérivé (cf.
  [ARCHITECTURE.md](./ARCHITECTURE.md) 8.2).

### 7.1 Découverte progressive (anti-spoiler)

**Principe fort** : rien ne doit dévoiler l'avancée du jeu à l'avance. Chaque
nouvelle phase est une **découverte** ; elle ne doit pas être annoncée ni
attendue (au mieux **soupçonnée** par un joueur à l'esprit logique ayant des
notions de physique ou de biologie).

Règles concrètes :

- **Pas de carte des ères futures** : on ne montre jamais la liste, le nombre,
  ni les noms des ères à venir. La fin (et même l'idée de prestige) reste une
  surprise.
- **Contenu verrouillé = caché, pas grisé-nommé** : un générateur, une
  ressource, un widget ou une crise non débloqués n'apparaissent pas du tout
  (pas de "à venir", pas de silhouette nommée).
- **Dévoilement progressif intra-ère** : à l'intérieur d'une ère, on ne montre
  pas tout d'un coup. La première machine est visible ; la suivante n'apparaît
  qu'une fois la précédente au niveau 1 ; une ressource n'apparaît qu'avec la
  machine qui la produit (ou dès qu'on en possède). Cela guide le joueur sans le
  noyer. Implémenté de façon générique dans `src/lib/reveal.ts`.
- **Textes non révélateurs** : titre, accroche, descriptions et infobulles ne
  doivent parler que du présent et du passé du joueur, jamais du futur.
- **Indices diégétiques seulement** : tout au plus, l'état courant peut
  *suggérer* logiquement la suite (ex : ça se complexifie), sans la nommer.
- **La doc est pour les développeurs** : [PHASES.md](./PHASES.md),
  [SCIENCE.md](./SCIENCE.md), [NARRATIVE.md](./NARRATIVE.md) décrivent tout le
  jeu, mais ce contenu **ne doit jamais fuiter** dans l'UI joueur.

## 9. Principes d'équilibrage

- **Coûts géométriques** : prix d'un générateur = `base * growth^n` (growth
  typiquement 1.07 à 1.15), standard du genre.
- **Production exponentielle maîtrisée** : les nombres grossissent vite ;
  prévoir une **notation abrégée** (k, M, G, T... puis notation
  scientifique). Centraliser le formatage dans `src/lib/format.ts`.
- **Temps cible par ère** (première partie, sans prestige) : quelques minutes
  pour les premières ères, croissant ensuite. À calibrer en playtest.
- **L'idle doit rester gratifiant** mais le clic actif donne un avantage clair
  en début d'ère (puis l'automatisation prend le relais).
- **Pas de pay-to-win, pas de microtransactions** : jeu 100% front, hors-ligne.
- L'équilibrage vit dans des **données** (`src/data/`), jamais en dur dans la
  logique, pour itérer sans toucher au moteur. Voir [ARCHITECTURE.md](./ARCHITECTURE.md).

## 10. Sauvegarde et export

- **Sauvegarde automatique** en `localStorage` (throttle, ex : toutes les 10 s
  et à chaque évènement majeur).
- **Calcul de l'idle hors-ligne** : à la reprise, créditer la production
  accumulée depuis `lastSeen` (avec un plafond raisonnable pour éviter les
  abus d'horloge).
- **Export / import** : sérialisation JSON de l'état complet, versionnée, avec
  migrations. Export en fichier téléchargeable + presse-papier ; import par
  collage ou fichier. Détail dans [ARCHITECTURE.md](./ARCHITECTURE.md).
- **Intégrité (anti-triche de base)** : la save porte une **empreinte** ; une
  sauvegarde modifiée hors du jeu (localStorage, fichier exporté) est **rejetée**
  (clin d'oeil "on ne hack pas l'univers"). Les saves existantes restent valides
  (signées au prochain save). Ralentisseur assumé, pas une sécurité absolue (jeu
  front-end open source) : détail et portée dans [ARCHITECTURE.md](./ARCHITECTURE.md) section 9.

## 11. Langue

- **Français par défaut**, anglais proposé (sélecteur). i18n custom léger
  (pattern maison), clés typées. Le contenu narratif et scientifique est
  rédigé d'abord en FR puis traduit en EN.

## 12. Ton, narration et humour

> Le catalogue vivant des anecdotes, easter eggs et références culturelles est
> tenu dans [NARRATIVE.md](./NARRATIVE.md).

> **Vecteur : modales d'évènements.** Le narratif et l'humour passent par un
> système de **modales** (`src/lib/events.ts`, `EventModal`) déclenchées par :
> le **changement d'ère** (texte d'évolution, clés `era.eN.transition`), les
> **crises** (annonce de la régression), et un **tutoriel** à la 1re machine
> (onboarding). Chaque évènement n'apparaît qu'une fois (`GameState.seenEvents`).
> C'est l'emplacement privilégié des références comiques.

- **Ton dominant** : émerveillement et sérieux scientifique. Le fil rouge est
  la complexité qui émerge, racontée avec curiosité et un brin d'épopée.
- **Humour parsemé, jamais envahissant** : des touches comiques **ponctuelles**
  et rares, posées surtout aux **transitions** et dans les **évènements**, pas
  dans le coeur de la boucle. Elles doivent surprendre, pas saturer.
- **Formes possibles** :
  - la rencontre de deux peuples teintée d'humour ;
  - une invention technologique absurde ;
  - une invention majeure déclenchée par un évènement ridicule
    (le sérieux du résultat contraste avec la bêtise de la cause).
- **La grande chute comique est réservée à la fin** (ère 19 : la ville-univers
  explose à cause d'un dirigeant qui a oublié le gaz, voir
  [PHASES.md](./PHASES.md)). Tout l'humour léger en amont prépare ce contraste.
- **Dosage** : l'humour reste minoritaire ; en cas de doute, pencher vers la
  sobriété. Les textes humoristiques sont identifiés comme tels dans les
  données (catégorie d'évènement), pour pouvoir régler leur fréquence.
- **Rejouabilité** : à chaque renaissance (prestige), envisager une
  **bibliothèque** de variantes comiques (rencontres, inventions, et causes de
  l'explosion finale) tirées d'un cycle à l'autre, pour récompenser le jeu
  répété par du contenu inédit. À affiner.

## 13. Hors-périmètre (pour l'instant)

- Pas de backend, pas de multijoueur, pas de classement en ligne.
- Pas de son/musique au MVP (à envisager plus tard).
- Pas de PWA au MVP (le pattern maison existe via `vite-plugin-pwa`, on
  l'ajoutera si souhaité).
