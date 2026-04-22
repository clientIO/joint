/* eslint-disable no-console */
import { Bench } from 'tinybench';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { dia } from '@joint/core';
import { DEFAULT_CELL_NAMESPACE, GraphStore } from '../src/store/graph-store';
import { graphView } from '../src/store/graph-view';
import { saveBenchResults } from './save-baseline';

const benchDirectory = path.dirname(fileURLToPath(import.meta.url));
const baselinePath = path.join(benchDirectory, 'baseline-pre-refactor.json');

function createGraph(): dia.Graph {
  return new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
}

function populateGraph(graph: dia.Graph, count: number): void {
  const cells: dia.Graph.CellInit[] = [];
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
  graph.syncCells(cells, { remove: true });
}

/** Baseline: pure dia.Graph with no React layer. */
function createBaseline(count: number) {
  const graph = createGraph();
  populateGraph(graph, count);
  return { graph };
}

/** graphView layer with per-ID container subscriptions simulating React components. */
function createWithGraphView(count: number) {
  const graph = createGraph();
  populateGraph(graph, count);
  const view = graphView({
    graph,
  });

  for (let index = 0; index < count; index++) {
    view.elements.subscribe(`el-${index}`, () => {});
  }
  for (let index = 0; index < count - 1; index++) {
    view.links.subscribe(`link-${index}`, () => {});
  }

  return { graph, view };
}

/** Full GraphStore with onElementsChange callback wired and per-ID subscriptions. */
function createWithGraphStore(count: number) {
  const elements: Record<string, object> = {};
  for (let index = 0; index < count; index++) {
    elements[`el-${index}`] = { x: index * 10, y: index * 10, width: 100, height: 50 };
  }
  const links: Record<string, object> = {};
  for (let index = 0; index < count - 1; index++) {
    links[`link-${index}`] = { source: `el-${index}`, target: `el-${index + 1}` };
  }

  const store = new GraphStore({
    initialElements: elements,
    initialLinks: links,
  });

  for (let index = 0; index < count; index++) {
    store.graphView.elements.subscribe(`el-${index}`, () => {});
  }
  for (let index = 0; index < count - 1; index++) {
    store.graphView.links.subscribe(`link-${index}`, () => {});
  }

  return { graph: store.graph, store };
}

function logResults(bench: Bench): void {
  for (const task of bench.tasks) {
    const { result } = task;
    if (result.state === 'completed') {
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

      // Each task gets its own tick counter to avoid interference
      let tickBaseline = 0;
      let tickView = 0;
      let tickStore = 0;
      const bench = new Bench({ time: 1000 });

      bench
        .add(`baseline (${size})`, () => {
          const index = tickBaseline % size;
          tickBaseline++;
          (baseline.graph.getCell(`el-${index}`) as dia.Element).position(tickBaseline, tickBaseline);
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
    }, 30_000);

    it(`${size} elements — data (attr) change`, async () => {
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
          (baseline.graph.getCell(`el-${index}`) as dia.Element).attr(
            'label/text',
            `L${tickBaseline}`
          );
        })
        .add(`graphView (${size})`, () => {
          const index = tickView % size;
          tickView++;
          (withView.graph.getCell(`el-${index}`) as dia.Element).attr('label/text', `L${tickView}`);
        })
        .add(`GraphStore (${size})`, () => {
          const index = tickStore % size;
          tickStore++;
          (withStore.graph.getCell(`el-${index}`) as dia.Element).attr('label/text', `L${tickStore}`);
        });

      await bench.run();
      console.log(`\n--- ${size} elements — data (attr) change ---`);
      logResults(bench);
      saveBenchResults(bench, `graph-view/data-change/n=${size}`, baselinePath);
      expect(bench.tasks.length).toBe(3);
    }, 30_000);

    it(`${size} elements — batch 10 position changes`, async () => {
      const baseline = createBaseline(size);
      const withView = createWithGraphView(size);
      const withStore = createWithGraphStore(size);

      let tickBaseline = 0;
      let tickView = 0;
      let tickStore = 0;
      const bench = new Bench({ time: 1000 });

      bench
        .add(`baseline (${size})`, () => {
          tickBaseline++;
          for (let index = 0; index < 10; index++) {
            const index_ = (tickBaseline + index) % size;
            (baseline.graph.getCell(`el-${index_}`) as dia.Element).position(
              tickBaseline + index,
              tickBaseline + index
            );
          }
        })
        .add(`graphView (${size})`, () => {
          tickView++;
          for (let index = 0; index < 10; index++) {
            const index_ = (tickView + index) % size;
            (withView.graph.getCell(`el-${index_}`) as dia.Element).position(
              tickView + index,
              tickView + index
            );
          }
        })
        .add(`GraphStore (${size})`, () => {
          tickStore++;
          for (let index = 0; index < 10; index++) {
            const index_ = (tickStore + index) % size;
            (withStore.graph.getCell(`el-${index_}`) as dia.Element).position(
              tickStore + index,
              tickStore + index
            );
          }
        });

      await bench.run();
      console.log(`\n--- ${size} elements — batch 10 position changes ---`);
      logResults(bench);
      saveBenchResults(bench, `graph-view/batch-position-change/n=${size}`, baselinePath);
      expect(bench.tasks.length).toBe(3);
    }, 30_000);
  }
});
