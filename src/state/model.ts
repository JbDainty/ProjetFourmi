import levels, { legacyLevels, campaign3Levels } from '../data/campaign';
import { initialKnowledge, moveKnowledge, revealTop } from '../engine/knowledge';
import { mechanicIds, type Mechanic } from '../engine/mechanics';
import { Board, clone, pour, won, capacity, type Move } from '../engine/puzzle';
import { discoverPigment, Pigment } from './pigments';
import { pageStars } from './stars';
import { attemptPuzzle, campaignPool, newRemix, validRemix, type Remix } from '../engine/remix';

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
  campaign?: 3 | 4;
  known?: boolean[][];
  historyKnown?: boolean[][][];
  seenMechanics?: Mechanic[];
  testSession?: { returnSave: Save };
  started: boolean;
  guideSeen: boolean;
  nickname: string;
  attemptRewarded: boolean;
  paidHints: Record<string, Move & { context?: string; revision?: number }>;
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
    campaign: 4,
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
    known: initialKnowledge(levels[0].board, levels[0].rules),
    historyKnown: [],
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
  return {
    ...initial(),
    settings: { ...s.settings },
    ...(s.testSession ? { testSession: s.testSession, seeds: 50 } : {}),
  };
}
export const restoration = (s: Save, index: number) =>
  s.testSession && index === Math.floor((s.current - 1) / 5)
    ? ((s.current - 1) % 5) + (won(s.board, activeRules(s)) ? 1 : 0)
    : Array.from({ length: 5 }, (_, i) => !!s.completed[String(index * 5 + i + 1)]).filter(Boolean)
        .length;
export const unlocked = (s: Save, id: number) =>
  !!s.testSession || id === 1 || !!s.completed[String(id - 1)];
