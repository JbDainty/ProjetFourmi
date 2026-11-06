# Le premier feuillet

Après le film et la première signature du carnet, `BotanicalGuide` présente un feuillet botanique illustré. Il explique le versement, les quatre mesures identiques exigées pour finir une fiole, les quatre lavis puis le sceau, les étoiles, les graines et les commandes gratuites. Les mêmes explications sont accessibles dans le menu « Aide », sur `/aide`.

L’essai de trois fioles utilise les vraies fonctions `pour` et `won` sur un état local indépendant. Il ne touche ni au plateau, ni aux mouvements, ni à l’historique, ni aux étoiles, ni aux graines de la sauvegarde. Il peut être recommencé et n’est jamais obligatoire pour entrer dans la serre. Le titre apparaît une fois par ouverture du guide ; la sélection d’une fiole est un court déplacement natif. Il n’y a ni boucle décorative ni animation géométrique à chaque image. Le mode sans animations affiche directement le contenu.

Le champ `guideSeen` reste faux jusqu’à l’entrée dans la serre, y compris si le joueur ferme le jeu après avoir signé. Une remise à zéro rend le film, la signature et le guide à nouveau disponibles dans cet ordre. Une sauvegarde antérieure sans ce champ conserve sa progression et est considérée comme déjà initiée si le carnet était signé. Consulter « Aide » ne modifie aucun champ de la sauvegarde.

L’atelier n’est pas monté pendant le premier feuillet et sa musique commence à l’entrée effective dans la serre. Le routeur reste monté pour garantir une navigation valide depuis un carnet remis à zéro. Les retours Android et les accès directs au jeu restent possibles sans imposer l’essai.

Le film, la signature et le guide partagent une seule fenêtre modale native. Le clavier est refermé à la signature et le contenu est remplacé dans cette même fenêtre, sans fermeture et réouverture simultanées de deux modales sur iOS.

Vérifications : `npm run typecheck`, `npm test`, `GAME_TEST_URL=http://localhost:8120/ node --import tsx scripts/guide-smoke.ts` et `scripts/carnet-menu-smoke.ts`. Les essais navigateur couvrent la première signature, l’interruption du guide, la pratique sans ressources, sa résolution, le menu Aide, le retour au jeu, les largeurs 320/390/1280, la remise à zéro et une sauvegarde antérieure.
