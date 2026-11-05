/**
 * Doomscroll share card: renders today's distance + landmark to a PNG and puts it
 * on the clipboard (falls back to a download). This is the viral unit — the "2.3 km"
 * gag is the thing people screenshot, so we hand them a clean image to paste.
 *
 * All local: the card is drawn on a canvas in the browser and never uploaded.
 * Works in both the content script (page world) and the popup (extension page).
 *
 * Pure renderer: callers hand it already-formatted strings (distance, landmark,
 * minutes) so this module stays a leaf — no import back into the meter.
 */

const W = 1200;
const H = 630; // 1.91:1 — the link-preview ratio X/Discord/Slack expand nicely

function drawCard(distance: string, landmark: string, minutes: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('no 2d context');
  const cx = W / 2;

  ctx.fillStyle = '#0f0f0f';
  ctx.fillRect(0, 0, W, H);
  // red glow behind the number (YouTube-ish accent)
  const glow = ctx.createRadialGradient(cx, 300, 40, cx, 300, 520);
  glow.addColorStop(0, 'rgba(255, 0, 51, 0.18)');
  glow.addColorStop(1, 'rgba(255, 0, 51, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const SANS = 'Roboto, "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = '#aaaaaa';
  ctx.font = `600 34px ${SANS}`;
  ctx.fillText('I doomscrolled on YouTube today 🫠', cx, 150);

  ctx.fillStyle = '#ff0033';
  ctx.font = `800 176px ${SANS}`;
  ctx.fillText(distance, cx, 350);

  ctx.fillStyle = '#ffffff';
  ctx.font = `600 40px ${SANS}`;
  ctx.fillText(landmark, cx, 432);

  ctx.fillStyle = '#888888';
  ctx.font = `400 30px ${SANS}`;
  ctx.fillText(`${minutes} on the feed`, cx, 492);

  ctx.fillStyle = '#666666';
  ctx.font = `600 26px ${SANS}`;
  // ponytail: brand text, not a URL — people search the name. Swap in the CWS
  // short link here once there is one.
  ctx.fillText('📜 YouTube Tab-Fullscreen · doomscroll meter', cx, 574);

  return c;
}

/**
 * Build the card and get it to the user. Prefers the clipboard (one paste into any
 * app); if that's unsupported or blocked, downloads a PNG instead.
 * Returns how it went so the caller can show the right toast.
 */
export async function shareDistanceCard(
  distance: string,
  landmark: string,
  minutes: string,
): Promise<'copied' | 'downloaded'> {
  const canvas = drawCard(distance, landmark, minutes);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
  if (!blob) throw new Error('render failed');

  // ponytail: clipboard image write needs a secure context + user gesture +
  // permission; when any of those is missing (older Firefox, denied) we fall
  // through to a download. Both paths are browser-verified only — no node test.
  try {
    if (navigator.clipboard && 'write' in navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      return 'copied';
    }
  } catch {
    /* fall through to download */
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'youtube-doomscroll.png';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}
