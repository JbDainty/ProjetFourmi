export const mechanicIds = [
  'mystery',
  'locks',
  'capacity',
  'crystal',
  'links',
  'pipette',
  'filter',
  'conservation',
] as const;
export type Mechanic = (typeof mechanicIds)[number];
export type Rules = {
  mechanics: Mechanic[];
  mystery?: number[];
  capacities?: number[];
  gates?: { tube: number; key: number }[];
  crystals?: { tube: number; depth: number; color: number }[];
  links?: [number, number][];
  pipettes?: number[];
  filters?: { tube: number; color: number }[];
  collectors?: number[];
};
export const mechanicDetails: Record<Mechanic, { name: string; symbol: string; intro: string }> = {
  mystery: {
    name: 'Teintes mystères',
    symbol: '?',
    intro:
      'Les fioles au verre givré cachent certaines couches avec un ?. Elles se révèlent au sommet et restent ensuite visibles. Plusieurs fioles peuvent être mystérieuses.',
  },
  locks: {
    name: 'Le pinceau et le verrou',
    symbol: '⚿',
    intro:
      'Complétez la fiole au pinceau gravé pour ouvrir les verrous aux bagues assorties. Un pinceau peut ouvrir plusieurs fioles ; il reste ensuite à sa place.',
  },
  capacity: {
    name: 'Petites fioles',
    symbol: '⅔',
    intro:
      'Le chiffre gravé au pied du verre indique deux ou trois mesures, au lieu de quatre. Ces petites fioles sont terminées une fois pleines d’une seule teinte.',
  },
  crystal: {
    name: 'Teinte cristallisée',
    symbol: '◇',
    intro:
      'Complétez une fiole de la couleur du cristal serti dans le verre. Le givre fond et libère la couche figée ; les couches au-dessus restent mobiles. Plusieurs cristaux peuvent fondre ensemble.',
  },
  links: {
    name: 'Fioles sœurs',
    symbol: '∞',
    intro:
      'Le lien végétal relie deux fioles : elles acceptent la même teinte au sommet. Deux fioles pleines doivent partager leur couleur. Videz une fiole pour changer de teinte.',
  },
  pipette: {
    name: 'Compte-gouttes',
    symbol: '·',
    intro:
      'La fiole équipée d’un compte-gouttes en laiton verse une seule mesure à la fois. Un geste vaut toujours un mouvement.',
  },
  filter: {
    name: 'Filtre de pétale',
    symbol: '▽',
    intro:
      'Le pétale coloré dans la bague du col indique la seule couleur acceptée. La fiole doit finir vide ou remplie de cette couleur. Vous pouvez la vider normalement.',
  },
  conservation: {
    name: 'Fiole de conservation',
    symbol: '↓',
    intro:
      'La bague à flèche descendante et le pied cerclé désignent une fiole qui reçoit les couleurs sans pouvoir les reverser. Choisissez sa couleur avant de la remplir.',
  },
};
