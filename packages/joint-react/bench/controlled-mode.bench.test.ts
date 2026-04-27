/* eslint-disable no-console */
/**
 * Controlled-mode benchmark — measures the sync round-trip cost of `GraphStore`
 * wired as a fully controlled component: external state holds a unified `cells`
 * array, `onIncrementalCellsChange` fires on every graph mutation, and the
 * external holder pushes updated snapshots back via `graphView.updateGraph({
 * cells, flag: 'updateFromReact' })`.
 *
 * This file was migrated from the pre-refactor `initialElements`/`initialLinks`
 * API (captured in `baseline-post-refactor.json`) to the unified cells API. The
 * baseline entries under `controlled/position-change/n=*` and
 * `controlled/updateGraph/n=*` remain comparable because the benchmarks exercise
 * the same underlying mutation path.
 */
import { Bench } from 'tinybench';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { dia } from '@joint/core';
import { DEFAULT_CELL_NAMESPACE, GraphStore } from '../src/store/graph-store';
import type { Cells, CellRecord } from '../src/types/cell.types';
import { saveBenchResults } from './save-baseline';

const benchDirectory = path.dirname(fileURLToPath(import.meta.url));
const baselinePath = path.join(benchDirectory, 'baseline-post-refactor.json');

interface ChangeCounter {
  count: number;
}

interface ControlledScenario {
  readonly graph: dia.Graph;
  readonly store: GraphStore;
  readonly cells: Cells;
  readonly counter: ChangeCounter;
}

function buildInitialCells(count: number): Cells {
  const cells: CellRecord[] = [];
  for (let index = 0; index < count; index++) {
    cells.push({
      id: `el-${index}`,
      type: 'ElementModel',
      position: { x: index * 10, y: index * 10 },
      size: { width: 100, height: 50 },
    });
  }
  for (let index = 0; index < count - 1; index++) {
    cells.push({
      id: `link-${index}`,
      type: 'LinkModel',
      source: { id: `el-${index}` },
      target: { id: `el-${index + 1}` },
    });
  }
  return cells;
}

/**
 * Creates a GraphStore wired with `onIncrementalCellsChange`, mirroring the
 * controlled-mode pattern shown in the step-by-step/redux tutorial.
 * The callback counts invocations so the optimizer cannot dead-code it.
 */
function createControlledScenario(count: number): ControlledScenario {
  const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
  const cells = buildInitialCells(count);
  const counter: ChangeCounter = { count: 0 };

  const store = new GraphStore({
    graph,
    initialCells: cells,
    onIncrementalCellsChange: () => {
      counter.count += 1;
    },
  });

  return { graph, store, cells, counter };
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

describe('controlled-mode benchmark: round-trip via GraphStore + onIncrementalCellsChange', () => {
  const sizes = [10, 100, 1000, 10_000] as const;

  for (const size of sizes) {
    it(`controlled n=${size} — graph→React direction (cell.set('position') triggers onIncrementalCellsChange)`, async () => {
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
      expect(scenario.counter.count).toBeGreaterThan(0);
    }, 60_000);

    it(`controlled n=${size} — React→graph direction (graphView.updateGraph pushes new cells)`, async () => {
      const scenario = createControlledScenario(size);

      // Pre-build two pre-computed snapshots outside the hot loop so the
      // measurement captures only `updateGraph`'s cost, not the per-iteration
      // array-spread allocation of a fresh `cells` snapshot.
      const snapshotA: Cells = scenario.cells;
      const snapshotB: Cells = scenario.cells.map((cell, index) => {
        if (index !== 0) return cell;
        return {
          ...cell,
          position: { x: 999, y: 999 },
        } as CellRecord;
      });

      let useA = true;
      const bench = new Bench({ time: 1000 });

      bench.add(`controlled/updateGraph/n=${size}`, () => {
        scenario.store.graphView.updateGraph({
          cells: useA ? snapshotA : snapshotB,
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
