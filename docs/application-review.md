# Revue de l’application — 10 novembre 2026

La revue couvre les sept écrans principaux, les carnets, le prologue, l’aide, les huit mécaniques et la campagne de 1 000 pages. Les vérifications utilisent Chromium/Playwright et les exports Hermes Android/iOS ; aucun téléphone ou simulateur natif n’est connecté à cet environnement. Les durées de test et comparaisons d’images ne constituent pas des mesures de FPS sur le S23 Ultra.

## Corrections

- **Ouverture après erreur de lecture** : le chargement initial ne montrait pas de commande de reprise exploitable. L’écran expose maintenant le message et le bouton « Réessayer l’ouverture », y compris aux lecteurs d’écran. Une reprise relit AsyncStorage et n’écrit jamais un carnet initial par-dessus les données en échec. Les nouvelles tentatives simultanées sont bornées. Le parcours vérifie une erreur répétée, la conservation du contenu brut, puis une lecture réussie sans rechargement de l’application.
- **Bordures des longues pages** : un SVG natif de plusieurs milliers de points pouvait nécessiter une grande surface bitmap à la densité du téléphone. Les grands cadres utilisent désormais de petites bandes autour du papier ; le centre vide n’est plus alloué dans chaque surface SVG. Les dessins, coordonnées et dégradés restent les mêmes. Sur les pages de test, la surface totale tombe sous 30 % du rectangle initial. Chaque bande est bornée ; les petits ornements et le rendu navigateur restent en une surface.
- **Carte et plantes terminées** : l’aperçu des fiches de page utilise la restauration commune jusqu’à la cinquième étape. Le sceau ne disparaît plus à cause d’une ancienne borne à quatre.
- **Outils de maintenance** : le générateur historique de cent puzzles refuse d’écraser la campagne étendue. La calibration tient compte des règles de chaque page et propose `--check` pour vérifier les références sans réécrire les données. Les anciennes hypothèses des scénarios navigateur ont été actualisées : dernière page 1 000, pages réellement à deux rangées et préférence de confirmation des indices.

## Validation

`npm run typecheck` et les **110 tests dans 22 fichiers** passent. Les versions de 21 dépendances natives ont été comparées en lecture seule aux métadonnées du SDK Expo installé, sans écart et sans modification des dépendances. La calibration hors ligne confirme également les 1 000 références avec `--check`, sans réécrire les puzzles. Les tests comprennent la résolution des 1 000 puzzles, le recalcul indépendant de leurs minima, les mélanges certifiés, les récompenses, les migrations, les formats, la physique, les interruptions audio natives et les surfaces des bordures.

Les seize parcours suivants ont été exécutés avec succès :

| Parcours                       | Vérifications principales                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `home-quick-entry-smoke.ts`    | Touchers immédiats et triples pendant l’entrée du menu, CPU ralenti quatre fois, destination unique.                            |
| `home-garden-smoke.ts`         | Décor animé, suspension/reprise, arrêt hors du menu, option sans animations.                                                    |
| `workshop-fit-smoke.ts`        | Cent premières pages et tous les nombres de fioles sur treize formats supplémentaires, commandes et cibles de 44 points.        |
| `hint-layout-smoke.ts`         | Place réservée, déroulement et écriture, aucun déplacement des commandes, messages longs et réserve vide.                       |
| `victory-fit-smoke.ts`         | Quinze formats, étoiles, révélation, reprise, sceau, dernière page, commandes visibles sans défilement.                         |
| `page-turn-smoke.ts`           | Feuillet unique et changements d’espèce, bonne illustration d’arrivée, sons et options indépendantes.                           |
| `overlap-smoke.ts`             | Versement, éclosion et titre simultanés, puis étoiles et lianes ; dessins vectoriels immuables.                                 |
| `audio-resume-smoke.ts`        | Six sorties/retours pendant les sons ; une seule musique active, aucun bruitage différé ni atténuation bloquée.                 |
| `cinematic-smoke.ts`           | Vidéo réelle, pause/reprise, signature, rejeu, cache hors ligne, passage et repli si le média échoue.                           |
| `guide-smoke.ts`               | Première inscription, aide accessible depuis le menu, exercice, préférences, reprise et remise à zéro.                          |
| `remix-smoke.ts`               | Confirmation, annulation, une graine par aide, relecture gratuite, mélange certifié, départ pendant l’animation.                |
| `reward-reset-smoke.ts`        | Gains uniques, meilleur score conservé, rejeu, deux confirmations, écriture en échec et succès durable.                         |
| `herbarium-stability-smoke.ts` | Collection complète, vingt livres accessibles, quatre couvertures montées, une planche et huit pigments à la fois.              |
| `expansion-smoke.ts`           | Huit leçons jouées, capacités différentes, mille pages sur carte virtualisée, migration et essai isolé.                         |
| `app-review-smoke.ts`          | Sept écrans sur quatre formats, lecture défaillante, boutique, pseudo, statut des comptes et vingt musiques réellement lancées. |
| `native-foliage-smoke.ts`      | Même composant avec la branche mobile, surfaces bornées et comparaison des pixels de la bordure avec la surface originale.      |

La comparaison du cadre porte sur 350 × 1 500, 700 × 3 200 et 920 × 600 points. L’erreur moyenne maximale sur les pixels du pourtour reste inférieure à 0,006 sur une échelle de 0 à 255. Les captures et journaux sont produits dans `test-results/` et les fichiers temporaires de la session ; ils ne sont pas embarqués dans le jeu.

## Vérifications sur appareil restantes

Confirmer les fermetures natives, la consommation mémoire, la fluidité pendant une longue session, le clavier et les interruptions audio système sur le S23 Ultra, puis sur un appareil iOS. Les connexions Google/Apple et les services commerciaux restent explicitement inactifs, comme prévu ; les deux futurs modes affichent « À venir ».
