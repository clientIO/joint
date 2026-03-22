import { renderHook } from '@testing-library/react';
import { useFlatElementData } from '../use-flat-element-data';
import { defaultPortStyle } from '../../theme/element-theme';
import type { FlatElementData } from '../../types/data-types';

describe('useFlatElementData', () => {

    const minimalElementData: FlatElementData = {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
    };

    const mockGraph = {} as never;

    function callForwardMapper(
        hook: ReturnType<typeof useFlatElementData<any>>,
        data: FlatElementData = minimalElementData,
    ) {
        return hook.mapDataToElementAttributes!({
            id: 'el-1',
            data,
            graph: mockGraph,
        });
    }

    function callReverseMapper(
        hook: ReturnType<typeof useFlatElementData<any>>,
        attributes: Record<string, unknown> = {},
    ) {
        return hook.mapElementAttributesToData!({
            id: 'el-1',
            attributes: attributes as never,
            defaultAttributes: {} as never,
            element: {} as never,
            graph: mockGraph,
        });
    }

    // ── No options ─────────────────────────────────────────────────────────

    it('returns passthrough flat mapper when no options given', () => {
        const { result } = renderHook(() => useFlatElementData());
        const cellJson = callForwardMapper(result.current);
        expect(cellJson.position).toEqual({ x: 10, y: 20 });
        expect(cellJson.size).toEqual({ width: 100, height: 50 });
    });

    it('returns passthrough reverse mapper when no options given', () => {
        const { result } = renderHook(() => useFlatElementData());
        const data = callReverseMapper(result.current, {
            position: { x: 10, y: 20 },
            size: { width: 100, height: 50 },
            data: { label: 'hello' },
        });
        expect(data).toEqual({ x: 10, y: 20, width: 100, height: 50, label: 'hello' });
    });

    // ── Defaults only ──────────────────────────────────────────────────────

    it('applies static portDefaults to ports', () => {
        const { result } = renderHook(() => useFlatElementData({
            defaults: { portStyle: { color: 'red' } },
        }));
        const cellJson = callForwardMapper(result.current, {
            ...minimalElementData,
            ports: { p1: { cx: 0, cy: 0 } },
        });

        const portItem = (cellJson.ports as { items: Array<Record<string, unknown>> })?.items[0];
        const portBody = (portItem?.attrs as Record<string, Record<string, any>>)?.portBody;
        expect(portBody?.style?.fill).toBe('red');
        expect(portBody?.style?.strokeWidth).toBe(defaultPortStyle.outlineWidth);
    });

    it('applies static data defaults (ports, dimensions)', () => {
        const { result } = renderHook(() => useFlatElementData({
            defaults: {
                width: 200,
                height: 80,
                ports: {
                    out: { cx: 'calc(w)', cy: 'calc(0.5*h)' },
                },
            },
        }));
        const cellJson = callForwardMapper(result.current, { x: 50, y: 50 });

        expect(cellJson.size).toEqual({ width: 200, height: 80 });
        const portItem = (cellJson.ports as { items: Array<Record<string, unknown>> })?.items[0];
        expect(portItem).toBeDefined();
    });

    it('element data takes precedence over static data defaults', () => {
        const { result } = renderHook(() => useFlatElementData({
            defaults: { width: 200, height: 80 },
        }));
        const cellJson = callForwardMapper(result.current, {
            x: 10,
            y: 20,
            width: 300,
            height: 100,
        });

        expect(cellJson.size).toEqual({ width: 300, height: 100 });
    });

    it('applies portDefaults to all ports', () => {
        const { result } = renderHook(() => useFlatElementData({
            defaults: {
                width: 120,
                height: 60,
                ports: { p1: { cx: 0, cy: 0 } },
                portStyle: { color: 'blue', width: 16 },
            },
        }));
        const cellJson = callForwardMapper(result.current, { x: 0, y: 0 });

        expect(cellJson.size).toEqual({ width: 120, height: 60 });
        const portItem = (cellJson.ports as { items: Array<Record<string, unknown>> })?.items[0];
        const portBody = (portItem?.attrs as Record<string, Record<string, any>>)?.portBody;
        expect(portBody?.style?.fill).toBe('blue');
        expect(portItem?.size).toEqual({ width: 16, height: defaultPortStyle.height });
    });

    // ── Defaults with width/height ──────────────────────────────────────────

    it('defaults with width/height produce correct size and are not in result.data', () => {
        const { result } = renderHook(() => useFlatElementData({
            defaults: { width: 150, height: 75 },
        }));
        const cellJson = callForwardMapper(result.current, { x: 10, y: 20 });

        expect(cellJson.size).toEqual({ width: 150, height: 75 });
        const cellData = cellJson.data as Record<string, unknown>;
        expect(cellData).not.toHaveProperty('width');
        expect(cellData).not.toHaveProperty('height');
    });

    // ── Callback defaults ──────────────────────────────────────────────────

    it('applies per-element defaults via callback', () => {
        const portsByKind: Record<string, Record<string, { cx: number | string; cy: string }>> = {
            start: { out: { cx: 'calc(w)', cy: 'calc(0.5*h)' } },
        };
        const defaultPorts = {
            in: { cx: 0, cy: 'calc(0.5*h)' },
            out: { cx: 'calc(w)', cy: 'calc(0.5*h)' },
        };
        const { result } = renderHook(() => useFlatElementData({
            defaults: (data) => {
                const ports = portsByKind[data.kind as string] ?? defaultPorts;
                return {
                    ports,
                    portStyle: { color: data.kind === 'start' ? 'green' : 'orange' },
                };
            },
        }));

        // "start" element — 1 port, green
        const startJson = callForwardMapper(result.current, { ...minimalElementData, kind: 'start' });
        const startPorts = (startJson.ports as { items: Array<Record<string, unknown>> })?.items;
        expect(startPorts).toHaveLength(1);
        const startBody = (startPorts[0]?.attrs as Record<string, Record<string, any>>)?.portBody;
        expect(startBody?.style?.fill).toBe('green');

        // Other element — 2 ports, orange
        const otherJson = callForwardMapper(result.current, { ...minimalElementData, kind: 'process' });
        const otherPorts = (otherJson.ports as { items: Array<Record<string, unknown>> })?.items;
        expect(otherPorts).toHaveLength(2);
        const otherBody = (otherPorts[0]?.attrs as Record<string, Record<string, any>>)?.portBody;
        expect(otherBody?.style?.fill).toBe('orange');
    });

    // ── Round-trip pollution (defaults) ─────────────────────────────────────

    it('does not pollute cell.data with default-provided keys', () => {
        const { result } = renderHook(() => useFlatElementData({
            defaults: {
                portStyle: { color: 'red' },
                ports: { p1: { cx: 0, cy: 0 } },
            },
        }));
        const cellJson = callForwardMapper(result.current, {
            x: 10, y: 20, width: 100, height: 50,
        });
        const cellData = cellJson.data as Record<string, unknown>;

        expect(cellData).not.toHaveProperty('portStyle');
        expect(cellData).not.toHaveProperty('ports');
    });

    it('preserves user-provided keys that overlap with defaults in cell.data', () => {
        const { result } = renderHook(() => useFlatElementData({
            defaults: { portStyle: { color: 'red' } },
        }));
        const cellJson = callForwardMapper(result.current, {
            x: 10, y: 20, width: 100, height: 50,
            portStyle: { color: 'blue' },
        });
        const cellData = cellJson.data as Record<string, unknown>;

        expect(cellData).toHaveProperty('portStyle');
    });

    // ── Pick only ──────────────────────────────────────────────────────────

    it('pick filters reverse-mapped data to only picked keys', () => {
        const { result } = renderHook(() => useFlatElementData<FlatElementData & { label: string; kind: string }>({
            pick: ['label', 'kind'],
        }));
        const data = callReverseMapper(result.current, {
            position: { x: 10, y: 20 },
            size: { width: 100, height: 50 },
            z: 5,
            data: { label: 'hello', kind: 'process', extra: 'should-be-removed' },
        });

        expect(data).toEqual({ label: 'hello', kind: 'process' });
        expect(data).not.toHaveProperty('x');
        expect(data).not.toHaveProperty('y');
        expect(data).not.toHaveProperty('width');
        expect(data).not.toHaveProperty('height');
        expect(data).not.toHaveProperty('z');
        expect(data).not.toHaveProperty('extra');
    });

    // ── Defaults + Pick ────────────────────────────────────────────────────

    it('defaults + pick: forward applies defaults, reverse strips to picked keys', () => {
        const { result } = renderHook(() => useFlatElementData<FlatElementData & { label: string }>({
            defaults: { width: 100, height: 50 },
            pick: ['label'],
        }));

        // Forward: defaults applied
        const cellJson = callForwardMapper(result.current, { x: 10, y: 20, label: 'test' } as never);
        expect(cellJson.size).toEqual({ width: 100, height: 50 });
        const cellData = cellJson.data as Record<string, unknown>;
        expect(cellData).not.toHaveProperty('width');
        expect(cellData).not.toHaveProperty('height');

        // Reverse: only picked keys
        const data = callReverseMapper(result.current, {
            position: { x: 10, y: 20 },
            size: { width: 100, height: 50 },
            data: { label: 'test' },
        });
        expect(data).toEqual({ label: 'test' });
        expect(data).not.toHaveProperty('x');
        expect(data).not.toHaveProperty('width');
    });

    // ── Pick preserves interactive values ───────────────────────────────────

    it('pick preserves picked values even after user interaction (e.g. width in pick + user resized)', () => {
        const { result } = renderHook(() => useFlatElementData<FlatElementData & { label: string }>({
            defaults: { width: 100, height: 50 },
            pick: ['label', 'width', 'height'],
        }));

        // Simulate: user resized to 200x100
        const data = callReverseMapper(result.current, {
            position: { x: 10, y: 20 },
            size: { width: 200, height: 100 },
            data: { label: 'test' },
        });
        expect(data).toEqual({ label: 'test', width: 200, height: 100 });
        expect(data).not.toHaveProperty('x');
        expect(data).not.toHaveProperty('y');
    });

    // ── mapAttributes (forward post-processing) ────────────────────────────

    it('mapAttributes post-processes forward-mapped attributes', () => {
        const { result } = renderHook(() => useFlatElementData({
            mapAttributes: ({ attributes }) => ({
                ...attributes,
                attrs: { body: { fill: 'red' } },
            }),
        }));

        const cellJson = callForwardMapper(result.current);
        expect(cellJson.attrs).toEqual({ body: { fill: 'red' } });
        expect(cellJson.position).toEqual({ x: 10, y: 20 });
    });

    it('mapAttributes receives original data and graph', () => {
        let receivedData: FlatElementData | undefined;
        let receivedGraph: unknown;

        const { result } = renderHook(() => useFlatElementData({
            mapAttributes: ({ attributes, data, graph }) => {
                receivedData = data;
                receivedGraph = graph;
                return attributes;
            },
        }));

        callForwardMapper(result.current);
        expect(receivedData).toEqual(minimalElementData);
        expect(receivedGraph).toBe(mockGraph);
    });

    // ── mapData (reverse post-processing) ──────────────────────────────────

    it('mapData post-processes reverse-mapped data', () => {
        const { result } = renderHook(() => useFlatElementData<FlatElementData & { custom: string }>({
            mapData: ({ data }) => ({
                ...data,
                custom: 'injected',
            }),
        }));

        const data = callReverseMapper(result.current, {
            position: { x: 10, y: 20 },
            size: { width: 100, height: 50 },
            data: { label: 'hello' },
        });
        expect(data.custom).toBe('injected');
        expect(data.x).toBe(10);
    });

    it('mapData runs before pick', () => {
        const { result } = renderHook(() => useFlatElementData<FlatElementData & { label: string; derived: string }>({
            mapData: ({ data }) => ({
                ...data,
                derived: 'computed',
            }),
            pick: ['label', 'derived'],
        }));

        const data = callReverseMapper(result.current, {
            position: { x: 10, y: 20 },
            size: { width: 100, height: 50 },
            data: { label: 'hello' },
        });
        expect(data).toEqual({ label: 'hello', derived: 'computed' });
        expect(data).not.toHaveProperty('x');
    });

    // ── Memoization ────────────────────────────────────────────────────────

    it('returns stable reference for static defaults', () => {
        const { result, rerender } = renderHook(() =>
            useFlatElementData({ defaults: { portStyle: { color: 'blue' } } }),
        );
        const firstForward = result.current.mapDataToElementAttributes;
        const firstReverse = result.current.mapElementAttributesToData;
        rerender();
        expect(result.current.mapDataToElementAttributes).toBe(firstForward);
        expect(result.current.mapElementAttributesToData).toBe(firstReverse);
    });

    const stableCallback = (data: FlatElementData) => ({
        portStyle: { color: data.kind === 'a' ? 'red' : 'blue' },
    });

    it('returns stable reference for callback defaults', () => {
        const { result, rerender } = renderHook(() =>
            useFlatElementData({ defaults: stableCallback }),
        );
        const firstForward = result.current.mapDataToElementAttributes;
        const firstReverse = result.current.mapElementAttributesToData;
        rerender();
        expect(result.current.mapDataToElementAttributes).toBe(firstForward);
        expect(result.current.mapElementAttributesToData).toBe(firstReverse);
    });

    it('recreates mapper when deps change', () => {
        let color = 'red';
        const { result, rerender } = renderHook(() =>
            useFlatElementData({ defaults: () => ({ portStyle: { color } }) }, [color]),
        );
        const firstForward = result.current.mapDataToElementAttributes;
        const firstReverse = result.current.mapElementAttributesToData;

        // Same deps — stable
        rerender();
        expect(result.current.mapDataToElementAttributes).toBe(firstForward);
        expect(result.current.mapElementAttributesToData).toBe(firstReverse);

        // Deps change — new reference
        color = 'blue';
        rerender();
        expect(result.current.mapDataToElementAttributes).not.toBe(firstForward);
        expect(result.current.mapElementAttributesToData).not.toBe(firstReverse);
    });
});
