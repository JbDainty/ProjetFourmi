# Ressources et provenance

- `assets/illustrations/prairies.png`, `sous-bois.png`, `zones-humides.png`, `montagnes.png`, `mediterranee.png` : vingt illustrations numériques originales à rendu aquarelle, générées pour COLOR WORLD avec l’outil de génération d’images OpenAI le 4 novembre 2026. Chaque atlas contient les quatre espèces d’un écosystème, dans l’ordre de lecture. Aucune planche historique ou illustration commerciale n’a été copiée. Les caractères morphologiques ont été précisés lors de la création ; une revue botanique indépendante reste recommandée avant publication scientifique.
- `assets/illustrations/papier.png` : texture originale de papier ancien générée pour le projet avec le même outil. Le grain, les fibres et les légères marques d’âge sont intégrés en fond sans intercepter les gestes.
- `src/components/Botanical.tsx` : cadrage des vingt spécimens, filtre d’encre sépia et révélation progressive des tiges, feuillages, fleurs, détails et nuances au moyen de filtres et masques SVG. Les atlas PNG restent inchangés. Les limites réelles de chaque spécimen sont mesurées dans `src/data/illustrations.ts` : le cadrage garde les proportions et exclut les fragments de plantes voisines, même lorsqu’une feuille dépasse un quadrant.
- `src/components/Paper.tsx` : composition du fond et des planches sur papier ivoire patiné.
- `src/components/BotanicalIcon.tsx` : pictogrammes SVG originaux dessinés pour le projet : rameaux, feuilles nervurées, fleur, loupe de naturaliste, carnet et graines. Ils remplacent les pictogrammes génériques dans les commandes et la navigation.
- `src/components/HerbariumTitle.tsx` : composition typographique originale de frontispice, Almendra en gras, petites capitales et fleuron botanique doré en SVG.
- `src/components/TitleVines.tsx` : lianes ornementales originales, feuilles nervurées et fleurs décoratives en SVG. Les tiges se dessinent, les feuilles se déploient et les fleurs éclosent au toucher du titre.
- `src/components/ChapterVignette.tsx` : mise en page originale inspirée des annotations d’un livre botanique, rameaux discrets, chapitre manuscrit et progression exprimée par cinq feuilles.
- `src/components/SpellIcon.tsx` : trois dessins SVG originaux pour les commandes du jeu, avec dorures, nervures, croissant, graines, fleurs et étoiles. Aucun symbole commercial externe.
- `src/components/VictoryPaper.tsx` : lianes originales en SVG qui se dessinent sur les marges de la page de réussite, avec feuilles nervurées et vrilles. Elles remplacent l’encadrement statique sur cet écran et ne prennent pas les gestes.
- `src/components/StampPrompt.tsx` : courte invitation italique et petites lueurs dorées originales pour l’observation de la planche.
- `src/components/HerbariumBookButton.tsx` : livre ancien original en SVG, reliure verte, tranche de papier, dorures et plantes gravées. L’animation ouvre la couverture puis révèle le menu ; aucun visuel de couverture externe.
- `src/components/PageFolio.tsx` : fleuron de pagination original en SVG, rameaux symétriques et chiffre en Almendra.
- `src/components/PencilNote.tsx` : crayon à papier original dessiné en SVG ; apparition progressive de l’écriture Caveat et positionnement du crayon d’après les lettres et les lignes réellement affichées.
- `src/components/HintScroll.tsx` : parchemin original en SVG, papier patiné embarqué, bords irréguliers, rouleaux ombrés et discret filigrane végétal. Les deux rouleaux s’écartent avant le début de l’écriture. La texture réutilise `papier.png` sans modification de l’image.
- `src/components/BotanicalStamp.tsx` : timbre dentelé original en SVG, réutilisant les illustrations et les étapes de restauration existantes.
- `src/components/FoliageFrame.tsx` : ornements SVG originaux créés pour le projet, avec tiges sinueuses, feuilles nervurées et rameaux d’angle. Le tracé s’adapte à la taille de chaque cadre ; sa couleur accompagne la restauration du chapitre ou de la planche. Aucune bordure commerciale ou image de cadre externe.
- `assets/pour.wav` : son synthétique original généré à partir d’oscillations et de bruit avec une enveloppe douce ; aucune bibliothèque sonore tierce.
- `assets/leaf-wind.wav` : souffle de vent et bruissement de feuilles synthétisés pour le jeu, 2,8 secondes, mono PCM 22 050 Hz. Bruit filtré, rafales douces et frémissements brefs ; aucun enregistrement tiers. Source reproductible : `scripts/generate-leaf-wind.py`.
- `public/icon.svg` : dessin original pour l’application Web. Les icônes de soumission aux boutiques restent à préparer.
- `assets/illustrations/serre.png` : décor original de serre ancienne à rendu aquarelle, généré pour COLOR WORLD avec l’outil de génération d’images OpenAI le 4 novembre 2026. Les flacons et supports ne sont pas intégrés à cette image : ils sont dessinés et animés indépendamment pour s’adapter à chaque niveau.
- `src/components/Greenhouse.tsx` : porte-tubes en bois, logements ouverts, pieds, traverses, vis en laiton et support commun pour les rangées multiples. Aucune ressource de mobilier commerciale.
- Almendra : Ana Sanfelippo, SIL Open Font License 1.1, pour les titres et la marque. Notice : `public/licenses/Almendra-OFL.txt`.
- Alegreya Sans : The Alegreya Sans Project Authors, SIL Open Font License 1.1, pour les commandes, textes et annotations. Notice : `public/licenses/Alegreya-Sans-OFL.txt`.
- Alegreya : The Alegreya Project Authors, SIL Open Font License 1.1, pour les noms scientifiques en italique. Notice : `public/licenses/Alegreya-OFL.txt`.
- Caveat : The Caveat Project Authors, SIL Open Font License 1.1, pour les commandes manuscrites et les annotations au crayon. Notice : `public/licenses/Caveat-OFL.txt`.
- `src/components/fonts.ts` : fichiers de polices embarqués et variantes de graisse explicites ; aucun chargement Google Fonts à distance pendant le jeu.
- Ionicons / react-native-vector-icons : MIT. Notices dans `public/licenses/`.
- `src/data/taxonomy.json` : résultats d’identification nomenclaturale de l’API GBIF avec URL et date de consultation. Aucun visuel GBIF intégré.

Les licences des dépendances JavaScript sont également disponibles dans leurs paquets npm. Ne pas présenter le contrôle nomenclatural comme une certification des dessins ou comme une validation INPN. Les images numériques ne sont pas présentées comme des aquarelles historiques authentiques.
