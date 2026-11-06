# Cinématique d’ouverture Android et iOS

Depuis la version 1.0.2 (code Android 3), le chemin normal utilise un film 3D précalculé avec Blender, embarqué en H.264 vertical 720 × 1280, 24 images par seconde et environ 14,8 secondes. Le téléphone décode une vidéo locale via `expo-video` 3.0.16 ; il ne calcule plus les géométries, ombres et déformations du film. La version Web lit le même MP4 dans un lecteur HTML silencieux, avec gestion explicite des promesses de lecture annulées.

Le MP4 ne contient pas de piste audio. La musique originale reste gérée par le coordinateur audio du jeu et ses réglages. Sur mobile, le lecteur vidéo est muet, utilise `mixWithOthers`, désactive les notifications, la lecture en arrière-plan et le mode incrustation. La préparation est asynchrone sur iOS ; le papier d’attente disparaît à la première image décodée. Le passage en arrière-plan suspend le film et l’horloge ; une reprise recale la position une fois, sans chercher la vidéo ni modifier React à chaque image. Passer le prologue, atteindre la signature ou démonter la scène libère le lecteur. Le mode sans animations et l’accueil d’un joueur déjà inscrit n’instancient aucun lecteur.

Le navigateur et son cache hors ligne servent les requêtes partielles de vidéo (`Range`, réponses 206 et suffixes), y compris hors ligne. Les réglages de musique restent indépendants du son du jeu. Le fondu de papier et la signature interactive sont conservés. Une erreur de média, ou une préparation qui dépasse douze secondes en premier plan, utilise la scène de secours décrite ci-dessous.

**Un nouvel APK est nécessaire** : le lecteur vidéo est un nouveau module natif. Les APK 1.0.1 gardent leur runtime précédent ; une mise à jour JavaScript ne peut pas leur ajouter ce lecteur. Installer la 1.0.2 par-dessus la précédente conserve le même package et la signature EAS. Un joueur déjà inscrit peut utiliser « Revoir le prologue » sur sa page d’accueil pour voir le nouveau film.

Le film est reproductible avec `scripts/cinematic/render-opening.py` puis `finish-opening.py`. Les modèles sont originaux, les planches et polices proviennent du projet et le cuir/bois photographiques sont sous CC0 de Poly Haven ; les sources et empreintes sont dans `art/cinematic/texture-sources.json`. Le calcul hors ligne n’ajoute ni Blender ni le débruiteur au jeu. Le manifeste du film décrit le codec, les dimensions et son empreinte.

La couverture laisse une garde réelle au-dessus des feuilles courbées. Les folios partent après son ouverture, se soulèvent au passage de la reliure et se reposent sur la face intérieure ; les feuillets volants décollent de la droite et restent au-dessus de l’éventail avant de poursuivre leur spirale. `scripts/cinematic/check-clearance.py` vérifie les surfaces évaluées, déformations et épaisseur comprises, sur les 356 images et leurs demi-images : couverture contre papier et notes volantes contre folios reliés. Exécution : `blender -b /chemin/herbier-opening.blend --python-exit-code 1 --python scripts/cinematic/check-clearance.py`. Le contrôle ne s’exécute pas sur téléphone.

Après la signature d’un nouveau carnet, le [premier feuillet](first-feuillet.md) présente les règles et un essai indépendant avant l’arrivée dans l’atelier. Les joueurs déjà inscrits retrouvent ce guide par « Aide » dans le menu du livre.

## Secours 3D en temps réel

Le secours Android/iOS utilise une scène Three.js sur `expo-gl` 16 (Expo SDK 54), via OpenGL ES 3. Ce secours ne fait appel ni à un navigateur ni à une WebView sur mobile. La version Web est une prévisualisation du même noyau, des mêmes textures et de la même chronologie.

## Scène et rendu

`src/scene/prologueScene.ts` construit le livre articulé, les bandes de reliure, les coins en laiton, le fermoir qui se dégage avant l’ouverture, quatorze feuilles courbées, douze feuillets emportés, cinquante-six feuilles nervurées, huit tiges fleuries et cent soixante grains de pollen. Les pétales passent du bouton à la fleur ouverte. Les feuilles volantes et les pétales sont instanciés ; le pollen est un seul nuage de points. La scène conserve une lumière chaude, des ombres et le rapprochement final vers la signature.

Le contrôleur vise 60 images par seconde, avec des échéances alignées sur l’horloge pour éviter les alternances irrégulières sur les écrans 59,94 ou 120 Hz. L’horloge du film est lue directement par le moteur : aucun état React n’est mis à jour à chaque image. Les fondus et textes utilisent des transformations et opacités natives. Ce plafond ne garantit pas le débit sur téléphone.

