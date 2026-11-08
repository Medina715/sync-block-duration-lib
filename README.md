# sync-block-duration-lib

Measures wall-clock time spent inside synchronous function bodies by wrapping them with `performance.now()` around the call.

```js
import { measureSync } from 'sync-block-duration-lib';

const { result, durationMs } = measureSync(() => {
  let sum = 0;
  for (let i = 0; i < 1e6; i++) sum += i;
  return sum;
});

console.log(result);      // 499999500000
console.log(durationMs);  // e.g. 3.21
```

The clock is injectable so tests can supply a deterministic fake:

```js
import { measureSync } from 'sync-block-duration-lib';

let t = 0;
const fakeNow = () => (t += 5);
const { durationMs } = measureSync(() => 'work', { now: fakeNow });
console.log(durationMs); // 5
```

## Why this exists

Profiling synchronous blocks usually means either reaching for a full profiler or sprinkling `performance.now()` calls by hand. Hand-rolled timing is easy to get wrong: forgetting the second read when the function throws, or mixing up start/end. `measureSync` wraps the call so both clock reads happen exactly once and the elapsed time is returned alongside the function's own result.

The trade-off is that this only measures synchronous execution. If the wrapped function returns a promise, `durationMs` reflects only the time to create that promise, not the time until it settles. That is deliberate: the library is named for synchronous blocks, and pretending otherwise would produce numbers that look meaningful but are not.

## Edge cases

- If the measured function throws, the exception propagates unchanged and no duration is returned. The two clock reads still happen, so the injected clock is not left half-consumed.
- `options.now` must be a function returning a number. Passing anything else throws a `TypeError` before the measured function runs.
- The default clock uses `performance.now()` from `node:perf_hooks`, which is monotonic and unaffected by system clock adjustments.
