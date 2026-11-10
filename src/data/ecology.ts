export const extraEcosystems = [
  ['Les haies du bocage', 'Entre branches et chemins creux', '#71866a'],
  ['Le verger familier', 'Sous les arbres en fleurs', '#b3a17a'],
  ['Le potager', 'Les couleurs du jardin nourricier', '#89946b'],
  ['Le jardin des simples', 'Au parfum des feuilles', '#819f83'],
  ['Les dunes et le littoral', 'Entre sable, sel et lumière', '#bca77c'],
  ['Les landes', 'La douceur des bruyères', '#aa8eac'],
  ['Les bords de rivière', 'Là où les rameaux touchent l’eau', '#6e9b91'],
  ['La forêt de feuillus', 'Sous les grandes couronnes', '#637d58'],
  ['Les pinèdes', 'Dans le silence des aiguilles', '#778b70'],
  ['Les jardins de village', 'Des fleurs tout près de chez soi', '#b5928f'],
  ['Les vieux murs', 'La vie entre les pierres', '#9a9d7d'],
  ['Les champs cultivés', 'Les compagnons des moissons', '#b3a267'],
  ['Les talus ensoleillés', 'De petits jardins libres', '#acac78'],
  ['Les chemins et les friches', 'Le vivant reprend sa place', '#a3967d'],
  ['Les sous-bois frais', 'Un tapis de feuilles et de lumière', '#71937c'],
].map(([name, subtitle, color]) => ({ name, subtitle, color }));
export const TOTAL_PAGES = 1000;
export const TOTAL_SPECIES = 200;
export const ecosystemForPlant = (plant: number) =>
  plant < 20
    ? Math.floor(plant / 4)
    : plant < 50
      ? Math.floor((plant - 20) / 6)
      : 5 + Math.floor((plant - 50) / 10);
export const ecosystemForPage = (page: number) => ecosystemForPlant(Math.floor((page - 1) / 5));
export const plantsForEcosystem = (eco: number) =>
  Array.from({ length: 200 }, (_, i) => i).filter((i) => ecosystemForPlant(i) === eco);
export const journeyRegions = [
  ...Array.from({ length: 5 }, (_, i) => ({
    ecosystem: i,
    start: i * 20 + 1,
    end: i * 20 + 20,
    volume: 1,
  })),
  ...Array.from({ length: 5 }, (_, i) => ({
    ecosystem: i,
    start: 101 + i * 30,
    end: 130 + i * 30,
    volume: 2,
  })),
  ...Array.from({ length: 15 }, (_, i) => ({
    ecosystem: i + 5,
    start: 251 + i * 50,
    end: 300 + i * 50,
    volume: 1,
  })),
];
export const regionForPage = (page: number) =>
  journeyRegions.findIndex((r) => page >= r.start && page <= r.end);
