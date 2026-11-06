# Correctifs du premier essai Android

Le premier APK a révélé des rubans de boutons séparés de leur texte et des ralentissements jusque sur un plateau immobile. Les captures du téléphone sont le point de départ de ces corrections ; une compilation réussie ne prouve pas la fluidité sur appareil.

## Plateau et illustrations

Le plateau n’a plus de boucle de rafraîchissement au repos. Pendant un versement, le décor, les supports, les numéros et les autres fioles restent dans un SVG mémorisé. Un SVG distinct ne redessine que la source, la destination et le filet, avec l’occlusion du support de destination. La récompense d’une fiole a également sa propre surface SVG. Les zones tactiles ne sont pas recréées à chaque image.

L’essai dans le moteur Android a aussi révélé des avertissements SVG répétés : ses dégradés refusent les chaînes telles que `offset=".5"`, acceptées par le navigateur, et remplacent alors leur valeur par zéro. Les nombres concernés ont été normalisés avec un zéro initial, par exemple `"0.5"`. Cela rétablit les dégradés et supprime ces avertissements du rendu. Le test de régression utilise le véritable extracteur natif de la version installée de `react-native-svg`, avec uniquement le convertisseur de couleurs système remplacé pour fonctionner dans Node.

Le versement conserve son modèle de liquide et sa durée réelle, avec une cible de 60 dessins par seconde. Son horloge suspend les images et le temps actif à l’arrière-plan, reprend sans saut et ne peut pas valider un mouvement après démontage. Les parchemins, les lianes de récompense, les étoiles et les éclosions utilisent des opacités et transformations natives. Les anciens effets vectoriels du titre et du carnet restent plafonnés à 60 mises à jour par seconde et cèdent la priorité aux actions principales. Aucun débit d’images sur téléphone n’est garanti par ces plafonds.

## Feuilletage

Les changements de page utilisent des images de papier et des illustrations mémorisées, déplacées par `Animated` sur le fil natif. Les cinq feuillets décalés du changement d’espèce ne reconstruisent plus de grands SVG à chaque image. L’ombre suit le bord du papier et la planche de destination correspond à la nouvelle espèce, y compris en revenant à une fleur déjà restaurée. L’image native suivante est préchargée pendant le bilan. La séquence valide la nouvelle page une seule fois lorsque le papier couvre l’écran ; elle suspend et reprend ses phases à l’arrière-plan.

`Botanical.native.tsx` emploie des images natives : les cinq états de couleur des vingt planches sont compilés à partir du composant SVG existant. Les atlas originaux restent inchangés. Cela évite les filtres et les masques d’atlas pendant le rendu Android/iOS et conserve l’aspect de chaque étape. Les légendes sont des textes natifs. Les 100 PNG transparents font 540 × 735 pixels chacun, pour environ 35,3 Mio compressés au total ; ils augmentent la taille de l’installation en échange d’un rendu plus simple. Le navigateur conserve le SVG.

Pour régénérer ces images avec Chromium installé :

```sh
npm run assets:botanical
```

## Mise en page

`SvgBackdrop` mesure une vue absolue, puis donne au SVG une largeur et une hauteur numériques. Le fond décoratif ne participe plus à la mesure du texte d’un bouton. Ce mécanisme est utilisé pour les rubans, le voile de la serre et le chapitre. Les textes natifs désactivent l’ajout de marge de police Android ; les boutons peuvent grandir et le texte peut revenir à la ligne.

La planche du bilan dépend de la hauteur disponible et du facteur de police. Les statistiques sont centrées, les commandes du bas sont plus compactes et les trois actions restent accessibles sous la zone réservée aux indices. La progression et les règles des graines ne changent pas.

## Indice sans déplacement des commandes

L’emplacement du parchemin est désormais réservé même lorsqu’il reste invisible. `HintSlot` mesure à l’avance les paragraphes possibles avec la police manuscrite réelle, la largeur disponible et le réglage de taille de texte du téléphone. L’indice, la recherche et les messages de réserve vide occupent cette même surface ; ni les boutons ni la hauteur de la serre ne changent à leur apparition. Aucun papier ni texte n’est visible avant un appui sur « Indice ».

Le papier et les deux rouleaux sont des surfaces fixes animées par transformations natives, sans mise à jour SVG à chaque image. L’écriture ne commence qu’après leur ouverture. Une nouvelle demande remonte la séquence avec un papier fermé, ce qui évite de réafficher brièvement l’ancien message. La serre couvre au minimum toute la fenêtre, même quand le contenu du jeu est plus court, pour supprimer la coupure au-dessus de la marge inférieure.

