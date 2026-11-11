# Bibliothèque d’herbiers

Le catalogue utilise un viewport mesuré dans la zone sûre du téléphone. Son titre,
ses onglets, les livres et la pagination se partagent cette hauteur sans défilement.
Quatre carnets sont affichés sur les formats ordinaires ; les écrans très courts
ou un affichage avec un texte agrandi passent à deux carnets par page.
La grille adopte une rangée en paysage. Les pigments utilisent aussi une grille
et une pagination calculées à partir de la place disponible.

Les reliures possèdent vingt gravures botaniques originales, un cuir patiné, des
coins de laiton, des nerfs au dos, une tranche de papier, un fermoir serti et des
dorures. Les textures proviennent des ressources déjà présentes dans le jeu.
Le catalogue monte au plus quatre couvertures de 320 × 390 points, sans charger
les illustrations des 200 espèces. Un seul bitmap de cuir et une tranche sont
partagés entre les couvertures ; le cadrage du cuir évite les inscriptions de la
texture de l’introduction. Les gravures et les cadres restent statiques.

Un unique cycle natif éclaire successivement les dorures. Il s’arrête en arrière-plan,
lors d’une animation prioritaire et lorsque les animations sont désactivées.
L’ouverture d’un carnet dure 360 ms, avec protection contre les appuis multiples
et annulation en quittant le catalogue ou en changeant d’onglet. Le Menu revient
directement à l’accueil si un livre est en cours d’ouverture.

La position est mémorisée par l’index du premier livre (`volume`) ; l’ancien
paramètre `shelf` conserve sa signification de groupe de quatre. Le lecteur
retrouve ainsi le même livre après un retour ou un changement de format.
La progression, les graines et les collections sont uniquement consultées.

Validation : `tests/herbarium-layout.test.ts` vérifie quinze formats avec trois
tailles de texte. `scripts/herbarium-fit-smoke.ts` contrôle les deux onglets sur
huit formats, les vingt titres sans rognage, les cibles de 44 points, la collection
de 1 000 pigments, les annulations et la sauvegarde. Les essais `herbarium-stability`
et `herbarium-entry` couvrent les vingt livres, les albums, les liens directs,
les dates absentes des parties d’essai et les retours avec un CPU ralenti.
