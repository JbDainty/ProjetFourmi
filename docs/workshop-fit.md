# Atelier sur une seule vue

Les cent pages de jeu occupent la zone sûre disponible, sans défilement du plateau ni de la page. Le menu, les graines, les fioles, l’indice et les quatre commandes restent accessibles ensemble. Les pages du carnet gardent leur propre défilement ; la carte conserve son défilement intérieur.

## Composition

`workshopLayout` utilise la largeur et la hauteur mesurées dans la scène, après les marges système. Il réserve l’ATH, la vignette de plante, une zone d’indice pré-mesurée et les commandes. Sur un écran court, les informations secondaires disparaissent et le nom de la plante rejoint l’ATH. En paysage court, l’indice et les commandes sont côte à côte. Un écran large conserve la planche botanique dans une colonne distincte.

`liquidBoardLayout` compare les nombres de colonnes possibles. Il ajuste la taille des fioles aux dimensions disponibles, sans plafond fixe, en tenant compte du rack, des numéros et de la place nécessaire au versement. Le choix privilégie de grands tubes lisibles et une bonne occupation de la hauteur, avec des rangées équilibrées : sur un téléphone haut, six fioles forment deux rangées de trois plutôt qu’une petite rangée perdue au milieu du décor. Sur un écran court, elles peuvent rester sur une rangée. La dernière rangée est centrée.

La géométrie est réduite uniformément : les proportions des tubes et la simulation du liquide restent identiques. Les numéros gardent une taille de texte de dix points ; les symboles de couleur restent lisibles. Chaque cible tactile mesure au moins 44 points, reste dans le plateau et ne chevauche aucune autre cible.

L’indice est mesuré avec les mêmes dimensions et polices que son affichage final. Son emplacement reste vide avant la demande ; son déroulement et son écriture n’agrandissent pas le pied de page. Les deux messages exceptionnels les plus longs ont une formulation visuelle plus courte, avec leur texte complet conservé pour les lecteurs d’écran. Le coût des indices et la progression ne changent pas.

La barre retrouve les lianes et les ornements d’angle du cadre original, avec vingt-six points réservés au-dessus et en dessous des quatre commandes. Les libellés ajustent leur taille à leur cellule ; sur un paysage très court, seuls les symboles sont visibles, avec leurs noms accessibles complets. Aucun prix n’est écrit sous Indice : une fenêtre confirme la dépense d’une graine, avec une case « Ne plus me prévenir ». Ce choix persiste et peut être réactivé dans les paramètres. Relire un indice acquis et demander un indice sans graine n’ouvre pas cette confirmation.

Mélanger ouvre une confirmation gratuite, puis redistribue les couleurs de la même page avec un fondu. Il démarre une nouvelle tentative (mouvements et historique remis à zéro), sans modifier les acquis. La disposition provient d’un puzzle de même capacité et de même nombre de couleurs, dont le minimum exact et la solution sont certifiés hors ligne. Les indices et le calcul des étoiles utilisent cette référence après permutation des tubes et des couleurs. Le mélange et ses paramètres sont sauvegardés. Les gestes sont bloqués pendant le fondu ; quitter la scène interrompt l’animation. Recommencer et Rejouer retrouvent la disposition originale de la page.

## Vérification

- `npm test` couvre les cent pages sur quinze formats, avec deux facteurs de taille de police : limites du plateau, cibles de 44 points, absence de chevauchement et répartition des rangées. Des régressions spécifiques vérifient le remplissage de la hauteur sur les téléphones hauts et l’ajustement selon le nombre de fioles.
- `node --import tsx scripts/workshop-fit-smoke.ts` contrôle le rendu réel des cent pages à 393 × 852, puis chaque nombre de fioles sur treize formats supplémentaires, du portrait 320 × 400 au paysage 480 × 280 et aux tablettes. Il vérifie les limites de chaque cible, les commandes, l’absence de défilement horizontal et vertical, ainsi que la stabilité des boutons pendant l’indice. La page 25 à 412 × 915 doit occuper la hauteur du plateau en deux rangées.
- Les essais d’entrée dans l’atelier, de versement, d’indice, de navigation et de bilan complètent ces contrôles. Le bilan est également vérifié avant et après révélation sur quinze formats.

Ces contrôles de navigateur et les exports Android/iOS vérifient la composition et la compilation. Ils ne mesurent pas la cadence d’affichage sur un téléphone physique.
