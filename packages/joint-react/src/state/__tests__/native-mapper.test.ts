import { dia, shapes } from '@joint/core';
import { ReactElement } from '../../models/react-element';
import type { GraphElement } from '../../types/element-types';
import type { GraphLink } from '../../types/link-types';
import { nativeMapper } from '../native-mapper';
import { flatMapper } from '../flat-mapper';
import type { ElementToGraphOptions, GraphToElementOptions, LinkToGraphOptions, GraphToLinkOptions } from '../graph-state-selectors';

const DEFAULT_CELL_NAMESPACE = { ...shapes, ReactElement };

const { mapDataToElementAttributes, mapDataToLinkAttributes, mapElementAttributesToData, mapLinkAttributesToData } = nativeMapper;

function elementToGraphOptions(id: string, data: GraphElement, graph: dia.Graph): ElementToGraphOptions<GraphElement> {
    return { id, data, graph, toAttributes: (d) => flatMapper.mapDataToElementAttributes({ id, data: d, graph } as unknown as ElementToGraphOptions<GraphElement>) };
}
function graphToElementOptions(id: string, cell: dia.Element, graph: dia.Graph, previousData?: GraphElement): GraphToElementOptions<GraphElement> {
    return { id, cell, graph, previousData, toData: () => flatMapper.mapElementAttributesToData({ id, cell, graph } as unknown as GraphToElementOptions<GraphElement>) };
}
function linkToGraphOptions(id: string, data: GraphLink, graph: dia.Graph): LinkToGraphOptions<GraphLink> {
    return { id, data, graph, toAttributes: (d) => flatMapper.mapDataToLinkAttributes({ id, data: d, graph } as unknown as LinkToGraphOptions<GraphLink>) };
}
function graphToLinkOptions(id: string, cell: dia.Link, graph: dia.Graph, previousData?: GraphLink): GraphToLinkOptions<GraphLink> {
    return { id, cell, graph, previousData, toData: () => flatMapper.mapLinkAttributesToData({ id, cell, graph } as unknown as GraphToLinkOptions<GraphLink>) };
}

