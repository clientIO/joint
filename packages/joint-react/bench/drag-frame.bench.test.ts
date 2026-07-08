/* eslint-disable no-console */
/**
 * Proves the goal by numbers: a drag frame's reactive cost is O(1) — FLAT across
 * container size N — for both uncontrolled and controlled mode. Uses the REAL
 * container. A per-frame commit changes ONE cell's data (no add/remove), then
 * the two per-frame consumers read: the id-list (`getIds`, memoised → O(1) on a
 * data change) and a per-id reader (`get(id)`). If ops/sec stays roughly the
 * same from N=100 to N=100000, the path is O(1).
 *
 * Contrast: `getSnapshot()` (a whole-list consumer) DOES materialise O(n) — that
 * cost is opt-in and shown separately.
 */
import { describe, test } from '@jest/globals';
import { Bench } from 'tinybench';
import { createContainer, type Container } from '../src/store/state-container';

interface Cell {
  readonly id: string;
  readonly position: { readonly x: number; readonly y: number };
}

function populate(container: Container<Cell>, size: number): void {
  const added = new Map<string, Cell>();
  for (let index = 0; index < size; index++) {
    added.set(`c${index}`, { id: `c${index}`, position: { x: index, y: index } });
  }
  container.batchSet({ added, changed: new Map(), removed: new Set() });
}

function logTask(bench: Bench): void {
  const { result } = bench.tasks[0];
  if (result && result.state === 'completed') {
    console.log(
      `  ${bench.tasks[0].name}: ${Math.round(result.throughput.mean).toLocaleString()} ops/sec (${(result.latency.mean * 1e3).toFixed(3)}µs/frame)`
    );
  }
}

describe('drag-frame: reactive cost is O(1) (flat across N)', () => {
  const SIZES = [100, 1000, 10_000, 100_000] as const;

  for (const size of SIZES) {
    test(`n=${size} — drag frame: batchSet(1 changed) + getIds + get`, async () => {
      const container = createContainer<Cell>();
      populate(container, size);
      // Subscribe one per-id listener (like a rendered element) + the id-list.
      const unsub = container.subscribeById('c0', () => {});
      let tick = 0;
      const bench = new Bench({ time: 500 });
      bench.add(`drag-frame/O(1)-path/n=${size}`, () => {
        const id = `c${tick % size}`;
        tick++;
        container.batchSet({
          added: new Map(),
          changed: new Map([[id, { id, position: { x: tick, y: tick } }]]),
          removed: new Set(),
        });
        container.getIds(); // id-list consumer — memoised, O(1) on data change
        container.get(id); // per-id consumer — O(1)
      });
      await bench.run();
      logTask(bench);
      unsub();
    }, 60_000);

    test(`n=${size} — whole-list read: getSnapshot (materialises, O(n))`, async () => {
      const container = createContainer<Cell>();
      populate(container, size);
      let tick = 0;
      const bench = new Bench({ time: 500 });
      bench.add(`drag-frame/getSnapshot-O(n)/n=${size}`, () => {
        const id = `c${tick % size}`;
        tick++;
        container.batchSet({
          added: new Map(),
          changed: new Map([[id, { id, position: { x: tick, y: tick } }]]),
          removed: new Set(),
        });
        container.getSnapshot(); // whole-list consumer — rebuilds O(n)
      });
      await bench.run();
      logTask(bench);
    }, 60_000);
  }
});
