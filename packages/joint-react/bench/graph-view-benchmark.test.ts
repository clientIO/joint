/* eslint-disable no-console */
import { Bench } from 'tinybench';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { dia } from '@joint/core';
import { DEFAULT_CELL_NAMESPACE, GraphStore } from '../src/store/graph-store';
import { graphView } from '../src/store/graph-view';
import type { Cells, CellRecord } from '../src/types/cell.types';
import { saveBenchResults } from './save-baseline';

const benchDirectory = path.dirname(fileURLToPath(import.meta.url));
const baselinePath = path.join(benchDirectory, 'baseline-post-refactor.json');

function createGraph(): dia.Graph {
  return new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
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

function populateGraph(graph: dia.Graph, count: number): void {
  const jsons: dia.Graph.CellInit[] = [];
  for (let index = 0; index < count; index++) {
    jsons.push({
      id: `el-${index}`,
      type: 'ElementModel',
      position: { x: index * 10, y: index * 10 },
      size: { width: 100, height: 50 },
    });
  }
  for (let index = 0; index < count - 1; index++) {
    jsons.push({
      id: `link-${index}`,
      type: 'LinkModel',
      source: { id: `el-${index}` },
      target: { id: `el-${index + 1}` },
    });
  }
  graph.syncCells(jsons, { remove: true });
}

/** Baseline: pure dia.Graph with no React layer. */
function createBaseline(count: number) {
  const graph = createGraph();
  populateGraph(graph, count);
  return { graph };
}

/** graphView layer with per-id container subscriptions simulating React components. */
function createWithGraphView(count: number) {
  const graph = createGraph();
  populateGraph(graph, count);
  const view = graphView({ graph });

  for (let index = 0; index < count; index++) {
    view.cells.subscribe(`el-${index}`, () => {});
  }
  for (let index = 0; index < count - 1; index++) {
    view.cells.subscribe(`link-${index}`, () => {});
  }

  return { graph, view };
}

/** Full GraphStore with per-id subscriptions mirroring React component usage. */
function createWithGraphStore(count: number) {
  const store = new GraphStore({
    initialCells: buildInitialCells(count),
  });

  for (let index = 0; index < count; index++) {
    store.graphView.cells.subscribe(`el-${index}`, () => {});
  }
  for (let index = 0; index < count - 1; index++) {
    store.graphView.cells.subscribe(`link-${index}`, () => {});
  }

  return { graph: store.graph, store };
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

describe('graph-view benchmark: baseline vs graphView vs GraphStore', () => {
  const sizes = [10, 100, 1000] as const;

  for (const size of sizes) {
    it(`${size} elements — position change`, async () => {
      const baseline = createBaseline(size);
      const withView = createWithGraphView(size);
      const withStore = createWithGraphStore(size);

      let tickBaseline = 0;
      let tickView = 0;
      let tickStore = 0;
      const bench = new Bench({ time: 1000 });

      bench
        .add(`baseline (${size})`, () => {
          const index = tickBaseline % size;
          tickBaseline++;
          (baseline.graph.getCell(`el-${index}`) as dia.Element).position(
            tickBaseline,
            tickBaseline
          );
        })
        .add(`graphView (${size})`, () => {
          const index = tickView % size;
          tickView++;
          (withView.graph.getCell(`el-${index}`) as dia.Element).position(tickView, tickView);
        })
        .add(`GraphStore (${size})`, () => {
          const index = tickStore % size;
          tickStore++;
          (withStore.graph.getCell(`el-${index}`) as dia.Element).position(tickStore, tickStore);
        });

      await bench.run();
      console.log(`\n--- ${size} elements — position change ---`);
      logResults(bench);
      saveBenchResults(bench, `graph-view/position-change/n=${size}`, baselinePath);
      expect(bench.tasks.length).toBe(3);
    }, 60_000);
  }
});
