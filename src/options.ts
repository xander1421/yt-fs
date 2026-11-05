/**
 * Full options page. Reads/writes shared prefs; changes auto-save and propagate
 * live to any open YouTube tab via chrome.storage. Can also reset today's counter.
 */
import { getPrefs, savePrefs, getDay, saveDay, type Prefs, type BadgeMode } from './store';
import { pxToKm, formatDistance, formatMinutes } from './doomscroll';

function $(id: string): HTMLElement {
  return document.getElementById(id) as HTMLElement;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

let savedTimer: number | undefined;
function flashSaved(): void {
  const el = $('saved');
  el.classList.add('show');
  if (savedTimer) clearTimeout(savedTimer);
  savedTimer = window.setTimeout(() => el.classList.remove('show'), 1200);
}

async function patch(p: Partial<Prefs>): Promise<void> {
  await savePrefs(p);
  flashSaved();
}

function clampNum(el: HTMLInputElement, fallback: number): number {
  const n = parseInt(el.value, 10);
  const min = parseInt(el.min, 10) || 1;
  const max = parseInt(el.max, 10) || 9999;
  if (isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

async function renderToday(): Promise<void> {
  const day = await getDay();
  const km = pxToKm(day?.px || 0);
  $('todayStat').textContent = `📜 ${formatDistance(km)} scrolled · ${formatMinutes(day?.ms || 0)} on the feed`;
}

async function init(): Promise<void> {
  const prefs = await getPrefs();

  ($('enabled') as HTMLInputElement).checked = prefs.enabled;
  ($('badge') as HTMLSelectElement).value = prefs.badge;
  ($('softMin') as HTMLInputElement).value = String(prefs.softMin);
  ($('hardBlock') as HTMLInputElement).checked = prefs.hardBlock;
  ($('hardMin') as HTMLInputElement).value = String(prefs.hardMin);
  ($('home') as HTMLInputElement).checked = prefs.home;
  ($('subs') as HTMLInputElement).checked = prefs.subs;
  ($('shorts') as HTMLInputElement).checked = prefs.shorts;

  $('enabled').addEventListener('change', (e) => patch({ enabled: (e.target as HTMLInputElement).checked }));
  $('hardBlock').addEventListener('change', (e) => patch({ hardBlock: (e.target as HTMLInputElement).checked }));
  $('home').addEventListener('change', (e) => patch({ home: (e.target as HTMLInputElement).checked }));
  $('subs').addEventListener('change', (e) => patch({ subs: (e.target as HTMLInputElement).checked }));
  $('shorts').addEventListener('change', (e) => patch({ shorts: (e.target as HTMLInputElement).checked }));
  $('badge').addEventListener('change', (e) => patch({ badge: (e.target as HTMLSelectElement).value as BadgeMode }));
  $('softMin').addEventListener('change', (e) => {
    const v = clampNum(e.target as HTMLInputElement, prefs.softMin);
    (e.target as HTMLInputElement).value = String(v);
    void patch({ softMin: v });
  });
  $('hardMin').addEventListener('change', (e) => {
    const v = clampNum(e.target as HTMLInputElement, prefs.hardMin);
    (e.target as HTMLInputElement).value = String(v);
    void patch({ hardMin: v });
  });

  $('reset').addEventListener('click', async () => {
    await saveDay({ day: today(), px: 0, ms: 0 });
    await renderToday();
    flashSaved();
  });

  void renderToday();
}

void init();
