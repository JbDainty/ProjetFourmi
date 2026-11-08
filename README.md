# Herbier des couleurs

Jeu de tri de pigments en français, réalisé avec Expo SDK 54, React Native, Expo Router et TypeScript strict. Les cent niveaux se répartissent entre cinq écosystèmes et vingt espèces. Les quatre premières pages rendent progressivement ses couleurs à chaque plante ; la cinquième appose un sceau botanique daté.

## Tester le jeu sans rien installer

Adresse de la version de test : **https://jbdainty.github.io/ProjetFourmi/**

Ouvrir le lien dans un navigateur sur ordinateur ou téléphone, laisser le livre s’ouvrir puis signer le carnet avec un pseudo. L’accueil du cabinet présente la restauration et les futurs modes. « Commencer » ouvre le premier feuillet d’explications et son petit essai de versement, puis la serre. Les carnets déjà signés arrivent directement sur l’accueil ; « Continuer » reprend les fioles de la page en cours. Le guide reste disponible dans le menu principal, sous « Aide ». La progression est enregistrée sur cet appareil ; elle n’est pas partagée automatiquement avec un autre téléphone ou navigateur. Aucun paiement ni publicité n’est actif.

L’accueil illustré, sa chorégraphie native et la séparation entre `/` et `/atelier` sont décrits dans [docs/home.md](docs/home.md). Le Feuillet du jour et les Encres oubliées sont indiqués « À venir » ; ils ne sont pas encore jouables.

Les fichiers sources sont conservés sur https://github.com/JbDainty/ProjetFourmi. La branche `master` contient le code source, et la branche `gh-pages` contient le site compilé. GitHub Pages est activé sur **gh-pages / (root)**. Le site est accessible à l’adresse ci-dessus ; aucune installation ni activation supplémentaire n’est nécessaire pour jouer.

Après l’envoi d’une nouvelle version sur `gh-pages`, GitHub reconstruit automatiquement le site en quelques minutes. Son état est visible dans l’onglet **Actions** et dans **Settings → Pages** du dépôt.

Pour envoyer une nouvelle version Web après des modifications :

```sh
npm test
npm run typecheck
npm run deploy:pages
```

Le script compile le jeu avec le bon préfixe et met à jour la branche `gh-pages` sans envoi forcé. Il nécessite l’accès Git en écriture au dépôt et une identité Git configurée. Il ne change ni la visibilité du dépôt ni ses paramètres d’hébergement.

Pour reproduire l’export GitHub Pages localement :

```sh
EXPO_PUBLIC_BASE_PATH=/ProjetFourmi npm run build:web
PORT=8083 EXPO_PUBLIC_BASE_PATH=/ProjetFourmi npm run preview
GAME_TEST_URL=http://localhost:8083/ProjetFourmi/ npm run test:browser
npm run test:pouring
```

Le préfixe est appliqué au routeur, aux ressources, au manifeste et au service worker. Les pages de navigation, dont `/aide`, possèdent une entrée HTML pour fonctionner après un rechargement chez l’hébergeur. `404.html` permet aussi de reprendre les autres routes du site.

## Jouer dans le navigateur

Node.js 22 LTS ou 24, npm et un navigateur récent sont nécessaires.

```sh
cd /workspace/ProjetFourmi
npm install
npx expo start --web
```

Pour une installation reproductible, utiliser `npm ci` avec le fichier `package-lock.json`. Aucun compte ou secret n’est nécessaire pour jouer. Laisser le prologue ouvrir le livre, signer le carnet avec un pseudo, puis sélectionner un flacon source et sa destination. Le flacon doit être vide ou porter la même couleur au sommet. Un groupe contigu se verse dans la limite des quatre couches. Pour gagner, chaque flacon doit être vide ou contenir quatre couches de la même couleur. Une couleur encore répartie entre des flacons partiellement remplis ne valide pas le niveau. Les 100 solutions, les indices et les parcours de référence sont vérifiés avec cette condition. Les configurations de départ et les récompenses déjà enregistrées sont conservées.

Les annulations et reprises sont gratuites. Un nouvel indice coûte une graine ; relire un indice déjà acquis pour cette page et cette disposition des fioles est gratuit, même après annulation, reprise, navigation ou rechargement. Les étoiles sont désormais calculées sur le **minimum exact de versements** de chaque page, enregistré dans `par`. Trois étoiles autorisent ce minimum plus 10 % arrondis au mouvement supérieur, avec au moins un mouvement de marge. Deux étoiles autorisent jusqu’à 150 % du minimum arrondis à l’entier inférieur, avec au moins un mouvement supplémentaire après le seuil des trois étoiles. Au-delà, la réussite vaut une étoile. Exemple : minimum 10, trois étoiles jusqu’à 11, deux jusqu’à 15, une à partir de 16. Le minimum et l’objectif des trois étoiles apparaissent dans le bilan uniquement, après la réussite.

Le bilan affiche les étoiles de la tentative actuelle ; la collection conserve toujours le meilleur score enregistré, y compris les étoiles gagnées avant ce rééquilibrage. Une tentative moins bonne n’efface ni étoiles, ni graines, ni pigments, ni date de première réussite. Chaque tentative terminée avec trois étoiles, y compris une reprise, donne exactement une graine ; une ou deux étoiles n’en donnent pas. Les pigments et dates de première réussite restent uniques. Une nouvelle espèce s’ouvre après cinq pages, un écosystème après vingt. La page 100 termine la collection sans charger de page 101.

