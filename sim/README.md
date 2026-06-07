# Simulation d'équilibrage

Outil de **dev** : il simule la progression d'un joueur en réutilisant le **vrai
moteur** (`src/lib`) et les **vraies données** (`src/data`), donc les stats
reflètent l'équilibrage réel (pas une réimplémentation). Sert à estimer le temps
pour franchir chaque palier, compter les retours en arrière, et vérifier si le
joueur active toutes les étapes d'une ère avant de passer à la suivante.

## Utilisation

```sh
make start          # le jeu tourne sur http://localhost:1138 (tu peux jouer)
make sim            # lance les simulations (processus séparé, ~2-3 min)
                    # -> écrit sim/results/*.json
# ouvre http://localhost:1138/sim/viewer/  dans un autre onglet
```

`make sim` tourne dans un **processus Node distinct** (via Vitest, juste comme
runner TS) : il ne touche pas au serveur de dev, tu peux continuer à jouer
pendant qu'il calcule. Le viewer est une **page séparée** servie par le même
serveur de dev (`/sim/viewer/`), hors du bundle du jeu. Quand de nouveaux JSON
sont écrits, le viewer se recharge tout seul (HMR).

## Ce qui est simulé

- **4 profils** (`profiles.ts`) : idle (full auto), casual, actif, optimal.
  La compétence aux mini-jeux des widgets est abstraite en *clics + completes par
  seconde* (pas le mini-jeu au pixel).
- **2 politiques de déblocage** : `asap` (franchit dès que possible) et `ready`
  (attend d'avoir développé l'ère) -> 8 runs.
- Aléa (crises) **déterministe** : runs reproductibles et comparables.

## Métriques (par run, dans le JSON)

- temps pour rendre chaque palier *atteignable* et pour le *franchir* (+ grind) ;
- `backTrips` : épisodes où un intrant amont passe en déficit pendant l'ère ;
- `completeness` au moment de quitter l'ère : générateurs/convertisseurs actifs
  vs total, ressources révélées, et `fullyActivated` (la question « tout activé
  avant le palier suivant ? ») ;
- crises résolues ; courbe de complexité dans le temps.

Chaque résultat est tagué avec le **hash des données** et le **commit git**, pour
savoir quel équilibrage l'a produit et comparer des runs entre eux.

## Réglages

- profils : `sim/profiles.ts`
- bornes (pas de temps, plafond d'itérations, seuils de stall) : constantes en
  haut de `sim/simulate.ts`
- le viewer : `sim/viewer/`
