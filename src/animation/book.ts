import { restoration, type Save } from '../state/model';

export const singleTurnDuration = 1500;
export const speciesTurnDuration = 2300;
export type BookTurnKind = 'single' | 'species';
export type TurningPage = {
  id: number;
  from: number;
  to: number;
  plant: number;
  stage: number;
  targetPlant: number;
  targetStage: number;
  kind: BookTurnKind;
};

/** Snapshot both plates before committing the new level; never reuse the old
 * specimen as the destination, including chapter boundaries and map jumps. */
export function planBookTurn(save: Save, target: number, id: number): TurningPage {
  if (!Number.isInteger(target) || target < 1 || target > 100)
    throw new RangeError('Invalid book page');
  const plant = Math.floor((save.current - 1) / 5);
  const targetPlant = Math.floor((target - 1) / 5);
  return {
    id,
    from: save.started ? save.current : 0,
    to: target,
    plant,
    stage: restoration(save, plant),
    targetPlant,
    targetStage: restoration(save, targetPlant),
    kind: targetPlant === plant ? 'single' : 'species',
  };
}
