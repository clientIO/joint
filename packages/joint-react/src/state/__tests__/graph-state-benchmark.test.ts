/* eslint-disable no-console */
import { Bench } from 'tinybench';
import { dia } from '@joint/core';
import type { PaperStore } from '../../store';
import { DEFAULT_CELL_NAMESPACE } from '../../store/graph-store';
import { graphState } from '../graph-state';

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

function createGraphWithState(count: number, enableBatchUpdates = false) {
    const graph = createGraph();
    const state = graphState({
        graph,
        papers: new Map<string, PaperStore>(),
        onIncrementalChange: () => {},
        onReset: () => {},
        mappers: {},
        enableBatchUpdates,
    });

    const elements: Record<string, Record<string, unknown>> = {};
    for (let index = 0; index < count; index++) {
        elements[`el-${index}`] = {
            x: index * 10,
            y: index * 10,
            width: 100,
            height: 50,
        };
    }
    state.updateGraph({ elements, links: {} });

    // Simulate real React usage: each element subscribes to dataState + layoutState
    for (let index = 0; index < count; index++) {
        state.dataState.subscribe(() => {});
        state.layoutState.subscribe(() => {});
    }

    return { graph, state };
}

describe('graph-state benchmark (tinybench): pure graph vs graph+state', () => {
    const sizes = [10, 100, 1000];

    for (const size of sizes) {
        it(`${size} elements — position change`, async () => {
            const pureGraph = createGraph();
            populateGraph(pureGraph, size);
            const { graph: stateGraph } = createGraphWithState(size);

            let tick = 0;
            const bench = new Bench({ time: 1000 });

            bench
                .add(`pure graph (${size})`, () => {
                    tick++;
                    const element = pureGraph.getCell(`el-${tick % size}`) as dia.Element;
                    element.position(tick, tick);
                })
                .add(`graph + state (${size})`, () => {
                    tick++;
                    const element = stateGraph.getCell(`el-${tick % size}`) as dia.Element;
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
            const { graph: stateGraph } = createGraphWithState(size);

            let tick = 0;
            const bench = new Bench({ time: 1000 });

            bench
                .add(`pure graph (${size})`, () => {
                    tick++;
                    const element = pureGraph.getCell(`el-${tick % size}`) as dia.Element;
                    element.attr('label/text', `Label ${tick}`);
                })
                .add(`graph + state (${size})`, () => {
                    tick++;
                    const element = stateGraph.getCell(`el-${tick % size}`) as dia.Element;
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
            const { graph: stateGraph } = createGraphWithState(size);
            const { graph: batchGraph } = createGraphWithState(size, true);

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
                .add(`graph + state (${size})`, () => {
                    tick++;
                    for (let index = 0; index < 10; index++) {
                        const element = stateGraph.getCell(`el-${(tick + index) % size}`) as dia.Element;
                        element.position(tick + index, tick + index);
                    }
                })
                .add(`graph + state batched (${size})`, () => {
                    tick++;
                    batchGraph.startBatch('update');
                    for (let index = 0; index < 10; index++) {
                        const element = batchGraph.getCell(`el-${(tick + index) % size}`) as dia.Element;
                        element.position(tick + index, tick + index);
                    }
                    batchGraph.stopBatch('update');
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

            expect(bench.tasks.length).toBe(3);
        }, 30_000);
    }
});