Les étoiles du bilan sont des fleurs étoilées originales, dorées et nervurées. Elles éclosent l’une après l’autre, avec un petit rebond et des éclats de pollen qui se dissipent ; les étoiles non obtenues restent en contour. L’effet est fini, se joue une fois par réussite et ne recommence pas à la révélation du pigment. Sans animations, les étoiles apparaissent directement. Un libellé accessible annonce le résultat complet sur trois étoiles.

« Rejouer la page » est disponible dès le bilan, avant ou après la révélation, y compris à la page 100. Lorsque des étoiles restent à gagner, ce bouton apparaît près du résultat ; sinon il est placé parmi les actions du bilan. Il retourne au plateau initial de la même page avec l’animation de feuillet, remet à zéro les mouvements, l’historique et les états temporaires, et garde les étoiles déjà acquises, pigments, graines et préférences. Une nouvelle réussite rouvre le bilan, peut améliorer le meilleur score et accorde une graine si cette tentative vaut trois étoiles, sans répéter les pigments.

L’atelier est une scène de jeu continue : le décor de serre s’étend sous le titre et les flacons. L’ATH présente « Herbier des couleurs », les graines et un bouton de carnet. Il appartient au contenu qui défile : en descendant, tout le bandeau sort de l’écran sans recouvrir les tubes ni les commandes. Ce bouton ouvre le menu du jeu, avec la reprise de la partie, l’herbier, les écosystèmes, la boutique et les réglages. Il remplace la barre d’onglets et le panneau latéral. Ouvrir puis refermer le carnet conserve la sélection et le puzzle ; quitter l’atelier interrompt un versement en cours avant sa validation.

Les écrans du carnet partagent `BookScrollView` : le bandeau reste dans le flux, y compris dans l’herbier, les écosystèmes, la boutique et les réglages. Lorsque le contenu dépasse l’écran, une petite flèche végétale « Haut » est placée dans un pied de page, à droite, après les commandes. Elle devient visible en arrivant en bas et remonte au début sans toucher à la progression. Le retour est doux avec les animations activées et immédiat autrement. Le pied de page ne se superpose pas au jeu ; il est absent lorsque tout tient déjà à l’écran. Son calcul de débordement exclut sa propre hauteur pour éviter une apparition artificielle après redimensionnement. `npm run test:scroll` couvre le défilement d’un puzzle à deux rangées, le retour, les petits et grands écrans, l’herbier et la conservation de la sauvegarde.

La présentation emploie « page » dans l’atelier, la carte et le parcours. Le compteur affiche uniquement la page courante, par exemple « PAGE 04 ». Le titre reprend la composition d’un frontispice botanique ancien, avec petites capitales et fleuron doré. Le bouton du carnet représente un livre relié dont la couverture s’ouvre avant l’affichage du menu. Désactiver « Animations douces » rend l’ouverture immédiate.

Toucher « Herbier des couleurs » fait pousser des lianes qui s’entrelacent dans le titre, puis éclore de petites fleurs. Un nouveau toucher relance la floraison. Cette animation est décorative et conserve la sélection et la progression ; les fleurs apparaissent immédiatement lorsque les animations sont désactivées. Le chapitre se présente comme une vignette de livre : paysage et chapitre réunis dans une même phrase italique, plante et rameau de cinq feuilles indiquant les nuances retrouvées. Les commandes du puzzle portent des symboles botaniques dorés : rameau de retour, couronne fleurie de renaissance et loupe enchantée.

Le paysage et le chapitre se lisent par exemple « Les prairies fleuries, chapitre 1 », dans la même police italique. L’invitation au timbre est un petit lien « Voir la planche », en Alegreya italique avec deux lueurs dorées discrètes ; le toucher ouvre directement la planche. Son animation respecte le réglage des mouvements.

À la réussite d’une page, y compris « Détails floraux », des lianes grimpent et s’enroulent le long du papier. Un souffle de feuilles original de 2,8 secondes accompagne cette apparition une seule fois, à faible volume. Le son s’arrête à la fermeture et respecte « Sons de l’atelier » ; le cadre apparaît directement si les animations sont désactivées. `npm run test:victory` contrôle la croissance des lianes, le véritable décodage et playback audio, le volume, l’absence de répétition, l’arrêt à la sortie et les deux réglages d’accessibilité.

Une courte mélodie originale de harpe, bois et cordes échantillonnés accompagne la première restauration complète de chaque plante (cinquième page). Elle dure 5,6 secondes et joue à faible volume au clic de révélation, une seule fois. En rejouant une page déjà terminée, la courte mélodie de révélation la remplace. Elle s’arrête à la fermeture du bilan et respecte « Sons de l’atelier ». Composition sous CC0 1.0 et instruments FluidR3 GM sous MIT : `public/licenses/cozy-audio-CC0.txt`, `public/licenses/FluidR3-MIT.txt` et `scripts/generate-cozy-audio.py`.

Les actions du bilan prennent la forme de rubans botaniques gravés, avec titres Almendra et annotations Alegreya en italique. Au passage à la page suivante et à la sélection d’une page dans la carte, un feuillet patiné se courbe sur toute la surface du jeu, ATH compris. La nouvelle page est chargée une seule fois sous le papier, avant d’être révélée ; les gestes sont bloqués pendant la transition. La progression reste identique et un rechargement ne relance pas cet effet. Sans « Animations douces », le changement est immédiat. `npm run test:book` vérifie cette transition, la mélodie réelle, le silence, la relecture et les boutons sur écran étroit.

