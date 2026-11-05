/**
 * Self-check for the doomscroll pure helpers. No framework — run with:
 *   bun tests/doomscroll.check.ts
 * (bun runs TypeScript directly). Fails loud if any invariant breaks.
 */
import assert from 'node:assert/strict';
import { pxToKm, landmarkFor, formatDistance, formatMinutes, nextAction } from '../src/doomscroll';

// pxToKm: one kilometre's worth of CSS px round-trips back to ~1 km
const pxPerKm = (96 / 2.54) * 100_000;
assert.ok(Math.abs(pxToKm(pxPerKm) - 1) < 1e-6, 'pxToKm(1km worth) ~= 1');
assert.equal(pxToKm(0), 0, 'pxToKm(0) === 0');

// landmark + formatting sanity
assert.match(landmarkFor(0.33), /Eiffel/, '~0.33km -> Eiffel');
assert.match(landmarkFor(9), /Everest/, '9km -> Everest');
assert.match(landmarkFor(0.02), /bus/, '~20m -> London bus');
assert.match(landmarkFor(0.0005), /flick/, 'below a person -> a few flicks');
assert.equal(formatDistance(0.5), '500 m', 'sub-km shown in metres');
assert.equal(formatDistance(2.345), '2.35 km', 'km to 2dp');
assert.equal(formatMinutes(90_000), '1 min', '90s -> 1 min');
assert.equal(formatMinutes(3_600_000), '1 h 0 min', '60min -> 1h');

// nextAction: block wins over nudge; nudge suppressed once "done"; disabled block falls through
const soft = 3 * 60_000;
const hard = 10 * 60_000;
assert.equal(
  nextAction({ sessionMs: hard, nextSoftMs: soft, blockAtMs: hard, hardBlock: true, doneThisSession: false }),
  'block',
  'at hard limit -> block',
);
assert.equal(
  nextAction({ sessionMs: hard, nextSoftMs: soft, blockAtMs: hard, hardBlock: false, doneThisSession: false }),
  'soft',
  'block disabled -> soft still fires',
);
assert.equal(
  nextAction({ sessionMs: soft, nextSoftMs: soft, blockAtMs: hard, hardBlock: true, doneThisSession: false }),
  'soft',
  'at soft boundary -> soft',
);
assert.equal(
  nextAction({ sessionMs: soft, nextSoftMs: soft, blockAtMs: hard, hardBlock: true, doneThisSession: true }),
  null,
  '"I\'m done" suppresses the soft nudge',
);
assert.equal(
  nextAction({ sessionMs: 60_000, nextSoftMs: soft, blockAtMs: hard, hardBlock: true, doneThisSession: false }),
  null,
  'below both thresholds -> nothing',
);

// eslint-disable-next-line no-console
console.log('doomscroll self-check OK');
