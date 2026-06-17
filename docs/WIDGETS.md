# Big Bang Clicker - Catalogue de conception des widgets-mécaniques

> **Statut : implémentés.** Les widgets des ères 5 à 14 (`e4`-`e13`) décrits ici sont codés et
> branchés (`src/components/game/widgets/`, registre `interactive.ts`), plus un
> widget de **crise** plein écran (survie à l'extinction, ère 11 (`e10`)). Depuis, les
> ères 15 à 18 (`e14`-`e17`) ont aussi reçu leur widget interactif (arbre des inventions,
> lancement de fusée, relais à effet de masse, roue de l'unification), si bien
> que **chaque ère** dispose désormais de son geste propre. Ce document reste la
> référence de conception des widgets des ères 5 à 14 (`e4`-`e13`) ci-dessous.
>
> Numérotation comme en jeu (1-based) : « Ère N » a pour id technique `e(N-1)`.
>
> Conception des widgets des **ères 5 à 14 (`e4`-`e13`)** (les ères 1-4
> (`e0`-`e3`) étaient déjà implémentées). Respecte le
> [playbook widgets](./UI-UX.md) et les règles d'[AGENTS](../AGENTS.md) :
> mécanique concrète, jolie + réactive, anti-frustration (jamais d'échec sec),
> manuel + automatisable, accessibilité (clavier, aria), science respectée,
> peut revenir et se complexifier.

## Principe : faire progresser l'expérience

Le **type d'interaction évolue** avec le récit, pour casser la monotonie : on
passe de la **dextérité/artisanat** (jauge, timing, semis, fusion) à des
**systèmes vivants** (équilibre, croissance, assemblage), puis à de la
**stratégie cognitive et sociale** (arbre, mémoire, urbanisme, carte). La
**gestion de ressources** elle-même évolue à partir de l'ère 8 (`e7`) (équilibres à
tenir, structures vivantes qu'on peut perdre, bonus d'adjacence, territoires).

| Ère | Thème | Widget | Archétype d'interaction (nouveau) |
|----:|-------|--------|-----------------------------------|
| 1 (`e0`) | Big Bang | jauge de température | *(fait)* jauge |
| 2 (`e1`) | Recombinaison | atome de Bohr | *(fait)* capture d'un mobile (timing) |
| 3 (`e2`) | Premières étoiles | pépinière | *(fait)* semis + combo de clics |
| 4 (`e3`) | Forges stellaires | tableau périodique | *(fait)* grille de fusion |
| **5** (`e4`) | Système solaire | disque d'accrétion | **fusion physique** (collisions, croissance) |
| **6** (`e5`) | Briques de la vie | molécules boule-tige | **tracer des liaisons** (graphe à dessiner) |
| **7** (`e6`) | Premières vies | boîte de Petri | **automate / culture** (diviser, élaguer) |
| **8** (`e7`) | Grande Oxydation | balance atmosphérique | **équilibre à tenir** (corde raide) |
| **9** (`e8`) | Eucaryotes | endosymbiose | **cliquer-engloutir** (combiner A dans B) |
| **10** (`e9`) | Cambrien | chaîne de montage (pleine largeur) | **tapis roulant** (attraper les bonnes pièces) |
| **11** (`e10`) | Conquête des terres | arbre du vivant | **arbre qui ramifie** (croissance + extinctions) |
| **12** (`e11`) | Intelligence | constellation d'idées | **mémoire / séquence** (Simon) |
| **13** (`e12`) | Sociétés | plan de la cité | **placement sur grille** (adjacences) |
| **14** (`e13`) | Nations | carte du monde | **contrôle de territoire** (diplomatie vs guerre) |

---

## Ère 5 (`e4`) - Système solaire : disque d'accrétion

- **Ressources / recette** : `dust` (+ `heavyElement` de l'ère 4 (`e3`)) -> `planet`
  (recette `accretion`). Verbe : Accréter.
- **Mécanique - fusion physique.** Un disque protoplanétaire tourne ; des
  **planétésimaux** y dérivent. On les **pousse au clic/drag** vers le centre ;
  deux corps qui se touchent **fusionnent** en un plus gros (croissance type
  boule de neige : poussière -> caillou -> planétésimal -> planète). Atteindre
  une taille seuil détache une **planète**.
- **Progression / nouveauté** : première mécanique de **collision/croissance**
  (rien de tel avant). On gère plusieurs corps qui grossissent en parallèle.
- **Gestion de ressources** : classique (les corps accumulent de la "masse" =
  poussière + éléments lourds ; la masse seuil produit `planet`).
- **Implémentation** : manuel = pousser/fusionner ; auto = `accretion`
  automatisée (achat de niveaux). Anti-frustration = pas d'échec ; pousser
  rate juste = le corps continue de dériver. a11y = bouton "Accréter" qui
  fusionne le couple le plus proche (clavier). Récurrence : revient à l'ère
  spatiale (former des systèmes entiers).

```
        . o     . O          o = caillou, O = planétésimal
   .  o    ( * )   O   .      ( * ) = soleil ; clic/drag -> rapproche
      . O      .  o           contact -> fusion -> plus gros -> Planète
```

## Ère 6 (`e5`) - Briques de la vie : molécules boule-tige

- **Ressources / recette** : `molecule` -> `rna` (recette `synthesis`). Verbe :
  Synthétiser.
- **Mécanique - tracer des liaisons.** Des atomes (boules : C, H, O, N)
  flottent ; on **trace une liaison en glissant** d'un atome à un autre.
  Compléter le motif d'une molécule cible (ex : une base d'ARN) la **produit**
  et libère les atomes. Modèle boule-tige authentique.
- **Progression / nouveauté** : premier **dessin de graphe** (on construit une
  structure en reliant des nœuds), très différent du clic/placement.
- **Gestion de ressources** : les atomes sont une "réserve" qu'on assemble ; la
  molécule finie devient la ressource. Introduit l'idée de **recette spatiale**
  (la forme compte), pas juste une quantité.
- **Implémentation** : manuel = tracer les liaisons (`manualProduce` à la
  complétion) ; auto = `synthesis` automatisée. Anti-frustration = liaison
  fausse -> elle se défait doucement, pas de perte. a11y = au clavier, un
  bouton "lier" qui relie la prochaine paire valide. Récurrence : revient pour
  des molécules plus grosses (protéines, ADN).

## Ère 7 (`e6`) - Premières vies : boîte de Petri

- **Ressources / recette** : `cell` -> `microbe` (recette `division`). Verbe :
  Répliquer.
- **Mécanique - automate / culture.** Une boîte de Petri (petite grille
  organique). On **tape une cellule pour la diviser** dans une case voisine
  libre ; les cellules se répliment aussi toutes seules lentement. Mais la
  **surpopulation** asphyxie : trop dense -> des cellules meurent. On **gère la
  densité** (élaguer, laisser de l'espace) pour maximiser la production de
  microbes.
- **Progression / nouveauté** : première **simulation spatiale vivante**
  (croissance + mort), proche d'un automate cellulaire. On entretient un
  système, on ne fait pas qu'accumuler.
- **Gestion de ressources** : nouveauté - une **population vivante** sur une
  grille, avec une **capacité de charge** (densité optimale). La ressource
  dépend de l'état spatial, pas d'un simple compteur.
- **Implémentation** : manuel = diviser/élaguer ; auto = `division` (réplication
  passive). Anti-frustration = la surpopulation ralentit, ne détruit pas tout
  (rebond). a11y = boutons "Diviser" / "Élaguer". Récurrence : multicellularité.

## Ère 8 (`e7`) - Grande Oxydation : balance atmosphérique

- **Ressources / recette** : `oxygen` -> `atmosphere` (recette `oxidation`).
  Verbe : Oxygéner.
- **Mécanique - équilibre à tenir.** Une **balance** (CO2 d'un côté, O2 de
  l'autre) avec une **zone verte** au milieu. Cliquer "Oxygéner" pousse vers
  l'O2 ; l'atmosphère dérive seule vers le CO2. Le but : **maintenir l'aiguille
  dans la zone** pour produire de l'atmosphère stable. Pousser trop fort = la
  **Grande Oxydation / catastrophe de l'oxygène** (crise narrative) : effondrement
  puis rebond (vie aérobie).
- **Progression / nouveauté** : première mécanique d'**homéostasie** (tenir un
  équilibre, pas accumuler). Tension nouvelle : trop peu ET trop sont mauvais.
- **Gestion de ressources** : évolution forte - la ressource n'est pas un stock
  qu'on maximise mais un **équilibre dynamique**. Lié à une **crise**.
- **Implémentation** : manuel = pousser l'aiguille ; auto = une régulation
  achetable qui amortit la dérive (élargit la zone verte). Anti-frustration =
  sortir de la zone = production réduite, pas zéro ; la catastrophe est un
  rebond net positif. a11y = `role="slider"`/`progressbar` + valeur lue, bouton
  "Oxygéner". Récurrence : climat/terraformation aux ères spatiales.

```
   [ CO2 ======|##ZONE##|====== O2 ]   garder l'aiguille | dans ##
        derive <-                       clic "Oxygener" -> pousse a droite
```

## Ère 9 (`e8`) - Eucaryotes : endosymbiose

- **Ressources / recette** : `organelle` -> `eukaryote` (recette
  `endosymbiosis`). Verbe : Fusionner.
- **Mécanique - cliquer-engloutir.** Une grande cellule-hôte (membrane irrégulière,
  forme légèrement différente à chaque maturation) au centre ; des **organites**
  aux silhouettes organiques dérivent sur un anneau autour. On en **clique une** :
  elle **glisse réellement vers l'intérieur** de l'hôte et s'y installe ; les
  organites restants se **redistribuent uniformément** sur l'anneau. Après en avoir
  englouti assez, l'hôte **mûrit en eucaryote** (gratuit) et un nouvel anneau
  réapparaît en fondu. Combiner **deux choses distinctes** délibérément.
- **Progression / nouveauté** : geste de **combinaison délibérée** (A dans B),
  différent de la collision passive (ère 5 (`e4`)) et du tracé (ère 6 (`e5`)).
- **Gestion de ressources** : chaque organite englouti compte vers la maturation
  de l'hôte -> produit un eucaryote.
- **Implémentation** : manuel = clic sur une organite -> trajet vers l'hôte ; auto =
  `endosymbiosis`. a11y = chaque organite est un bouton (`role="button"`, focus
  visible) étiqueté "Engloutir", activable au clavier. Récurrence : symbioses plus
  complexes.

## Ère 10 (`e9`) - Cambrien : la chaîne de montage du vivant (pleine largeur)

- **Ressources / recette** : `tissue` -> `organism` (recette `differentiation`).
  Verbe : Assembler.
- **Mécanique - tapis roulant d'usine, contre la montre.** Des **pièces** (œil,
  nageoire, carapace, segment, queue, plaque) **défilent** de droite à gauche sur
  un tapis pleine largeur. Un **plan de corps** demande quelques pièces
  **précises** ; on **clique les bonnes pièces** quand elles passent pour les
  emboîter. Chaque organisme a une **durée de vie de 5 s** :
  - rien d'assemblé -> il **meurt** sans rien rapporter ;
  - partiellement assemblé -> il meurt en rapportant **1 tissu par pièce** posée ;
  - entièrement assemblé -> il **ne meurt pas**, **nage vers l'extérieur** et
    produit un **organisme** (la grosse récompense).
  À chaque issue, un nouveau plan apparaît (timer relancé). Les pièces ratées
  **sortent du tapis** (légère tension, jamais de pénalité).
- **File de production + garantie d'approvisionnement (anti-frustration).** Une
  **file de 3 organismes** (le courant + 2 à venir) ; un **aperçu "À venir"**
  montre discrètement le prochain. Le tapis suit une **garantie à deux étages** :
  (1) une pièce de l'organisme **courant** absente du tapis est produite en
  priorité, donc il reste toujours complétable à temps ; (2) sinon, une pièce du
  **suivant** absente est produite, si bien qu'il est déjà approvisionné quand il
  arrive (plus d'attente d'un défilement complet). Le compteur d'apparition du
  galet (voir plus bas) part du pré-remplissage, pour compter en pièces *vues*.
- **Contenu** : **10 organismes** réels du Cambrien (Burgess / Chengjiang) :
  trilobite, Anomalocaris, Opabinia, Hallucigenia, Wiwaxia, Pikaia,
  Haikouichthys, Marrella, brachiopode, éponge. Chacun = une combinaison de
  pièces **partagées** (œil, segments, appendice, épine, patte, coquille,
  nageoire ; seule la fronde de l'éponge est exclusive), si bien que la plupart
  des pièces servent à plusieurs organismes. Chaque pièce a sa **propre teinte**
  d'arc-en-ciel (palette `--part-1..8`) : la forme reste l'identité, la couleur
  aide à les distinguer d'un coup d'oeil.
- **Galet de la diversité (découverte par widget).** Une fois `differentiation`
  au niveau 2, un **galet peint en arc-en-ciel** défile sur le tapis (~toutes les
  20-30 pièces, cerclé d'octarine) tant qu'il n'est pas cliqué. Au clic, il est
  découvert (modale + rangement au réceptacle) et octuple la Complexité jusqu'à
  l'ère cambrienne. Voir [ARCHITECTURE.md](./ARCHITECTURE.md) section 8.1.
- **Progression / nouveauté** : **sélection dans un flux** qui défile (timing +
  reconnaissance), inédit ; et premier widget **pleine largeur** du palier Vie.
- **Gestion de ressources** : les tissus sont des **composants** attrapés au vol
  pour produire des organismes.
- **Implémentation** : manuel = cliquer une pièce qui passe ; auto =
  `differentiation`. a11y / `prefers-reduced-motion` : cliquer un **emplacement
  du plan** attrape la prochaine pièce correspondante sur le tapis (sans viser
  une cible mobile) ; en mouvement réduit, le tapis est figé (pièces présentées
  statiquement). Récurrence : chaînes de production aux ères industrielles.

## Ère 11 (`e10`) - Conquête des terres : arbre du vivant

- **Ressources / recette** : `flora`/`fauna` (recette `evolution`). Verbe :
  Faire évoluer. **Crise** : extinction de masse (ère 11 (`e10`)).
- **Mécanique - arbre qui ramifie.** Un **arbre phylogénétique** qui pousse :
  à chaque nœud, on **choisit une branche** (mutation/lignée) à faire évoluer
  (clic). Chaque branche vivante **produit** de la biodiversité. Lors d'une
  **extinction**, une partie des branches **meurt** (visuellement élaguée) ;
  une branche mineure **rebondit** en explosant de diversité (mammifères après
  les dinosaures).
- **Progression / nouveauté** : première **structure persistante stratégique**
  (un arbre qu'on cultive sur la durée), couplée aux **crises**. On prend des
  décisions de long terme.
- **Gestion de ressources** : forte évolution - la production est **portée par
  les branches vivantes** ; on peut **perdre** des branches (extinction), donc
  diversifier devient une stratégie de résilience.
- **Implémentation** : manuel = choisir/étendre des branches ; auto =
  `evolution`. Anti-frustration = l'extinction est un rebond net positif
  (mécanique de crise existante). a11y = arbre navigable au clavier (nœuds =
  boutons). Récurrence : arbre des civilisations / des technologies.

```
            o--- (branche A)
   racine --+--- (branche B) === vivante, produit
            o--- (branche C)  X  eteinte (extinction) -> une mineure rebondit
```

### Crise (ère 11 (`e10`)) - survie à l'extinction (plein écran)

Une crise peut se résoudre par son **propre mini-jeu**, pas seulement un bouton.
À l'extinction de masse, la modale d'annonce porte **« Affronter »** : la fermer
lance un widget plein écran où des **météores tombent au hasard** sur toute la
largeur tandis que de petites **créatures** (rats, raptors) errent au sol. On les
**clique pour les faire plonger dans un terrier** (en pente) avant qu'un impact
ne les fauche ; **50 sauvetages** surmontent la crise. Voir [GAME-DESIGN](./GAME-DESIGN.md)
section 6.4 (`CrisisGame`, `CrisisBanner`, `CrisisScene`, `crisisStore`).

## Ère 12 (`e11`) - Intelligence : constellation d'idées (mémoire)

- **Ressources / recette** : `tool` -> `knowledge` (recette `learning`). Verbe :
  Apprendre.
- **Mécanique - séquence façon vrai Simon.** Six "idées" (nœuds), **chacune sa
  couleur** (la couleur aide à mémoriser, la forme/numéro reste l'identité ;
  petit point coloré au survol). La séquence **s'illumine dans un ordre**, le
  joueur la **reproduit**. Elle est **cumulative** : +1 nœud à chaque réussite,
  **plafonnée à 10** ; une erreur **repart de zéro** avec une nouvelle séquence.
  Signaux nets : floraison à la réussite, flash rouge + secousse à l'échec, et un
  **compteur d'étapes**.
- **Récompenses** : **chaque clic** produit du `tool` (base) - **doublé** sur le
  bon nœud ; **valider la séquence** produit du `knowledge` (secondaire) ×sa
  longueur. **Pinacle** : réussir une séquence de **10** **double la Complexité de
  l'ère** (modale + ×N devant le diamant des ressources), cumulable jusqu'à un
  cap (×32) ; au cap, un "Bonus maximal atteint" évite de frustrer le joueur.
- **Progression / nouveauté** : pure mécanique de **mémoire/skill**, cérébrale -
  colle à l'éveil de l'esprit, et offre un **levier actif** d'accélération de la
  Complexité de l'ère (cf. [GAME-DESIGN.md](./GAME-DESIGN.md) section 8).
- **Implémentation** : manuel = reproduire la séquence ; auto = `learning`
  (transmission passive). a11y = nœuds = boutons numérotés, séquence + issue
  annoncées (aria-live). Récurrence : sciences, paradigmes.

## Ère 13 (`e12`) - Sociétés : plan de la cité

- **Ressources / recette** : `population` -> `city` (recette `construction`).
  Verbe : Bâtir. **Crise** : esclavage/révolte (Starpacus, ère 13 (`e12`)).
- **Mécanique - placement sur grille (adjacences).** Une grille de terrain ; on
  **pose des bâtiments** (habitations, fermes, ateliers, marchés) en choisissant
  l'emplacement. Les **adjacences** donnent des bonus (ferme à côté d'habitation,
  marché entre ateliers...). Optimiser le plan **augmente la production** de
  cité/population.
- **Progression / nouveauté** : premier **puzzle d'optimisation spatiale** (où
  poser pour maximiser), façon city-builder léger. Décisions de placement
  durables.
- **Gestion de ressources** : nouveauté - la production dépend de la
  **disposition** (adjacences), pas seulement des quantités. Couplée à la crise
  de révolte (sur-exploitation -> rebond).
- **Implémentation** : manuel = poser/déplacer des bâtiments ; auto =
  `construction`. Anti-frustration = mauvais placement = bonus moindre, jamais
  négatif ; on peut redéplacer. a11y = grille de cases-boutons + palette de
  bâtiments. Récurrence : mégastructures galactiques, ville-univers (finale).

```
   [Hab][Fer][   ]      adjacence Hab+Fer = bonus nourriture
   [Ate][Mar][Ate]      Marche entre 2 Ateliers = bonus commerce
   [   ][Hab][   ]      poser pour maximiser les voisinages
```

## Ère 14 (`e13`) - Nations : carte du monde

- **Ressources / recette** : `trade` -> `empire` (recette `conquest`). Verbe :
  Négocier / Conquérir.
- **Mécanique - contrôle de territoire (Risk léger).** Une **carte de régions**.
  Chaque région **non contrôlée** peut être prise de deux façons : **négocier**
  (lent, sûr, pacifique -> `trade`) ou **conquérir** (rapide, risqué, monte la
  tension -> `empire`). Contrôler des régions **produit** de l'influence ; les
  régions adjacentes contrôlées forment des **blocs** (bonus). La voie guerrière
  alimente la **course à l'armement** (lien vers la crise atomique de l'ère 15 (`e14`)).
- **Progression / nouveauté** : première **stratégie de carte avec choix
  moral/tactique** (diplomatie vs guerre), apogée de la montée en complexité
  stratégique. Deux styles de jeu.
- **Gestion de ressources** : forte évolution - production **territoriale** +
  un **axe de choix** (commerce vs conquête) qui oriente quelles ressources on
  privilégie et le niveau de risque.
- **Implémentation** : manuel = cliquer une région -> Négocier / Conquérir ;
  auto = `conquest` (expansion passive). Anti-frustration = une conquête ratée
  = région non prise + un peu de tension, jamais de perte sèche. a11y = régions
  = boutons étiquetés (nom + action). Récurrence : fédérations galactiques,
  intergalactique.

```
   ( A )==( B )   ( C )      A,B controlees (bloc -> bonus)
      \\    |       |         C neutre : [Negocier] (sur) ou [Conquerir] (risque)
   ( D )--( E )==( F )
```

---

## Notes transverses

- **Réutilisation moteur** : chaque widget pilote les ressources/recettes
  existantes via `manualProduce` / `manualConvert` / `click` + flottants ; le
  fond idle reste l'automatisation (`tick`).
- **Nouveaux états** : certaines mécaniques (Petri, arbre, cité, carte)
  demandent un **état de widget persistant** (grille, structure). À décider :
  local (non sauvegardé, se reconstruit) ou ajouté à `GameState` (comme
  `discovered`/`seenEvents`, avec `withDefaults`). Privilégier le local quand la
  structure peut se régénérer ; persister quand la disposition est un acquis du
  joueur (cité, arbre).
- **Coût d'implémentation** (indicatif) : faible = balance (e7), endosymbiose
  (e8), mémoire (e11) ; moyen = accrétion (e4), molécules (e5), assemblage (e9) ;
  élevé = Petri/automate (e6), arbre (e10), cité (e12), carte (e13).
- **Ordre suggéré** : commencer par e4 (accrétion, continuité cosmique) puis
  e7 (balance, peu coûteux et très distinct) pour valider deux archétypes
  nouveaux avant les gros (arbre, cité, carte).
