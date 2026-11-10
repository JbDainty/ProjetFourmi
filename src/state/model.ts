import levels from '../data/levels.json';
import { Board, clone, pour, won, type Move } from '../engine/puzzle';
import { discoverPigment, Pigment } from './pigments';
import { pageStars } from './stars';
import { attemptPuzzle, newRemix, validRemix, type Remix } from '../engine/remix';

export type Settings = {
  sound: boolean;
  music: boolean;
  haptics: boolean;
  patterns: boolean;
  motion: boolean;
  confirmHints?: boolean;
};
export type Save = {
  version: 2;
  started: boolean;
  guideSeen: boolean;
  nickname: string;
  attemptRewarded: boolean;
  paidHints: Record<string, Move>;
  current: number;
  completed: Record<string, { stars: number; date: string }>;
  seeds: number;
  pigments: Pigment[];
  board: Board;
  history: Board[];
  moves: number;
  remix?: Remix;
  settings: Settings;
  theme: string;
  owned: string[];
  daily: string | null;
};
export function initial(): Save {
  return {
    version: 2,
    started: false,
    guideSeen: false,
    nickname: '',
    attemptRewarded: false,
    paidHints: {},
    current: 1,
    completed: {},
    seeds: 1,
    pigments: [],
    board: clone(levels[0].board),
    history: [],
    moves: 0,
    settings: {
      sound: true,
      music: true,
      haptics: true,
      patterns: false,
      motion: true,
      confirmHints: true,
    },
    theme: 'ivoire',
    owned: ['ivoire'],
    daily: null,
  };
}
/** A new journey keeps accessibility preferences, never earned progress or themes. */
export function resetProgress(s: Save): Save {
  return { ...initial(), settings: { ...s.settings } };
}
export const restoration = (s: Save, index: number) =>
  Array.from({ length: 5 }, (_, i) => !!s.completed[String(index * 5 + i + 1)]).filter(Boolean)
    .length;
