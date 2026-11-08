# Le bilan de restauration

`RestorationResult` présente une feuille fixe dans la zone sûre du système, sans conteneur de défilement. La plante utilise la place restante après le titre, les étoiles, les mouvements et les commandes. En paysage, elle occupe la colonne de gauche ; le bilan et les actions occupent celle de droite. Les zones tactiles restent d’au moins 44 points, avec 48 points pour l’action principale.

Les informations secondaires s’effacent sur les écrans courts : le minimum et les explications de récompense restent disponibles dans les libellés d’accessibilité. Le fait botanique apparaît lorsque la hauteur le permet. La révélation conserve la même place pour l’illustration et les commandes. Les actions secondaires « Rejouer » et « Herbier » sont côte à côte, avec « Passer » avant révélation.

Les étoiles ne redémarrent pas lors de la révélation. Les quatre aquarelles progressives, le sceau rouge de la cinquième page et leurs sons restent inchangés. La cérémonie du sceau adapte aussi sa planche et ses espaces à la hauteur disponible. Aucun calcul de score, gain, progression ou sauvegarde n’est modifié.

`GAME_TEST_URL=http://localhost:8124/ node --import tsx scripts/victory-fit-smoke.ts` vérifie quinze formats de 320 × 480 à 1280 × 900, dont le paysage court 568 × 280 : étoiles, illustration et boutons entièrement visibles avant et après révélation, absence de débordement, relecture avec moins d’étoiles, cérémonie du sceau et dernière page. Les tests `reward-reset-smoke.ts` et `restoration-smoke.ts` couvrent les animations et les transitions du carnet. Les exports Android et iOS complètent ces contrôles ; la fluidité réelle reste à observer sur appareil.
