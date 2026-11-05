/**
 * Doomscroll meter for YouTube feed surfaces (home, /feed/*, /shorts/*).
 *
 * Escalation ladder on *session* active time (resets after a 5-min break):
 *   - softMin  -> soft, dismissible nudge ("keep going?")
 *   - hardMin  -> hard block (escapable): "Add 5 min" or "Go to top"
 * Thresholds, the hard-block toggle, which surfaces to watch, and the badge
 * display all come from shared prefs (see store.ts) and update live when the
 * popup/options page changes them.
 *
 * Distance is a playful metric shown on the peek badge only (not a trigger) — an
 * approximation (see pxToKm), a gag not telemetry. All local: state lives in
 * chrome.storage.local, no network.
 */
import { getPrefs, savePrefs, getDay, saveDay, onChange, type Prefs, type DayCount } from './store';
import { shareDistanceCard } from './sharecard';

// ---- tunable knobs ----
export const PX_PER_INCH = 96; // CSS reference pixel: 1px = 1/96 inch (spec)
const ADD_MS = 5 * 60_000; // "Add 5 min" extends the stop by this much
const SESSION_GAP_MS = 5 * 60_000; // a break longer than this resets the session timer
const ACTIVE_WINDOW_MS = 60_000; // time only counts if you scrolled within this window
const PEEK_FADE_MS = 3000; // badge fades this long after the last scroll (peek mode)
const LINE_PX = 16; // wheel deltaMode=1 (lines) -> approx px per line (Firefox)
const SAVE_THROTTLE_MS = 2000;
const TICK_MS = 1000;

// ---- pure helpers (unit-checked in tests/doomscroll.check.ts) ----

/**
 * CSS pixels -> gag kilometres. Assumes 96px = 1 inch (the CSS reference pixel,
 * NOT your monitor's real DPI), so it's an approximation. Fine: its job is the
 * laugh, not accuracy.
 */
export function pxToKm(px: number): number {
  return ((px / PX_PER_INCH) * 2.54) / 100_000;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(2)} km`;
}

export function formatMinutes(ms: number): string {
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${min % 60} min`;
}

const LANDMARKS: Array<{ km: number; name: string; emoji: string }> = [
  { km: 0.0018, name: 'a person', emoji: '🧍' },
  { km: 0.012, name: 'a London bus', emoji: '🚌' },
  { km: 0.028, name: 'a basketball court', emoji: '🏀' },
  { km: 0.056, name: 'the Leaning Tower of Pisa', emoji: '🗼' },
  { km: 0.093, name: 'the Statue of Liberty', emoji: '🗽' },
  { km: 0.11, name: 'a football pitch', emoji: '⚽' },
  { km: 0.33, name: 'the Eiffel Tower', emoji: '🗼' },
  { km: 0.443, name: 'the Empire State Building', emoji: '🏢' },
  { km: 0.83, name: 'the Burj Khalifa', emoji: '🏙️' },
  { km: 3.776, name: 'Mount Fuji', emoji: '🗻' },
  { km: 8.849, name: 'Mount Everest', emoji: '🏔️' },
];

/**
 * Fun "N× <landmark>" comparison. Feed scrolling racks up tens of metres, so the
 * small landmarks are what you'll actually hit; the giants are for marathon days.
 */
export function landmarkFor(km: number): string {
  if (km <= 0) return 'nothing yet 😴';
  const smallest = LANDMARKS[0];
  if (km < smallest.km) return 'a few flicks 👆';
  let pick = smallest;
  for (const l of LANDMARKS) if (l.km <= km) pick = l;
  return `${(km / pick.km).toFixed(1)}× ${pick.name} ${pick.emoji}`;
}

/**
 * Which escalation (if any) is due for the current session, independent of the
 * DOM. Block wins over nudge; the nudge is suppressed once the user said "I'm
 * done". The open/closed state of the overlays is handled by the caller.
 */
