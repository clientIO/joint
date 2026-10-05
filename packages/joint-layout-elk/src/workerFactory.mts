/**
 * Starts the Web Worker `layout()` runs ELK in by default (see `defaultElk.mts`).
 *
 * Written as `new Worker(new URL(..., import.meta.url))` with literal arguments - the
 * pattern bundlers (webpack 5, Vite, Parcel) look for to emit `elk.worker.mts` as a
 * worker file of its own. In its own module so the UMD build, which has no way to
 * locate a worker file, can replace it with one returning `undefined` (see
 * `rollup.config.mjs`).
 */
export function createElkWorker(): Worker | undefined {
    return new Worker(new URL('./elk.worker.mjs', import.meta.url), { type: 'module' });
}
