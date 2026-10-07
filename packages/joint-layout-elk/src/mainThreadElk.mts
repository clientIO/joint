import type { ELK } from 'elkjs';

/**
 * Loads ELK to run on the main thread (`elkjs/lib/elk.bundled.js`, see `defaultElk.mts`).
 *
 * Imported dynamically, so bundlers split it into a chunk of its own, loaded only if a
 * layout ever runs on the main thread - not by an app that always passes an `elk` of its
 * own (e.g. one running in a Web Worker, see `createWorkerElk()`). In its own module so
 * the UMD build, which can't load a chunk, can replace it with one importing it
 * statically (see `rollup.config.mjs`).
 */
export async function loadMainThreadElk(): Promise<new () => ELK> {
    const { default: ElkConstructor } = await import('elkjs/lib/elk.bundled.js');
    return ElkConstructor;
}
