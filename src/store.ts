/**
 * Shared state in chrome.storage.local — readable/writable from the content
 * script, the popup, and the options page, with live change notifications.
 *
 * Uses the callback form of chrome.storage, which exists in both Chrome (MV3)
 * and Firefox (MV2, via the `chrome` compat namespace), so no promise/callback
 * branching is needed.
 */

export type BadgeMode = 'peek' | 'always' | 'off';

export interface Prefs {
  enabled: boolean; // doomscroll meter on/off
  softMin: number; // soft nudge after N active minutes (this session)
  hardMin: number; // hard block after N active minutes (this session)
  hardBlock: boolean; // is the hard block active at all
  badge: BadgeMode; // live counter display
  home: boolean; // track the home feed
  subs: boolean; // track /feed/* (subscriptions etc.)
  shorts: boolean; // track Shorts
}

export const DEFAULT_PREFS: Prefs = {
  enabled: true,
  softMin: 3,
  hardMin: 10,
  hardBlock: true,
  badge: 'peek',
  home: true,
  subs: true,
  shorts: true,
};

export interface DayCount {
  day: string; // YYYY-MM-DD
  px: number; // scroll distance in CSS px
  ms: number; // active time in ms
}

const PREFS_KEY = 'ytds-prefs';
const DAY_KEY = 'ytds-day';

function get<T>(key: string, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(key, (o) => {
        const v = o && o[key];
        resolve(v === undefined || v === null ? fallback : (v as T));
      });
    } catch {
      resolve(fallback);
    }
  });
}

function set(key: string, value: unknown): Promise<void> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.set({ [key]: value }, () => resolve());
    } catch {
      resolve();
    }
  });
}

export async function getPrefs(): Promise<Prefs> {
  return { ...DEFAULT_PREFS, ...(await get<Partial<Prefs>>(PREFS_KEY, {})) };
}

export async function savePrefs(patch: Partial<Prefs>): Promise<Prefs> {
  const next = { ...(await getPrefs()), ...patch };
  await set(PREFS_KEY, next);
  return next;
}

export function getDay(): Promise<DayCount | null> {
  return get<DayCount | null>(DAY_KEY, null);
}

export function saveDay(d: DayCount): Promise<void> {
  return set(DAY_KEY, d);
}

/** Subscribe to local-storage changes. Called with whichever of prefs/day changed. */
export function onChange(cb: (c: { prefs?: Prefs; day?: DayCount }) => void): void {
  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      const out: { prefs?: Prefs; day?: DayCount } = {};
      if (changes[PREFS_KEY]) {
        out.prefs = { ...DEFAULT_PREFS, ...((changes[PREFS_KEY].newValue as Partial<Prefs>) || {}) };
      }
      if (changes[DAY_KEY]) out.day = changes[DAY_KEY].newValue as DayCount;
      if (out.prefs || out.day) cb(out);
    });
  } catch {
    // ignore
  }
}
