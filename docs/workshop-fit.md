# Atelier sur une seule vue

Les cent pages de jeu occupent la zone sûre disponible, sans défilement du plateau ni de la page. Le menu, les graines, les fioles, l’indice et les trois commandes restent accessibles ensemble. Les pages du carnet gardent leur propre défilement ; la carte conserve son défilement intérieur.

## Composition

`workshopLayout` utilise la largeur et la hauteur mesurées dans la scène, après les marges système. Il réserve l’ATH, la vignette de plante, une zone d’indice pré-mesurée et les commandes. Sur un écran court, les informations secondaires disparaissent et le nom de la plante rejoint l’ATH. En paysage court, l’indice et les commandes sont côte à côte. Un écran large conserve la planche botanique dans une colonne distincte.

`liquidBoardLayout` compare les nombres de colonnes possibles. Il ajuste la taille des fioles aux dimensions disponibles, sans plafond fixe, en tenant compte du rack, des numéros et de la place nécessaire au versement. Le choix privilégie de grands tubes lisibles et une bonne occupation de la hauteur, avec des rangées équilibrées : sur un téléphone haut, six fioles forment deux rangées de trois plutôt qu’une petite rangée perdue au milieu du décor. Sur un écran court, elles peuvent rester sur une rangée. La dernière rangée est centrée.

La géométrie est réduite uniformément : les proportions des tubes et la simulation du liquide restent identiques. Les numéros gardent une taille de texte de dix points ; les symboles de couleur restent lisibles. Chaque cible tactile mesure au moins 44 points, reste dans le plateau et ne chevauche aucune autre cible.

L’indice est mesuré avec les mêmes dimensions et polices que son affichage final. Son emplacement reste vide avant la demande ; son déroulement et son écriture n’agrandissent pas le pied de page. Les deux messages exceptionnels les plus longs ont une formulation visuelle plus courte, avec leur texte complet conservé pour les lecteurs d’écran. Le coût des indices et la progression ne changent pas.

La barre de commandes dispose d’un cadre feuillu spécifique aux formats bas. Ses petites feuilles restent dans les marges ; les ornements d’angle des grandes pages ne sont pas comprimés autour des boutons. Sa hauteur réserve douze points en haut et en bas, puis la place des icônes, des libellés selon la taille de police et du coût de l’indice lorsqu’il est affiché. Les trois libellés partagent la même ligne et le prix reste à l’intérieur du papier, avant et après la demande d’indice.

## Vérification

- `npm test` couvre les cent pages sur quinze formats, avec deux facteurs de taille de police : limites du plateau, cibles de 44 points, absence de chevauchement et répartition des rangées. Des régressions spécifiques vérifient le remplissage de la hauteur sur les téléphones hauts et l’ajustement selon le nombre de fioles.
- `node --import tsx scripts/workshop-fit-smoke.ts` contrôle le rendu réel des cent pages à 393 × 852, puis chaque nombre de fioles sur treize formats supplémentaires, du portrait 320 × 400 au paysage 480 × 280 et aux tablettes. Il vérifie les limites de chaque cible, les commandes, l’absence de défilement horizontal et vertical, ainsi que la stabilité des boutons pendant l’indice. La page 25 à 412 × 915 doit occuper la hauteur du plateau en deux rangées.
- Les essais d’entrée dans l’atelier, de versement, d’indice, de navigation et de bilan complètent ces contrôles. Le bilan est également vérifié avant et après révélation sur quinze formats.

Ces contrôles de navigateur et les exports Android/iOS vérifient la composition et la compilation. Ils ne mesurent pas la cadence d’affichage sur un téléphone physique.
