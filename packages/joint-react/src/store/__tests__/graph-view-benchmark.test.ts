/* eslint-disable no-console */
import { Bench } from 'tinybench';
import { dia } from '@joint/core';
import type { PaperStore } from '../../store';
import { DEFAULT_CELL_NAMESPACE } from '../../store/graph-store';
import { graphView } from '../graph-view';

function createGraph() {
    return new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
}

function populateGraph(graph: dia.Graph, count: number) {
    const cells = [];
    for (let index = 0; index < count; index++) {
        cells.push({
            id: `el-${index}`,
            type: 'PortalElement',
            position: { x: index * 10, y: index * 10 },
            size: { width: 100, height: 50 },
        });
    }
    graph.syncCells(cells, { remove: true });
}

function createGraphWithView(count: number) {
    const graph = createGraph();
    populateGraph(graph, count);
    const view = graphView({
        graph,
        getPaperStores: () => new Map<string, PaperStore>(),
    });

    // Simulate real React: each element subscribes to elements + elementsLayout (per ID)
    for (let index = 0; index < count; index++) {
        const id = `el-${index}`;
        view.elements.subscribe(id, () => {});
        view.elementsLayout.subscribe(id, () => {});
    }

    return { graph, view };
}

describe('graph-view benchmark (tinybench): pure graph vs graph+view', () => {
    const sizes = [10, 100, 1000];

    for (const size of sizes) {
        it(`${size} elements — position change`, async () => {
            const pureGraph = createGraph();
            populateGraph(pureGraph, size);
            const { graph: viewGraph } = createGraphWithView(size);

            let tick = 0;
            const bench = new Bench({ time: 1000 });

            bench
                .add(`pure graph (${size})`, () => {
                    tick++;
                    const element = pureGraph.getCell(`el-${tick % size}`) as dia.Element;
                    element.position(tick, tick);
                })
                .add(`graph + view (${size})`, () => {
                    tick++;
                    const element = viewGraph.getCell(`el-${tick % size}`) as dia.Element;
                    element.position(tick, tick);
                });

            await bench.run();

            console.log(`\n--- ${size} elements — position change ---`);
            for (const task of bench.tasks) {
                const { result } = task;
                if (result.state === 'completed') {
                    console.log(
                        `${task.name}: ${Math.round(result.throughput.mean).toLocaleString()} ops/sec (avg ${(result.latency.mean * 1e6).toFixed(0)}ns)`
                    );
                }
            }

            expect(bench.tasks.length).toBe(2);
        }, 30_000);

        it(`${size} elements — data (attr) change`, async () => {
            const pureGraph = createGraph();
            populateGraph(pureGraph, size);
            const { graph: viewGraph } = createGraphWithView(size);

            let tick = 0;
            const bench = new Bench({ time: 1000 });

            bench
                .add(`pure graph (${size})`, () => {
                    tick++;
                    const element = pureGraph.getCell(`el-${tick % size}`) as dia.Element;
                    element.attr('label/text', `Label ${tick}`);
                })
                .add(`graph + view (${size})`, () => {
                    tick++;
                    const element = viewGraph.getCell(`el-${tick % size}`) as dia.Element;
                    element.attr('label/text', `Label ${tick}`);
                });

            await bench.run();

            console.log(`\n--- ${size} elements — data (attr) change ---`);
            for (const task of bench.tasks) {
                const { result } = task;
                if (result.state === 'completed') {
                    console.log(
                        `${task.name}: ${Math.round(result.throughput.mean).toLocaleString()} ops/sec (avg ${(result.latency.mean * 1e6).toFixed(0)}ns)`
                    );
                }
            }

            expect(bench.tasks.length).toBe(2);
        }, 30_000);

        it(`${size} elements — batch 10 position changes`, async () => {
            const pureGraph = createGraph();
            populateGraph(pureGraph, size);
            const { graph: viewGraph } = createGraphWithView(size);

            let tick = 0;
            const bench = new Bench({ time: 1000 });

            bench
                .add(`pure graph (${size})`, () => {
                    tick++;
                    for (let index = 0; index < 10; index++) {
                        const element = pureGraph.getCell(`el-${(tick + index) % size}`) as dia.Element;
                        element.position(tick + index, tick + index);
                    }
                })
                .add(`graph + view (${size})`, () => {
                    tick++;
                    for (let index = 0; index < 10; index++) {
                        const element = viewGraph.getCell(`el-${(tick + index) % size}`) as dia.Element;
                        element.position(tick + index, tick + index);
                    }
                });

            await bench.run();

            console.log(`\n--- ${size} elements — batch 10 position changes ---`);
            for (const task of bench.tasks) {
                const { result } = task;
                if (result.state === 'completed') {
                    console.log(
                        `${task.name}: ${Math.round(result.throughput.mean).toLocaleString()} ops/sec (avg ${(result.latency.mean * 1e6).toFixed(0)}ns)`
                    );
                }
            }

            expect(bench.tasks.length).toBe(2);
        }, 30_000);
    }
});
