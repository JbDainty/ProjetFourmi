# L’Herbier des Couleurs

Jeu de tri de pigments en français, réalisé avec Expo SDK 54, React Native, Expo Router et TypeScript strict. Les cent niveaux se répartissent entre cinq écosystèmes et vingt espèces. Chaque première victoire révèle un cinquième de la planche et ajoute un pigment daté à la collection.

## Tester le jeu sans rien installer

Adresse de la version de test : **https://jbdainty.github.io/ProjetFourmi/**

Ouvrir le lien dans un navigateur sur ordinateur ou téléphone, puis choisir « Commencer la restauration ». La progression est enregistrée sur cet appareil ; elle n’est pas partagée automatiquement avec un autre téléphone ou navigateur. Aucun paiement ni publicité n’est actif.

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

Le préfixe est appliqué au routeur, aux ressources, au manifeste et au service worker. Les quatre pages de navigation possèdent une entrée HTML pour fonctionner après un rechargement chez l’hébergeur. `404.html` permet aussi de reprendre les autres routes du site.

## Jouer dans le navigateur

Node.js 22 LTS ou 24, npm et un navigateur récent sont nécessaires.

```sh
cd /workspace/ProjetFourmi
npm install
npx expo start --web
```

Pour une installation reproductible, utiliser `npm ci` avec le fichier `package-lock.json`. Aucun compte ou secret n’est nécessaire pour jouer. Accepter le tutoriel, sélectionner un flacon source puis sa destination. Le flacon doit être vide ou porter la même couleur au sommet. Un groupe contigu se verse dans la limite des quatre couches. Pour gagner, chaque flacon doit être vide ou contenir quatre couches de la même couleur. Une couleur encore répartie entre des flacons partiellement remplis ne valide pas le niveau. Les 100 solutions, les indices et les parcours de référence sont vérifiés avec cette condition. Les configurations de départ et les récompenses déjà enregistrées sont conservées.

Les annulations, indices et reprises sont gratuits. Les étoiles comparent le nombre de mouvements à un parcours de référence vérifié, **pas à un optimum mathématique**. Rejouer peut améliorer les étoiles sans dupliquer les graines ou les pigments. Une nouvelle espèce s’ouvre après cinq niveaux, un écosystème après vingt. Le niveau 100 termine la collection sans charger de niveau 101.

L’atelier est une scène de jeu continue : le décor de serre s’étend sous le titre et les flacons. L’ATH flottant présente « L’Herbier des Couleurs », les graines et un bouton de carnet. Ce bouton ouvre le menu du jeu, avec la reprise de la partie, l’herbier, les écosystèmes, la boutique et les réglages. Il remplace la barre d’onglets et le panneau latéral. Ouvrir puis refermer le carnet conserve la sélection et le puzzle ; quitter l’atelier interrompt un versement en cours avant sa validation.

La présentation emploie « page » dans l’atelier, la carte et le parcours. Le compteur affiche uniquement la page courante, par exemple « PAGE 04 ». Le titre reprend la composition d’un frontispice botanique ancien, avec petites capitales et fleuron doré. Le bouton du carnet représente un livre relié dont la couverture s’ouvre avant l’affichage du menu. Désactiver « Animations douces » rend l’ouverture immédiate.

Sur téléphone et tablette, un timbre botanique accompagne le chapitre dans l’atelier. Il reprend la plante et ses pigments déjà restaurés ; ses cinq points indiquent l’avancement. Toucher le timbre ouvre la planche en grand, puis « Revenir au jeu » retrouve le puzzle et la sélection en cours. La grande planche reste à côté du jeu sur les écrans larges. Les icônes des commandes et de la navigation sont des dessins SVG originaux inspirés des herbiers, avec leurs libellés conservés.

`npm run test:mobile-herbarium` vérifie le timbre, sa progression persistante, l’ouverture sans perte de sélection et les présentations à 320, 390 et 1440 pixels. Comme les autres tests navigateur, il accepte `GAME_TEST_URL` pour viser un serveur de prévisualisation.

## La serre et ses porte-tubes

La zone de puzzle est un atelier de serre à verrière ancienne, avec une lumière végétale douce et une table en bois. Le décor est une image originale embarquée, distincte des flacons. Les supports sont des éléments SVG : trous, barres de maintien, socle, montants et détails de laiton. Chaque rangée possède son porte-tubes et les configurations à plusieurs rangées utilisent un bâti commun. Les trous restent visibles lorsqu’un flacon est soulevé.

Le flacon est extrait verticalement du support avant de s’incliner pour verser. Au retour, il se redresse et s’aligne au-dessus de son logement avant d’y redescendre. Les emplacements de jeu, les couleurs, les règles et la sauvegarde restent indépendants de ce décor.

Toute la typographie utilise maintenant **Almendra** pour les titres, **Alegreya Sans** pour les textes et commandes, et **Alegreya en italique** pour les noms scientifiques. Les polices et leurs graisses sont embarquées et restent disponibles hors ligne. Les notices sont incluses dans `public/licenses/`.

```sh
# Après npm run preview :
npm run test:greenhouse
```

Ce contrôle vérifie le chargement du décor et des six variantes typographiques, les supports sur chaque rangée et les affichages mobiles à 320 et 390 pixels de large.

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

