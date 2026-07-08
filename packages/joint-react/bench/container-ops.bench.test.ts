/* eslint-disable no-console */
/**
 * Container-ops micro-benchmark for the immutable cells container. Measures the
 * cost of `batchSet` (the single write path) for the realistic change-set
 * shapes a commit produces: one changed cell (a drag frame), K scattered
 * changed cells (a multi-select move / layout), a batch of adds, and a batch of
 * removes — over containers of increasing size.
 */
import { describe, test } from '@jest/globals';
import { Bench } from 'tinybench';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContainer, type Container, type ContainerChangeSet } from '../src/store/state-container';
import { saveBenchResults } from './save-baseline';

const BENCH_DIR = fileURLToPath(new URL('.', import.meta.url));
const OUTPUT = path.join(BENCH_DIR, 'baseline-post-refactor.json');

interface TestCell {
  readonly id: string;
  readonly value: number;
}

const EMPTY_CHANGED: ReadonlyMap<string, TestCell> = new Map();
const EMPTY_ADDED: ReadonlyMap<string, TestCell> = new Map();
const EMPTY_REMOVED: ReadonlySet<string> = new Set();

function populate(container: Container<TestCell>, size: number): void {
  const added = new Map<string, TestCell>();
  for (let index = 0; index < size; index++) added.set(`id-${index}`, { id: `id-${index}`, value: index });
  container.batchSet({ added, changed: EMPTY_CHANGED, removed: EMPTY_REMOVED });
}

/** Scattered indices across the container so no change set is contiguous. */
function scatter(count: number, size: number): number[] {
  const indices: number[] = [];
  for (let index = 0; index < count; index++) indices.push((index * 7919) % size);
  return indices;
}

function logResults(bench: Bench): void {
  console.log('\n--- container-ops (batchSet) ---');
  for (const task of bench.tasks) {
    const { result } = task;
    if (result && result.state === 'completed') {
      console.log(
        `  ${task.name}: ${Math.round(result.throughput.mean).toLocaleString()} ops/sec (avg ${(result.latency.mean * 1e3).toFixed(2)}µs)`
      );
    }
  }
}

const SIZES = [100, 1000, 10_000] as const;

describe('container-ops: batchSet on the immutable container', () => {
  for (const size of SIZES) {
    test(`n=${size} — batchSet 1 changed (drag frame)`, async () => {
      const container = createContainer<TestCell>();
      populate(container, size);
      let tick = 0;
      const bench = new Bench({ time: 500 });
      bench.add(`container/batchSet-1-changed/n=${size}`, () => {
        const index = tick++ % size;
        const changed = new Map([[`id-${index}`, { id: `id-${index}`, value: tick }]]);
        container.batchSet({ added: EMPTY_ADDED, changed, removed: EMPTY_REMOVED });
      });
      await bench.run();
      logResults(bench);
      saveBenchResults(bench, `container/batchSet-1-changed/n=${size}`, OUTPUT);
    }, 60_000);

    test(`n=${size} — batchSet 100 changed (scattered)`, async () => {
      const container = createContainer<TestCell>();
      populate(container, size);
      const indices = scatter(Math.min(100, size), size);
      let tick = 0;
      const bench = new Bench({ time: 500 });
      bench.add(`container/batchSet-100-changed/n=${size}`, () => {
        tick++;
        const changed = new Map<string, TestCell>();
        for (const index of indices) changed.set(`id-${index}`, { id: `id-${index}`, value: tick });
        container.batchSet({ added: EMPTY_ADDED, changed, removed: EMPTY_REMOVED });
      });
      await bench.run();
      logResults(bench);
      saveBenchResults(bench, `container/batchSet-100-changed/n=${size}`, OUTPUT);
    }, 60_000);

    test(`n=${size} — batchSet mixed (50 changed + 25 added + 25 removed)`, async () => {
      let tick = 0;
      const bench = new Bench({ time: 500 });
      bench.add(`container/batchSet-mixed/n=${size}`, () => {
        // Rebuild a fresh container each op so add/remove stay net-neutral.
        const container = createContainer<TestCell>();
        populate(container, size);
        tick++;
        const changed = new Map<string, TestCell>();
        for (const index of scatter(Math.min(50, size), size)) {
          changed.set(`id-${index}`, { id: `id-${index}`, value: tick });
        }
        const added = new Map<string, TestCell>();
        for (let index = 0; index < 25; index++) added.set(`new-${index}`, { id: `new-${index}`, value: index });
        const removed = new Set<string>();
        for (const index of scatter(25, size)) removed.add(`id-${index}`);
        const changeSet: ContainerChangeSet<TestCell> = { added, changed, removed };
        container.batchSet(changeSet);
      });
      await bench.run();
      logResults(bench);
      saveBenchResults(bench, `container/batchSet-mixed/n=${size}`, OUTPUT);
    }, 60_000);
  }
});