describe('nativeMapper', () => {
    let graph: dia.Graph;

    beforeEach(() => {
        graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
    });

    afterEach(() => {
        graph.clear();
    });

    describe('element forward: data → JointJS', () => {
        it('should keep nested position/size as-is', () => {
            const id = 'el-1';
            const data = {
                position: { x: 10, y: 20 },
                size: { width: 100, height: 50 },
            } as unknown as GraphElement;

            const cellJson = mapDataToElementAttributes(elementToGraphOptions(id, data, graph));
            expect(cellJson.position).toEqual({ x: 10, y: 20 });
            expect(cellJson.size).toEqual({ width: 100, height: 50 });
            expect(cellJson.type).toBe('ReactElement');
        });

        it('should accept flat x/y/width/height for convenience', () => {
            const id = 'el-1';
            const data: GraphElement = { x: 30, y: 40, width: 200, height: 100 };

            const cellJson = mapDataToElementAttributes(elementToGraphOptions(id, data, graph));
            expect(cellJson.position).toEqual({ x: 30, y: 40 });
            expect(cellJson.size).toEqual({ width: 200, height: 100 });
        });

        it('should pass attrs as-is (no conversion)', () => {
            const id = 'el-1';
            const data = {
                x: 0, y: 0, width: 50, height: 50,
                attrs: { body: { fill: 'blue', stroke: 'red' } },
            } as unknown as GraphElement;

            const cellJson = mapDataToElementAttributes(elementToGraphOptions(id, data, graph));
            expect(cellJson.attrs).toEqual({ body: { fill: 'blue', stroke: 'red' } });
        });

        it('should pass ports as-is (no convertPorts)', () => {
            const id = 'el-1';
            const nativePorts = {
                groups: { in: { position: 'left' }, out: { position: 'right' } },
                items: [{ id: 'p1', group: 'in' }, { id: 'p2', group: 'out' }],
            };
            const data = { x: 0, y: 0, width: 50, height: 50, ports: nativePorts } as unknown as GraphElement;

            const cellJson = mapDataToElementAttributes(elementToGraphOptions(id, data, graph));
            expect(cellJson.ports).toEqual(nativePorts);
        });

        it('should spread all data props as cell attributes (no cell.data)', () => {
            type MyElement = GraphElement & { label: string; status: string };
            const id = 'el-1';
            const data: MyElement = { x: 0, y: 0, width: 50, height: 50, label: 'Node', status: 'active' };

            const cellJson = mapDataToElementAttributes(elementToGraphOptions(id, data as GraphElement, graph));
            expect(cellJson.label).toBe('Node');
            expect(cellJson.status).toBe('active');
            expect(cellJson.data).toBeUndefined();
        });

        it('should allow overriding type', () => {
            const id = 'el-1';
            const data = {
                position: { x: 0, y: 0 },
                size: { width: 50, height: 50 },
                type: 'standard.Rectangle',
            } as unknown as GraphElement;

            const cellJson = mapDataToElementAttributes(elementToGraphOptions(id, data, graph));
            expect(cellJson.type).toBe('standard.Rectangle');
        });
    });

    describe('element reverse: JointJS → data', () => {
        it('should return nested position/size', () => {
            const id = 'el-1';
            const cellJson = {
                type: 'ReactElement',
                id,
                position: { x: 10, y: 20 },
                size: { width: 100, height: 50 },
            } as dia.Cell.JSON;
            graph.syncCells([cellJson], { remove: true });
            const cell = graph.getCell(id) as dia.Element;

            const result = mapElementAttributesToData(graphToElementOptions(id, cell, graph));

            expect(result).toHaveProperty('position', { x: 10, y: 20 });
            expect(result).toHaveProperty('size', { width: 100, height: 50 });
            expect(result).not.toHaveProperty('id');
        });

        it('should include type in returned data', () => {
            const id = 'el-1';
            const cellJson = {
                type: 'ReactElement',
                id,
                position: { x: 0, y: 0 },
                size: { width: 50, height: 50 },
            } as dia.Cell.JSON;
            graph.syncCells([cellJson], { remove: true });
            const cell = graph.getCell(id) as dia.Element;

            const result = mapElementAttributesToData(graphToElementOptions(id, cell, graph));
            expect((result as Record<string, unknown>).type).toBe('ReactElement');
        });

        it('should pass attrs as-is on reverse', () => {
            const id = 'el-1';
            const cellJson = {
                type: 'ReactElement',
                id,
                position: { x: 0, y: 0 },
                size: { width: 50, height: 50 },
                attrs: { body: { fill: 'green' } },
            } as dia.Cell.JSON;
            graph.syncCells([cellJson], { remove: true });
            const cell = graph.getCell(id) as dia.Element;

            const result = mapElementAttributesToData(graphToElementOptions(id, cell, graph));
            expect((result as Record<string, unknown>).attrs).toEqual({ body: { fill: 'green' } });
        });

        it('should pass ports as-is on reverse', () => {
            const id = 'el-1';
            const nativePorts = {
                groups: { in: { position: { name: 'left' } } },
                items: [{ id: 'p1', group: 'in' }],
            };
            const cellJson = {
                type: 'ReactElement',
                id,
                position: { x: 0, y: 0 },
                size: { width: 50, height: 50 },
                ports: nativePorts,
            } as dia.Cell.JSON;
            graph.syncCells([cellJson], { remove: true });
            const cell = graph.getCell(id) as dia.Element;

            const result = mapElementAttributesToData(graphToElementOptions(id, cell, graph));
            expect(result.ports).toBeDefined();
        });

        it('should return custom attributes directly (no cell.data indirection)', () => {
            const id = 'el-1';
            // Set custom attributes directly on the cell
            const cellJson = {
                type: 'ReactElement',
                id,
                position: { x: 0, y: 0 },
                size: { width: 50, height: 50 },
                label: 'Hello',
                score: 42,
            } as dia.Cell.JSON;
            graph.syncCells([cellJson], { remove: true });
            const cell = graph.getCell(id) as dia.Element;

            const result = mapElementAttributesToData(graphToElementOptions(id, cell, graph)) as Record<string, unknown>;
            expect(result.label).toBe('Hello');
            expect(result.score).toBe(42);
        });

        it('should apply shape preservation via previousData', () => {
            const id = 'el-1';
            const cellJson = {
                type: 'ReactElement',
                id,
                position: { x: 10, y: 20 },
                size: { width: 100, height: 50 },
                known: 'val',
                extra: 'filtered',
            } as dia.Cell.JSON;
            graph.syncCells([cellJson], { remove: true });
            const cell = graph.getCell(id) as dia.Element;

            type E = GraphElement & { position?: { x: number; y: number }; size?: { width: number; height: number }; known?: string };
            const previousData: E = { position: { x: 0, y: 0 }, size: { width: 0, height: 0 }, known: undefined };

            const result = mapElementAttributesToData(graphToElementOptions(id, cell, graph, previousData as GraphElement));
            expect(result).toHaveProperty('known', 'val');
            expect(result).not.toHaveProperty('extra');
        });
    });

    describe('element round-trip', () => {
        it('should round-trip with nested format', () => {
            const id = 'el-1';
            const data = {
                position: { x: 10, y: 20 },
                size: { width: 100, height: 50 },
            } as unknown as GraphElement;

            const cellJson = mapDataToElementAttributes(elementToGraphOptions(id, data, graph));
            graph.syncCells([cellJson], { remove: true });
            const cell = graph.getCell(id) as dia.Element;

            const result = mapElementAttributesToData(graphToElementOptions(id, cell, graph));
            expect((result as Record<string, unknown>).position).toEqual({ x: 10, y: 20 });
            expect((result as Record<string, unknown>).size).toEqual({ width: 100, height: 50 });
        });

        it('should round-trip custom attributes', () => {
            type MyElement = GraphElement & { label: string; score: number };
            const id = 'el-1';
            const data: MyElement = {
                x: 10, y: 20, width: 100, height: 50,
                label: 'Hello', score: 42,
            };

            const cellJson = mapDataToElementAttributes(elementToGraphOptions(id, data as GraphElement, graph));
            graph.syncCells([cellJson], { remove: true });
            const cell = graph.getCell(id) as dia.Element;

            const result = mapElementAttributesToData(graphToElementOptions(id, cell, graph)) as Record<string, unknown>;
            expect(result.label).toBe('Hello');
            expect(result.score).toBe(42);
            expect(result.position).toEqual({ x: 10, y: 20 });
            expect(result.size).toEqual({ width: 100, height: 50 });
        });
    });

    describe('link forward: data → JointJS', () => {
        it('should create link with source/target', () => {
            const id = 'link-1';
            const data: GraphLink = { source: 'el-1', target: 'el-2' };

            const cellJson = mapDataToLinkAttributes(linkToGraphOptions(id, data, graph));
            expect(cellJson.source).toEqual({ id: 'el-1' });
            expect(cellJson.target).toEqual({ id: 'el-2' });
            expect(cellJson.type).toBe('standard.Link');
        });

        it('should pass attrs as-is (no theme system)', () => {
            const id = 'link-1';
            const data: GraphLink = {
                source: 'a', target: 'b',
                attrs: { line: { stroke: 'purple', strokeWidth: 5 } },
            };

            const cellJson = mapDataToLinkAttributes(linkToGraphOptions(id, data, graph));
            expect(cellJson.attrs).toEqual({ line: { stroke: 'purple', strokeWidth: 5 } });
        });

        it('should spread all data props as cell attributes (no cell.data)', () => {
            const id = 'link-1';
            const data: GraphLink = {
                source: 'a', target: 'b',
                color: 'red', width: 4, pattern: '5 5',
                sourceMarker: 'arrow', targetMarker: 'circle',
                className: 'my-link',
            };

            const cellJson = mapDataToLinkAttributes(linkToGraphOptions(id, data, graph));
            // All props become cell attributes directly
            expect(cellJson.color).toBe('red');
            expect(cellJson.width).toBe(4);
            expect(cellJson.pattern).toBe('5 5');
            expect(cellJson.sourceMarker).toBe('arrow');
            expect(cellJson.targetMarker).toBe('circle');
            expect(cellJson.className).toBe('my-link');
            // No cell.data indirection
            expect(cellJson.data).toBeUndefined();
        });

        it('should spread custom user props as cell attributes', () => {
            type MyLink = GraphLink & { weight: number };
            const id = 'link-1';
            const data: MyLink = { source: 'a', target: 'b', weight: 5 };

            const cellJson = mapDataToLinkAttributes(linkToGraphOptions(id, data as GraphLink, graph));
            expect(cellJson.weight).toBe(5);
            expect(cellJson.data).toBeUndefined();
        });

        it('should allow overriding type', () => {
            const id = 'link-1';
            const data: GraphLink = { source: 'a', target: 'b', type: 'standard.DoubleLink' };

            const cellJson = mapDataToLinkAttributes(linkToGraphOptions(id, data, graph));
            expect(cellJson.type).toBe('standard.DoubleLink');
        });
    });

    describe('link reverse: JointJS → data', () => {
        it('should return raw cell attributes including attrs', () => {
            const id = 'link-1';
            const cellJson = {
                type: 'standard.Link',
                id,
                source: { id: 'a' },
                target: { id: 'b' },
                attrs: { line: { stroke: 'green', strokeWidth: 3 } },
            } as dia.Cell.JSON;
            graph.syncCells([cellJson], { remove: true });
            const cell = graph.getCell(id) as dia.Link;

            const result = mapLinkAttributesToData(graphToLinkOptions(id, cell, graph));
            expect(result.attrs).toBeDefined();
            expect(result.attrs?.line?.stroke).toBe('green');
            expect(result).not.toHaveProperty('id');
        });

        it('should return custom attributes directly (no cell.data indirection)', () => {
            const id = 'link-1';
            const cellJson = {
                type: 'standard.Link',
                id,
                source: { id: 'a' },
                target: { id: 'b' },
                weight: 10,
                category: 'flow',
            } as dia.Cell.JSON;
            graph.syncCells([cellJson], { remove: true });
            const cell = graph.getCell(id) as dia.Link;

            const result = mapLinkAttributesToData(graphToLinkOptions(id, cell, graph)) as Record<string, unknown>;
            expect(result.weight).toBe(10);
            expect(result.category).toBe('flow');
        });

        it('should apply shape preservation via previousData', () => {
            const id = 'link-1';
            const cellJson = {
                type: 'standard.Link',
                id,
                source: { id: 'a' },
                target: { id: 'b' },
                known: 'val',
                extra: 'filtered',
            } as dia.Cell.JSON;
            graph.syncCells([cellJson], { remove: true });
            const cell = graph.getCell(id) as dia.Link;

            type L = GraphLink & { known?: string; extra?: string };
            const previousData: L = { source: 'a', target: 'b', known: undefined };

            const result = mapLinkAttributesToData(graphToLinkOptions(id, cell, graph, previousData as GraphLink));
            expect(result).toHaveProperty('known', 'val');
            expect(result).not.toHaveProperty('extra');
        });
    });

    describe('link round-trip', () => {
        it('should round-trip with native attrs', () => {
            const id = 'link-1';
            const data: GraphLink = {
                source: 'el-1', target: 'el-2',
                attrs: { line: { stroke: 'red', strokeWidth: 3 } },
            };

            const cellJson = mapDataToLinkAttributes(linkToGraphOptions(id, data, graph));
            graph.syncCells([cellJson], { remove: true });
            const cell = graph.getCell(id) as dia.Link;

            const result = mapLinkAttributesToData(graphToLinkOptions(id, cell, graph));
            expect(result.source).toEqual({ id: 'el-1' });
            expect(result.target).toEqual({ id: 'el-2' });
            expect(result.attrs?.line?.stroke).toBe('red');
        });

        it('should round-trip custom attributes', () => {
            type MyLink = GraphLink & { weight: number; category: string };
            const id = 'link-1';
            const data: MyLink = {
                source: 'el-1', target: 'el-2',
                weight: 5, category: 'flow',
            };

            const cellJson = mapDataToLinkAttributes(linkToGraphOptions(id, data as GraphLink, graph));
            graph.syncCells([cellJson], { remove: true });
            const cell = graph.getCell(id) as dia.Link;

            const result = mapLinkAttributesToData(graphToLinkOptions(id, cell, graph)) as Record<string, unknown>;
            expect(result.weight).toBe(5);
            expect(result.category).toBe('flow');
        });
    });

    describe('preset object', () => {
        it('should export all four mapper functions', () => {
            expect(nativeMapper.mapDataToElementAttributes).toBeInstanceOf(Function);
            expect(nativeMapper.mapDataToLinkAttributes).toBeInstanceOf(Function);
            expect(nativeMapper.mapElementAttributesToData).toBeInstanceOf(Function);
            expect(nativeMapper.mapLinkAttributesToData).toBeInstanceOf(Function);
        });
    });
});
