import { restoration, type Save } from './model';

/** The cabinet reads the current attempt; opening it never reloads or rewards a page. */
export function homeProgress(save: Save) {
  const plant = Math.floor((save.current - 1) / 5);
  const completedPages = Object.keys(save.completed).length;
  return {
    plant,
    chapter: Math.floor(plant / 4),
    stage: restoration(save, plant),
    page: save.current,
    completedPages,
    sealedPlants: Array.from({ length: 20 }, (_, index) => restoration(save, index)).filter(
      (n) => n === 5,
    ).length,
    firstPage: completedPages === 0 && save.current === 1 && save.moves === 0,
    collectionComplete: completedPages === 100,
  };
}
