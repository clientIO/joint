/* eslint-disable no-console */
/**
 * Controlled-mode benchmark (Phase 0 baseline — Task 0.1).
 *
 * Measures the sync round-trip cost of the current `GraphStore` when it is
 * wired as a fully controlled component: external state holds
 * `elements`/`links` records, `onIncrementalChange`/`onElementsChange`/
 * `onLinksChange` fires on every graph mutation, and the external holder
 * pushes updated records back via `graphView.updateGraph({ flag: 'updateFromReact' })`.
 *
 * Today's GraphProvider API uses `elements`/`links` (props) and
 * `initialElements`/`initialLinks` (uncontrolled bootstrap) — NOT
 * `initialCells`/`cells`. That rename lands in later phases of the
 * unified-cells refactor; this file stays on the current API so the
 * resulting numbers are a true pre-refactor baseline.
 */
import { Bench } from 'tinybench';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { dia } from '@joint/core';
import { DEFAULT_CELL_NAMESPACE, GraphStore } from '../src/store/graph-store';
import type { ElementRecord, LinkRecord } from '../src/types/data-types';
import { saveBenchResults } from './save-baseline';

const benchDirectory = path.dirname(fileURLToPath(import.meta.url));
const baselinePath = path.join(benchDirectory, 'baseline-pre-refactor.json');

interface ChangeCounter {
  count: number;
}

interface ControlledScenario {
  readonly graph: dia.Graph;
  readonly store: GraphStore;
  readonly elements: Readonly<Record<string, ElementRecord>>;
  readonly links: Readonly<Record<string, LinkRecord>>;
  readonly counter: ChangeCounter;
}

function buildInitialRecords(count: number): {
  elements: Record<string, ElementRecord>;
  links: Record<string, LinkRecord>;
} {
  const elements: Record<string, ElementRecord> = {};
  for (let index = 0; index < count; index++) {
    elements[`el-${index}`] = {
      position: { x: index * 10, y: index * 10 },
      size: { width: 100, height: 50 },
    };
  }
  const links: Record<string, LinkRecord> = {};
  for (let index = 0; index < count - 1; index++) {
    links[`link-${index}`] = {
      source: { id: `el-${index}` },
      target: { id: `el-${index + 1}` },
    };
  }
  return { elements, links };
}

/**
 * Creates a GraphStore wired with `onIncrementalChange`, mirroring the
 * controlled-mode pattern shown in `code-controlled-mode-redux.tsx`.
 * The callback counts invocations so the optimizer cannot dead-code it.
 */
function createControlledScenario(count: number): ControlledScenario {
  const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
  const { elements, links } = buildInitialRecords(count);
  const counter: ChangeCounter = { count: 0 };

  const store = new GraphStore({
    graph,
    initialElements: elements,
    initialLinks: links,
    onIncrementalChange: () => {
      counter.count += 1;
    },
  });

  return { graph, store, elements, links, counter };
}

function logResults(bench: Bench): void {
  for (const task of bench.tasks) {
    const { result } = task;
    if (result && result.state === 'completed') {
      console.log(
        `  ${task.name}: ${Math.round(result.throughput.mean).toLocaleString()} ops/sec (avg ${(result.latency.mean * 1e6).toFixed(0)}ns)`
      );
    }
  }
}

describe('controlled-mode benchmark: baseline round-trip via GraphStore + onIncrementalChange', () => {
  const sizes = [10, 100, 1000, 10_000] as const;

  for (const size of sizes) {
    it(`controlled n=${size} — graph→React direction (cell.set('position') triggers onIncrementalChange)`, async () => {
      const scenario = createControlledScenario(size);
      const cells: dia.Element[] = [];
      for (let index = 0; index < size; index++) {
        const id = `el-${index}`;
        const cell = scenario.graph.getCell(id);
        if (!cell) throw new Error(`bench setup invariant: cell '${id}' missing`);
        if (!(cell instanceof dia.Element)) {
          throw new TypeError(`bench setup invariant: cell '${id}' is not a dia.Element`);
        }
        cells.push(cell);
      }

      let tick = 0;
      const bench = new Bench({ time: 1000 });

      bench.add(`controlled/position-change/n=${size}`, () => {
        const index = tick % size;
        tick++;
        cells[index].set('position', { x: tick, y: tick });
      });

      await bench.run();
      console.log(
        `\n--- controlled n=${size} — position change (graph→React incremental callback) ---`
      );
      logResults(bench);
      saveBenchResults(bench, `controlled/position-change/n=${size}`, baselinePath);
      expect(bench.tasks.length).toBe(1);
      // Sanity: the callback must have fired at least once, otherwise we are
      // not measuring the controlled round-trip, just a bare graph mutation.
      expect(scenario.counter.count).toBeGreaterThan(0);
    }, 60_000);

    it(`controlled n=${size} — React→graph direction (graphView.updateGraph pushes new records)`, async () => {
      const scenario = createControlledScenario(size);

      // Pre-build two pre-computed snapshots outside the hot loop so the
      // measurement captures only `updateGraph`'s cost, not the per-iteration
      // object-spread allocation of a fresh `elements` record.
      const firstId = 'el-0';
      const snapshotA: Record<string, ElementRecord> = { ...scenario.elements };
      const snapshotB: Record<string, ElementRecord> = {
        ...scenario.elements,
        [firstId]: {
          position: { x: 999, y: 999 },
          size: { width: 100, height: 50 },
        },
      };

      let useA = true;
      const bench = new Bench({ time: 1000 });

      bench.add(`controlled/updateGraph/n=${size}`, () => {
        scenario.store.graphView.updateGraph({
          elements: useA ? snapshotA : snapshotB,
          links: scenario.links,
          flag: 'updateFromReact',
        });
        useA = !useA;
      });

      await bench.run();
      console.log(`\n--- controlled n=${size} — updateGraph round-trip (React→graph) ---`);
      logResults(bench);
      saveBenchResults(bench, `controlled/updateGraph/n=${size}`, baselinePath);
      expect(bench.tasks.length).toBe(1);
    }, 60_000);
  }
});
