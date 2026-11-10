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
      'Les couches marquées ? se révèlent lorsqu’elles arrivent au sommet. Une teinte découverte reste visible.',
  },
  locks: {
    name: 'Le pinceau et le verrou',
    symbol: '⚿',
    intro:
      'Complétez la fiole marquée du pinceau pour ouvrir la fiole verrouillée. Le pinceau reste ensuite à sa place.',
  },
  capacity: {
    name: 'Petites fioles',
    symbol: '⅔',
    intro:
      'Lisez les graduations : certaines fioles contiennent seulement deux ou trois mesures. Elles sont terminées une fois pleines d’une seule teinte.',
  },
  crystal: {
    name: 'Teinte cristallisée',
    symbol: '◇',
    intro:
      'Complétez une fiole de la couleur indiquée par le cristal. Il fond alors et libère la couche figée ; les couches au-dessus restent mobiles.',
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
      'La fiole à pipette verse une seule mesure à la fois. Un geste vaut toujours un mouvement.',
  },
  filter: {
    name: 'Filtre de pétale',
    symbol: '▽',
    intro:
      'La pastille au col indique la seule couleur que cette fiole peut recevoir. À la fin, elle doit être vide ou remplie de cette couleur. Vous pouvez la vider normalement.',
  },
  conservation: {
    name: 'Fiole de conservation',
    symbol: '↓',
    intro:
      'Cette fiole reçoit les couleurs, mais ne peut pas être reversée. Choisissez sa couleur avant de la remplir.',
  },
};
