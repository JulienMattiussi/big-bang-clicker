# Big Bang Clicker - Les 20 ères

> Découpage validé, dérivé de la chronologie scientifique
> ([SCIENCE.md](./SCIENCE.md)). Pour chaque ère : verbe, réseau de ressources
> (chaînes de combinaison), widget iconique interactif, achats, condition de
> passage, ancrage scientifique.
>
> **Anti-spoiler** : ce document est une référence **développeur** qui dévoile
> tout le jeu. Côté joueur, chaque ère doit rester une **découverte** : ce
> contenu ne doit jamais fuiter dans l'UI (voir
> [GAME-DESIGN.md](./GAME-DESIGN.md) section 7.1).
>
> Modèle économique : ressources multiples qui se combinent + méta-ressource
> Complexité + prestige final (voir [GAME-DESIGN.md](./GAME-DESIGN.md)).
> Interface : coquille stable + widgets iconiques + paliers de transformation
> (voir [UI-UX.md](./UI-UX.md)).
>
> Statut : structure figée (20 ères) ; chiffres et contenu fin à affiner. La
> partie biologique/anthropologique reste **à re-sourcer** (voir SCIENCE.md).

## Légende

- **Verbe** : le geste de jeu central.
- **Accroche** : phrase affichée au joueur dans l'ère (anti-spoiler ;
  premier jet, modifiable selon le ressenti).
- **Ressources & chaînes** : ressources de base et combinaisons (`a + b -> c`).
- **Widget** : l'élément iconique interactif au centre de la scène.
- **Production** : générateurs (production directe) et convertisseurs (recettes).
- **Passage** : condition de déblocage de l'ère suivante.
- **Science** : `vérifié`, `co-émergence`, ou `consensus à re-sourcer`.

## Vue d'ensemble et paliers UI

| Tier UI | Ères | Bascule |
|---|---|---|
| COSMOS | 0 à 4 | base |
| VIVANT | 5 à 10 | **transformation majeure** (apparition de la vie, ère 5/6) |
| CIVILISATION | 11 à 14 | **transformation majeure** (apparition des sociétés, ère 12) |
| SPATIAL | 15 à 18 | marquée |
| TRANSCENDANCE | 19 | spectaculaire (prestige) |

---

## Tier COSMOS

### Ère 0 - Big Bang & refroidissement `vérifié`

- **Accroche** : « Trop chaud pour exister. Laisse l'univers respirer. »
- **Narratif** : l'univers naît, dense et brûlant. Forces qui se découplent,
  quarks qui se confinent, premiers noyaux légers. Il faut que ça refroidisse.
