# Vérification des niveaux et correction des indices

La position photographiée à la page 863 est résoluble. L’ancien calcul d’indice
renvoyait une solution longue, puis recalculait une autre solution comprenant le
versement inverse au tour suivant. Le joueur pouvait ainsi suivre les indices
indéfiniment sans progresser.

Le nouvel indice cherche une continuation minimale avec les règles exactes de la
partie. Les fioles ne sont interchangeables que si leurs capacités et leurs
équipements le permettent. Les positions avec pinceaux ou liens conservent leurs
identités. Une continuation trouvée est conservée dans un cache borné, avec ses
suffixes ; suivre ses indices diminue donc la distance restante sans boucle.
La recherche cède régulièrement la main à l’interface et s’annule à la fermeture
de l’atelier. Les anciens indices payés sont recalculés sans nouvelle dépense,
même si le joueur n’a plus de graines.

Une allocation des couleurs aux capacités réelles fournit une borne admissible
et détecte les répartitions devenues impossibles. Elle respecte les filtres, les
liens, les fioles de conservation et les couleurs définitivement fixées dans les
pinceaux ou les déclencheurs de cristaux. Une recherche qui atteint sa limite de
temps, de profondeur ou de travail reste « incomplète » ; elle n’est jamais
présentée comme une preuve d’impossibilité. Aucun échec de recherche ne dépense
de graine.

## Petites fioles

Une couleur peut avoir six mesures et nécessiter deux fioles de trois mesures.
Chaque fiole occupée doit être pleine et unie, tandis que les fioles inutilisées
peuvent rester vides. Une coche sur une fiole ordinaire ne l’empêche pas de verser.
Les fioles de conservation et les pinceaux ou déclencheurs de cristal achevés
restent soumis à leurs règles permanentes. Le guide et la leçon des petites
fioles expliquent désormais ces distinctions.

Pour la position exacte de la photo, une solution est **8 → 3, 5 → 8, 1 → 3,
1 → 4**. Les fioles 3 et 4 terminent chacune avec trois mesures rouges.

## Contrôles reproductibles

`node --import tsx scripts/audit-solvability.ts` produit
[solvability-audit.json](solvability-audit.json). Cet audit rejoue les solutions
avec une seconde implémentation des versements et de la victoire, indépendante
des fonctions utilisées dans le jeu :

- les 1 000 niveaux actuels, les 1 000 niveaux de la campagne précédente et les
  100 niveaux historiques ;
- trois mélanges par niveau actuel, soit 3 000 parties supplémentaires ;
- 52 756 versements de solutions, avec conservation des teintes, capacités,
  légalité indépendante et vérification de la borne à chaque étape ;
- 17 798 positions de jeu aléatoire sur les 1 000 pages, soit 808 532 comparaisons
  de versements autorisés ou refusés ;
- des continuations hors solution initiale, dont des dispositions bloquées.

Les tests unitaires comparent également les allocations à une énumération
exhaustive de petites configurations, et les distances à une recherche en
largeur indépendante avec petites fioles, liens, filtres, pinceaux, cristaux,
compte-gouttes et conservation.

`node --import tsx scripts/solvability-smoke.ts` vérifie dans le navigateur la
position photographiée jusqu’à la victoire, le remplacement gratuit d’un ancien
indice à zéro graine, la consommation unique des nouveaux indices, une disposition
bloquée issue de la campagne, la stabilité de la barre d’actions et l’annulation
en quittant l’atelier. Le site exporté doit être servi à `GAME_TEST_URL`.

Ces résultats prouvent la solvabilité de chaque départ et des mélanges contrôlés.
Ils ne prétendent pas parcourir toutes les positions possibles : un mauvais choix
avec une mécanique irréversible peut mener à une impasse, récupérable avec Annuler,
Recommencer ou Mélanger. Les sauvegardes en cours et les références d’étoiles sont
conservées.