Entre deux pages de la même plante, un seul feuillet tourne en 1,5 seconde. Au passage à une autre espèce, cinq feuillets se tournent rapidement et de façon décalée en 2,3 secondes. Le premier referme la plante quittée, puis les intercalaires portent seulement un léger rameau. Une planche d’arrivée montre ensuite **l’espèce de destination**, son nom, son nom latin et son état réel de restauration, avant de révéler le jeu. La destination est mémorisée avant le chargement du niveau ; le changement d’état ne remplace donc pas le spécimen d’arrivée par celui de la plante précédente. Cette logique couvre aussi les changements de chapitre et les retours par la carte à une plante déjà restaurée. Rejouer une page garde le feuillet unique ; la page 100 mène à l’herbier sans inventer d’espèce suivante.

Un bruitage original de papier de 1,15 seconde accompagne le feuillet unique ; un froissement original de 1,85 seconde accompagne le feuilletage rapide. Ils sont joués à faible volume et synchronisés avec les courbures, sans boucle ni répétition lors du chargement de la nouvelle page. Sur le Web, ils sont préparés depuis un geste du joueur pour respecter les règles de lecture audio du navigateur. Le réglage « Sons de l’atelier » les coupe et arrête une lecture en cours. Les réglages de son et d’animation restent indépendants : sans animation, la page change immédiatement et le son approprié peut continuer à jouer. Les sons sont également embarqués pour le mode hors ligne.

`npm run test:page-turn` vérifie les modes simple/multiple, la destination Coquelicot → Bleuet et le passage au sous-bois, la planche d’une espèce déjà restaurée depuis la carte, les vrais sons Web Audio, leur faible volume, le silence, le mode sans animation, les écrans à 320 pixels et la conservation des récompenses. Les tests unitaires vérifient les dix-neuf frontières d’espèces et les deux fichiers PCM originaux.

Le numéro de page prend la forme d’un folio orné. Le nombre de mouvements reste caché pendant le puzzle et apparaît seulement dans le bilan de la page achevée. Les commandes « Annuler », « Recommencer » et « Indice » utilisent l’écriture manuscrite Caveat. Avant une demande d’indice, la zone sous les flacons reste vide, sans cadre ni texte. Au clic, un parchemin patiné se déroule horizontalement, puis l’indice s’écrit en graphite avec un crayon qui suit les lettres et les retours à la ligne. Redemander un indice relance les deux étapes ; jouer, annuler ou recommencer les interrompt. L’indice complet est annoncé aux lecteurs d’écran après le déroulement. Parchemin et texte apparaissent immédiatement quand les animations sont désactivées.

Un versement impossible fait tomber quelques feuilles autour d’un conseil manuscrit posé sur une feuille nervurée. Le message disparaît après 5,8 secondes, sans déplacer les tubes ni bloquer les gestes. Une nouvelle action, un indice ou un redémarrage l’efface ; des erreurs répétées remplacent proprement l’effet précédent. Avec les animations désactivées, la feuille et son texte apparaissent directement, sans chute. Le conseil est annoncé poliment aux lecteurs d’écran et n’affecte ni la progression ni le nombre de mouvements. `npm run test:mistake` vérifie les destinations pleines, les couleurs différentes, la disparition, le remplacement rapide, les indices, la reprise du jeu et la lisibilité à 320 pixels.

Les anecdotes botaniques apparaissent après la révélation des couleurs. Cinq annotations par espèce, tirées des descriptions botaniques, de l’habitat et de la floraison déjà présents dans le carnet, accompagnent ses cinq pages. La réussite annonce « Votre herbier reprend vie ». L’indice ne comporte aucune phrase de recherche intermédiaire et attend la fin du déroulement pour apparaître.

`npm run test:pencil` vérifie l’absence de parchemin au repos, son déroulement avant l’écriture, l’absence de message parasite image par image, le déplacement du crayon, la répétition et l’interruption dans les deux étapes, le mode sans animation, les anecdotes du coquelicot puis du bleuet après révélation, la typographie des commandes à 320 et 390 pixels et le nombre de mouvements réservé au bilan de victoire.

Sur téléphone et tablette, un timbre botanique accompagne le chapitre dans l’atelier. Il reprend la plante et ses pigments déjà restaurés ; ses cinq points indiquent l’avancement. Toucher le timbre ouvre la planche en grand, puis « Revenir au jeu » retrouve le puzzle et la sélection en cours. La grande planche reste à côté du jeu sur les écrans larges. Les icônes des commandes et de la navigation sont des dessins SVG originaux inspirés des herbiers, avec leurs libellés conservés.

`npm run test:mobile-herbarium` vérifie la floraison du titre, la conservation de la sélection pendant cette animation, le mode sans animation, le timbre, sa progression persistante et les présentations à 320, 390 et 1440 pixels. Comme les autres tests navigateur, il accepte `GAME_TEST_URL` pour viser un serveur de prévisualisation.

## La serre et ses porte-tubes

La zone de puzzle est un atelier de serre à verrière ancienne, avec une lumière végétale douce et une table en bois. Le décor est une image originale embarquée, distincte des flacons. Les supports sont des éléments SVG : trous, barres de maintien, socle, montants et détails de laiton. Chaque rangée possède son porte-tubes et les configurations à plusieurs rangées utilisent un bâti commun. Les trous restent visibles lorsqu’un flacon est soulevé.

Le flacon est extrait verticalement du support avant de s’incliner pour verser. Au retour, il se redresse et s’aligne au-dessus de son logement avant d’y redescendre. Les emplacements de jeu, les couleurs, les règles et la sauvegarde restent indépendants de ce décor.