export function nextAction(s: {
  sessionMs: number;
  nextSoftMs: number;
  blockAtMs: number;
  hardBlock: boolean;
  doneThisSession: boolean;
}): 'block' | 'soft' | null {
  if (s.hardBlock && s.sessionMs >= s.blockAtMs) return 'block';
  if (!s.doneThisSession && s.sessionMs >= s.nextSoftMs) return 'soft';
  return null;
}

// ---- controller (DOM + shared storage; the part that runs in the page) ----

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Which tracked surface we're on, or null. */
function feedKind(): 'home' | 'subs' | 'shorts' | null {
  const p = location.pathname;
  if (p === '/') return 'home';
  if (p.startsWith('/feed')) return 'subs';
  if (p.startsWith('/shorts')) return 'shorts';
  return null;
}

let inited = false;

export async function initDoomScroll(): Promise<void> {
  if (inited) return;
  inited = true;

  let prefs: Prefs = await getPrefs();

  let day: DayCount = { day: today(), px: 0, ms: 0 };
  const stored = await getDay();
  if (stored && stored.day === today() && typeof stored.px === 'number' && typeof stored.ms === 'number') {
    day = { day: stored.day, px: stored.px, ms: stored.ms };
  }

  // Session timer (in-memory; resets after a break). Drives nudge + block.
  let sessionMs = 0;
  let nextSoftMs = prefs.softMin * 60_000;
  let blockAtMs = prefs.hardMin * 60_000;
  let doneThisSession = false; // user said "I'm done" -> stop SOFT nudges this session
  let lastActiveTs = 0;
  let lastScrollTs = 0;
  let lastSaveTs = 0;
  let fadeTimer: number | undefined;

  let badge: HTMLElement | null = null;
  let nudgeEl: HTMLElement | null = null;
  let blockEl: HTMLElement | null = null;
  let nudgeOpen = false;
  let blockOpen = false;

  /** On a tracked surface? Honours per-surface prefs. */
  function activeSurface(): boolean {
    const k = feedKind();
    return k !== null && prefs[k];
  }

  function saveDayThrottled(force = false): void {
    const now = Date.now();
    if (!force && now - lastSaveTs < SAVE_THROTTLE_MS) return;
    lastSaveTs = now;
    void saveDay(day);
  }

  function rollDayIfNeeded(): void {
    if (day.day === today()) return;
    day = { day: today(), px: 0, ms: 0 };
    saveDayThrottled(true);
  }

  function resetSession(): void {
    sessionMs = 0;
    nextSoftMs = prefs.softMin * 60_000;
    blockAtMs = prefs.hardMin * 60_000;
    doneThisSession = false;
    lastActiveTs = Date.now();
  }

  function goToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function dayDistance(): number {
    return pxToKm(day.px);
  }

  function badgeText(): string {
    return `📜 ${formatDistance(dayDistance())} · ${formatMinutes(day.ms)}`;
  }

  function hideBadge(): void {
    if (badge) badge.classList.add('yt-ds-hide');
  }

  function showBadge(): void {
    if (prefs.badge === 'off' || !activeSurface()) return;
    if (!badge || !badge.isConnected) {
      badge = document.createElement('div');
      badge.className = 'yt-ds-badge yt-ds-hide';
      (document.body || document.documentElement).appendChild(badge);
    }
    badge.textContent = badgeText();
    badge.classList.remove('yt-ds-hide');
    if (fadeTimer) clearTimeout(fadeTimer);
    if (prefs.badge === 'peek') {
      fadeTimer = window.setTimeout(() => hideBadge(), PEEK_FADE_MS);
    }
  }

  // ---- soft nudge ----

  function closeNudge(): void {
    nudgeOpen = false;
    if (nudgeEl) nudgeEl.classList.add('yt-ds-hide');
  }

  function openNudge(): void {
    nudgeOpen = true;
    if (!nudgeEl) {
      nudgeEl = document.createElement('div');
      nudgeEl.className = 'yt-ds-nudge';
      nudgeEl.innerHTML =
        '<div class="yt-ds-card" role="dialog" aria-modal="true" aria-labelledby="yt-ds-head">' +
        '<div class="yt-ds-emoji">🕳️</div>' +
        '<div id="yt-ds-head" class="yt-ds-head"></div>' +
        '<div class="yt-ds-sub"></div>' +
        '<div class="yt-ds-btns">' +
        '<button type="button" class="yt-ds-keep">Keep scrolling</button>' +
        '<button type="button" class="yt-ds-done">I\'m done</button>' +
        '</div>' +
        '<button type="button" class="yt-ds-sharelink">📤 Share this</button>' +
        '</div>';
      (document.body || document.documentElement).appendChild(nudgeEl);
      nudgeEl.addEventListener('click', (e) => {
        const t = e.target as HTMLElement;
        if (t === nudgeEl || t.classList.contains('yt-ds-keep')) {
          closeNudge();
          nextSoftMs = sessionMs + prefs.softMin * 60_000; // snooze one more interval
        } else if (t.classList.contains('yt-ds-done')) {
          closeNudge();
          doneThisSession = true;
          goToTop();
        } else if (t.classList.contains('yt-ds-sharelink')) {
          const link = t as HTMLButtonElement;
          link.disabled = true;
          const km = dayDistance();
          shareDistanceCard(formatDistance(km), landmarkFor(km), formatMinutes(day.ms))
            .then((how) => {
              link.textContent = how === 'copied' ? '✅ Copied — paste anywhere' : '✅ Image saved';
            })
            .catch(() => {
              link.textContent = '⚠ Try again';
            })
            .finally(() => {
              setTimeout(() => {
                link.textContent = '📤 Share this';
                link.disabled = false;
              }, 2200);
            });
        }
      });
      document.addEventListener(
        'keydown',
        (e) => {
          if (nudgeOpen && e.key === 'Escape') {
            closeNudge();
            nextSoftMs = sessionMs + prefs.softMin * 60_000;
          }
        },
        true,
      );
    }
    const km = dayDistance();
    (nudgeEl.querySelector('.yt-ds-head') as HTMLElement).textContent =
      `You've scrolled ${formatDistance(km)} today — ${landmarkFor(km)}`;
    (nudgeEl.querySelector('.yt-ds-sub') as HTMLElement).textContent =
      `${formatMinutes(sessionMs)} on the feed. Sure you want to keep going?`;
    nudgeEl.classList.remove('yt-ds-hide');
  }

  // ---- hard block (escapable, toggleable) ----

  function closeBlock(): void {
    blockOpen = false;
    if (blockEl) blockEl.classList.add('yt-ds-hide');
    document.documentElement.style.overflow = ''; // restore scrolling
  }

  function openBlock(): void {
    blockOpen = true;
    document.documentElement.style.overflow = 'hidden'; // freeze the feed behind
    if (!blockEl) {
      blockEl = document.createElement('div');
      blockEl.className = 'yt-ds-block';
      blockEl.innerHTML =
        '<div class="yt-ds-card yt-ds-blockcard" role="alertdialog" aria-modal="true">' +
        '<div class="yt-ds-emoji">🛑</div>' +
        '<div class="yt-ds-head"></div>' +
        '<div class="yt-ds-sub"></div>' +
        '<div class="yt-ds-btns">' +
        '<button type="button" class="yt-ds-top">Go to top</button>' +
        '<button type="button" class="yt-ds-add">Add 5 min</button>' +
        '</div>' +
        '<label class="yt-ds-cfg"><input type="checkbox" class="yt-ds-hb"> Hard-block me at my limit</label>' +
        '</div>';
      (document.body || document.documentElement).appendChild(blockEl);
      blockEl.addEventListener('click', (e) => {
        const t = e.target as HTMLElement;
        if (t.classList.contains('yt-ds-top')) {
          closeBlock();
          resetSession();
          goToTop();
        } else if (t.classList.contains('yt-ds-add')) {
          closeBlock();
          blockAtMs += ADD_MS; // one more stretch before the next wall
        }
      });
      (blockEl.querySelector('.yt-ds-hb') as HTMLInputElement).addEventListener('change', (e) => {
        prefs.hardBlock = (e.target as HTMLInputElement).checked;
        void savePrefs({ hardBlock: prefs.hardBlock });
        if (!prefs.hardBlock) closeBlock(); // turned off -> let them through
      });
    }
    const km = dayDistance();
    (blockEl.querySelector('.yt-ds-head') as HTMLElement).textContent =
      `🛑 ${formatMinutes(sessionMs)} down the rabbit hole`;
    (blockEl.querySelector('.yt-ds-sub') as HTMLElement).textContent =
      `You've scrolled ${formatDistance(km)} today — ${landmarkFor(km)}. Time for a break?`;
    (blockEl.querySelector('.yt-ds-hb') as HTMLInputElement).checked = prefs.hardBlock;
    blockEl.classList.remove('yt-ds-hide');
  }

  function escalate(): void {
    if (blockOpen) return;
    const action = nextAction({ sessionMs, nextSoftMs, blockAtMs, hardBlock: prefs.hardBlock, doneThisSession });
    if (action === 'block') {
      closeNudge(); // block supersedes a soft nudge that may be open underneath
      openBlock();
    } else if (action === 'soft' && !nudgeOpen) {
      openNudge();
    }
  }

  // ---- react to pref changes from the popup / options page ----
  onChange(({ prefs: np, day: nd }) => {
    if (np) {
      prefs = np;
      const sm = prefs.softMin * 60_000;
      nextSoftMs = (Math.floor(sessionMs / sm) + 1) * sm;
      blockAtMs = prefs.hardMin * 60_000;
      if (!prefs.enabled) {
        closeNudge();
        closeBlock();
        hideBadge();
      }
      if (prefs.badge === 'off') hideBadge();
    }
    if (nd && nd.day === today()) day = nd; // reflect a counter reset from options
  });

  // ---- inputs ----

  // Scroll distance via wheel delta: fires on both the window (home/subs feed) and
  // inner snap containers (Shorts), so one listener covers all feed surfaces with no
  // double counting. Known gap: keyboard/scrollbar scrolling isn't captured.
  window.addEventListener(
    'wheel',
    (e) => {
      if (!prefs.enabled) return;
      rollDayIfNeeded();
      if (!activeSurface()) return;
      let d = Math.abs(e.deltaY);
      if (e.deltaMode === 1) d *= LINE_PX; // lines -> px (Firefox)
      else if (e.deltaMode === 2) d *= window.innerHeight; // pages -> px
      if (d <= 0) return;
      lastScrollTs = Date.now();
      day.px += d;
      showBadge();
      saveDayThrottled();
    },
    { passive: true },
  );

  // Active-time accrual + escalation. Session resets after a long enough break.
  window.setInterval(() => {
    if (!prefs.enabled) return;
    rollDayIfNeeded();
    const now = Date.now();
    if (sessionMs > 0 && now - lastActiveTs > SESSION_GAP_MS) resetSession();
    if (!activeSurface()) {
      if (blockOpen) closeBlock(); // left the feed -> release the block
      if (nudgeOpen) closeNudge();
      hideBadge(); // don't leave the counter stuck on /watch (esp. "always" mode)
      return;
    }
    if (prefs.badge === 'always') showBadge();
    if (document.hidden) return;
    if (now - lastScrollTs > ACTIVE_WINDOW_MS) return; // AFK -> don't count
    day.ms += TICK_MS;
    sessionMs += TICK_MS;
    lastActiveTs = now;
    if (badge && !badge.classList.contains('yt-ds-hide')) badge.textContent = badgeText();
    escalate();
    saveDayThrottled();
  }, TICK_MS);

  // Flush on tab hide / unload so the day's total survives.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) saveDayThrottled(true);
  });
  window.addEventListener('pagehide', () => saveDayThrottled(true));
}
