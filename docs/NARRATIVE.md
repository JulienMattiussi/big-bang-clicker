# Big Bang Clicker - Narration, anecdotes et clins d'oeil

> Catalogue **vivant** des anecdotes scénaristiques, easter eggs, références
> culturelles et idées d'évènements. Destiné à grossir **au fil de l'eau**.
> Pour le ton général et le dosage de l'humour, voir
> [GAME-DESIGN.md](./GAME-DESIGN.md) section 12. Pour les crises (régressions),
> voir section 6.

## Principes

- **Humour et références parsemés**, jamais envahissants (cf. ton dominant :
  émerveillement et sérieux scientifique).
- **Clins d'oeil renommés** : on évite les marques déposées et noms exacts ; on
  garde des hommages **parodiques** reconnaissables (ex : "couteau à huître
  laser" plutôt
  que le nom de marque, "Cultivateurs" plutôt que le nom d'origine).
- **Mise en oeuvre** : la plupart sont du **texte d'ambiance** ou de petits
  **évènements** déclenchés à des seuils/transitions ; certains peuvent être des
  inventions abandonnées, d'autres de courts arcs narratifs. Tagués en données
  pour régler leur fréquence (voir [ARCHITECTURE.md](./ARCHITECTURE.md) i18n).
- **Sobriété en cas de doute** : mieux vaut rare et savoureux que fréquent et
  lourd.

## Catalogue (extensible)

| Référence / source | Idée en jeu | Ère(s) | Type |
|---|---|---|---|
| Star Wars | Invention d'un **couteau à huître laser** (lame d'énergie pour ouvrir les huîtres), vite **abandonné car peu fiable** (instable, dangereux pour l'utilisateur) | 14 (Technologies) | Invention absurde / abandonnée |
| Asimov, Fondation | Un savant invente la **psychohistoire** (prédire l'avenir des sociétés), **abandonnée car peu fiable** | 13 (Relations) ou 14 (Technologies) | Invention abandonnée / clin d'oeil |
| (Histoire des religions) | **Naissance et disparition de religions** au fil de la société ; la société la plus évoluée devient **athée** | 12 (Sociétés) | Arc narratif / évènements |
| Mass Effect | Le **Commandant Shepard** meurt en luttant contre une civilisation hostile, les **Cultivateurs** | 16 (galactique) / 17 (intergalactique) | Évènement narratif / clin d'oeil |
| Mass Effect | Technologie **effet de masse** débloquant les **voyages intergalactiques** | 17 (Intergalactique) | Techno nommée / clin d'oeil |
| Dune | L'**épice**, ressource clé de la conquête galactique, produite par les **vers de vase** de la planète **Salakis** | 16 (Galactique) | Ressource nommée / clin d'oeil |
| H2G2 | **"Pas de panique"** affiché au déclenchement d'une crise (régression) : un clin d'oeil qui **rassure** le joueur au pire moment | Transverse (crises, section 6) | **Humour utile (UX)** |
| H2G2 | Le nombre **42** comme "réponse" cachée : jalon/easter egg secret (ex : à 42 d'une ressource ou de Complexité, un message énigmatique) | Transverse | Easter egg / nombre culte |
| H2G2 | La Terre est en réalité un **super-ordinateur** construit pour calculer la Grande Question (et un dirigeant l'éteindra, cf. ère 19) | 4-5 (Terre) | Clin d'oeil narratif |
| H2G2 | **Drive à improbabilité infinie** : propulsion absurde alternative à l'effet de masse | 15-17 (Spatial) | Techno absurde / clin d'oeil |
| Disque-monde (Pratchett) | L'**octarine**, la huitième couleur (couleur de la magie), employée **discrètement** pour les éléments rares/secrets/magiques. Variable `--octarine` dans le thème | Transverse (design) | Easter egg discret / couleur |
| Pierres de l'infini (Marvel) | Six **galets peints de l'infini** (Espace, Temps, Réalité, Pouvoir, Esprit, Âme), rares, à collectionner à travers les ères et les prestiges ; les réunir tous débloque un effet majeur. Nom volontairement mondain (de simples galets peints qui gouvernent l'univers) | Transverse (méta-progression) | Collection rare / clin d'oeil |
| Jurassic Park | « **La vie trouve toujours un chemin** » comme accroche / titre de l'ère de l'évolution | 10 (Évolution) | Phrase d'interface / clin d'oeil |
| Spartacus | La révolte des esclaves est menée par un certain **Starpacus** | 12 (Sociétés) | Évènement nommé / clin d'oeil |
| The Matrix | Une IA toute-puissante, le **Matrixator**, se soulève : crise (régression) | 14 (Technologies) | Crise nommée / clin d'oeil |
| Lavoisier | « Rien ne se perd, rien ne se crée, tout se transforme » en accroche de l'ère des forges stellaires (forme popularisée) | 3 (Forges) | Citation / accroche |

## Idées de mise en scène

- **Inventions abandonnées** (couteau à huître laser, psychohistoire) : peuvent
  apparaitre
  comme un upgrade "raté" qui donne un petit bonus de saveur (ou un mini-malus
  comique) puis disparait, sans casser l'équilibrage. Lien possible avec les
  crises légères (section 6).
- **Religions** (ère 12) : un sous-système discret ou une chaine d'évènements
  (apparition -> influence -> déclin), aboutissant à une société laïque comme
  jalon de "maturité" narrative voulu par le porteur du projet.
- **"Pas de panique" (H2G2)** : à afficher sur l'écran de **crise/régression**
  (section 6). C'est le cas rare d'un clin d'oeil qui sert aussi l'UX : il
  dédramatise le revers et rappelle au joueur que le rebond est prévu. Réglable
  via le tag d'évènement (peut n'apparaitre qu'une fois sur N crises).
- **Terre-ordinateur + 42 (H2G2)** : la Terre (ères 4-5) peut être présentée
  comme un super-calculateur cherchant la Grande Question, et le nombre **42**
  semé en easter egg. Belle résonance avec la fin (ère 19) : tout l'univers
  comme un calcul, interrompu par une bêtise domestique.
- **Épice / Salakis** (ère 16) : au-delà du clin d'oeil, l'épice peut être une
  **ressource du réseau** (rare, produite par une chaîne dédiée via les vers de
  vase) requise pour débloquer ou accélérer l'expansion galactique. Voir le
  modèle de ressources dans [GAME-DESIGN.md](./GAME-DESIGN.md) section 3.1.
- **Galets peints de l'infini** : chacun peut correspondre à un domaine
  fondamental du jeu, ancré dans une ère :
  - Espace -> conquête spatiale / intergalactique (ères 15-17)
  - Temps -> vitesse de jeu / rendement idle
  - Réalité -> transmutation de ressources (le réseau, section 3.1)
  - Pouvoir -> multiplicateur de production global
  - Esprit -> intelligence / recherche (ères 11, 14)
  - Âme -> vie / biomasse (ères 6-10)
  Idée méta : on les **gagne au fil des prestiges** (lien avec les Échos), ils
  brillent en **octarine**, et les réunir tous débloque un effet puissant (un
  "claquement de doigts" optionnel, qui pourrait même être une crise-récompense
  assumée, cf. section 6). Collection longue durée qui récompense la rejouabilité.
- **Octarine (Disque-monde)** : la réserver, en touche **discrète**, aux
  éléments rares ou magiques (lueur d'un easter egg, le 42, un secret de
  prestige). Tag couleur `--octarine` déjà posé dans `src/theme.css`. Un
  tooltip peut souffler qu'elle n'est "visible que par les sorciers et les
  chats".
- **Cultivateurs / effet de masse** (ères 16-17) : intégrer aux widgets
  spatiaux (carte galactique, toile cosmique) ; la lutte contre les Cultivateurs
  peut être un évènement marquant (voire une crise) de l'ère intergalactique.

## Localisation des références (FR / EN)

Le jeu est bilingue (**FR par défaut, EN proposé**). Règle stricte pour les
références : utiliser la **formulation officielle/pertinente de chaque langue**,
jamais une traduction littérale. Les **jeux de mots français** doivent être
**recréés** en anglais (un calque ne serait ni drôle ni compréhensible).

Citations dont la version officielle est connue :

| Référence | FR | EN |
|---|---|---|
| Jurassic Park | « La vie trouve toujours un chemin » | "Life finds a way" |
| Lavoisier | « Rien ne se perd, rien ne se crée, tout se transforme » | "Nothing is lost, nothing is created, everything is transformed" |
| H2G2 (Don't Panic) | « Pas de panique » | "Don't Panic" |
| Asimov (fin) | « Que la lumière soit » | "Let there be light" |
| Tsiolkovski (ère 15) | « La Terre est un berceau, pas une demeure » | "Earth is the cradle of humanity, but one cannot live in the cradle forever" |

Jeux de mots à **réinventer** en anglais (ne pas traduire mot à mot) :

- **Salakis** (marque de feta FR) : trouver un équivalent culturel anglophone,
  ou conserver le nom en assumant le clin d'oeil franco-français.
- **Vers de vase** (asticots de pêche) : recréer le contraste mondain en
  anglais (ex : un ver de pêche banal), pas une traduction littérale.
- **Couteau à huître laser**, **Starpacus**, **Matrixator** : vérifier que le
  jeu de mots fonctionne aussi en anglais ; adapter sinon.

Note de travail : à chaque référence intégrée, **renseigner les deux langues**
dans les fichiers de traduction (`src/i18n/translations/`), en contrôlant la
formulation officielle.

## À ajouter au fil de l'eau

Réserve pour les prochaines idées (références, anecdotes, évènements). Garder le
dosage parcimonieux et le ton cohérent avec l'ère concernée.
