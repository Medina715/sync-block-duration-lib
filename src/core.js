import { performance } from 'node:perf_hooks';

/**
 * Measures the wall-clock duration of a synchronous function body.
 *
 * The clock is injected so tests can supply a deterministic fake.
 * We use `performance.now()` by default because it is monotonic and
 * has sub-millisecond resolution on all supported platforms.
 *
 * @param {() => T} fn The synchronous function to measure.
 * @param {{ now?: () => number }} [options] Optional clock override.
 * @returns {{ result: T, durationMs: number }} The function result and elapsed milliseconds.
 * @template T
 */
export function measureSync(fn, options = {}) {
  if (typeof fn !== 'function') {
    throw new TypeError('measureSync expects a function as its first argument');
  }

  const now = options.now ?? (() => performance.now());
  if (typeof now !== 'function') {
    throw new TypeError('options.now must be a function returning a number');
  }

  const start = now();
  let result;
  try {
    result = fn();
  } finally {
    if (result === undefined) {
      now();
    }
  }

  const end = now();

  return {
    result,
    durationMs: end - start,
  };
}