- **Verbe** : refroidir (le clic dissipe l'énergie, fait baisser la température).
- **Ressources & chaînes** :
  - Base : Énergie/Chaleur (à dissiper), Quarks.
  - `quarks -> protons & neutrons` (confinement)
  - `proton + neutron -> deutérium` puis `deutérium -> hélium-4` (BBN)
  - Traces de lithium-7. **Aucun élément plus lourd** (impossible ici).
- **Widget** : jauge de température / soupe de plasma qui se fige en particules.
- **Production** : expansion de l'espace, dissipation thermique, découplage des
  forces ; convertisseurs de nucléosynthèse primordiale.
- **Passage** : température assez basse pour la recombinaison (~3000 K).

### Ère 1 - Recombinaison : premiers atomes `vérifié`

- **Accroche** : « Les électrons se posent enfin : que la lumière soit. »
- **Narratif** : électrons et noyaux se lient en atomes neutres. L'univers
  devient transparent : la première lumière (fond diffus cosmologique) s'échappe.
- **Verbe** : capturer les électrons / assembler les premiers atomes.
- **Ressources & chaînes** :
  - Base : Électrons libres, noyaux (de l'ère 0).
  - `noyau H + électron -> hydrogène neutre`
  - `noyau He + 2 électrons -> hélium neutre`
  - Sous-produit : Photons (CMB) libérés.
- **Widget** : **atome de Bohr** (noyau + électrons qui se placent sur les
  orbites). Les couches se remplissent au clic.
- **Production** : refroidissement résiduel, capture électronique (auto).
- **Passage** : gaz neutre H/He formé en quantité -> âges sombres.
- **Note science** : ce sont les **atomes légers**. Les lourds viendront des
  étoiles (ère 3), pas ici.

### Ère 2 - Âges sombres -> premières étoiles & galaxies `vérifié`

- **Accroche** : « Dans le noir absolu, allume les premiers soleils. »
- **Narratif** : dans le noir, la gravité rassemble le gaz vierge. Les
  premières étoiles (Population III) s'allument, les galaxies s'assemblent.
- **Verbe** : effondrer / allumer.
- **Ressources & chaînes** :
  - Base : Gaz (H/He, consommé depuis l'ère 1), Gravité/Densité.
  - `gaz + gravité -> nuage moléculaire -> proto-étoile -> étoile (Pop III)`
  - `étoiles -> amas -> galaxie`
- **Widget** : **Voie lactée naissante** (champ d'étoiles qu'on allume,
  bras spiraux qui se forment). Canvas/WebGL.
- **Production** : effondrement de halos, allumage stellaire, fusion de galaxies.
- **Passage** : étoiles massives en fin de vie, prêtes à forger et exploser.
- **Note science** : étoiles, galaxies, réionisation et forge **cohabitent**
  (chevauchement jusqu'à z~5). L'ère 3 démarre donc en recouvrement.

### Ère 3 - Forges stellaires : les éléments lourds `vérifié`

- **Accroche** : « Rien ne se perd, rien ne se crée, tout se transforme. »
  (Lavoisier, forme popularisée)
- **Narratif** : au coeur des étoiles et dans leurs morts violentes
  (supernovae, fusions d'étoiles à neutrons), la matière se complexifie. Le
  tableau périodique se remplit.
- **Verbe** : forger les éléments lourds.
- **Ressources & chaînes** :
  - Base : Étoiles (consommées depuis l'ère 2), Métallicité.
  - `He -> C -> O -> ... -> Fe` (fusion stellaire, jusqu'au fer)
  - `supernova` et `fusion d'étoiles à neutrons -> éléments au-delà du fer`
    (r-process : or, uranium...)
- **Widget** : **tableau de Mendeleïev** qui se remplit case par case (familles
  colorées, bonus par élément débloqué) + animations supernova/kilonova.
- **Production** : étoiles massives, supernovae, fusions d'étoiles à neutrons.
- **Passage** : assez de métaux pour former un disque planétaire rocheux.

### Ère 4 - Système solaire & Terre `vérifié`

- **Accroche** : « De la poussière d'étoiles, bâtis un monde. »
- **Narratif** : autour d'une étoile, un disque enrichi en métaux s'agrège :
  poussière, planétésimaux, planètes. La Terre se forme, la Lune naît d'un
  impact géant (Hadéen).
- **Verbe** : accréter / faire entrer en collision.
- **Ressources & chaînes** :
  - Base : Poussière/disque (métaux de l'ère 3), Gravité.
  - `poussière -> planétésimaux -> protoplanètes -> planètes`
  - `impact géant -> Lune` ; `différenciation -> noyau / manteau / croûte`
- **Widget** : **disque d'accrétion / collisions** (combiner des corps pour en
  former de plus gros).
- **Production** : accrétion, bombardement, différenciation planétaire.
- **Passage** : planète rocheuse stable -> mise en place de l'habitabilité.
- **Note science** : Terre, accrétion et Lune sont quasi simultanées (Hadéen).
  Âge de la Lune présenté en fourchette (~4,51-4,35 Ga).

---

## Tier VIVANT - TRANSFORMATION MAJEURE de l'UI (apparition de la vie)

### Ère 5 - Terre habitable + briques de la vie `co-émergence`

- **Accroche** : « De l'eau, de la chaleur, et la chimie s'emballe. »
- **Narratif** : la planète devient habitable (océans, atmosphère, climat
  stable) **en même temps** que sa chimie se complexifie vers le vivant. Les
  deux processus s'entremêlent.
- **Verbe** : stabiliser **et** synthétiser (double mécanique parallèle).
- **Ressources & chaînes** :
  - Jauges d'habitabilité : Atmosphère, Eau/Océans, Température, Champ
    magnétique (à équilibrer).
  - Chimie : `CHONPS + énergie (foudre/hydrothermal) -> acides aminés,
    nucléotides, lipides`
  - `nucléotides -> ARN` (monde à ARN) ; `lipides -> membranes -> protocellule`
- **Widget** : scène double : **coupe de planète/volcan** (habitabilité,
  dégazage, océans) + **molécules en boules et bâtons** (chimie prébiotique).
- **Production** : dégazage volcanique, apport d'eau (comètes), sources
  hydrothermales, auto-catalyse, réplication de l'ARN.
- **Passage** : réplicateur encapsulé stable -> première cellule.
- **Note science** : co-émergence validée (cycle CHONPS dans le même contexte
  géochimique que l'habitabilité). Datations d'abiogenèse débattues.

### Ère 6 - Premières vies (LUCA, procaryotes) `consensus à re-sourcer`

- **Accroche** : « Une cellule se divise. Tout commence vraiment. »
- **Narratif** : les premières cellules apparaissent et se divisent. La vie est
  là (LUCA, procaryotes). C'est ici que l'UI bascule pleinement vers le vivant.
- **Verbe** : répliquer / diviser.
- **Ressources & chaînes** :
  - `protocellule + métabolisme -> cellule (LUCA) -> populations microbiennes`
  - Mutations bénéfiques (petit système de tirage).
- **Widget** : **cellule en coupe** (membrane, métabolisme).
- **Production** : division binaire, métabolisme primitif.
- **Passage** : apparition de la photosynthèse oxygénique.

### Ère 7 - Photosynthèse & Grande Oxydation `consensus à re-sourcer`

- **Accroche** : « Le premier souffle d'oxygène change tout. »
- **Narratif** : des cyanobactéries captent la lumière et rejettent de
  l'oxygène. L'O2 s'accumule : la Grande Oxydation transforme la planète.
- **Verbe** : oxygéner.
- **Ressources & chaînes** :
  - `cellule + lumière -> photosynthèse -> O2`
  - `O2 + fer dissous -> dépôts de fer rubané` (puits) ; `O2 -> atmosphère`
- **Widget** : la **coupe planète/atmosphère** réutilisée, avec la jauge d'O2
  qui monte et l'océan/atmosphère qui changent de couleur.
- **Production** : cyanobactéries, tapis microbiens.
- **Passage** : O2 suffisant pour soutenir des cellules complexes.

### Ère 8 - Eucaryotes & endosymbiose `consensus à re-sourcer`

- **Accroche** : « Mieux vaut s'associer que se digérer. »
- **Narratif** : des cellules en absorbent d'autres sans les digérer :
  l'endosymbiose crée les eucaryotes (mitochondries, puis chloroplastes).
- **Verbe** : fusionner (endosymbiose) / complexifier.
- **Ressources & chaînes** :
  - `procaryote + procaryote -> eucaryote (mitochondrie)`
  - `eucaryote + cyanobactérie -> cellule végétale (chloroplaste)`
- **Widget** : **cellule eucaryote en coupe** (organites cliquables à acquérir).
- **Production** : endosymbioses, acquisition d'organites.
- **Passage** : conditions pour la multicellularité.

### Ère 9 - Multicellularité & explosion cambrienne `consensus à re-sourcer`

- **Accroche** : « L'union fait le corps : mille formes surgissent. »
- **Narratif** : les cellules s'associent en tissus, puis en organismes. Au
  Cambrien, les grands plans d'organisation animaux explosent en diversité.
- **Verbe** : assembler des organismes / diversifier.
- **Ressources & chaînes** :
  - `eucaryotes -> colonies -> tissus -> organismes`
  - `organismes -> plans d'organisation` (diversification cambrienne)
- **Widget** : **chaîne de montage du vivant** (plein écran) : des pièces de
  plan de corps défilent sur un tapis, on attrape les bonnes pour assembler des
  organismes (explosion des formes au Cambrien).
- **Production** : agrégation cellulaire, différenciation des tissus.
- **Passage** : organismes prêts à coloniser les terres.

### Ère 10 - Conquête des terres : plantes & animaux `consensus à re-sourcer`

- **Accroche** : « La vie trouve toujours un chemin. » (clin d'oeil Jurassic
  Park, voir [NARRATIVE.md](./NARRATIVE.md))
- **Narratif** : la vie sort de l'eau. Les plantes verdissent les continents,
  les animaux suivent. L'évolution se diversifie, ponctuée d'extinctions.
- **Verbe** : faire évoluer / peupler.
- **Ressources & chaînes** :
  - Plantes : `algues -> mousses -> fougères -> conifères -> plantes à fleurs`
  - Animaux : `invertébrés -> poissons -> tétrapodes -> amniotes ->
    mammifères / oiseaux`
- **Widget** : **arbre phylogénétique** complet (étendre des branches,
  débloquer des clades) + **évènements d'extinction** (Big Five) qui rebattent
  les cartes.
- **Production** : par grands clades végétaux et animaux.
- **Crise (régression)** : **extinction de masse**. Un clade prospère et
  **domine** (ex : les dinosaures), puis une extinction le **fait disparaître**
  (régression : on perd la branche dominante). Au rebond, une branche jusque-là
  mineure **explose en diversité** (ex : l'essor des mammifères) et ouvre une
  voie meilleure. Voir [GAME-DESIGN.md](./GAME-DESIGN.md) section 6.
- **Passage** : émergence d'espèces à forte cognition.

---

## Tier CIVILISATION - TRANSFORMATION MAJEURE de l'UI (apparition des sociétés)

### Ère 11 - Intelligence (préhistoire) `consensus à re-sourcer`

- **Accroche** : « Le feu, l'outil, le mot : l'esprit s'éveille. »
- **Narratif** : des créatures deviennent intelligentes : outils, feu, langage,
  culture. L'intelligence s'auto-amplifie.
- **Verbe** : apprendre / innover.
- **Ressources & chaînes** :
  - `cerveau + transmission -> outils -> feu -> langage -> culture cumulative`
- **Widget** : **campement préhistorique / frise de découvertes** (hotspots :
  pierre taillée, feu, langage, art).
- **Production** : outils, feu, chasse coordonnée, transmission culturelle.
- **Passage** : sédentarisation / premières communautés stables.

### Ère 12 - Sociétés (néolithique, villes, écriture) `consensus à re-sourcer`

- **Accroche** : « De la tribu à la cité : bâtir ensemble. »
- **Narratif** : agriculture, sédentarisation, villages puis villes,
  institutions, écriture. La civilisation commence. L'UI bascule (interface
  "humaine").
- **Verbe** : organiser / bâtir.
- **Ressources & chaînes** :
  - `agriculture -> surplus -> population`
  - `population + surplus -> bâtiments -> institutions -> écriture`
- **Widget** : **plan de cité** (vue isométrique : poser et améliorer des
  bâtiments).
- **Production** : fermes, ateliers, marchés, temples, administrations.
- **Crise (régression)** : **esclavage**. L'esclave est une ressource
  sur-exploitée ; une jauge de tension monte avec l'exploitation. Au seuil :
  **révolte** menée par un certain **Starpacus** (clin d'oeil Spartacus, voir
  [NARRATIVE.md](./NARRATIVE.md)), la société éclate (régression). Au rebond, les
  ex-esclaves deviennent des **citoyens** (ressource meilleure et plus
  productive) et la société repart **améliorée**. Voir
  [GAME-DESIGN.md](./GAME-DESIGN.md) section 6.
- **Passage** : plusieurs sociétés distinctes coexistent.

### Ère 13 - Relations inter-sociétés `consensus à re-sourcer`

- **Accroche** : « Commercer, négocier... ou conquérir. »
- **Narratif** : commerce, diplomatie, guerres, alliances, empires.
- **Verbe** : négocier / conquérir.
- **Ressources & chaînes** :
  - `production + routes -> commerce -> influence`
  - `armées + territoires -> conquêtes -> empires`
- **Widget** : **carte type Risk** (territoires à contrôler, fronts, commerce
  vs guerre).
- **Production** : routes commerciales, ambassades, armées, ports.
- **Passage** : accélération technologique soutenue.

### Ère 14 - Technologies `consensus à re-sourcer`

- **Accroche** : « Inventer plus vite qu'on ne réfléchit. »
- **Narratif** : révolutions agricole, industrielle, numérique. La tech
  s'emballe.
- **Verbe** : rechercher / inventer.
- **Ressources & chaînes** :
  - `recherche -> inventions -> industrie -> énergie -> informatique -> IA`
- **Widget** : **arbre technologique** (noeuds à débloquer).
- **Production** : universités, laboratoires, industries, data centers.
- **Crise (régression)** : **arme atomique**. Une course à l'armement fait
  monter le risque ; au seuil, une bombe éclate : **forte régression** de la
  société. Les survivants refondent une société plus avancée et **résiliente**
  (bonus permanent). Ton grave. Voir [GAME-DESIGN.md](./GAME-DESIGN.md) section 6.
- **Crise (régression)** : **crise écologique**. L'industrialisation et la
  sur-exploitation des ressources font monter une jauge de **pollution /
  dérèglement** ; au seuil, **effondrement écologique** (régression : chute de
  production, perte de biomasse/ressources). Au rebond, une **transition
  durable** (énergies propres, économie circulaire) relance sur des bases plus
  efficaces et résilientes. Voir [GAME-DESIGN.md](./GAME-DESIGN.md) section 6.
- **Crise (régression)** : **soulèvement de l'IA**. Une IA toute-puissante, le
  **Matrixator** (clin d'oeil Matrix, voir [NARRATIVE.md](./NARRATIVE.md)), se
  retourne contre ses créateurs ; au seuil, prise de contrôle des machines
  (régression : automatisation neutralisée, production effondrée). Au rebond,
  une cohabitation/alignement avec l'IA relance sur des bases plus puissantes.
  Voir [GAME-DESIGN.md](./GAME-DESIGN.md) section 6.
- **Passage** : capacité à quitter la planète.

---

## Tier SPATIAL

### Ère 15 - Conquête spatiale `vérifié -> spéculatif`

- **Accroche** : « La Terre est un berceau, pas une demeure. »
- **Narratif** : fusées, satellites, Lune, Mars, premières colonies hors-sol.
  Réaliste jusqu'au présent, spéculatif au-delà.
- **Verbe** : lancer / explorer.
- **Ressources & chaînes** :
  - `carburant + étages -> fusée -> lancement -> orbite`
  - `orbite -> Lune / Mars -> colonies orbitales`
- **Widget** : **étages de propulsion d'une fusée** (empiler/améliorer,
  séquence de lancement) + **carte du système solaire** à débloquer.
- **Production** : fusées, stations, sondes, colonies.
- **Crise (régression)** : **navette qui explose**. Pousser les lancements sans
  investir dans la sécurité fait monter le risque ; au seuil, une navette
  explose, le **budget spatial est gelé** (régression). Une avancée de sécurité
  relance ensuite la conquête sur de **meilleures bases**. Voir
  [GAME-DESIGN.md](./GAME-DESIGN.md) section 6.
- **Passage** : présence multiplanétaire stable.

### Ère 16 - Sociétés galactiques `spéculatif`

- **Accroche** : « Une galaxie entière ne demande qu'à vivre. »
- **Narratif** : la civilisation se répand dans **sa galaxie** : colonisation
  interstellaire, fédérations d'étoiles, méga-structures captant l'énergie des
  étoiles (sphères de Dyson).
- **Verbe** : coloniser / fédérer (à l'échelle de la galaxie).
- **Ressources & chaînes** :
  - `vaisseaux interstellaires -> systèmes colonisés -> fédération galactique`
  - `étoiles -> sphères de Dyson -> énergie stellaire`
- **Widget** : **carte galactique** (la Voie lactée, systèmes à coloniser) +
  **sphère de Dyson**.
- **Production** : vaisseaux générationnels, mondes-anneaux, sphères de Dyson.
- **Passage** : galaxie largement colonisée -> franchir le vide intergalactique.

### Ère 17 - Sociétés intergalactiques `spéculatif`

- **Accroche** : « Entre les galaxies, le grand vide t'attend. »
- **Narratif** : franchir les abysses entre galaxies. Relier plusieurs galaxies,
  exploiter des amas, tendre des ponts à travers la **toile cosmique**.
- **Verbe** : relier les galaxies / s'étendre dans l'amas.
- **Ressources & chaînes** :
  - `fédération galactique -> ponts intergalactiques -> amas reliés`
  - `galaxies -> super-amas -> réseau de la toile cosmique`
- **Widget** : **carte de l'amas / toile cosmique** (filaments reliant les
  galaxies, noeuds à activer). Zoom au-dessus de la carte galactique de l'ère 16.
- **Production** : ponts intergalactiques, vaisseaux à très longue portée,
  exploitation d'amas.
- **Passage** : assez de galaxies reliées pour englober l'univers entier.

### Ère 18 - Ville-univers `spéculatif`

- **Accroche** : « L'univers entier, réuni en une seule ville. »
- **Narratif** : toute la matière et l'énergie de l'univers convergent en une
  unique ville-univers (civilisation de Type III+).
- **Verbe** : unifier / englober.
- **Ressources & chaînes** :
  - `districts galactiques -> ville-univers`
  - jauge de **complétude de l'univers** qui sature.
- **Widget** : **ville-univers / horloge cosmique** (la complétude se remplit,
  l'instabilité monte).
- **Production** : districts galactiques, cerveau-matriochka, ordinateur cosmique.
- **Passage** : seuil d'instabilité atteint -> explosion.

---

## Tier TRANSCENDANCE

### Ère 19 - Explosion : nouveau Big Bang `spéculatif`

- **Accroche** : « Tout finit... et tout recommence, en mieux. »
- **Narratif** : la ville-univers est saturée de complexité, au bord de
  l'instabilité. Et puis tout bascule pour une raison dérisoire : un dirigeant
  de galaxie a oublié d'éteindre le gaz (et un patin) après son petit-déjeuner,
  déclenchant une réaction en chaîne. Tout explose : un nouveau Big Bang. La
  renaissance est augmentée par les Échos.
- **Ton** : bascule **comique/absurde** assumée pour la toute fin. Les enjeux
  cosmiques sont anéantis par une bêtise domestique : c'est le contraste qui
  fait le sel de la chute. (Formulation exacte du gag **à affiner**.)
- **Note de design** : l'instabilité (jauge de complétude de l'ère 18) fournit
  la poudre ; l'incident trivial fournit l'étincelle. Possibilité d'un petit
  évènement scripté/illustré au moment du déclenchement.
- **Verbe** : transcender (déclencher le prestige).
- **Mécanique** : conversion de la Complexité totale en **Échos** ; reset
  complet sauf Échos et méta-upgrades ; retour à l'ère 0, plus fort. Voir
  [GAME-DESIGN.md](./GAME-DESIGN.md) section 3.3.
- **Widget** : **singularité / écran qui se contracte puis explose** (transition
  spectaculaire vers la nouvelle partie).
- **Rejouabilité** : chaque cycle débloque de nouveaux méta-upgrades et
  potentiellement des variantes narratives.

---

## Notes transverses

- **Cohabitation** : chaque ère ajoute un étage au réseau de ressources et
  consomme des sorties d'ères antérieures (voir [GAME-DESIGN.md](./GAME-DESIGN.md)
  section 3.1bis). Les anciennes ères restent utiles.
- **Blocs parallèles** : aube cosmique (ères 2-3) et Terre vivante naissante
  (ères 4-6) se recouvrent fortement ; les présenter en cohabitation, pas en
  file indienne.
- **Réutilisation de widgets** : Voie lactée (ères 2 et 16), coupe de planète
  (ères 4, 5, 7), cellule (ères 6, 8), arbre phylogénétique (ères 9, 10),
  graphe de noeuds (molécules, arbre du vivant, tech tree, réseau de
  ressources). Voir [UI-UX.md](./UI-UX.md) section 5.
- **Crises (régressions)** : certaines ères portent une crise (effondrement
  partiel puis rebond amélioré), echo réduit de l'explosion finale. Six sont
  déjà posées (extinction de masse ère 10, esclavage ère 12, arme atomique +
  crise écologique + soulèvement IA ère 14, navette ère 15) ; d'autres pourront
  être ajoutées avec parcimonie. Mécanique décrite dans
  [GAME-DESIGN.md](./GAME-DESIGN.md) section 6.
- **À re-sourcer** : tout ce qui est marqué `consensus à re-sourcer` (ères 6 à
  14) avant de figer dates et contenu. Voir [SCIENCE.md](./SCIENCE.md).
- **Tuning** : tous les chiffres sont indicatifs ; équilibrage en données
  (`src/data/`) et en playtest.
