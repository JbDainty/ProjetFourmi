# Ressources et provenance

- `assets/illustrations/prairies.png`, `sous-bois.png`, `zones-humides.png`, `montagnes.png`, `mediterranee.png` : vingt illustrations numériques originales à rendu aquarelle, générées pour COLOR WORLD avec l’outil de génération d’images OpenAI le 4 novembre 2026. Chaque atlas contient les quatre espèces d’un écosystème, dans l’ordre de lecture. Aucune planche historique ou illustration commerciale n’a été copiée. Les caractères morphologiques ont été précisés lors de la création ; une revue botanique indépendante reste recommandée avant publication scientifique.
- `assets/illustrations/papier.png` : texture originale de papier ancien générée pour le projet avec le même outil. Le grain, les fibres et les légères marques d’âge sont intégrés en fond sans intercepter les gestes.
- `src/components/Botanical.tsx` : cadrage des vingt spécimens, filtre d’encre sépia et révélation progressive des tiges, feuillages, fleurs, détails et nuances au moyen de filtres et masques SVG. Les atlas PNG restent inchangés. Les limites réelles de chaque spécimen sont mesurées dans `src/data/illustrations.ts` : le cadrage garde les proportions et exclut les fragments de plantes voisines, même lorsqu’une feuille dépasse un quadrant.
- `src/components/Paper.tsx` : composition du fond et des planches sur papier ivoire patiné avec fins encadrements.
- `assets/pour.wav` : son synthétique original généré à partir d’oscillations et de bruit avec une enveloppe douce ; aucune bibliothèque sonore tierce.
- `public/icon.svg` : dessin original pour l’application Web. Les icônes de soumission aux boutiques restent à préparer.
- `assets/illustrations/serre.png` : décor original de serre ancienne à rendu aquarelle, généré pour COLOR WORLD avec l’outil de génération d’images OpenAI le 4 novembre 2026. Les flacons et supports ne sont pas intégrés à cette image : ils sont dessinés et animés indépendamment pour s’adapter à chaque niveau.
- `src/components/Greenhouse.tsx` : porte-tubes en bois, logements ouverts, pieds, traverses, vis en laiton et support commun pour les rangées multiples. Aucune ressource de mobilier commerciale.
- Almendra : Ana Sanfelippo, SIL Open Font License 1.1, pour les titres et la marque. Notice : `public/licenses/Almendra-OFL.txt`.
- Alegreya Sans : The Alegreya Sans Project Authors, SIL Open Font License 1.1, pour les commandes, textes et annotations. Notice : `public/licenses/Alegreya-Sans-OFL.txt`.
- Alegreya : The Alegreya Project Authors, SIL Open Font License 1.1, pour les noms scientifiques en italique. Notice : `public/licenses/Alegreya-OFL.txt`.
- `src/components/fonts.ts` : fichiers de polices embarqués et variantes de graisse explicites ; aucun chargement Google Fonts à distance pendant le jeu.
- Ionicons / react-native-vector-icons : MIT. Notices dans `public/licenses/`.
- `src/data/taxonomy.json` : résultats d’identification nomenclaturale de l’API GBIF avec URL et date de consultation. Aucun visuel GBIF intégré.

Les licences des dépendances JavaScript sont également disponibles dans leurs paquets npm. Ne pas présenter le contrôle nomenclatural comme une certification des dessins ou comme une validation INPN. Les images numériques ne sont pas présentées comme des aquarelles historiques authentiques.
