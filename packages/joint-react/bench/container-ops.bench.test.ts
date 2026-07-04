/* eslint-disable no-console */
import { describe, test } from '@jest/globals';
import { Bench } from 'tinybench';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContainer, type Container } from '../src/store/state-container';
import { saveBenchResults } from './save-baseline';

const BENCH_DIR = fileURLToPath(new URL('.', import.meta.url));
const OUTPUT = path.join(BENCH_DIR, 'baseline-post-refactor.json');

interface TestCell {
  readonly id: string;
  readonly value: number;
}

function populate(container: Container<TestCell>, n: number): void {
  for (let index = 0; index < n; index++) {
    container.set(`id-${index}`, { id: `id-${index}`, value: index });
  }
  container.commitChanges();
}

function logResults(bench: Bench): void {
  console.log('\n--- container-ops results ---');
  for (const task of bench.tasks) {
    const result = task.result;
    if (result && result.state === 'completed') {
      console.log(`  ${task.name}: ${Math.round(result.hz).toLocaleString()} ops/sec`);
    }
  }
}

const SIZES = [10, 100, 1000, 10_000] as const;

describe('container-ops: O(1) flat-micro benchmark', () => {
  for (const n of SIZES) {
    test(`n=${n} — set existing`, async () => {
      const bench = new Bench({ iterations: 20 });
      const container = createContainer<TestCell>();
      populate(container, n);
      let index = 0;

      bench.add(`container/set-existing/n=${n}`, () => {
        container.set(`id-${index % n}`, { id: `id-${index % n}`, value: index });
        index++;
      });
      await bench.run();
      logResults(bench);
      saveBenchResults(bench, `container/set-existing/n=${n}`, OUTPUT);
    }, 60_000);

    test(`n=${n} — set insert (new id)`, async () => {
      const bench = new Bench({ iterations: 20 });
      const container = createContainer<TestCell>();
      populate(container, n);
      let index = n;

      bench.add(`container/set-insert/n=${n}`, () => {
        const id = `new-${index}`;
        container.set(id, { id, value: index });
        index++;
      });
      await bench.run();
      logResults(bench);
      saveBenchResults(bench, `container/set-insert/n=${n}`, OUTPUT);
    }, 60_000);

    test(`n=${n} — delete (swap-pop) + re-insert`, async () => {
      const bench = new Bench({ iterations: 20 });
      const container = createContainer<TestCell>();
      populate(container, n);
      let index = 0;

      bench.add(`container/delete/n=${n}`, () => {
        const id = `id-${index % n}`;
        container.delete(id);
        container.set(id, { id, value: index });
        index++;
      });
      await bench.run();
      logResults(bench);
      saveBenchResults(bench, `container/delete/n=${n}`, OUTPUT);
    }, 60_000);
  }
});