export const activeRules = (s: Save) => attemptPuzzle(s.current, s.remix).rules;
export function loadLevel(s: Save, id: number): Save {
  if (id < 1 || id > 1000 || !unlocked(s, id)) return s;
  return {
    ...s,
    current: id,
    board: clone(levels[id - 1].board),
    history: [],
    moves: 0,
    attemptRewarded: false,
    remix: undefined,
    campaign: 4,
    known: initialKnowledge(levels[id - 1].board, levels[id - 1].rules),
    historyKnown: [],
  };
}
export function reward(s: Save, now = new Date().toISOString()): Save {
  if (!won(s.board, activeRules(s)) || s.attemptRewarded) return s;
  if (s.testSession) return { ...s, attemptRewarded: true };
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
  if (won(s.board, activeRules(s))) return s;
  const board = pour(s.board, from, to, activeRules(s));
  if (!board) return s;
  return reward({
    ...s,
    board,
    known: moveKnowledge(
      s.board,
      board,
      s.known ?? initialKnowledge(s.board, activeRules(s)),
      from,
      to,
    ),
    historyKnown: [
      ...(s.historyKnown ?? s.history.map((b) => initialKnowledge(b))),
      s.known ?? initialKnowledge(s.board, activeRules(s)),
    ],
    history: [...s.history, s.board],
    moves: s.moves + 1,
  });
}
export function undo(s: Save): Save {
  if (!s.history.length || won(s.board, activeRules(s))) return s;
  const board = s.history.at(-1)!;
  const prior = s.historyKnown?.at(-1) ?? board.map((t) => t.map(() => true));
  const known = prior.map((t, i) =>
    t.map((v, d) => v || (board[i][d] === s.board[i][d] && s.known?.[i]?.[d] === true)),
  );
  return {
    ...s,
    board,
    history: s.history.slice(0, -1),
    known,
    historyKnown: s.historyKnown?.slice(0, -1),
    moves: Math.max(0, s.moves - 1),
  };
}
/** Start a new certified puzzle for the same page, retaining the earned collection. */
export function remixPage(s: Save, random = Math.random): Save {
  if (won(s.board, activeRules(s)) || s.seeds < 1) return s;
  let remix = newRemix(s.current, s.remix, random);
  for (
    let attempt = 0;
    attempt < 8 &&
    JSON.stringify(attemptPuzzle(s.current, remix).board) === JSON.stringify(s.board);
    attempt++
  )
    remix = newRemix(s.current, s.remix, random);
  if (JSON.stringify(attemptPuzzle(s.current, remix).board) === JSON.stringify(s.board)) {
    remix.order.push(remix.order.shift()!);
    if (JSON.stringify(attemptPuzzle(s.current, remix).board) === JSON.stringify(s.board)) {
      [remix.colors[0], remix.colors[1]] = [remix.colors[1], remix.colors[0]];
    }
  }
  return {
    ...s,
    remix,
    seeds: s.seeds - 1,
    board: clone(attemptPuzzle(s.current, remix).board),
    known: initialKnowledge(
      attemptPuzzle(s.current, remix).board,
      attemptPuzzle(s.current, remix).rules,
    ),
    historyKnown: [],
    history: [],
    moves: 0,
    attemptRewarded: false,
  };
}
export function restore(raw: string | null): Save {
  if (!raw) return initial();
  const v = JSON.parse(raw) as Save;
  if (v.campaign !== 4 && v.campaign !== 3 && v.current >= 1 && v.current <= 100) {
    const original = legacyLevels[(v.remix?.level ?? v.current) - 1];
    v.remix = {
      level: v.remix?.level ?? v.current,
      order: v.remix?.order ?? original.board.map((_, i) => i),
      colors: v.remix?.colors ?? [...new Set(original.board.flat())].sort(),
      legacy: true,
    };
    v.campaign = 4;
  } else if (v.campaign === 3) {
    const original = (v.remix?.legacy ? legacyLevels : campaign3Levels)[
      (v.remix?.level ?? v.current) - 1
    ];
    if (!original) throw Error('Ancienne page invalide.');
    v.remix = {
      level: v.current,
      order: original.board.map((_, i) => i),
      colors: [...new Set(original.board.flat())].sort(),
      ...v.remix,
      ...(v.remix?.legacy ? {} : { campaign: 3 }),
    };
    v.campaign = 4;
  }
  if (v.testSession) {
    if (!v.testSession.returnSave || v.testSession.returnSave.testSession)
      throw Error('Session de test invalide.');
    v.testSession = { returnSave: restore(JSON.stringify(v.testSession.returnSave)) };
  }
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
    v.current > 1000 ||
    !validBoard(v.board) ||
    !v.completed ||
    !Array.isArray(v.pigments) ||
    !Number.isFinite(v.seeds) ||
    v.seeds < 0
  )
    throw Error('Sauvegarde invalide.');
  const expected = campaignPool(v.remix)[v.current - 1].board.flat().sort().join(',');
  if (v.board.length !== campaignPool(v.remix)[v.current - 1].board.length)
    throw Error('Nombre de fioles invalide.');
  if (v.remix !== undefined && !validRemix(v.current, v.remix)) throw Error('Mélange invalide.');
  if (v.board.some((t, i) => t.length > capacity(activeRules(v), i)))
    throw Error('Capacité de fiole invalide.');
  if (v.board.flat().sort().join(',') !== expected) throw Error('Contenu des flacons invalide.');
  if (
    !Array.isArray(v.history) ||
    !v.history.every(
      (b) =>
        validBoard(b) &&
        b.length === v.board.length &&
        b.every((t, i) => t.length <= capacity(activeRules(v), i)) &&
        b.flat().sort().join(',') === expected,
    )
  )
    throw Error('Historique invalide.');
  if (!Number.isInteger(v.moves) || v.moves < 0 || typeof v.started !== 'boolean')
    throw Error('Progression invalide.');
  for (const [id, entry] of Object.entries(v.completed))
    if (
      !Number.isInteger(Number(id)) ||
      Number(id) < 1 ||
      Number(id) > 1000 ||
      !entry ||
      ![1, 2, 3].includes(entry.stars) ||
      !Number.isFinite(Date.parse(entry.date))
    )
      throw Error('Niveau enregistré invalide.');
  for (let id = 2; id <= 1000; id++)
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
  if (
    v.seenMechanics !== undefined &&
    (!Array.isArray(v.seenMechanics) || !v.seenMechanics.every((m) => mechanicIds.includes(m)))
  )
    throw Error('Mécaniques découvertes invalides.');
  const validKnown = (known: unknown, b: Board) =>
    Array.isArray(known) &&
    known.length === b.length &&
    known.every(
      (t, i) =>
        Array.isArray(t) && t.length === b[i].length && t.every((x) => typeof x === 'boolean'),
    );
  if (v.known !== undefined && !validKnown(v.known, v.board))
    throw Error('Teintes révélées invalides.');
  if (
    v.historyKnown !== undefined &&
    (!Array.isArray(v.historyKnown) ||
      v.historyKnown.length !== v.history.length ||
      !v.historyKnown.every((k, i) => validKnown(k, v.history[i])))
  )
    throw Error('Historique des teintes invalide.');
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
        id > 1000 ||
        !validBoard(board) ||
        (board.flat().sort().join(',') !== levels[id - 1].board.flat().sort().join(',') &&
          board.flat().sort().join(',') !== campaign3Levels[id - 1].board.flat().sort().join(',') &&
          (id > 100 ||
            board.flat().sort().join(',') !==
              legacyLevels[id - 1].board.flat().sort().join(','))) ||
        !hint ||
        (hint.context !== undefined && typeof hint.context !== 'string') ||
        (hint.revision !== undefined && (!Number.isInteger(hint.revision) || hint.revision < 1)) ||
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
    attemptRewarded:
      v.attemptRewarded ?? (!!v.completed[v.current] && won(v.board, activeRules(v))),
    paidHints: v.paidHints ?? {},
    known: revealTop(v.board, v.known ?? initialKnowledge(v.board, activeRules(v))),
    historyKnown: v.historyKnown ?? v.history.map((b) => b.map((t) => t.map(() => true))),
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
const hintContext = (s: Save) =>
  `${s.remix?.legacy ? 'legacy' : s.remix?.campaign === 3 ? '3' : '4'}:${JSON.stringify(activeRules(s) ?? null)}`;
export const hintPurchased = (s: Save): boolean => {
  const h = s.paidHints[hintKey(s)];
  if (
    !h ||
    (h.context !== undefined
      ? h.context !== hintContext(s)
      : !s.remix?.legacy && s.remix?.campaign !== 3 && s.current > 10)
  )
    return false;
  return true;
};
export const currentHint = (s: Save): Move | undefined => {
  const h = s.paidHints[hintKey(s)];
  if (!hintPurchased(s) || h.revision !== 1 || !pour(s.board, h.from, h.to, activeRules(s))) return;
  return { from: h.from, to: h.to };
};
/** Charge only for a valid, newly revealed suggestion; duplicate taps are idempotent. */
export function purchaseHint(s: Save, suggestion: Move): Save {
  if (
    won(s.board, activeRules(s)) ||
    currentHint(s) ||
    (!hintPurchased(s) && s.seeds < 1) ||
    !pour(s.board, suggestion.from, suggestion.to, activeRules(s))
  )
    return s;
  return {
    ...s,
    seeds: s.seeds - (hintPurchased(s) ? 0 : 1),
    paidHints: {
      ...s.paidHints,
      [hintKey(s)]: { ...suggestion, context: hintContext(s), revision: 1 },
    },
  };
}
