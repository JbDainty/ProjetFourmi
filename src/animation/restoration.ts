export const COLOR_STEPS = 4;
export const PAGE_STEPS = 5;
export const restorationTitles = [
  'Premier lavis',
  'Les couleurs s’éveillent',
  'Les nuances s’accordent',
  'Les couleurs retrouvées',
  'Le sceau du botaniste',
] as const;

export function restorationState(stage: number) {
  const page = Math.round(Math.max(0, Math.min(PAGE_STEPS, stage)));
  return { page, colors: Math.min(page, COLOR_STEPS), sealed: page === PAGE_STEPS };
}
export function restorationDescription(stage: number) {
  const { colors, sealed } = restorationState(stage);
  return `${colors} couleur${colors === 1 ? '' : 's'} sur 4 restaurée${colors === 1 ? '' : 's'}${sealed ? ', planche estampillée' : colors === 4 ? ', planche à estampiller' : ''}`;
}
export function restorationCaption(stage: number) {
  const { colors, sealed } = restorationState(stage);
  return `${colors} / 4 couleur${colors === 1 ? '' : 's'}${sealed ? ' · Estampillée' : colors === 4 ? ' · À estampiller' : colors === 1 ? ' restaurée' : ' restaurées'}`;
}

const ink = [
  0.23, 0.64, 0.1, 0, 0.06, 0.21, 0.58, 0.09, 0, 0.04, 0.16, 0.46, 0.07, 0, 0.02, 0, 0, 0, 1, 0,
];
const color = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];
/** The whole watercolor gains chroma together. No organ stencil or rectangular reveal. */
export function restorationWash(stage: number) {
  const step = restorationState(stage).colors;
  const amount = [0, 0.26, 0.52, 0.78, 1][step];
  return {
    matrix: ink.map((value, i) => value + (color[i] - value) * amount),
    opacity: [0.76, 0.86, 0.93, 0.98, 1][step],
  };
}

export const sealPosition = { x: 285, y: 426, diameter: 76, angle: -12 };
