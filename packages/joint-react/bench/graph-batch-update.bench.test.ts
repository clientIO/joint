/* eslint-disable no-console */
/**
 * End-to-end "drag / batch update" benchmark, driven through the real
 * `dia.Graph` API (`cell.set('position')` inside a batch), measuring the full
 * round-trip: graph mutation → graphProjection → cells container → the snapshot
 * a controlled `onCellsChange` consumer hands to React state.
 *
 * Scenarios: a graph of N cells, updating K element positions in a single
 * batch (K=1 is a drag frame; K=100/1000 is a multi-select move or a layout
 * pass). Two variants per (N,K):
 *   - engine:   onIncrementalCellsChange only counts (isolates graph+container)
 *   - snapshot: consumer materialises the full cells array each commit (the
 *               controlled-mode path GraphProvider drives via onCellsChange)
 *
 * Results are printed (ops/sec); this bench does not write a baseline JSON so
 * it can be run repeatedly for before/after comparison without clobbering.
 */
import { Bench } from 'tinybench';
import { dia } from '@joint/core';
import { DEFAULT_CELL_NAMESPACE, GraphStore } from '../src/store/graph-store';
import { ELEMENT_MODEL_TYPE } from '../src/mvc/element-model';
import type { CellRecord } from '../src/types/cell.types';

function buildElements(count: number): CellRecord[] {
  const cells: CellRecord[] = [];
  for (let index = 0; index < count; index++) {
    cells.push({
      id: `el-${index}`,
      type: ELEMENT_MODEL_TYPE,
      position: { x: index * 10, y: index * 10 },
      size: { width: 100, height: 50 },
    });
  }
  return cells;
}

/** Drain the microtask-based scheduler so the commit + callback have fired. */
async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

interface Scenario {
  readonly graph: dia.Graph;
  readonly store: GraphStore;
  readonly elements: dia.Element[];
  counter: number;
  lastLength: number;
}

function createScenario(count: number, withSnapshot: boolean): Scenario {
  const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
  const store = new GraphStore({ graph, initialCells: buildElements(count) });
  const elements: dia.Element[] = [];
  for (let index = 0; index < count; index++) {
    const cell = graph.getCell(`el-${index}`);
    if (!(cell instanceof dia.Element)) throw new TypeError(`bad setup el-${index}`);
    elements.push(cell);
  }
  const scenario: Scenario = { graph, store, elements, counter: 0, lastLength: 0 };
  store.setOnIncrementalCellsChange(() => {
    scenario.counter += 1;
    if (withSnapshot) {
      // What a controlled-mode consumer now stores in React state: the immutable
      // snapshot reference itself — no copy. Record its length so the read is not
      // dead-code-eliminated by the optimizer.
      scenario.lastLength = store.graphProjection.cells.getSnapshot().length;
    }
  });
  return scenario;
}

function logResults(bench: Bench): void {
  for (const task of bench.tasks) {
    const { result } = task;
    if (result && result.state === 'completed') {
      console.log(
        `  ${task.name}: ${Math.round(result.throughput.mean).toLocaleString()} ops/sec (avg ${(result.latency.mean * 1e3).toFixed(1)}µs)`
      );
    }
  }
}

describe('graph batch-update round-trip (drag 1 / update K via dia.Graph API)', () => {
  const sizes = [1000, 10_000] as const;
  const updateCounts = [1, 100, 1000] as const;

  for (const size of sizes) {
    for (const withSnapshot of [false, true] as const) {
      const variant = withSnapshot ? 'snapshot' : 'engine';
      it(`n=${size} — ${variant} — update K∈{1,100,1000} in one batch`, async () => {
        console.log(`\n--- n=${size} — ${variant} (graph→React round-trip) ---`);
        for (const updateCount of updateCounts) {
          if (updateCount > size) continue;
          const scenario = createScenario(size, withSnapshot);
          let tick = 0;
          const bench = new Bench({ time: 500 });
          bench.add(`${variant}/update-${updateCount}/n=${size}`, async () => {
            tick++;
            scenario.graph.startBatch('drag');
            for (let offset = 0; offset < updateCount; offset++) {
              scenario.elements[(tick + offset) % size].set('position', {
                x: tick + offset,
                y: tick,
              });
            }
            scenario.graph.stopBatch('drag');
            await flush();
          });
          await bench.run();
          logResults(bench);
          if (scenario.counter <= 0) throw new Error('bench invariant: no commits observed');
        }
      }, 120_000);
    }
  }
});
