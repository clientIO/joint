/* eslint-disable no-console */
import { describe, test } from '@jest/globals';
import { Bench } from 'tinybench';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Container } from '../src/store/container';
import { saveBenchResults } from './save-baseline';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const OUTPUT = join(__dirname, 'baseline-pre-refactor.json');

interface TestCell {
  readonly id: string;
  readonly value: number;
}

function populate(container: Container<TestCell>, n: number): void {
  for (let i = 0; i < n; i++) {
    container.set(`id-${i}`, { id: `id-${i}`, value: i });
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
      const container = new Container<TestCell>();
      populate(container, n);
      let i = 0;

      bench.add(`container/set-existing/n=${n}`, () => {
        container.set(`id-${i % n}`, { id: `id-${i % n}`, value: i });
        i++;
      });
      await bench.warmup();
      await bench.run();
      logResults(bench);
      saveBenchResults(bench, `container/set-existing/n=${n}`, OUTPUT);
    }, 60_000);

    test(`n=${n} — set insert (new id)`, async () => {
      const bench = new Bench({ iterations: 20 });
      const container = new Container<TestCell>();
      populate(container, n);
      let i = n;

      bench.add(`container/set-insert/n=${n}`, () => {
        const id = `new-${i}`;
        container.set(id, { id, value: i });
        i++;
      });
      await bench.warmup();
      await bench.run();
      logResults(bench);
      saveBenchResults(bench, `container/set-insert/n=${n}`, OUTPUT);
    }, 60_000);

    test(`n=${n} — delete (swap-pop) + re-insert`, async () => {
      const bench = new Bench({ iterations: 20 });
      const container = new Container<TestCell>();
      populate(container, n);
      let i = 0;

      bench.add(`container/delete/n=${n}`, () => {
        const id = `id-${i % n}`;
        container.delete(id);
        container.set(id, { id, value: i });
        i++;
      });
      await bench.warmup();
      await bench.run();
      logResults(bench);
      saveBenchResults(bench, `container/delete/n=${n}`, OUTPUT);
    }, 60_000);
  }
});
