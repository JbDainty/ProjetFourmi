# Correctifs du premier essai Android

Le premier APK a révélé des rubans de boutons séparés de leur texte et des ralentissements jusque sur un plateau immobile. Les captures du téléphone sont le point de départ de ces corrections ; une compilation réussie ne prouve pas la fluidité sur appareil.

## Plateau et illustrations

Le plateau n’a plus de boucle de rafraîchissement au repos. Pendant un versement, le décor, les supports, les numéros et les autres fioles restent dans un SVG mémorisé. Un SVG distinct ne redessine que la source, la destination et le filet, avec l’occlusion du support de destination. La récompense d’une fiole a également sa propre surface SVG. Les zones tactiles ne sont pas recréées à chaque image.

L’essai dans le moteur Android a aussi révélé des avertissements SVG répétés : ses dégradés refusent les chaînes telles que `offset=".5"`, acceptées par le navigateur, et remplacent alors leur valeur par zéro. Les nombres concernés ont été normalisés avec un zéro initial, par exemple `"0.5"`. Cela rétablit les dégradés et supprime ces avertissements du rendu. Le test de régression utilise le véritable extracteur natif de la version installée de `react-native-svg`, avec uniquement le convertisseur de couleurs système remplacé pour fonctionner dans Node.

Le versement conserve son modèle de liquide et sa durée réelle, avec un plafond de 30 dessins par seconde sur Android/iOS. Sa nouvelle horloge suspend les images et le temps actif à l’arrière-plan, reprend sans saut et ne peut pas valider un mouvement après démontage. Les effets vectoriels finis de lianes, de parchemin, de titre et d’éclosion limitent aussi les mises à jour React ; les effets d’opacité et de transformation existants gardent leur pilote natif. Aucun débit d’images sur téléphone n’est garanti par ces plafonds.

`Botanical.native.tsx` emploie des images natives : les six états des vingt planches sont compilés à partir du composant SVG existant. Les atlas originaux restent inchangés. Cela évite les filtres et les masques d’atlas pendant le rendu Android/iOS et conserve l’aspect de chaque étape. Les légendes sont des textes natifs. Les 120 PNG transparents font 540 × 735 pixels chacun, pour environ 42,5 Mio compressés au total ; ils augmentent la taille de l’installation en échange d’un rendu plus simple. Le navigateur conserve le SVG.

Pour régénérer ces images avec Chromium installé :

```sh
npm run assets:botanical
```

## Mise en page

`SvgBackdrop` mesure une vue absolue, puis donne au SVG une largeur et une hauteur numériques. Le fond décoratif ne participe plus à la mesure du texte d’un bouton. Ce mécanisme est utilisé pour les rubans, le voile de la serre et le chapitre. Les textes natifs désactivent l’ajout de marge de police Android ; les boutons peuvent grandir et le texte peut revenir à la ligne.

La planche du bilan dépend de la hauteur disponible et du facteur de police. Les statistiques sont centrées, les commandes du bas sont plus compactes et un emplacement d’indice vide ne réserve plus la hauteur du parchemin entier. La progression et les règles des graines ne changent pas.

## Validation

- `npm test` : règles existantes et horloge de versement, y compris annulation, arrière-plan, images manquées et fin unique.
- `npm run typecheck` : composants et scripts.
- `tests/native-svg.test.ts` : les 71 décalages littéraux de dégradé du jeu sont acceptés sans avertissement par le parseur SVG natif réel.
- `npm run test:pouring` : filet visible, validation atomique, annulation, navigation, mode sans animations et versement entre rangées.
- `npm run test:mobile-rendering` : aucun changement du SVG du plateau pendant 1,2 seconde au repos, sur la première et la dernière page ; le support reste inchangé pendant un versement ; rubans et textes contenus dans les boutons à 320 et 393 pixels, avant et après révélation.
- Les exports Hermes Android et iOS contrôlent l’inclusion des ressources natives. Les essais navigateur et les exports restent distincts d’un essai matériel Android/iOS.

Le nouvel APK doit être installé par-dessus le précédent, sans désinstallation, pour conserver le carnet local. Vérifier ensuite les captures signalées, le défilement, les versements, les sons, les retours d’arrière-plan et le prologue sur le téléphone du joueur.
