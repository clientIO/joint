/* eslint-disable no-console */
import { Bench } from 'tinybench';
import { dia } from '@joint/core';
import type { PaperStore } from '../../store';
import { DEFAULT_CELL_NAMESPACE } from '../../store/graph-store';
import { graphState } from '../graph-state';
import { graphView } from '../../store/graph-view';

function createGraph() {
    return new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
}

function populateGraph(graph: dia.Graph, count: number) {
    const cells: Record<string, unknown>[] = [];
    for (let index = 0; index < count; index++) {
        cells.push({
            id: `el-${index}`,
            type: 'PortalElement',
            position: { x: index * 10, y: index * 10 },
            size: { width: 100, height: 50 },
        });
    }
    // Chain elements with links: el-0 → el-1 → el-2 → ...
    for (let index = 0; index < count - 1; index++) {
        cells.push({
            id: `link-${index}`,
            type: 'standard.Link',
            source: { id: `el-${index}` },
            target: { id: `el-${index + 1}` },
        });
    }
    graph.syncCells(cells, { remove: true });
}

function createWithGraphState(count: number) {
    const graph = createGraph();
    const state = graphState({
        graph,
        papers: new Map<string, PaperStore>(),
        onIncrementalChange: () => {},
        onReset: () => {},
        mappers: {},
    });
    const elements: Record<string, Record<string, unknown>> = {};
    const links: Record<string, Record<string, unknown>> = {};
    for (let index = 0; index < count; index++) {
        elements[`el-${index}`] = { x: index * 10, y: index * 10, width: 100, height: 50 };
    }
    for (let index = 0; index < count - 1; index++) {
        links[`link-${index}`] = { source: { id: `el-${index}` }, target: { id: `el-${index + 1}` } };
    }
    state.updateGraph({ elements, links });

    // Fair: per-element + per-link listeners (simulates React subscriptions)
    for (let index = 0; index < count; index++) {
        state.dataState.subscribe(() => {});
        state.layoutState.subscribe(() => {});
    }
    // links also subscribe
    for (let index = 0; index < count - 1; index++) {
        state.dataState.subscribe(() => {});
        state.layoutState.subscribe(() => {});
    }
    return { graph };
}

function createWithGraphView(count: number) {
    const graph = createGraph();
    populateGraph(graph, count);
    const view = graphView({
        graph,
        getPaperStores: () => new Map<string, PaperStore>(),
    });

    // Fair: per-id listeners for elements + links
    for (let index = 0; index < count; index++) {
        const id = `el-${index}`;
        view.elements.subscribe(id, () => {});
        view.elementsLayout.subscribe(id, () => {});
    }
    for (let index = 0; index < count - 1; index++) {
        const id = `link-${index}`;
        view.links.subscribe(id, () => {});
        view.linksLayout.subscribe(id, () => {});
    }
    return { graph };
}

function logResults(bench: Bench) {
    for (const task of bench.tasks) {
        const { result } = task;
        if (result.state === 'completed') {
            console.log(
                `  ${task.name}: ${Math.round(result.throughput.mean).toLocaleString()} ops/sec (avg ${(result.latency.mean * 1e6).toFixed(0)}ns)`
            );
        }
    }
}

describe('graph-state vs graph-view — fair comparison (elements + links)', () => {
    const sizes = [10, 100, 1000];

    // Suppress debug logs from create-state during benchmark setup
    const originalLog = console.log;
    beforeAll(() => {
        console.log = (...arguments_: unknown[]) => {
            if (typeof arguments_[0] === 'string' && arguments_[0].startsWith('[State:')) return;
            originalLog(...arguments_);
        };
    });
    afterAll(() => {
        console.log = originalLog;
    });

    for (const size of sizes) {
        it(`${size} elements + ${size - 1} links — position change`, async () => {
            const pureGraph = createGraph();
            populateGraph(pureGraph, size);
            const { graph: oldGraph } = createWithGraphState(size);
            const { graph: newGraph } = createWithGraphView(size);

            let tick = 0;
            const bench = new Bench({ time: 1000 });

            bench
                .add('baseline', () => {
                    tick++;
                    (pureGraph.getCell(`el-${tick % size}`) as dia.Element).position(tick, tick);
                })
                .add('graphState (old)', () => {
                    tick++;
                    (oldGraph.getCell(`el-${tick % size}`) as dia.Element).position(tick, tick);
                })
                .add('graphView (new)', () => {
                    tick++;
                    (newGraph.getCell(`el-${tick % size}`) as dia.Element).position(tick, tick);
                });

            await bench.run();
            console.log(`\n--- ${size} elements + ${size - 1} links — position change ---`);
            logResults(bench);
            expect(bench.tasks.length).toBe(3);
        }, 30_000);

        it(`${size} elements + ${size - 1} links — data (attr) change`, async () => {
            const pureGraph = createGraph();
            populateGraph(pureGraph, size);
            const { graph: oldGraph } = createWithGraphState(size);
            const { graph: newGraph } = createWithGraphView(size);

            let tick = 0;
            const bench = new Bench({ time: 1000 });

            bench
                .add('baseline', () => {
                    tick++;
                    (pureGraph.getCell(`el-${tick % size}`) as dia.Element).attr('label/text', `L${tick}`);
                })
                .add('graphState (old)', () => {
                    tick++;
                    (oldGraph.getCell(`el-${tick % size}`) as dia.Element).attr('label/text', `L${tick}`);
                })
                .add('graphView (new)', () => {
                    tick++;
                    (newGraph.getCell(`el-${tick % size}`) as dia.Element).attr('label/text', `L${tick}`);
                });

            await bench.run();
            console.log(`\n--- ${size} elements + ${size - 1} links — data (attr) change ---`);
            logResults(bench);
            expect(bench.tasks.length).toBe(3);
        }, 30_000);

        it(`${size} elements + ${size - 1} links — batch 10 position changes`, async () => {
            const pureGraph = createGraph();
            populateGraph(pureGraph, size);
            const { graph: oldGraph } = createWithGraphState(size);
            const { graph: newGraph } = createWithGraphView(size);

            let tick = 0;
            const bench = new Bench({ time: 1000 });

            bench
                .add('baseline', () => {
                    tick++;
                    for (let index = 0; index < 10; index++) {
                        (pureGraph.getCell(`el-${(tick + index) % size}`) as dia.Element).position(tick + index, tick + index);
                    }
                })
                .add('graphState (old)', () => {
                    tick++;
                    for (let index = 0; index < 10; index++) {
                        (oldGraph.getCell(`el-${(tick + index) % size}`) as dia.Element).position(tick + index, tick + index);
                    }
                })
                .add('graphView (new)', () => {
                    tick++;
                    for (let index = 0; index < 10; index++) {
                        (newGraph.getCell(`el-${(tick + index) % size}`) as dia.Element).position(tick + index, tick + index);
                    }
                });

            await bench.run();
            console.log(`\n--- ${size} elements + ${size - 1} links — batch 10 position changes ---`);
            logResults(bench);
            expect(bench.tasks.length).toBe(3);
        }, 30_000);
    }
});
