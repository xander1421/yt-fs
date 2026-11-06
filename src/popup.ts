/**
 * Toolbar popup: today's doomscroll stats, quick toggles, a tab-fullscreen
 * convenience button, and a link to the full options page.
 */
import { getPrefs, savePrefs, getDay } from './store';
import { pxToKm, formatDistance, formatMinutes, landmarkFor } from './doomscroll';
import { shareDistanceCard } from './sharecard';

const api = typeof browser !== 'undefined' && browser ? browser : chrome;

function $(id: string): HTMLElement {
  return document.getElementById(id) as HTMLElement;
}

async function render(): Promise<void> {
  const [prefs, day] = await Promise.all([getPrefs(), getDay()]);
  $('dist').textContent = formatDistance(pxToKm(day?.px || 0));
  $('time').textContent = formatMinutes(day?.ms || 0);
  ($('enabled') as HTMLInputElement).checked = prefs.enabled;
  ($('hardBlock') as HTMLInputElement).checked = prefs.hardBlock;
}

$('enabled').addEventListener('change', (e) => {
  void savePrefs({ enabled: (e.target as HTMLInputElement).checked });
});

$('hardBlock').addEventListener('change', (e) => {
  void savePrefs({ hardBlock: (e.target as HTMLInputElement).checked });
});

// Share today's distance as an image (clipboard, or a download fallback).
$('share').addEventListener('click', async () => {
  const btn = $('share') as HTMLButtonElement;
  btn.disabled = true;
  try {
    const day = await getDay();
    const km = pxToKm(day?.px || 0);
    const how = await shareDistanceCard(formatDistance(km), landmarkFor(km), formatMinutes(day?.ms || 0));
    btn.textContent = how === 'copied' ? '✅ Copied — paste anywhere' : '✅ Image saved';
  } catch {
    btn.textContent = '⚠ Could not share';
  }
  setTimeout(() => {
    btn.textContent = '📤 Share my stats';
    btn.disabled = false;
  }, 2200);
});

$('opts').addEventListener('click', () => {
  if (api.runtime.openOptionsPage) api.runtime.openOptionsPage();
  else window.close();
});

// Convenience: toggle tab-fullscreen on the active YouTube tab (the in-player
// button and Alt+T still do this too).
$('fs').addEventListener('click', () => {
  api.tabs.query({ active: true, currentWindow: true }, (tabs: Array<{ id?: number; url?: string }>) => {
    const t = tabs && tabs[0];
    if (t?.id && t.url && t.url.includes('youtube.com')) {
      // Callback reads lastError so a missing receiver doesn't log an uncaught error.
      api.tabs.sendMessage(t.id, { action: 'toggle-tabfs' }, () => void api.runtime.lastError);
    }
    window.close();
  });
});

void render();
