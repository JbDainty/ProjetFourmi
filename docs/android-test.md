# Installer et tester sur Android

Le projet Expo appartient au compte `jbame` : https://expo.dev/accounts/jbame/projects/color-world-herbier.

Le profil EAS `preview` compile une application Android autonome au format APK. L’application fonctionne sans Expo Go, sans ordinateur connecté et sans serveur de développement. Les illustrations, textures, polices et sons sont embarqués. L’installation de test ne passe pas par Google Play.

## Sur le téléphone

1. Ouvrir la [page de la première compilation Android](https://expo.dev/accounts/jbame/projects/color-world-herbier/builds/67787e90-ff4f-48ce-aac2-227d94834393), ou la dernière compilation Android `preview` dans l’onglet Builds du projet.
2. Attendre que la compilation indique **Finished**, puis toucher **Install** ou **Download** pour télécharger le fichier `.apk`.
3. Ouvrir le téléchargement. Si Android demande une autorisation, ouvrir ses paramètres et autoriser l’installation depuis le navigateur utilisé pour ce téléchargement, puis revenir à l’installation.
4. Toucher **Installer**, puis **Ouvrir**. L’application s’appelle **Herbier des couleurs**. L’autorisation d’installation du navigateur peut ensuite être retirée dans les paramètres Android.

La progression de la version Web reste dans le navigateur : ce premier lancement Android crée un carnet distinct avec une graine. La connexion Expo utilisée pour compiler n’est pas un compte joueur. Les boutons Google/Apple du jeu restent préparatoires ; aucune sauvegarde en ligne n’est encore active.

## Premier essai

- Regarder le prologue 3D, signer le carnet, puis vérifier l’arrivée sur les fioles et le démarrage de la musique avant tout versement.
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
