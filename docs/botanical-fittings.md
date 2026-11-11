# Équipements botaniques des fioles

Les fioles sœurs sont désormais regroupées côte à côte sur la même rangée, avec
une attache commune de laiton, de feuillage et un sceau en forme de lien. Le
ressort du support se libère quand une fiole est sélectionnée ou soulevée ;
l’autre reste à sa place. La sélection souligne les deux bagues.

L’agencement reste une projection visuelle : `positions[tube]` conserve l’identité
du tube d’origine. Les numéros ne sont pas réattribués et aucun tableau de teintes,
historique, indice payé ou règle n’est modifié. Les portoirs, trous, étiquettes,
zones tactiles, versements et récompenses utilisent tous ces mêmes positions.
Le portoir du destinataire se choisit par sa rangée réelle, et non par une division
de son numéro. Les mélanges et les anciennes campagnes suivent le même placement.

Chaque mécanisme possède un équipement reconnaissable :

- Verrous : col scellé, cage végétale, cadenas et fermeture qui s’ouvre.
- Pinceaux : pinceau attaché au col et bague assortie aux verrous.
- Compte-gouttes : poire verte, pipette de verre et goutte unique.
- Filtres : fleur dont les pétales portent la couleur acceptée, au-dessus du filtre.
- Conservation : valve descendante et pied en forme de coupe végétale.
- Cristaux : givre à la hauteur réelle de la couche figée, qui disparaît lors de
  sa libération ; gemme de la couleur requise.
- Mystères : gravures de verre givré et couches masquées par des points d’interrogation.
- Petites capacités : volume physique réduit, graduations et chiffre contrasté,
  placé au-dessus de l’attache s’il y en a une.

Les schémas des nouvelles mécaniques et de l’aide reprennent les équipements du
jeu. Les dessins restent statiques ; les mouvements existants des fioles
transportent leurs équipements. Aucune boucle d’animation supplémentaire n’est
ajoutée. L’espace au-dessus des fioles et leurs zones tactiles s’adaptent aux
poires et pinceaux, en gardant des cibles d’au moins 44 points séparées entre rangées.

Validation : `tests/linked-layout.test.ts` couvre les paires actuelles, archivées
et mélangées ; `tests/workshop-fit.test.ts` vérifie les 1 000 pages sur quinze
formats avec deux tailles de texte. `scripts/tube-details-smoke.ts` contrôle les
équipements sur quatre formats, la résolution de la page 980, les ressorts pendant
un versement, les verrous et la fonte du givre. `scripts/expansion-smoke.ts`
contrôle les huit introductions et leurs solutions ; les essais du guide et de
l’entrée dans l’atelier couvrent les schémas et les transitions.
