# Prologue de production Android et iOS

Android et iOS utilisent désormais une vraie scène Three.js sur `expo-gl` 16 (Expo SDK 54), via OpenGL ES 3. Aucun Canvas HTML, navigateur, vidéo distante ou WebView n’est utilisé pour le rendu natif. La version Web est une prévisualisation du même noyau, des mêmes textures et de la même chronologie.

## Scène et rendu

`src/scene/prologueScene.ts` construit le livre articulé, les bandes de reliure, les coins en laiton, le fermoir qui se dégage avant l’ouverture, quatorze feuilles courbées, douze feuillets emportés, cinquante-six feuilles nervurées, huit tiges fleuries et cent soixante grains de pollen. Les pétales passent du bouton à la fleur ouverte. Les feuilles volantes et les pétales sont instanciés ; le pollen est un seul nuage de points. La scène conserve une lumière chaude, des ombres et le rapprochement final vers la signature.

Le contrôleur partagé plafonne le rendu à 30 images par seconde. Ce plafond est une limite de travail, pas une garantie de débit sur tous les téléphones. Le tampon natif est utilisé à sa résolution physique ; aucune multiplication supplémentaire par la densité n’est appliquée. Les ombres sont limitées à 512 pixels. Le test GL a mesuré 112 appels de dessin au maximum aux phases échantillonnées.

## Textures et démarrage

Onze textures PNG sont référencées statiquement et incluses par Metro dans les bundles Android/iOS. `expo-asset` les résout localement en production ; `expo-file-system` lit les octets et UPNG les décode en pixels RGBA8. Des `DataTexture` Three.js les téléversent dans Expo GL, sans charger d’image par une API DOM. Le test unitaire contrôle toutes les textures et leur budget décodé, inférieur à 16 Mio avant mipmaps.

Le film ne commence qu’après le chargement des textures et la soumission effective de la première image par `endFrameEXP()`. Passer le film pendant le chargement annule les lectures et libère les textures déjà décodées. L’horloge s’arrête lorsque l’application devient inactive ou passe en arrière-plan ; le rendu s’arrête aussi. Une reprise de surface reconstruit la scène avant de reprendre le film à sa position, sans modifier le carnet.

Le `GLView` possède son contexte et le détruit à son démontage. Le composant libère ses géométries, matériaux et textures et annule ses tâches, sans appeler une seconde destruction du contexte. Le mode sans animations n’instancie pas de `GLView`. Une erreur de contexte ou un appareil sans OpenGL ES 3 affiche le secours SVG ; il ne s’agit plus du chemin natif normal.

## Prévisualisation et vérifications

- `npm run typecheck` et `npm test` : types, progression, graines, PNG et ordonnanceur des images.
- `npm run test:native-prologue` : utilise le même adaptateur de contexte natif et les mêmes pixels sur un vrai contexte WebGL2 de Chromium/ANGLE ; vérifie les shaders, les erreurs GL, les images soumises et la destruction. **Ce contrôle de contrat ne constitue pas un essai Android ou iOS.**
- `npm run test:prologue` et `npm run test:journey` : scène partagée, signature, relecture, interruption et parcours du jeu dans le navigateur.
- `npx expo export --platform android --platform ios --output-dir /tmp/herbier-native` : vérification des bundles Hermes et des ressources. **Un export Metro n’est ni un APK/IPA compilé ni un essai sur téléphone.**

Expo GL est inclus dans Expo Go compatible SDK 54 pour les essais de développement. Une installation native ou un development build permet ensuite de tester le contexte réel avec le package du jeu. Les profils EAS existants permettent de préparer un APK de test Android et des builds iOS une fois le compte Expo, les identifiants définitifs et les signatures configurés.

Les essais physiques restent indispensables : Android d’entrée/milieu de gamme, iPhone compatible iOS 15.1 ou ultérieur, chargement à froid, retour d’arrière-plan, interruption pendant la préparation, rotation système malgré l’orientation portrait, chauffe et mémoire sur plusieurs relectures. Cet environnement ne possède ni téléphone, ni émulateur Android, ni simulateur iOS ; aucun résultat sur appareil ne doit être déduit des captures Web.

## Régénérer les textures

`npm run assets:prologue` utilise Chromium et les polices/atlas locaux pour générer `assets/prologue/*.png`. Les sources d’illustrations restent intactes. Les PNG sont les mêmes sur les trois plateformes ; cette étape est une compilation de ressources, pas une dépendance de l’application à un navigateur.