La hauteur de la zone de jeu suit les rangées réellement affichées. Une seule rangée reste compacte, même sur un téléphone très haut ; une seconde ajoute la place nécessaire à son porte-tubes. L’espace de levage et de versement au-dessus des flacons est conservé. Le cadrage de la serre suit aussi la hauteur du contenu, et les commandes restent rapprochées du puzzle.

La typographie utilise **Almendra** pour les titres, **Alegreya Sans** pour les textes, **Alegreya en italique** pour les noms scientifiques et **Caveat** pour les annotations au crayon et les commandes du puzzle. Les polices et leurs graisses sont embarquées et restent disponibles hors ligne. Les notices sont incluses dans `public/licenses/`.

```sh
# Après npm run preview :
npm run test:greenhouse
npm run test:scroll
npm run test:stars
npm run test:reward-reset
```

Ce contrôle vérifie le chargement du décor et des huit variantes typographiques, les supports sur chaque rangée, la hauteur compacte sur les écrans hauts et le passage d’une à deux rangées pour un même puzzle à différentes largeurs.

## Versement visqueux et pigments mystérieux

Les flacons utilisent un rendu SVG commun au Web et au mobile. Le verre se soulève, s’incline vers la destination, verse un filet continu puis revient à sa place. Les sections colorées conservent leur aire pendant l’inclinaison et leur surface reste soumise à la verticale de la gravité ; un léger décalage transitoire traduit la viscosité. Les ménisques, le reflet du verre, les gouttes et les remous à l’arrivée sont animés séparément. Il s’agit d’un modèle illustratif en deux dimensions, pas d’un solveur de fluide généraliste.

Le liquide quitte la source avant d’atteindre la destination : une petite partie de son volume reste dans le filet en vol. Les teintes évoquent des pierres et résines colorées, avec des reflets nacrés, une faible aura et des particules discrètes. Les couleurs botaniques des planches ne sont pas modifiées.

L’action logique et la sauvegarde sont appliquées une seule fois, après le retour du flacon. Les commandes du puzzle sont bloquées pendant le transfert. Quitter l’atelier interrompt l’animation sans modifier un puzzle devenu invisible. Le réglage « Animations douces » permet toujours des transferts immédiats ; le réglage des symboles reste disponible.

## Export Web et mode hors ligne

```sh
npm run build:web
npm run preview
```

`dist/` contient le site de production. Le serveur local écoute le port 8081 (`PORT` permet de le changer). Pour héberger le site, servir ce dossier à la racine d’un domaine HTTPS et rediriger les routes sans fichier vers `index.html` ; ne pas rediriger les fichiers manquants vers du HTML. Les routes `/herbier`, `/carte`, `/boutique` et `/parametres` sont des routes d’application.

Le service worker met les ressources en cache à la première visite complète de l’export de production. Il permet ensuite une reprise hors ligne. HTTPS est requis en dehors du serveur local. Le serveur Expo de développement ne fournit pas ce cache. L’installation PWA dépend du navigateur ; le manifeste utilise une icône SVG, et des icônes PNG adaptées aux boutiques restent à préparer.

## Vérifications

```sh
npm test
npm run typecheck
npx expo install --check
npm run build:web
# Dans un autre terminal après npm run preview :
npm run test:browser
```

Les 27 tests unitaires couvrent les transferts, les refus, la victoire, l’annulation et la reprise, les 100 solutions, le solveur indépendant sur chacun des niveaux, les 100 récompenses, les déblocages, les vingt restaurations, les migrations et la restauration de sauvegardes, ainsi que l’économie. Sept tests portent sur la sortie et le retour dans les porte-tubes, la conservation des volumes à différentes inclinaisons, les couches, l’angle de débordement, le volume en vol, le déroulement temporel et les quantités fractionnaires.

Le contrôle navigateur utilise Playwright et Chromium installé dans `/usr/bin/chromium`. Adapter `executablePath` dans `scripts/browser-smoke.ts` sur une autre machine. Il couvre le carnet signé, l’indice, une résolution jouée par clics, la révélation, le rechargement, les réglages d’accessibilité, la fin du niveau 100, l’herbier complet, le mode hors ligne, l’affichage mobile et l’absence de cadeau quotidien. Pour préparer le dernier niveau, il injecte une sauvegarde créée en résolvant réellement les niveaux 1 à 99 via le moteur ; il ne prétend pas cliquer les cent niveaux dans le navigateur. Les captures sont générées dans `test-results/`.

```sh
npm run levels
```

Régénère les cent configurations de manière déterministe. Le générateur utilise des mouvements inverses légaux, rejoue leurs certificats avec le moteur de versement puis calcule une solution minimale exacte. Les tests vérifient de nouveau chaque solution. Les budgets de couleurs augmentent de 2 à 7 et le brassage augmente progressivement. L’unicité est vérifiée indépendamment de l’ordre des flacons. Un équilibrage par des joueurs reste nécessaire.

Pour recalculer les minima **en conservant les configurations existantes** :

```sh
npm run levels:calibrate
```

`src/engine/optimal.ts` effectue une recherche IDA* hors ligne. Le nombre de blocs de couleur moins le nombre final de flacons pleins est une borne inférieure : un versement peut supprimer au plus un bloc. Les limites de coût sont explorées successivement à partir de cette borne ; la première solution a donc un nombre minimal de versements. Les permutations de flacons, mouvements sans changement de position canonique et enfants équivalents peuvent être éliminés car les flacons n’ont pas de rôle imposé dans la condition de victoire. Une table de transposition conserve le meilleur budget restant exploré par position. Toutes les autres actions légales sont considérées, y compris les regroupements de flacons monochromes partiellement pleins.

