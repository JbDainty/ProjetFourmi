# Installer et tester sur Android

Le projet Expo appartient au compte `jbame` : https://expo.dev/accounts/jbame/projects/color-world-herbier.

Le profil EAS `preview` compile une application Android autonome au format APK. L’application fonctionne sans Expo Go, sans ordinateur connecté et sans serveur de développement. Les illustrations, textures, polices, sons et la cinématique sont embarqués. L’installation de test ne passe pas par Google Play.

## Sur le téléphone

1. Ouvrir la [compilation Android 1.0.2](https://expo.dev/accounts/jbame/projects/color-world-herbier/builds?platform=android), ou la dernière compilation Android `preview` dans l’onglet Builds du projet.
2. Attendre que la compilation indique **Finished**, puis toucher **Install** ou **Download** pour télécharger le fichier `.apk`.
3. Ouvrir le téléchargement. Si Android demande une autorisation, ouvrir ses paramètres et autoriser l’installation depuis le navigateur utilisé pour ce téléchargement, puis revenir à l’installation.
4. Installer cette version par-dessus la précédente, sans désinstaller le jeu, puis toucher **Ouvrir**. L’application s’appelle **Herbier des couleurs**. L’autorisation d’installation du navigateur peut ensuite être retirée dans les paramètres Android.

La progression de la version Web reste dans le navigateur : ce premier lancement Android crée un carnet distinct avec une graine. La connexion Expo utilisée pour compiler n’est pas un compte joueur. Les boutons Google/Apple du jeu restent préparatoires ; aucune sauvegarde en ligne n’est encore active.

Un carnet déjà signé arrive sur sa page d’accueil habituelle : toucher **Revoir le prologue** pour voir le nouveau film. Les animations doivent être activées. La signature et la progression existantes sont conservées.

## Premier essai

- Regarder la cinématique 3D précalculée, signer le carnet, puis vérifier l’arrivée sur les fioles et le démarrage de la musique avant tout versement.
- Terminer une page, révéler sa couleur et continuer ; contrôler les sons, le tintement d’une fiole complète, les étoiles, les graines et le changement de page.
- Passer l’application en arrière-plan, revenir, puis la fermer et la rouvrir : vérifier la pause audio, la reprise et la conservation du carnet.
- Dans les paramètres, essayer le silence et les animations désactivées. Au prochain lancement, essayer « Revoir le prologue » ; vérifier le confort sur l’écran et la fluidité du film.
- Relancer en mode avion pour contrôler les ressources embarquées et le fonctionnement hors ligne.

Pour signaler un problème, noter le modèle du téléphone, sa version Android, la page jouée et les gestes qui provoquent le problème. Une capture ou une courte vidéo aide à distinguer un souci de mise en page, de son ou de rendu 3D. La réussite d’une compilation ne remplace pas ces essais sur appareil.

## Mettre à jour l’application de test

Installer le prochain APK par-dessus l’application existante, avec le même package `com.colorworld.herbier` et la même signature EAS, conserve normalement la progression locale. Désinstaller l’application ou remettre le carnet à zéro efface cette progression.

Pour créer un nouvel APK depuis les sources avec l’accès au compte Expo :

```sh
npm ci
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

Les identifiants publics du projet sont dans `app.json`. Les clés et mots de passe ne doivent pas être ajoutés au dépôt. EAS gère actuellement la signature Android à distance. La commande `preview` ne publie rien sur les boutiques.

## Petites mises à jour de test

La version 1.0.1 (code Android 2) a introduit `expo-updates` et le canal EAS `preview`. La **1.0.2 (code Android 3)** ajoute le lecteur vidéo natif : il faut installer ce nouvel APK une fois pour voir la cinématique. La 1.0.1 ne peut pas recevoir ce nouveau module par une simple mise à jour JavaScript. Les modifications suivantes compatibles avec le nouveau runtime restent distribuables par EAS Update.

Le runtime est identifié par l’empreinte native (`fingerprint`). Une mise à jour JavaScript compatible peut ensuite être envoyée au canal de test, séparé du canal `production` :

```sh
npx eas-cli update --channel preview --platform android --environment preview --message "Description du correctif"
```

L’application démarre immédiatement avec sa version locale, même hors ligne, et vérifie les mises à jour au lancement. Une mise à jour téléchargée est appliquée lors d’un lancement suivant ; il peut donc falloir fermer complètement puis rouvrir le jeu après le téléchargement. Un nouveau module natif ou une autre empreinte demande un nouvel APK. Les publications de test ne mettent rien sur Google Play.
