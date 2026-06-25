# Simulation d'équilibrage

Outil de **dev** (exclu de `make check`) : il simule la progression d'un joueur
en réutilisant le **vrai moteur** (`src/lib`) et les **vraies données**
(`src/data`), donc les stats reflètent l'équilibrage réel, pas une
réimplémentation. Sert à estimer le temps pour franchir chaque palier, repérer
les murs (ère bloquée faute de Complexité), et comparer deux équilibrages.

## Cycle de travail

```sh
make sim                 # joue les runs -> écrit un snapshot dans sim/results/<id>/
make sim-summary         # tableau lisible du DERNIER snapshot (voir plus bas)
make sim-view            # rappelle l'URL du viewer graphique
```

`make sim` tourne dans un **processus Node distinct** (Vitest sert juste de
runner TS) : il ne touche pas au serveur de dev, tu peux jouer pendant qu'il
calcule. Aléa (crises, mémoire) **déterministe** par run : deux runs identiques
donnent le même résultat, donc deux équilibrages sont comparables.

## Lancer un run

Par défaut, `make sim` joue la **matrice complète** : 4 profils x 2 politiques =
**8 runs**, au niveau de renaissance 0 (`~15-20 min`). Pour cibler **un seul**
run, on passe des variables d'environnement :

| Variable | Effet | Défaut |
|---|---|---|
| `SIM_PROFILE` | un profil (`minimal`/`casual`/`active`/`optimal`) | tous |
| `SIM_POLICY` | `asap` (franchit dès que possible) ou `ready` (développe l'ère d'abord) | les deux |
| `SIM_REBIRTHS` | niveau de renaissance de départ (chaque renaissance = 1 Écho) | `0` |
| `SIM_META` | allocation des Échos : ids de méta-upgrades possédés, séparés par des virgules (`boostProduction`/`boostComplexity`/`boostClick`/`boostGalet`) | aucun |

```sh
SIM_PROFILE=active SIM_POLICY=ready make sim                      # 1 run, sans renaissance
SIM_PROFILE=active SIM_REBIRTHS=1 SIM_META=boostComplexity make sim  # r1, l'Écho mis sur la Complexité
```

Les bonus de renaissance sont **pré-appliqués** : le sim joue **une seule passe**
au niveau demandé (pas de boucle multi-tours). `SIM_META` ne peut pas allouer
plus d'Échos que `SIM_REBIRTHS` (1 Écho par renaissance), sinon erreur.

## Où sont les résultats, et comment les retrouver

Chaque `make sim` crée **un snapshot** = un dossier nommé avec un **préfixe
horodaté triable** :

```
sim/results/<AAAA-MM-JJ-HH-MM>__<commit>[__<cible>]/<profil>__<politique>[__rN][_metas].json
              └ horaire UTC      └ git    └ slug si    └ un fichier JSON par run
                (tri lexical =     court    run ciblé
                 chronologique)            (ex: active-ready-r1-boostComplexity)
```

> **Le « dernier » snapshot = le nom le plus grand, PAS le mtime le plus récent.**
> L'élagage (on ne garde que les 8 derniers dossiers) modifie les dates de
> modification : trier par mtime (`ls -t`) induit en erreur. Trier par **nom** :
> `ls -1d sim/results/*/ | sort | tail -1`.

Pour analyser, ne relis pas le JSON à la main :

```sh
make sim-summary                              # le dernier snapshot
make sim-summary DIR=sim/results/2026-06-25-11-56__8508a22   # un snapshot précis
```

`sim-summary` imprime, par run : profil, politique, renaissance, **ère finale**
(numéro affiché en jeu + nom), état de **fin**, **Complexité max**, jours-jeu et
temps de calcul (wall). Pour superposer plusieurs snapshots graphiquement
(avant/après un changement), utilise le **viewer** : `make start` puis
`http://localhost:1138/sim/viewer/` (page séparée, hors bundle du jeu ; se
recharge en HMR quand de nouveaux JSON arrivent).

### Lire un résultat

L'état de **fin** d'un run (colonne `fin`) :

- **`DESTRUCTION`** : le run a joué la fin de l'ère 19 (crise du gaz ->
  contraction de la singularité -> effondrement). C'est l'objectif d'une partie.
- **`STUCK`** : mur réel, le joueur ne pouvait plus progresser (`GLOBAL_STALL_S`).
- **`horizon`** : ni l'un ni l'autre, le run a simplement atteint le **plafond de
  temps** (`MAX_ITERS` ~ **11,5 jours-jeu**). Tous les runs s'arrêtent là s'ils
  n'ont pas fini avant ; un `horizon` à ère < 19 signale un manque de Complexité,
  pas un blocage dur.

Attention : **`finalEraIndex` est 0-based**, le numéro affiché en jeu (« Ère N »)
est `+1` (c'est ce que montre déjà `sim-summary` et le viewer). Schéma complet
d'un résultat : `RunResult` dans [`types.ts`](./types.ts).

> Gotcha zsh : `sim/results/<dir>/*.json` avorte (`no matches found`) si le glob
> ne matche rien. Pour lister à la main, préfère `find <dir> -name '*.json'`.

## Ce qui est simulé

- **4 profils** ([`profiles.ts`](./profiles.ts)) : `minimal` (bootstrap : clique
  juste pour lancer la 1re machine de chaque ère, mais amorce un niveau de
  chaque machine pour que les chaînes coulent), `casual`, `active`, `optimal`.
  La compétence aux widgets est abstraite en **clics + completes par seconde**,
  pas le mini-jeu au pixel.
- **2 politiques** : `asap` / `ready` (voir tableau plus haut).
- **Mémoire** : les profils qui y jouent ont un **taux de réussite par niveau**
  (`memoryWinRate`) ; le sim mise 10% de Complexité et applique le x2 cumulatif
  via les helpers purs de `src/lib/memory`.
- **Levelage des ères antérieures** (`levelsEarlierFactories`, active/optimal) :
  ces profils dépensent le surplus accumulé dans **chaque** ère pour monter le
  niveau de ses usines (par **achats**, jamais en rejouant d'anciens widgets).
- **Galets** : galets de palier découverts+activés comme en jeu ; galet de widget
  activé une fois la machine de l'ère au niveau requis.
- **Fin de l'ère 19** : rejoue la séquence de l'UI (crise du gaz ingagnable ->
  contraction au rythme de clic du profil), pour mesurer une partie complète.

## Réglages

- profils : [`profiles.ts`](./profiles.ts)
- bornes (pas de temps `DT`, plafond d'itérations `MAX_ITERS`, seuils de stall,
  cadences des widgets) : constantes en tête de [`simulate.ts`](./simulate.ts)
- sélection des runs et nommage des snapshots : [`run.sim.ts`](./run.sim.ts)
- résumeur CLI : [`summary.mjs`](./summary.mjs) ; viewer : [`viewer/`](./viewer)
