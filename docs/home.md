# Le cabinet botanique

`/` est le véritable accueil du jeu ; la restauration continue sur `/atelier`. La signature d’un nouveau carnet ouvre cet accueil. Les carnets existants y arrivent directement au lancement, avec leur progression, sans fenêtre de confirmation ni lecture automatique du prologue.

L’accueil met le grand livre en avant, avec seulement la réserve de graines en haut. Le petit livre de menu, le nom du cabinet et le titre ont été retirés de cet écran. Les trois cartes de même largeur sont regroupées sous « Modes de jeu » : aventure botanique, puzzle quotidien et énigmes aux couleurs cachées. Chaque carte a une courte explication ; la restauration ne conserve que l’espèce et la page en cours. Le chapitre, le compteur de couleurs, les feuilles de progression et les images répétées ont été retirés.

`homeProgress` lit la sauvegarde et ne charge pas de niveau. « Continuer » conserve donc les fioles, mouvements, historique, indices acquis et ressources. Les raccourcis vers l’herbier, la boutique, les paramètres et l’aide restent disponibles. Le menu du livre, sur les autres écrans, conserve l’accès aux écosystèmes et le retour à l’accueil.

Le Feuillet du jour et les Encres oubliées sont des emplacements de futurs modes, explicitement marqués « À venir ». Ils ne simulent aucun puzzle, déblocage, achat ni récompense. La restauration reste le mode jouable de cette version.

Le livre central combine une illustration originale en PNG RGBA, les polices du jeu et la vraie planche botanique de l’espèce courante. L’image est un décor statique ; la plante utilise le cache d’aquarelles natif déjà présent. Une entrée finie de 2,6 secondes fait apparaître le livre en perspective, déploie deux frondes, présente les cartes et fait passer un papillon et quelques grains de pollen. Les dessins SVG restent immuables : les transformations et opacités passent par le pilote natif. La progression respecte l’arrière-plan et le réglage des animations, puis la scène se stabilise. Elle n’ajoute aucune boucle de dessin au repos.

L’accueil ne reste pas animé sous le prologue lorsqu’il est revu volontairement. À la fin ou au passage du film, le cabinet réapparaît directement. Le coordinateur audio arrête son ambiance pendant le film et le guide, et rétablit la musique selon les réglages du carnet.

La disposition est verticale sur téléphone et forme deux pages côte à côte sur grand écran. Le bandeau du carnet défile avec le contenu. Les écrans courts permettent de faire défiler les cartes et les raccourcis ; aucune barre ne se superpose au jeu.

`scripts/home-smoke.ts` vérifie l’arrivée après signature, le lancement direct d’un carnet signé, la reprise exacte d’une tentative, le guide au premier jeu, les modes à venir, la relecture du film, l’absence de mutations SVG pendant la chorégraphie, les largeurs 320/390/1280 et le paysage, les animations désactivées, une plante avancée et la remise à zéro. `scripts/cinematic-smoke.ts` et `intro-music-smoke.ts` couvrent aussi la navigation et le son. Les exports Android/iOS ne remplacent pas un essai sur appareil.