Le contrôle navigateur utilise Playwright et Chromium installé dans `/usr/bin/chromium`. Adapter `executablePath` dans `scripts/browser-smoke.ts` sur une autre machine. Il couvre le tutoriel, l’indice, une résolution jouée par clics, la révélation, le rechargement, les réglages d’accessibilité, la fin du niveau 100, l’herbier complet, le mode hors ligne, l’affichage mobile et le cadeau quotidien. Pour préparer le dernier niveau, il injecte une sauvegarde créée en résolvant réellement les niveaux 1 à 99 via le moteur ; il ne prétend pas cliquer les cent niveaux dans le navigateur. Les captures sont générées dans `test-results/`.

```sh
npm run levels
```

Régénère les cent configurations de manière déterministe. Le générateur utilise des mouvements inverses légaux, rejoue leurs certificats avec le moteur de versement et cherche une solution indépendante. Les tests vérifient de nouveau chaque solution. Les budgets de couleurs augmentent de 2 à 7 et le brassage augmente progressivement. L’unicité est vérifiée indépendamment de l’ordre des flacons. Un équilibrage par des joueurs reste nécessaire.

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

Pour construire via EAS (compte Expo et certificats des plateformes nécessaires) :

```sh
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform android --profile production
npx eas-cli build --platform ios --profile production
```

`eas.json` prépare les profils APK de test et de production. Remplacer les identifiants `com.colorworld.herbier` par ceux du propriétaire avant les inscriptions en boutique. Aucun compte, certificat, signature ou téléversement n’a été créé. Vérifier aussi sons, haptique, gestes, zones sûres, petits écrans et sauvegardes sur de vrais iPhone et Android avant soumission.

## Sauvegarde et confidentialité

AsyncStorage conserve le document `color-world.save` (localStorage sur Web). Le format est versionné (`version: 2`) et le lecteur migre le format précédent, complète les options manquantes et rejette les données incohérentes. Le puzzle, son historique, les étoiles, pigments datés, graines, thèmes et paramètres sont enregistrés après les actions, dans une file d’écriture ordonnée. L’interface attend la lecture initiale avant toute écriture. Une erreur de lecture n’écrase pas la sauvegarde ; une erreur d’écriture affiche une action de nouvelle tentative.

Les réglages permettent de copier le document JSON et de restaurer une copie après validation et confirmation. La sauvegarde est locale, sans synchronisation serveur. Effacer les données de l’application ou du navigateur la supprime. Les cadeaux quotidiens suivent l’horloge locale : aucune promesse de protection contre sa manipulation.

Aucun compte, mesure d’audience ou service publicitaire actif. Les ressources de jeu et polices sont embarquées. Les paramètres proposent sons, haptique, animations et symboles indépendants des couleurs. Aucune donnée de santé ou recommandation de consommation végétale.

## Organisation

- `app/` : cinq espaces Expo Router, tutoriel et dialogues.
- `src/animation/liquid.ts` : géométrie des surfaces libres, volumes des couches et chronologie visqueuse.
- `src/components/Greenhouse.tsx` : décor de serre, porte-tubes et bâti des rangées.
- `src/components/fonts.ts` : familles et variantes typographiques embarquées.
- `src/components/LiquidBoard.tsx` : flacons, filet, gouttes, reflets et mouvements des pigments.
- `src/engine/puzzle.ts` : règles pures, capacités et solveur.
- `scripts/generate.ts`, `src/data/levels.json` : génération, certificats et 100 configurations.
- `src/state/model.ts` : progression, récompenses et validation/migration.
- `src/state/pigments.ts` : découverte des pigments.
- `src/state/economy.ts` : cadeaux, graines et cosmétiques.
- `src/state/store.tsx` : hydratation et persistance asynchrone.
- `src/data/botany.ts` : vingt fiches et cinq écosystèmes.
- `src/components/Paper.tsx` : texture de papier et vieillissement discret.
- `src/components/FoliageFrame.tsx` : encadrements végétaux adaptatifs, tiges courbes, feuilles nervurées et rameaux d’angle. Les cadres des planches et des chapitres passent du sépia au vert avec la restauration. Les ornements sont non interactifs et restent dans les marges.
- `src/components/Botanical.tsx` : vingt planches à rendu aquarelle en atlas PNG, filtres et masques SVG pour cinq étapes de coloration, détails agrandissables.
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

Illustrations, texture de papier et son de versement synthétisé créés pour ce projet, sans image commerciale externe. Almendra, Alegreya et Alegreya Sans sont distribuées sous SIL Open Font License ; Ionicons via react-native-vector-icons sous MIT. Les notices sont incluses dans `public/licenses/` et l’export. Voir `ASSETS.md`.

## Commerce et limites avant publication

La boutique fonctionnelle utilise les graines gagnées en jeu pour trois papiers cosmétiques. Les indices et annulations restent gratuits. `CommerceAdapter` définit les points d’intégration des fournisseurs natifs, avec un adaptateur indisponible par défaut. La politique des interstitiels est désactivée, configurable et réservée aux transitions de niveaux. **Aucun paiement ni visionnage de publicité n’est simulé comme une transaction réelle.**

Avant activation de revenus : intégrer les SDK retenus (Google Play Billing, StoreKit et fournisseur publicitaire), vérifier les achats côté serveur, gérer restauration et révocations, consentement/ATT, plafonnement réel, déclarations de confidentialité et tests sandbox. Les packs, encadrements saisonniers et la suppression des publicités ne sont pas implémentés comme produits achetables.

La base Web jouable, les cent niveaux et la progression sont présents. La revue botanique et éditoriale, l’équilibrage humain, les tests sur appareils, les achats réels et la préparation finale des boutiques restent à réaliser. La version Web de test est destinée à GitHub Pages. Aucune publication sur Google Play ou l’App Store, ni nouvelle publication de l’environnement cloud, n’est effectuée.
