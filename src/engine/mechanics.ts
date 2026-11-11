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
      'Le chiffre gravé indique deux ou trois mesures. Une teinte peut remplir plusieurs petites fioles : six mesures se répartissent en 3 + 3. Chaque fiole occupée doit être pleine et unie ; les autres peuvent rester vides.',
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
      'Les deux fioles côte à côte partagent une attache de feuillage et de laiton. Elles acceptent la même teinte au sommet. Pleines, elles doivent avoir la même couleur ; videz-en une pour changer de teinte. Chacune peut se soulever pour verser.',
  },
  pipette: {
    name: 'Compte-gouttes',
    symbol: '·',
    intro:
      'Le bouchon vert et sa pipette en laiton versent une seule mesure à la fois. Un geste vaut toujours un mouvement.',
  },
  filter: {
    name: 'Filtre de pétale',
    symbol: '▽',
    intro:
      'La fleur au col forme un filtre : la fiole ne reçoit que la couleur de ses pétales. Elle doit finir vide ou pleine de cette teinte. Vous pouvez la vider normalement.',
  },
  conservation: {
    name: 'Fiole de conservation',
    symbol: '↓',
    intro:
      'La bague à flèche descendante et le pied cerclé désignent une fiole qui reçoit les couleurs sans pouvoir les reverser. Choisissez sa couleur avant de la remplir.',
  },
};