Une limite de calcul ou de profondeur provoque une erreur, sans référence approximative de secours. Le script ne remplace le fichier qu’une fois les cent solutions minimales obtenues et rejouées avec les règles réelles. Cette calibration a réduit 84 anciennes références, sans modifier les cent plateaux ; par exemple la page 89 passe de 29 à 16 versements, et son objectif de trois étoiles est 18. Le rapport est conservé dans `scripts/star-calibration.json`. Les solutions minimales préenregistrées servent aussi aux indices demandés sur un plateau initial ; la recherche rapide en cours de partie reste distincte du calcul hors ligne des références.

`tests/stars.test.ts` compare les minima des dix premières pages à une recherche indépendante en largeur, vérifie les cent certificats et les seuils inclusifs, les annulations de recherche et la conservation des anciens gains. `npm run test:stars` joue de vraies tentatives en 4, 5, 6 et 7 mouvements pour vérifier respectivement 3, 3, 2 et 1 étoiles, puis contrôle une reprise moins bonne et le bilan sur téléphone étroit.

L’indice utilise un chemin complet trouvé par le solveur depuis l’état courant. Il ne propose jamais un mouvement aléatoire. La recherche est plafonnée à 250 000 états et 140 mouvements pour préserver la réactivité ; si elle n’aboutit pas, l’interface propose d’annuler ou de recommencer, sans prétendre fournir une solution.

## Android et iOS

Les mêmes routes, règles, SVG et sauvegardes sont partagés. Les bundles Metro/Hermes Android et iOS ont été exportés dans l’environnement cloud. **Cela ne constitue pas un essai sur appareil ni une compilation signée.**

Pour essayer sur un téléphone compatible avec le SDK 54, lancer `npx expo start`, puis ouvrir avec une version compatible d’Expo Go. Pour des compilations natives locales :

```sh
# Android Studio, SDK Android et JDK 17 configurés :
npm run android
# Uniquement sur macOS avec Xcode et CocoaPods :
npm run ios
```

Le projet EAS est rattaché au compte **jbame** : https://expo.dev/accounts/jbame/projects/color-world-herbier. Le profil `preview` produit un APK Android autonome, installable directement sans Expo Go ni serveur de développement. Le guide téléphone est dans [docs/android-test.md](docs/android-test.md).

Les correctifs du premier essai Android et leurs contrôles sont documentés dans [docs/mobile-rendering.md](docs/mobile-rendering.md) : plateau immobile au repos, couches de versement séparées, illustrations natives précalculées et fonds de boutons mesurés. La version 1.0.1 prépare aussi EAS Update sur le canal de test `preview`, avec une empreinte native pour empêcher les mises à jour incompatibles.

Pour construire via EAS avec un compte autorisé sur ce projet :

```sh
npx eas-cli login
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform android --profile production
npx eas-cli build --platform ios --profile production
```

`eas.json` prépare un APK de test (`preview`) et les archives destinées aux boutiques (`production`). Une clé de signature Android a été créée et est gérée par EAS sur le compte du propriétaire ; aucun secret de signature ne figure dans Git. Le package Android est `com.colorworld.herbier`. Il faut conserver ce package et sa signature pour installer les prochaines versions par-dessus la version de test. Aucune soumission Google Play ou App Store n’a été effectuée ; iOS nécessite encore ses certificats et un compte développeur Apple. Vérifier aussi sons, haptique, gestes, zones sûres, petits écrans et sauvegardes sur de vrais iPhone et Android avant soumission.

## Sauvegarde et confidentialité

AsyncStorage conserve le document `color-world.save` (localStorage sur Web). Le format est versionné (`version: 2`) et le lecteur migre le format précédent, complète les options manquantes et rejette les données incohérentes. Le puzzle, son historique, les étoiles, pigments datés, graines, thèmes et paramètres sont enregistrés après les actions, dans une file d’écriture ordonnée. L’interface attend la lecture initiale avant toute écriture. Une erreur de lecture n’écrase pas la sauvegarde ; une erreur d’écriture affiche une action de nouvelle tentative.

Dans les paramètres, « Remettre ma progression à zéro » ouvre d’abord un avertissement détaillant la perte des pages, étoiles, plantes restaurées, pigments, graines gagnées et papiers acquis. « Continuer vers la confirmation » ouvre une seconde étape avec une nouvelle action explicite « Oui, effacer ma progression ». Annuler ou fermer à l’une ou l’autre étape ne modifie aucune donnée et recommence le processus depuis le premier avertissement à la prochaine ouverture. Le bouton final reste brièvement désactivé à son apparition pour qu’un double appui rapide sur la première action ne puisse pas déclencher l’effacement.

La remise à zéro attend la fin des écritures précédentes puis enregistre une nouvelle sauvegarde avant de remplacer la progression en mémoire. Si l’écriture échoue, le dialogue reste ouvert avec une erreur et le parcours reste disponible en mémoire. Après succès, le joueur retrouve le film d’ouverture et la signature d’un nouveau carnet, avec une graine de départ, le papier d’ivoire et une collection vide. Les réglages de son, vibrations, animations et symboles sont conservés. Seule la clé du jeu est remplacée ; les autres données du navigateur et les ressources hors ligne ne sont pas effacées.