La surface GL native est dimensionnée avant sa création : densité maximale de 2 et côté long de 1 600 pixels physiques, puis agrandissement par le GPU. Cela réduit le remplissage sur les écrans QHD. Les ombres restent limitées à 512 pixels. Les pièces de laiton et les feuilles des tiges sont regroupées ; les faces d’un même matériau partagent leurs appels de dessin. Les pages, dont la courbure ne dépend que de l’abscisse, utilisent moins de sommets. Seules les feuilles visibles et en mouvement sont déformées. Le contrat GL impose au plus 65 appels de dessin et moins de 3 000 sommets déformés par image aux phases échantillonnées ; le maximum observé est de 58 appels, contre 112 avant ces changements. Ces mesures décrivent le travail rendu, pas des FPS sur appareil.

## Textures et démarrage

Onze textures PNG sont référencées statiquement et incluses par Metro dans les bundles Android/iOS. `expo-asset` les résout localement en production ; `expo-file-system` lit les octets et UPNG les décode en pixels RGBA8. Des `DataTexture` Three.js les téléversent dans Expo GL, sans charger d’image par une API DOM. Le test unitaire contrôle toutes les textures et leur budget décodé, inférieur à 16 Mio avant mipmaps.

Le film ne commence qu’après le chargement des textures et la soumission effective de la première image par `endFrameEXP()`. Passer le film pendant le chargement annule les lectures et libère les textures déjà décodées. L’horloge s’arrête lorsque l’application devient inactive ou passe en arrière-plan ; le rendu s’arrête aussi. Une reprise de surface reconstruit la scène avant de reprendre le film à sa position, sans modifier le carnet.

La musique originale « L’éveil du grimoire » accompagne le film : valse acoustique à 104 BPM, harpe, célesta, flûte, cordes et violoncelle, environ 14,8 secondes. Elle se précharge pendant la préparation et commence avec la scène, à faible volume. Le réglage « Musique du livre » et le bouton du prologue la contrôlent. Pause, reprise, passage du film et démontage invalident les lectures différées ; elle ne se superpose pas à l’ambiance de l’atelier. Le navigateur peut demander un toucher pour autoriser le son. Composition CC0, instruments FluidR3 GM sous MIT ; notice également intégrée aux métadonnées MP3.

Le `GLView` possède son contexte et le détruit à son démontage. Le composant libère ses géométries, matériaux et textures et annule ses tâches, sans appeler une seconde destruction du contexte. Le mode sans animations n’instancie pas de `GLView`. Une erreur de contexte ou un appareil sans OpenGL ES 3 affiche le secours SVG ; ce troisième secours reste passable et ne bloque pas la signature.

## Prévisualisation et vérifications

- `npm run typecheck` et `npm test` : types, progression, graines, PNG et ordonnanceur des images.
- `npm run test:native-prologue` : utilise le même adaptateur de contexte natif et les mêmes pixels sur un vrai contexte WebGL2 de Chromium/ANGLE ; vérifie les shaders, les erreurs GL, les images soumises et la destruction. **Ce contrôle de contrat ne constitue pas un essai Android ou iOS.**
- `npm run test:prologue` et `npm run test:journey` : scène partagée, signature, relecture, interruption et parcours du jeu dans le navigateur.
- `node --import tsx scripts/intro-music-smoke.ts` : musique réelle, volume, pause, reprise à la position du film, coupure, relecture, mode silencieux et passage à l’ambiance de jeu.
- `npx expo export --platform android --platform ios --output-dir /tmp/herbier-native` : vérification des bundles Hermes et des ressources. **Un export Metro n’est ni un APK/IPA compilé ni un essai sur téléphone.**

Expo GL est inclus dans Expo Go compatible SDK 54 pour les essais de développement. Une installation native ou un development build permet ensuite de tester le contexte réel avec le package du jeu. Les profils EAS existants permettent de préparer un APK de test Android et des builds iOS une fois le compte Expo, les identifiants définitifs et les signatures configurés.

Les essais physiques restent indispensables : notamment le S23 Ultra du joueur, Android d’entrée/milieu de gamme et iPhone compatible iOS 15.1 ou ultérieur, chargement à froid, retour d’arrière-plan, interruption pendant la préparation, chauffe et mémoire sur plusieurs relectures. Aucun résultat de fluidité sur appareil ne doit être déduit des captures Web ni du rendu logiciel d’un émulateur sans accélération matérielle.

## Régénérer les textures

`npm run assets:prologue` utilise Chromium et les polices/atlas locaux pour générer `assets/prologue/*.png`. Les sources d’illustrations restent intactes. Les PNG sont les mêmes sur les trois plateformes ; cette étape est une compilation de ressources, pas une dépendance de l’application à un navigateur.
