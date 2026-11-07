import { test } from 'node:test';
import assert from 'node:assert/strict';
import { measureSync } from '../src/index.js';

function fakeClock(...times) {
  let i = 0;
  return () => {
    if (i >= times.length) {
      throw new Error('fake clock exhausted');
    }
    return times[i++];
  };
}

test('returns the function result', () => {
  const { result } = measureSync(() => 42, { now: fakeClock(0, 1) });
  assert.equal(result, 42);
});

test('returns the elapsed duration in milliseconds', () => {
  const { durationMs } = measureSync(() => 'x', { now: fakeClock(100, 250) });
  assert.equal(durationMs, 150);
});

test('handles a zero duration', () => {
  const { durationMs } = measureSync(() => null, { now: fakeClock(5, 5) });
  assert.equal(durationMs, 0);
});

test('propagates exceptions from the measured function', () => {
  const boom = new Error('boom');
  assert.throws(
    () => measureSync(() => { throw boom; }, { now: fakeClock(0, 1) }),
    (err) => err === boom,
  );
});

test('still consumes both clock reads when the function throws', () => {
  const clock = fakeClock(0, 1);
  assert.throws(() => measureSync(() => { throw new Error('x'); }, { now: clock }));
  assert.throws(() => clock(), /fake clock exhausted/);
});

test('rejects a non-function first argument', () => {
  assert.throws(() => measureSync(123), TypeError);
});

test('rejects a non-function now option', () => {
  assert.throws(() => measureSync(() => 1, { now: 7 }), TypeError);
});

test('uses performance.now by default', () => {
  const { durationMs } = measureSync(() => 1);
  assert.equal(typeof durationMs, 'number');
  assert.ok(Number.isFinite(durationMs));
  assert.ok(durationMs >= 0);
});

test('passes through an array result without copying', () => {
  const arr = [1, 2, 3];
  const { result } = measureSync(() => arr, { now: fakeClock(0, 1) });
  assert.equal(result, arr);
});

test('measures only the synchronous body, not nested async work', () => {
  let resolved = false;
  Promise.resolve().then(() => { resolved = true; });
  const { durationMs } = measureSync(() => 'sync', { now: fakeClock(0, 10) });
  assert.equal(durationMs, 10);
  assert.equal(resolved, false);
});
