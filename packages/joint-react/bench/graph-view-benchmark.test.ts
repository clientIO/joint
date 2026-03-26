/* eslint-disable no-console */
import { Bench } from 'tinybench';
import { dia } from '@joint/core';
import type { PaperStore } from '../src/store';
import { DEFAULT_CELL_NAMESPACE, GraphStore } from '../src/store/graph-store';
import { graphView } from '../src/store/graph-view';

function createGraph(): dia.Graph {
  return new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
}

function populateGraph(graph: dia.Graph, count: number): void {
  const cells: object[] = [];
  for (let i = 0; i < count; i++) {
    cells.push({
      id: `el-${i}`,
      type: 'PortalElement',
      position: { x: i * 10, y: i * 10 },
      size: { width: 100, height: 50 },
    });
  }
  for (let i = 0; i < count - 1; i++) {
    cells.push({
      id: `link-${i}`,
      type: 'PortalLink',
      source: { id: `el-${i}` },
      target: { id: `el-${i + 1}` },
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
    getPaperStores: () => new Map<string, PaperStore>(),
  });

  for (let i = 0; i < count; i++) {
    view.elements.subscribe(`el-${i}`, () => {});
    view.elementsLayout.subscribe(`el-${i}`, () => {});
  }
  for (let i = 0; i < count - 1; i++) {
    view.links.subscribe(`link-${i}`, () => {});
  }

  return { graph, view };
}

/** Full GraphStore with onElementsChange callback wired and per-ID subscriptions. */
function createWithGraphStore(count: number) {
  const elements: Record<string, object> = {};
  for (let i = 0; i < count; i++) {
    elements[`el-${i}`] = { x: i * 10, y: i * 10, width: 100, height: 50 };
  }
  const links: Record<string, object> = {};
  for (let i = 0; i < count - 1; i++) {
    links[`link-${i}`] = { source: `el-${i}`, target: `el-${i + 1}` };
  }

  const store = new GraphStore({
    initialElements: elements,
    initialLinks: links,
  });

  for (let i = 0; i < count; i++) {
    store.graphView.elements.subscribe(`el-${i}`, () => {});
    store.graphView.elementsLayout.subscribe(`el-${i}`, () => {});
  }
  for (let i = 0; i < count - 1; i++) {
    store.graphView.links.subscribe(`link-${i}`, () => {});
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
          const idx = tickBaseline % size;
          tickBaseline++;
          (baseline.graph.getCell(`el-${idx}`) as dia.Element).position(tickBaseline, tickBaseline);
        })
        .add(`graphView (${size})`, () => {
          const idx = tickView % size;
          tickView++;
          (withView.graph.getCell(`el-${idx}`) as dia.Element).position(tickView, tickView);
        })
        .add(`GraphStore (${size})`, () => {
          const idx = tickStore % size;
          tickStore++;
          (withStore.graph.getCell(`el-${idx}`) as dia.Element).position(tickStore, tickStore);
        });

      await bench.run();
      console.log(`\n--- ${size} elements — position change ---`);
      logResults(bench);
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
          const idx = tickBaseline % size;
          tickBaseline++;
          (baseline.graph.getCell(`el-${idx}`) as dia.Element).attr(
            'label/text',
            `L${tickBaseline}`
          );
        })
        .add(`graphView (${size})`, () => {
          const idx = tickView % size;
          tickView++;
          (withView.graph.getCell(`el-${idx}`) as dia.Element).attr('label/text', `L${tickView}`);
        })
        .add(`GraphStore (${size})`, () => {
          const idx = tickStore % size;
          tickStore++;
          (withStore.graph.getCell(`el-${idx}`) as dia.Element).attr('label/text', `L${tickStore}`);
        });

      await bench.run();
      console.log(`\n--- ${size} elements — data (attr) change ---`);
      logResults(bench);
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
          for (let i = 0; i < 10; i++) {
            const idx = (tickBaseline + i) % size;
            (baseline.graph.getCell(`el-${idx}`) as dia.Element).position(
              tickBaseline + i,
              tickBaseline + i
            );
          }
        })
        .add(`graphView (${size})`, () => {
          tickView++;
          for (let i = 0; i < 10; i++) {
            const idx = (tickView + i) % size;
            (withView.graph.getCell(`el-${idx}`) as dia.Element).position(
              tickView + i,
              tickView + i
            );
          }
        })
        .add(`GraphStore (${size})`, () => {
          tickStore++;
          for (let i = 0; i < 10; i++) {
            const idx = (tickStore + i) % size;
            (withStore.graph.getCell(`el-${idx}`) as dia.Element).position(
              tickStore + i,
              tickStore + i
            );
          }
        });

      await bench.run();
      console.log(`\n--- ${size} elements — batch 10 position changes ---`);
      logResults(bench);
      expect(bench.tasks.length).toBe(3);
    }, 30_000);
  }
});
