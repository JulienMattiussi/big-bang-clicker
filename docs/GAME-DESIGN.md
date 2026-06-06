# Big Bang Clicker - Game Design

> Document de conception du jeu. Définit la boucle de gameplay, le modèle
> économique unifié, le système de prestige et les principes d'équilibrage.
> Voir aussi [PHASES.md](./PHASES.md), [UI-UX.md](./UI-UX.md),
> [ARCHITECTURE.md](./ARCHITECTURE.md), [SCIENCE.md](./SCIENCE.md).

## 1. Pitch

Un jeu incrémental (clicker / idle) qui raconte l'histoire de l'univers, du
Big Bang jusqu'à une ville-univers qui ré-explose pour tout recommencer, en
mieux. Le joueur traverse 16 ères, chacune apportant un nouveau geste de jeu
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
                │               upgrades (multiplicateurs)
                ▼                      │
        Complexité (méta) ◄───────────┘
                │
                ▼
        seuil atteint ──► nouvelle ère débloquée (nouveau verbe)
                │
                ▼
     ... 16 ères ... ──► phase 15 : explosion ──► PRESTIGE (New Game+)
```

Chaque ère est une instance du même moteur générique : une ressource locale,
des générateurs qui la produisent automatiquement, des upgrades qui
multiplient la production, et une contribution à la méta-ressource commune.

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
combinaison. La Complexité :

- est la **monnaie de progression** : franchir un palier d'ère coûte de la
  Complexité (et/ou exige un seuil de ressource locale) ;
- est **persistante** entre ères (elle ne se reset pas au passage d'ère) ;
- alimente des **upgrades transverses** (bonus globaux qui touchent toutes les
  ères actives).

### 3.3 Monnaie de prestige : les Échos

Au terme de la phase 15 (la ville-univers explose), le joueur déclenche un
**nouveau Big Bang**. Tout est remis à zéro (ressources locales, générateurs,
upgrades, ères) SAUF les **Échos**, gagnés en fonction de la Complexité totale
accumulée durant la partie. Les Échos achètent des **bonus permanents** (méta-
upgrades) qui rendent chaque renaissance plus rapide et plus puissante : c'est
le New Game+ augmenté.

Formule de prestige (principe, à équilibrer) :

```
échos_gagnés = floor( k * sqrt(complexité_totale / seuil_base) )
```

## 4. Cohabitation des ères

Décision clé : **les ères débloquées continuent de tourner en arrière-plan.**

- Une fois une ère débloquée, ses générateurs produisent même quand le joueur
  regarde une autre ère (production idle).
- Le joueur **navigue** entre ses ères actives via des onglets/scènes (voir
  [UI-UX.md](./UI-UX.md)).
- **Chaînage inter-ères** : c'est le mécanisme par défaut, porté par le réseau
  de ressources (section 3.1). La sortie d'une ère est l'entrée d'une autre
  (ex : les atomes de l'ère 1 alimentent les convertisseurs stellaires de
  l'ère 2). Donc une ère ancienne doit continuer de produire pour alimenter les
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
  le mécanisme qui rend supportables 20 ères en cohabitation.

### 5.1 Automatisation progressive (par ère)

Chaque ère suit le même rythme, ce qui garde la **complexité ressentie à peu
près constante** même si le système global grossit :

1. **Manuel** : on découvre le verbe de l'ère au clic.
2. **Premières usines** : elles automatisent partiellement le verbe et les
   conversions.
3. **Optimisation** : arbres d'amélioration (vitesse, rendement, capacité,
   coût).
4. **Automatisation de l'automatisation** : des gestionnaires font tourner (et
   parfois améliorer) seules les usines des ères anciennes.

### 5.2 Vocabulaire et lien technique

Le modèle est celui d'un **clicker standard** : clic manuel, puis générateurs
qui produisent tout seuls, achat automatique, et gestionnaires qui automatisent
les paliers anciens (façon Cookie Clicker / Adventure Capitalist). On reprend
ces conventions éprouvées plutôt que de réinventer.

"Usine" est le terme **joueur**. Techniquement, une usine est un **générateur**
(produit une ressource) ou un **convertisseur** (applique une recette) doté de
**niveaux** et d'améliorations (voir [ARCHITECTURE.md](./ARCHITECTURE.md)). Le
clic manuel reste possible mais devient marginal une fois l'ère automatisée.

### 5.3 Garde-fous

- L'automatisation ne doit pas rendre le jeu **passif au point d'ennuyer** : il
  reste toujours des décisions (quoi améliorer en priorité, comment équilibrer
  les flux entrées/sorties). Voir section 3.1ter.
- La **frontière active** demande de l'attention ; le passé est automatisé. On
  ne doit jamais avoir à micro-gérer manuellement une ère ancienne.
- Débloquer une automatisation peut être une **récompense** (upgrade, jalon,
  méta-upgrade de prestige), pas un acquis gratuit.

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

1. **Montée du risque** : une jauge de tension s'accumule, souvent par
   **sur-exploitation** d'une ressource ou par une course en avant. Toujours
   **télégraphiée** (le joueur voit venir).
2. **Déclenchement** : à un seuil scripté, par choix du joueur, ou de façon
   probabiliste au-delà d'un seuil.
3. **Régression** : perte **partielle** (une ressource s'effondre, la
   production chute, des structures sont détruites). Jamais une perte totale, ni
   un blocage.
4. **Rebond** : reconstruction puis **amélioration permanente** : une ressource
   se transforme en une meilleure, un multiplicateur, une mécanique débloquée,
   ou un changement narratif/structurel.

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

- **Extinction de masse** (ère 10) : un clade domine (ex : les dinosaures) puis
  disparaît dans une extinction ; au rebond, une branche jusque-là mineure
  explose en diversité (ex : les mammifères) et ouvre une voie meilleure.
- **Esclavage** (ère 12) : l'esclave est une ressource sur-exploitée ; au-delà
  d'un seuil, révolte (menée par un certain Starpacus), la société éclate ; les
  ex-esclaves deviennent des citoyens (ressource meilleure), la société repart
  améliorée.
- **Arme atomique** (ère 14) : la course à l'armement fait monter le risque ;
  une bombe éclate, forte régression ; les survivants refondent une société plus
  avancée et résiliente.
- **Crise écologique** (ère 14) : l'industrialisation et la sur-exploitation
  font monter la pollution ; au seuil, effondrement écologique (régression) ;
  une transition durable relance sur des bases plus efficaces et résilientes.
- **Soulèvement IA** (ère 14) : une IA toute-puissante (le Matrixator) se
  retourne contre ses créateurs ; prise de contrôle des machines (régression) ;
  un alignement avec l'IA relance sur des bases plus puissantes.
- **Navette spatiale** (ère 15) : pousser les lancements sans sécurité fait
  exploser une navette ; le budget est gelé (régression) ; une avancée de
  sécurité relance la conquête sur de meilleures bases.

D'autres crises pourront être ajoutées dans le même esprit (krachs économiques,
pandémies...), avec parcimonie.

## 7. Renouvellement : un verbe par ère

Pour éviter le "même bouton, autres mots", chaque grande ère introduit un
geste de jeu distinct. Détail dans [PHASES.md](./PHASES.md). Vue d'ensemble :

> Découpage validé à 20 ères (dérivé de [SCIENCE.md](./SCIENCE.md)). Détail
> complet (ressources, widgets, science) dans [PHASES.md](./PHASES.md).

| Ère | Thème | Verbe central |
|----:|-------|---------------|
| 0 | Big Bang & refroidissement | Refroidir |
| 1 | Recombinaison (premiers atomes) | Capturer les électrons |
| 2 | Premières étoiles & galaxies | Effondrer / allumer |
| 3 | Forges stellaires (éléments lourds) | Forger (Mendeleïev) |
| 4 | Système solaire & Terre | Accréter / faire entrer en collision |
| 5 | Terre habitable + briques de la vie | Stabiliser & synthétiser |
| 6 | Premières vies (procaryotes) | Répliquer / diviser |
| 7 | Photosynthèse & Grande Oxydation | Oxygéner |
| 8 | Eucaryotes & endosymbiose | Fusionner / complexifier |
| 9 | Multicellularité & Cambrien | Assembler des organismes |
| 10 | Conquête des terres (plantes, animaux) | Faire évoluer / peupler |
| 11 | Intelligence (préhistoire) | Apprendre / innover |
| 12 | Sociétés (néolithique, villes) | Organiser / bâtir |
| 13 | Relations inter-sociétés | Négocier / conquérir |
| 14 | Technologies | Rechercher / inventer |
| 15 | Conquête spatiale | Lancer / explorer |
| 16 | Sociétés galactiques | Coloniser / fédérer |
| 17 | Sociétés intergalactiques | Relier les galaxies |
| 18 | Ville-univers | Unifier / englober |
| 19 | Explosion (nouveau Big Bang) | Transcender (prestige) |

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

## 11. Langue

- **Français par défaut**, anglais proposé (sélecteur). i18n custom léger
  (pattern maison), clés typées. Le contenu narratif et scientifique est
  rédigé d'abord en FR puis traduit en EN.

## 12. Ton, narration et humour

> Le catalogue vivant des anecdotes, easter eggs et références culturelles est
> tenu dans [NARRATIVE.md](./NARRATIVE.md).

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