`npm run test:reward-reset` contrôle l’éclosion successive, l’absence de répétition à la révélation, les reprises avant/après révélation et sur la dernière page, les gains conservés, le mode sans animations et l’affichage à 320 pixels. Les remises à zéro sont testées dans une session isolée avec des données fictives : annulation aux deux étapes, Échap, double appui, échec simulé du stockage, effacement final, rechargement et conservation des préférences et des autres clés.

L’export/import manuel de la progression a été retiré des paramètres. La sauvegarde locale automatique demeure ; effacer les données du navigateur ou désinstaller l’application peut la supprimer. Les boutons Google et Apple sont préparés, avec un état explicitement indisponible, et ne simulent ni connexion ni sauvegarde distante. Le pseudo est une signature locale, pas un compte authentifié. Aucun cadeau quotidien n’ajoute désormais de graines. Voir `docs/accounts.md` pour les services à configurer avant d’activer la synchronisation.

Aucun compte, mesure d’audience ou service publicitaire actif. Les ressources de jeu et polices sont embarquées. Les paramètres proposent sons, haptique, animations et symboles indépendants des couleurs. Aucune donnée de santé ou recommandation de consommation végétale.

## Organisation

- `app/` : cinq espaces Expo Router, tutoriel et dialogues.
- `src/animation/liquid.ts` : géométrie des surfaces libres, volumes des couches et chronologie visqueuse.
- `src/components/Greenhouse.tsx` : décor de serre, porte-tubes et bâti des rangées.
- `src/components/fonts.ts` : familles et variantes typographiques embarquées.
- `src/components/LiquidBoard.tsx` : flacons, filet, gouttes, reflets et mouvements des pigments.
- `src/engine/puzzle.ts` : règles pures, capacités et solveur.
- `scripts/generate.ts`, `src/data/levels.json` : génération, solutions minimales et 100 configurations.
- `src/engine/optimal.ts`, `scripts/calibrate-stars.ts` : calcul hors ligne des minima exacts, sans modifier les plateaux existants.
- `src/state/stars.ts` : seuils partagés entre attribution des étoiles et bilan de la tentative.
- `src/state/model.ts` : progression, récompenses et validation/migration.
- `src/state/pigments.ts` : découverte des pigments.
- `src/state/economy.ts` : papiers cosmétiques ; graines et indices dans `src/state/model.ts`.
- `src/state/store.tsx` : hydratation et persistance asynchrone.
- `src/data/botany.ts` : vingt fiches et cinq écosystèmes.
- `src/components/Paper.tsx` : texture de papier et vieillissement discret.
- `src/components/FoliageFrame.tsx` : encadrements végétaux adaptatifs, tiges courbes, feuilles nervurées et rameaux d’angle. Les cadres des planches et des chapitres passent du sépia au vert avec la restauration. Les ornements sont non interactifs et restent dans les marges.
- `src/components/Botanical.tsx` : vingt planches à rendu aquarelle en atlas PNG, quatre lavis homogènes puis un sceau, détails agrandissables.
- `src/components/BotanicalStamp.tsx` : aperçu mobile de la planche courante, timbre dentelé et progression partagée avec l’herbier.
- `src/components/BotanicalIcon.tsx` : pictogrammes botaniques SVG originaux, communs aux commandes et à la navigation.
- `src/components/SceneVeil.tsx` : lavis continu pour la lisibilité de l’ATH dans la serre ; il reprend le thème de papier sélectionné.
- `src/services/` : son/haptique et contrat des fournisseurs commerciaux.

Les fiches et niveaux sont séparés de la présentation. Étendre le moteur au-delà de 100 niveaux demande de remplacer les bornes explicites et d’ajouter les données : aucune extension n’est annoncée comme automatique.

## Botanique et ressources

Les vingt noms et familles ont été contrôlés le 4 novembre 2026 par l’API du **GBIF Backbone Taxonomy** : vingt correspondances exactes, acceptées. Les réponses et URL sont conservées dans `src/data/taxonomy.json`. `python3 scripts/check-botany.py` renouvelle ce contrôle en ligne. Ce contrôle porte sur la nomenclature, pas sur l’ensemble des textes ni sur la conformité scientifique des dessins. Les différences de référentiels (notamment Anemone/Anemonoides et les sous-espèces d’edelweiss) doivent être revues avec TAXREF avant une publication scientifique.

Les descriptions signalent des caractères morphologiques usuels ; les périodes de floraison varient selon altitude et climat. Les vingt illustrations ont été remplacées par des images originales à rendu aquarelle naturaliste : nervures, fleurs, tiges, boutons et fruits propres aux espèces. Elles sont générées pour le projet, et leur provenance est documentée dans `ASSETS.md`. Le fond est un papier ivoire patiné, avec fibres, légères marques d’âge et fins encadrements. **La qualité visuelle ne constitue pas une validation botanique professionnelle.** Une revue indépendante des morphologies et des fiches reste nécessaire avant une publication scientifique.

- GBIF : https://www.gbif.org/species/search
- TAXREF / INPN : https://inpn.mnhn.fr/programme/referentiel-taxonomique-taxref
- Plants of the World Online, Kew : https://powo.science.kew.org/

Illustrations, texture de papier et son de versement synthétisé créés pour ce projet, sans image commerciale externe. Almendra, Alegreya, Alegreya Sans et Caveat sont distribuées sous SIL Open Font License ; Ionicons via react-native-vector-icons sous MIT. Les notices sont incluses dans `public/licenses/` et l’export. Voir `ASSETS.md`.

## Commerce et limites avant publication

