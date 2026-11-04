import type { Save } from './model';
export const themes = [
  { id: 'ivoire', name: 'Papier d’ivoire', color: '#f5f1e7', cost: 0 },
  { id: 'sauge', name: 'Carnet de sauge', color: '#dfe6d1', cost: 100 },
  { id: 'rose', name: 'Poussière de rose', color: '#eddbd1', cost: 150 },
];
export const levelSeeds = (id: number) => 10 + (id % 5 === 0 ? 25 : 0) + (id % 20 === 0 ? 50 : 0);
export function dailyReward(s: Save, day: string): Save {
  return s.daily === day ? s : { ...s, daily: day, seeds: s.seeds + 15 };
}
export function acquireTheme(s: Save, id: string): Save {
  const theme = themes.find((t) => t.id === id);
  if (!theme) return s;
  if (s.owned.includes(id)) return { ...s, theme: id };
  if (s.seeds < theme.cost) return s;
  return { ...s, theme: id, seeds: s.seeds - theme.cost, owned: [...s.owned, id] };
}