Le calcul de surface du liquide ne construit plus de polygones temporaires pendant chaque étape de sa recherche de volume. Les projections sont calculées une fois et les couches voisines partagent leurs frontières. Le contour final conserve la même géométrie ; la conservation du volume est vérifiée sur 1 271 couples angle/quantité supplémentaires. Un microbenchmark Node local de 1 800 échantillons (contact et cinq surfaces) est passé de 316 à 60 ms avec le même résultat numérique ; ce chiffre n’est pas une mesure de FPS Android.

## Effets simultanés

Les lianes du bilan et l’éclosion d’une fiole ne mettent plus de progression dans un état React à chaque image. Leurs dessins SVG restent fixes dans de petites vues mises en cache ; la croissance des tiges, l’apparition des feuilles, les pétales et le pollen utilisent les transformations et opacités du pilote natif. L’éclosion est une vue indépendante du SVG de versement. Son callback de fin reste stable pendant les images du liquide. Les trois étoiles partagent une seule horloge native avec des décalages interpolés ; leurs dessins et étincelles sont également mis en cache.

`useNativeProgress` suspend la séquence en arrière-plan, reprend le temps restant et annule les callbacks au démontage. Ces effets cosmétiques ne créent pas d’interactions bloquantes pour React Native. Le bilan conserve son délai d’ouverture de 650 ms après le dernier regroupement et démonte alors l’éclosion du plateau recouvert ; elle ne continue plus à dessiner derrière les étoiles.

Le registre `primaryAnimations` donne la priorité aux versements, au bilan et au feuilletage. Les scintillements du timbre et les mouvements périodiques de la bourse attendent leur fin ; les anciennes animations vectorielles du titre et du carnet ne redessinent pas leurs étapes intermédiaires pendant ces actions. Plusieurs propriétaires peuvent se chevaucher : les effets d’ambiance ne reprennent qu’après la libération du dernier. Ce mécanisme ne touche ni aux règles de jeu, ni aux récompenses, ni aux préférences, ni aux sons.

## Validation

- `npm test` : règles existantes et horloge de versement, y compris annulation, arrière-plan, images manquées et fin unique.
- `npm run typecheck` : composants et scripts.
- `tests/native-svg.test.ts` : les 71 décalages littéraux de dégradé du jeu sont acceptés sans avertissement par le parseur SVG natif réel.
- `npm run test:pouring` : filet visible, validation atomique, annulation, navigation, mode sans animations et versement entre rangées.
- `npm run test:mobile-rendering` : aucun changement du SVG du plateau pendant 1,2 seconde au repos, sur la première et la dernière page ; le support reste inchangé pendant un versement ; rubans et textes contenus dans les boutons à 320 et 393 pixels, avant et après révélation.
- `node --import tsx scripts/hint-layout-smoke.ts` : positions des commandes et hauteur du décor constantes pendant recherche, déroulement, écriture, nouvelle demande et fermeture ; messages longs à 320/393 pixels, deux rangées de tubes et mode sans animations. Aucun changement des attributs SVG du parchemin pendant son ouverture.
- `node --import tsx scripts/overlap-smoke.ts` : fiole en fleur, titre et versement simultanés, puis étoiles et lianes simultanées ; aucune modification des attributs SVG de ces récompenses pendant leur mouvement, retrait de l’éclosion recouverte, gain unique, changement de page et nouveau versement fonctionnels. Les tests de récompenses et de sons vérifient le silence, le mode sans animations et l’absence de relance à la révélation.
- `tests/primaryAnimations.test.ts` : les effets d’ambiance attendent tous les propriétaires actifs, avec libération et désabonnement idempotents.
- Les exports Hermes Android et iOS contrôlent l’inclusion des ressources natives. Les essais navigateur et les exports restent distincts d’un essai matériel Android/iOS.

Le nouvel APK doit être installé par-dessus le précédent, sans désinstallation, pour conserver le carnet local. Vérifier ensuite les captures signalées, le défilement, les versements, les sons, les retours d’arrière-plan et le prologue sur le téléphone du joueur.

La restauration utilise quatre lavis homogènes : le dessin entier gagne progressivement sa couleur, sans masques d’organes ni rectangles. Le quatrième lavis retrouve les couleurs originales. La cinquième page appose une gravure « Herbier restaurée » avec un tampon de bois ; le sceau reste un petit SVG séparé, sans vingt PNG supplémentaires. La révélation fond entre deux images natives et le tampon transforme des vues mises en cache : aucune géométrie SVG ni état React ne change à chaque image. Le bouton vers l’espèce suivante attend la fin de la pression ; sans animations, l’empreinte apparaît directement. Les sauvegardes à cinq pages par plante restent compatibles.