La boutique fonctionnelle utilise les graines gagnées en jeu pour trois papiers cosmétiques. Les annulations restent gratuites ; chaque nouvel indice coûte une graine. `CommerceAdapter` définit les points d’intégration des fournisseurs natifs, avec un adaptateur indisponible par défaut. La politique des interstitiels est désactivée, configurable et réservée aux transitions de niveaux. **Aucun paiement ni visionnage de publicité n’est simulé comme une transaction réelle.**

Avant activation de revenus : intégrer les SDK retenus (Google Play Billing, StoreKit et fournisseur publicitaire), vérifier les achats côté serveur, gérer restauration et révocations, consentement/ATT, plafonnement réel, déclarations de confidentialité et tests sandbox. Les packs, encadrements saisonniers et la suppression des publicités ne sont pas implémentés comme produits achetables.

La base Web jouable, les cent niveaux et la progression sont présents. La revue botanique et éditoriale, l’équilibrage humain, les tests sur appareils, les achats réels et la préparation finale des boutiques restent à réaliser. La version Web de test est destinée à GitHub Pages. Aucune publication sur Google Play ou l’App Store, ni nouvelle publication de l’environnement cloud, n’est effectuée.

## Ambiances et mixage sonore

Cinq compositions originales accompagnent les cinq écosystèmes, à faible volume, avec fondu entre les ambiances. Le thème des prairies garde sa flûte et son ensemble acoustique. Les quatre autres ambiances sont désormais des méditations orchestrales pour cordes divisées, violoncelles, harpe et piano, avec entrées progressives et phrases espacées, sans clarinette ni cuivres : chant de violoncelle dans le sous-bois, piano fluide dans les zones humides, choral aéré dans les montagnes et harpe lumineuse en Méditerranée. Les compositions sont CC0 ; les instruments FluidR3 GM sont sous MIT, sans redevances, avec notice embarquée. Elles sont embarquées et disponibles hors ligne. Aucun morceau MAIKY/Artlist n’est intégré : la description fournie pour Snowflakes ne donnait pas de licence gratuite de jeu. La provenance et le texte CC0 sont inclus dans ASSETS.md et public/licenses/cozy-audio-CC0.txt.

Le réglage « Musique du livre » est indépendant des bruitages. Il contrôle aussi « L’éveil du grimoire », une valse originale de 14,8 secondes (harpe, célesta, flûte et cordes) qui accompagne le prologue. Le film et sa musique se mettent en pause ensemble ; passer le prologue arrête la partition avant l’ambiance du jeu. Sur le Web, un bouton permet d’autoriser le son si le navigateur le bloque. La première ambiance se précharge pendant la signature. La lecture commence dès l’entrée dans le jeu, sans mouvement de fiole. Sur le Web, le bouton « Créer mon carnet » ou « Rouvrir mon herbier » autorise le son avant d’afficher la partie, conformément aux restrictions des navigateurs. La lecture se met en pause quand l’application passe en arrière-plan, puis reprend sa position. Les effets baissent temporairement la musique ; plusieurs effets superposés conservent la réduction la plus forte jusqu’à leur fin. Les anciens joueurs ayant désactivé le son gardent la musique désactivée lors de la migration. La remise à zéro conserve aussi ce réglage.

Quatre extraits d’un vrai ruisseau enregistré par jackthemurray sous CC0 suivent la quantité versée et démarrent avec le filet. Les aigus et grondements sont adoucis. Le fichier source de six secondes, ses droits et ses empreintes sont conservés dans `assets/audio-source/soft-stream.flac` et `scripts/audio-sources.json`. Une éclosion de lianes et de pollen récompense chaque nouveau flacon complet, sans gains supplémentaires ni répétition au simple déplacement d’un flacon plein. Un tintement de verre amorti, très bref et discret, accompagne chaque nouvelle éclosion. Il ne se déclenche ni pour un remplissage partiel ni pour le déplacement d’un flacon déjà complet ; le mode muet le coupe et le mode sans animations le conserve. La dernière éclosion reste visible un instant avant le bilan. Une courte mélodie accompagne la révélation de chaque pigment ; la première restauration complète d’une plante emploie la mélodie longue existante à la place. Quitter le bilan ou couper les bruitages arrête ces effets.

`npm run test:soundscape` vérifie en navigateur les boucles, le geste initial, les préférences, la pause en arrière-plan, le mixage, la synchronisation des versements, les félicitations et l’éclosion. Les tests unitaires contrôlent les réductions sonores imbriquées, la migration des réglages et la détection des flacons complétés.

Pour régénérer les ressources : installer libfluidsynth, NumPy, SciPy et ffmpeg, puis extraire `FluidR3_GM.sf2` du paquet MIT indiqué dans `scripts/audio-sources.json` et lancer `python3 scripts/generate-cozy-audio.py --soundfont /chemin/FluidR3_GM.sf2`. Cette commande délègue les quatre thèmes méditatifs à `scripts/generate-meditative-music.py`, qui peut aussi être lancé séparément avec le même argument `--soundfont`. La banque de 142 Mo reste hors du dépôt et de l’application ; seuls les fichiers audio rendus sont distribués.

## Carnet personnel, graines et indices

Un nouveau carnet ou une remise à zéro commence avec une seule graine. Chaque victoire à trois étoiles, y compris une page rejouée, donne une graine. Aucun bonus de plante, de chapitre ou de connexion quotidienne n’en ajoute. Les anciens soldes et progressions sont conservés lors de la migration ; les nouvelles règles s’appliquent aux tentatives suivantes. Le champ persistant `attemptRewarded` empêche un deuxième versement de la récompense au rechargement ou à un second appel du bilan. Il est réarmé uniquement lorsqu’une nouvelle tentative est chargée. Les étoiles utilisées sont celles de la tentative réelle, et non le meilleur score historique.