export const unlocked = (s: Save, id: number) => id === 1 || !!s.completed[String(id - 1)];
export function loadLevel(s: Save, id: number): Save {
  if (id < 1 || id > 100 || !unlocked(s, id)) return s;
  return {
    ...s,
    current: id,
    board: clone(levels[id - 1].board),
    history: [],
    moves: 0,
    attemptRewarded: false,
    remix: undefined,
  };
}
export function reward(s: Save, now = new Date().toISOString()): Save {
  if (!won(s.board) || s.attemptRewarded) return s;
  const id = s.current,
    first = !s.completed[id],
    stars = pageStars(s.moves, attemptPuzzle(id, s.remix).par);

  return {
    ...s,
    completed: {
      ...s.completed,
      [id]: {
        stars: Math.max(stars, s.completed[id]?.stars ?? 0),
        date: s.completed[id]?.date ?? now,
      },
    },
    attemptRewarded: true,
    seeds: s.seeds + (stars === 3 ? 1 : 0),
    pigments: first ? [...s.pigments, discoverPigment(id, now)] : s.pigments,
  };
}
export function move(s: Save, from: number, to: number): Save {
  if (won(s.board)) return s;
  const board = pour(s.board, from, to);
  if (!board) return s;
  return reward({ ...s, board, history: [...s.history, s.board], moves: s.moves + 1 });
}
export function undo(s: Save): Save {
  if (!s.history.length || won(s.board)) return s;
  return {
    ...s,
    board: s.history.at(-1)!,
    history: s.history.slice(0, -1),
    moves: Math.max(0, s.moves - 1),
  };
}
/** Start a new certified puzzle for the same page, retaining the earned collection. */
export function remixPage(s: Save, random = Math.random): Save {
  if (won(s.board)) return s;
  const remix = newRemix(s.current, s.remix, random);
  return {
    ...s,
    remix,
    board: clone(attemptPuzzle(s.current, remix).board),
    history: [],
    moves: 0,
    attemptRewarded: false,
  };
}
export function restore(raw: string | null): Save {
  if (!raw) return initial();
  const v = JSON.parse(raw) as Save;
  if (v.version !== 2 && (v as { version: number }).version !== 1)
    throw Error('Version de sauvegarde non prise en charge.');
  const validBoard = (b: unknown): b is Board =>
    Array.isArray(b) &&
    b.length >= 2 &&
    b.length <= 10 &&
    b.every(
      (t) =>
        Array.isArray(t) && t.length <= 4 && t.every((c) => Number.isInteger(c) && c >= 0 && c < 7),
    );
  if (
    !Number.isInteger(v.current) ||
    v.current < 1 ||
    v.current > 100 ||
    !validBoard(v.board) ||
    !v.completed ||
    !Array.isArray(v.pigments) ||
    !Number.isFinite(v.seeds) ||
    v.seeds < 0
  )
    throw Error('Sauvegarde invalide.');
  const expected = levels[v.current - 1].board.flat().sort().join(',');
  if (v.remix !== undefined && !validRemix(v.current, v.remix)) throw Error('Mélange invalide.');
  if (v.board.flat().sort().join(',') !== expected) throw Error('Contenu des flacons invalide.');
  if (
    !Array.isArray(v.history) ||
    !v.history.every((b) => validBoard(b) && b.flat().sort().join(',') === expected)
  )
    throw Error('Historique invalide.');
  if (!Number.isInteger(v.moves) || v.moves < 0 || typeof v.started !== 'boolean')
    throw Error('Progression invalide.');
  for (const [id, entry] of Object.entries(v.completed))
    if (
      !/^([1-9][0-9]?|100)$/.test(id) ||
      !entry ||
      ![1, 2, 3].includes(entry.stars) ||
      !Number.isFinite(Date.parse(entry.date))
    )
      throw Error('Niveau enregistré invalide.');
  for (let id = 2; id <= 100; id++)
    if (v.completed[id] && !v.completed[id - 1]) throw Error('Progression discontinue.');
  if (!unlocked(v, v.current)) throw Error('Niveau verrouillé.');

  if (
    v.pigments.length !== Object.keys(v.completed).length ||
    new Set(v.pigments.map((p) => p?.id)).size !== v.pigments.length
  )
    throw Error('Collection de pigments incohérente.');
  for (const p of v.pigments) {
    if (
      !p ||
      !v.completed[p.id] ||
      p.species !== Math.floor((p.id - 1) / 5) ||
      typeof p.name !== 'string' ||
      !/^#[0-9a-f]{6}$/i.test(p.shade) ||
      !Number.isFinite(Date.parse(p.discovered))
    )
      throw Error('Pigment invalide.');
  }
  if (v.nickname !== undefined && (typeof v.nickname !== 'string' || v.nickname.length > 80))
    throw Error('Pseudo invalide.');
  if (v.guideSeen !== undefined && typeof v.guideSeen !== 'boolean')
    throw Error('État du guide invalide.');
  if (v.attemptRewarded !== undefined && typeof v.attemptRewarded !== 'boolean')
    throw Error('Récompense de tentative invalide.');
  if (v.paidHints !== undefined) {
    if (!v.paidHints || typeof v.paidHints !== 'object' || Array.isArray(v.paidHints))
      throw Error('Indices invalides.');
    for (const [encoded, hint] of Object.entries(v.paidHints)) {
      const divider = encoded.indexOf('|');
      const id = Number(encoded.slice(0, divider));
      const board = JSON.parse(encoded.slice(divider + 1));
      if (
        divider < 1 ||
        !Number.isInteger(id) ||
        id < 1 ||
        id > 100 ||
        !validBoard(board) ||
        board.flat().sort().join(',') !== levels[id - 1].board.flat().sort().join(',') ||
        !hint ||
        !Number.isInteger(hint.from) ||
        !Number.isInteger(hint.to) ||
        !pour(board, hint.from, hint.to)
      )
        throw Error('Indice enregistré invalide.');
    }
  }
  if (v.settings && Object.values(v.settings).some((value) => typeof value !== 'boolean'))
    throw Error('Paramètres invalides.');
  if (v.theme && !['ivoire', 'sauge', 'rose'].includes(v.theme)) throw Error('Thème invalide.');
  if (
    v.owned &&
    (!Array.isArray(v.owned) || v.owned.some((t) => !['ivoire', 'sauge', 'rose'].includes(t)))
  )
    throw Error('Thèmes invalides.');
  if (v.daily !== undefined && v.daily !== null && !/^\d{4}-\d{2}-\d{2}$/.test(v.daily))
    throw Error('Date invalide.');
  return {
    ...initial(),
    ...v,
    version: 2,
    // Existing signed carnets keep their place; the guide remains available from Aide.
    guideSeen: v.guideSeen ?? v.started,
    nickname: typeof v.nickname === 'string' ? normalizeNickname(v.nickname) : '',
    attemptRewarded: v.attemptRewarded ?? (!!v.completed[v.current] && won(v.board)),
    paidHints: v.paidHints ?? {},
    settings: {
      ...initial().settings,
      ...v.settings,
      music:
        typeof v.settings?.music === 'boolean' ? v.settings.music : (v.settings?.sound ?? true),
    },
    owned: Array.isArray(v.owned) ? v.owned : ['ivoire'],
  };
}

/** A nickname names a local carnet; it is never presented as an authenticated account. */
export function normalizeNickname(value: string): string {
  return value
    .normalize('NFC')
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 24);
}
const hintKey = (s: Save) => `${s.current}|${JSON.stringify(s.board)}`;
export const currentHint = (s: Save): Move | undefined => s.paidHints[hintKey(s)];
/** Charge only for a valid, newly revealed suggestion; duplicate taps are idempotent. */
export function purchaseHint(s: Save, suggestion: Move): Save {
  if (
    won(s.board) ||
    currentHint(s) ||
    s.seeds < 1 ||
    !pour(s.board, suggestion.from, suggestion.to)
  )
    return s;
  return {
    ...s,
    seeds: s.seeds - 1,
    paidHints: { ...s.paidHints, [hintKey(s)]: { ...suggestion } },
  };
}
