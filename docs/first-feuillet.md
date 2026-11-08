# Le premier feuillet

Le premier lancement suit l’ordre film → signature → accueil du cabinet. Un carnet déjà signé arrive directement sur cet accueil. Le premier bouton de restauration passe ensuite par `BotanicalGuide`, sur `/aide?premiersPas=1`, avant d’entrer dans `/atelier`.

Ce feuillet explique le versement, les quatre mesures identiques exigées pour finir une fiole, les quatre lavis puis le sceau, les étoiles, les graines et les commandes gratuites. Il est accessible librement depuis « Aide » sur l’accueil, qui est le menu principal.

L’essai de trois fioles utilise les vraies fonctions `pour` et `won` sur un état local indépendant. Il ne touche ni au plateau, ni aux mouvements, ni à l’historique, ni aux étoiles, ni aux graines de la sauvegarde. Il peut être recommencé et n’est jamais obligatoire pour entrer dans la serre. Le titre apparaît une fois par ouverture du guide ; la sélection d’une fiole est un court déplacement natif. Il n’y a ni boucle décorative ni animation géométrique à chaque image. Le mode sans animations affiche directement le contenu.

Le champ `guideSeen` reste faux jusqu’à l’entrée effective dans la serre. Revenir à l’accueil ou quitter le jeu avant cela conserve le guide pour la prochaine entrée en restauration. Une remise à zéro rend à nouveau disponibles le film, la signature, l’accueil puis le premier feuillet. Une sauvegarde antérieure sans ce champ conserve sa progression et est considérée comme déjà initiée si le carnet était signé. Consulter et refermer « Aide » ne modifie aucun champ de la sauvegarde ; son bouton d’entrée dans la serre marque le guide comme vu, si nécessaire, et reprend la page sauvegardée.

L’atelier n’est pas monté pendant le premier feuillet. Son accès direct vérifie aussi `guideSeen`. Le routeur reste monté pour garantir une navigation valide depuis un carnet remis à zéro. L’essai reste facultatif.

Le film et la signature partagent une seule fenêtre modale native. Le clavier est refermé à la signature ; l’accueil devient alors le véritable écran du jeu. Le guide est une route du carnet. Le prologue peut être revu volontairement depuis l’accueil et revient directement à cet accueil, sans redemander de signature.

Vérifications : `npm run typecheck`, `npm test`, `GAME_TEST_URL=http://localhost:8124/ node --import tsx scripts/guide-smoke.ts`, `scripts/home-smoke.ts` et `scripts/carnet-menu-smoke.ts`. Les essais couvrent la première signature, l’interruption du guide, la pratique sans ressources, sa résolution, le retour à l’accueil, les petits et grands écrans, la remise à zéro et les sauvegardes antérieures.