`paidHints` conserve par page et disposition exacte la suggestion déjà achetée. Le débit d’une graine et l’ajout de la suggestion sont une seule transition du modèle sauvegardée en une écriture. Un double appui, un rechargement, une annulation ou une reprise ne refacturent pas le même conseil. Une disposition différente demande une nouvelle graine ; une réserve vide ou l’échec de la recherche n’entraîne aucun débit. Les papiers cosmétiques gardent leurs prix et les acquisitions précédentes sont conservées.

L’icône de la réserve est une petite bourse botanique originale ; elle remue toutes les dix secondes et ouvre une explication au toucher. Le mode sans animations conserve le dessin fixe. Le prologue de 14,8 secondes montre le livre, ses pages, les feuilles et les fleurs avant le fondu vers la signature. Le pseudo (2 à 24 caractères, espaces normalisés) personnalise le cabinet, le carnet et les paramètres. Les retours ultérieurs ouvrent directement le cabinet ; « Revoir le prologue » y est une action volontaire qui conserve la progression. La remise à zéro efface le pseudo et redonne accès au film, à la signature, à l’accueil et au premier guide.

`npm run test:journey` contrôle le vrai son au moment de l’entrée avant tout mouvement, le film, la signature, le mouvement périodique de la bourse, les indices payants et gratuits, les boutons de connexion transparents, les réglages personnels, le retour après rechargement et le nouveau départ à 320 pixels. `tests/seeds.test.ts` contrôle les seuils des trois étoiles, les reprises, les achats idempotents, la migration et le reset.

Le secours 3D conserve ses onze textures embarquées et son budget de rendu : surface plafonnée, ombres limitées, géométrie invisible ignorée et éléments répétés regroupés. Son horloge se suspend en arrière-plan et le contexte est libéré à la fin ou au passage du film. `npm run test:prologue` vérifie ce secours WebGL, ses phases, sa relecture, la perte de contexte et la signature à 320 pixels. Le chemin normal utilise la vidéo précalculée décrite ci-dessous.

Sur Android et iOS, `OpeningScene.tsx` utilise le lecteur vidéo natif ; `OpeningScene.web.tsx` utilise HTML5. Les fichiers `OpeningSceneRealtime` portent le secours Expo GL/Three.js. Voir `docs/native-prologue.md` pour les contrats et les essais physiques. `npm run assets:prologue` régénère les textures de secours ; `npm run test:native-prologue` vérifie l’adaptateur et les shaders sur un contexte GL2 de test, sans prétendre exécuter Android/iOS.

La musique du prologue peut être régénérée avec `python3 scripts/generate-intro-music.py --soundfont /chemin/FluidR3_GM.sf2`. Les optimisations du film et du feuilletage sont décrites dans `docs/native-prologue.md` et `docs/mobile-rendering.md`. La fluidité et les interruptions restent à vérifier sur appareil.

La couleur de chaque planche revient par quatre lavis homogènes. La quatrième page rend toutes les couleurs ; la cinquième est consacrée au sceau du botaniste : une cérémonie centrée agrandit le dessin, puis un tampon ancien presse une grande pastille de cire rouge et laisse une gravure botanique en relief avant le passage à l’espèce suivante. Les indicateurs distinguent 4/4 couleurs et planche estampillée. Les cent pages, étoiles, graines et sauvegardes existantes sont conservées.

Vérification du nouveau parcours de restauration : `node --import tsx scripts/restoration-smoke.ts` avec `GAME_TEST_URL` vers le serveur Web exporté. Le test couvre les couleurs complètes à la quatrième page, la pression du tampon et son son à la cinquième, le bouton de continuation, le passage d’espèce, la conservation des gains, les SVG immuables, le silence, le passage direct et les animations désactivées à 320 pixels.

L’accueil est le menu principal du jeu. Le livre gravé portant « Menu », sur les autres pages, y ramène directement avec une ouverture de couverture de 320 ms et une feuille qui s’envole. Les transformations sont natives et les dessins restent fixes ; sans animations, le retour est immédiat. Les accès Herbier, Écosystèmes, Boutique et Paramètres sont regroupés sur cet accueil, avec Aide et Revoir le prologue en liens secondaires. Il n’existe plus de fenêtre de menu supplémentaire. La reprise conserve la disposition des fioles, les mouvements, les indices et les ressources.

`GAME_TEST_URL=http://localhost:8124/ node --import tsx scripts/carnet-menu-smoke.ts` contrôle le retour direct, les appuis répétés, les SVG immuables, les cinq destinations, la reprise et les animations désactivées. Le test `home-smoke.ts` vérifie aussi les accès sans défilement sur quinze formats.

Depuis la version native 1.0.2, la première ouverture est une cinématique 3D précalculée en H.264 vertical. Le livre, les gravures, les pages et les fleurs sont fabriqués hors ligne avec Blender. La vidéo est muette et le coordinateur audio gère sa musique. Un carnet signé arrive directement sur le cabinet et peut y choisir « Revoir le prologue ». Android 1.0.2 contient le lecteur `expo-video` ; installer cet APK une fois par-dessus la précédente version, puis les mises à jour compatibles arrivent par EAS Update. Le Web lit le même film, y compris hors ligne et par requêtes partielles. Détails dans [docs/native-prologue.md](docs/native-prologue.md).
