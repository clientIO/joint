import { renderHook } from '@testing-library/react';
import { useFlatLinkData } from '../use-flat-link-data';
import { defaultLinkStyle, defaultLabelStyle } from '../../theme/link-theme';
import type { FlatLinkData } from '../../types/data-types';

describe('useFlatLinkData', () => {

    const minimalLinkData: FlatLinkData = {
        source: 'a',
        target: 'b',
    };

    const mockGraph = {} as never;

    function callForwardMapper(
        hook: ReturnType<typeof useFlatLinkData<any>>,
        data: FlatLinkData = minimalLinkData,
    ) {
        return hook.mapDataToLinkAttributes!({
            id: 'link-1',
            data,
            graph: mockGraph,
        });
    }

    function callReverseMapper(
        hook: ReturnType<typeof useFlatLinkData<any>>,
        attributes: Record<string, unknown> = {},
    ) {
        return hook.mapLinkAttributesToData!({
            id: 'link-1',
            attributes: attributes as never,
            defaultAttributes: {} as never,
            link: {} as never,
            graph: mockGraph,
        });
    }

    // ── No options ─────────────────────────────────────────────────────────

    it('returns mapper using internal defaults when no overrides given', () => {
        const { result } = renderHook(() => useFlatLinkData());
        const cellJson = callForwardMapper(result.current);

        expect(cellJson.attrs?.line?.style?.stroke).toBe(defaultLinkStyle.color);
        expect(cellJson.attrs?.line?.style?.strokeWidth).toBe(defaultLinkStyle.width);
    });

    it('returns passthrough reverse mapper when no options given', () => {
        const { result } = renderHook(() => useFlatLinkData());
        const data = callReverseMapper(result.current, {
            source: { id: 'a' },
            target: { id: 'b' },
            data: { source: 'a', target: 'b', label: 'hello' },
        });
        expect(data).toEqual({ source: 'a', target: 'b', label: 'hello' });
    });

    // ── Static defaults ─────────────────────────────────────────────────

    it('applies static line style defaults', () => {
        const { result } = renderHook(() => useFlatLinkData({ defaults: { color: 'red' } }));
        const cellJson = callForwardMapper(result.current);

        expect(cellJson.attrs?.line?.style?.stroke).toBe('red');
        expect(cellJson.attrs?.line?.style?.strokeWidth).toBe(defaultLinkStyle.width);
    });

    it('applies full line style override', () => {
        const fullOverride: Partial<FlatLinkData> = {
            color: '#00ff00',
            width: 5,
            sourceMarker: 'arrow',
            targetMarker: 'circle',
            className: 'my-line',
            dasharray: '5,5',
            linecap: 'round',
            linejoin: 'bevel',
            wrapperWidth: 12,
            wrapperColor: 'blue',
            wrapperClassName: 'my-wrapper',
        };
        const { result } = renderHook(() => useFlatLinkData({ defaults: fullOverride }));
        const cellJson = callForwardMapper(result.current);

        expect(cellJson.attrs?.line?.style?.stroke).toBe('#00ff00');
        expect(cellJson.attrs?.line?.style?.strokeWidth).toBe(5);
        expect(cellJson.attrs?.line?.style?.strokeDasharray).toBe('5,5');
        expect(cellJson.attrs?.line?.style?.strokeLinecap).toBe('round');
        expect(cellJson.attrs?.line?.style?.strokeLinejoin).toBe('bevel');
    });

    it('link data takes precedence over defaults', () => {
        const { result } = renderHook(() => useFlatLinkData({ defaults: { color: 'red', width: 5 } }));
        const cellJson = callForwardMapper(result.current, {
            source: 'a',
            target: 'b',
            color: 'blue',
        });

        expect(cellJson.attrs?.line?.style?.stroke).toBe('blue');
        expect(cellJson.attrs?.line?.style?.strokeWidth).toBe(5);
    });

    // ── labelStyle ──────────────────────────────────────────────────────

    it('applies labelStyle defaults to labels', () => {
        const { result } = renderHook(() =>
            useFlatLinkData({
                defaults: {
                    labelStyle: {
                        color: '#ff0000',
                        fontSize: 20,
                        fontFamily: 'monospace',
                    },
                },
            })
        );
        const cellJson = callForwardMapper(result.current, {
            source: 'a',
            target: 'b',
            labels: {
                'lbl-1': { text: 'Hello' },
            },
        });

        const label = (cellJson.labels as Array<Record<string, unknown>>)?.[0];
        expect(label).toBeDefined();
        const labelText = (label?.attrs as Record<string, Record<string, any>>)?.labelText;
        expect(labelText?.style?.fill).toBe('#ff0000');
        expect(labelText?.style?.fontSize).toBe(20);
        expect(labelText?.style?.fontFamily).toBe('monospace');
    });

    it('individual label properties override labelStyle', () => {
        const { result } = renderHook(() =>
            useFlatLinkData({
                defaults: { labelStyle: { color: 'red', fontSize: 20 } },
            })
        );
        const cellJson = callForwardMapper(result.current, {
            source: 'a',
            target: 'b',
            labels: {
                'lbl-1': { text: 'Hello', color: 'green' },
            },
        });

        const label = (cellJson.labels as Array<Record<string, unknown>>)?.[0];
        const labelText = (label?.attrs as Record<string, Record<string, any>>)?.labelText;
        expect(labelText?.style?.fill).toBe('green');
        expect(labelText?.style?.fontSize).toBe(20);
    });

    it('labels use internal defaults when no labelStyle given', () => {
        const { result } = renderHook(() => useFlatLinkData());
        const cellJson = callForwardMapper(result.current, {
            source: 'a',
            target: 'b',
            labels: { 'lbl-1': { text: 'Hello' } },
        });

        const label = (cellJson.labels as Array<Record<string, unknown>>)?.[0];
        const labelText = (label?.attrs as Record<string, Record<string, any>>)?.labelText;
        expect(labelText?.style?.fill).toBe(defaultLabelStyle.color);
        expect(labelText?.style?.fontSize).toBe(defaultLabelStyle.fontSize);
    });

    // ── Callback defaults ──────────────────────────────────────────────────

    it('applies per-link defaults via callback', () => {
        const { result } = renderHook(() => useFlatLinkData({
            defaults: (data) => ({
                color: data.source === 'a' ? 'red' : 'blue',
            }),
        }));

        const fromA = callForwardMapper(result.current, { source: 'a', target: 'b' });
        expect(fromA.attrs?.line?.style?.stroke).toBe('red');

        const fromX = callForwardMapper(result.current, { source: 'x', target: 'b' });
        expect(fromX.attrs?.line?.style?.stroke).toBe('blue');
    });

    // ── Does not pollute cell.data ──────────────────────────────────────

    it('does not pollute cell.data with internally-defaulted values', () => {
        const { result } = renderHook(() => useFlatLinkData());
        const cellJson = callForwardMapper(result.current);
        const cellData = cellJson.data as Record<string, unknown>;

        expect(cellData).not.toHaveProperty('color');
        expect(cellData).not.toHaveProperty('width');
    });

    it('does not pollute cell.data with default-provided keys', () => {
        const { result } = renderHook(() => useFlatLinkData({
            defaults: {
                color: 'red',
                width: 3,
                labelStyle: { color: '#fff', fontSize: 11 },
            },
        }));
        const cellJson = callForwardMapper(result.current);
        const cellData = cellJson.data as Record<string, unknown>;

        expect(cellData).not.toHaveProperty('color');
        expect(cellData).not.toHaveProperty('width');
        expect(cellData).not.toHaveProperty('labelStyle');
    });

    it('preserves user-provided keys that overlap with defaults in cell.data', () => {
        const { result } = renderHook(() => useFlatLinkData({
            defaults: {
                color: 'red',
                width: 3,
            },
        }));
        const cellJson = callForwardMapper(result.current, {
            source: 'a',
            target: 'b',
            color: 'blue',
        });
        const cellData = cellJson.data as Record<string, unknown>;

        expect(cellData).toHaveProperty('color');
        expect(cellData).not.toHaveProperty('width');
    });

    // ── Pick only ──────────────────────────────────────────────────────────

    it('pick filters reverse-mapped data to only picked keys', () => {
        const { result } = renderHook(() => useFlatLinkData<FlatLinkData & { label: string }>({
            pick: ['source', 'target', 'label'],
        }));
        const data = callReverseMapper(result.current, {
            source: { id: 'a' },
            target: { id: 'b' },
            z: 5,
            data: { source: 'a', target: 'b', label: 'hello', color: 'red' },
        });

        expect(data).toEqual({ source: 'a', target: 'b', label: 'hello' });
        expect(data).not.toHaveProperty('z');
        expect(data).not.toHaveProperty('color');
    });

    // ── Defaults + Pick ────────────────────────────────────────────────────

    it('defaults + pick: forward applies defaults, reverse strips to picked keys', () => {
        const { result } = renderHook(() => useFlatLinkData<FlatLinkData & { label: string }>({
            defaults: { color: 'red', targetMarker: 'arrow' },
            pick: ['source', 'target', 'label'],
        }));

        // Forward: defaults applied
        const cellJson = callForwardMapper(result.current, { source: 'a', target: 'b', label: 'test' } as never);
        expect(cellJson.attrs?.line?.style?.stroke).toBe('red');
        const cellData = cellJson.data as Record<string, unknown>;
        expect(cellData).not.toHaveProperty('color');
        expect(cellData).not.toHaveProperty('targetMarker');

        // Reverse: only picked keys
        const data = callReverseMapper(result.current, {
            source: { id: 'a' },
            target: { id: 'b' },
            z: 3,
            data: { source: 'a', target: 'b', label: 'test', color: 'red' },
        });
        expect(data).toEqual({ source: 'a', target: 'b', label: 'test' });
        expect(data).not.toHaveProperty('z');
        expect(data).not.toHaveProperty('color');
    });

    // ── mapAttributes (forward post-processing) ────────────────────────────

    it('mapAttributes post-processes forward-mapped attributes', () => {
        const { result } = renderHook(() => useFlatLinkData({
            mapAttributes: ({ attributes }) => ({
                ...attributes,
                attrs: { ...attributes.attrs, custom: { stroke: 'green' } },
            }),
        }));

        const cellJson = callForwardMapper(result.current);
        expect(cellJson.attrs?.custom).toEqual({ stroke: 'green' });
        expect(cellJson.attrs?.line).toBeDefined();
    });

    it('mapAttributes receives original data and graph', () => {
        let receivedData: FlatLinkData | undefined;
        let receivedGraph: unknown;

        const { result } = renderHook(() => useFlatLinkData({
            mapAttributes: ({ attributes, data, graph }) => {
                receivedData = data;
                receivedGraph = graph;
                return attributes;
            },
        }));

        callForwardMapper(result.current);
        expect(receivedData).toEqual(minimalLinkData);
        expect(receivedGraph).toBe(mockGraph);
    });

    // ── mapData (reverse post-processing) ──────────────────────────────────

    it('mapData post-processes reverse-mapped data', () => {
        const { result } = renderHook(() => useFlatLinkData<FlatLinkData & { custom: string }>({
            mapData: ({ data }) => ({
                ...data,
                custom: 'injected',
            }),
        }));

        const data = callReverseMapper(result.current, {
            source: { id: 'a' },
            target: { id: 'b' },
            data: { source: 'a', target: 'b' },
        });
        expect(data.custom).toBe('injected');
        expect(data.source).toBe('a');
    });

    it('mapData runs before pick', () => {
        const { result } = renderHook(() => useFlatLinkData<FlatLinkData & { label: string; derived: string }>({
            mapData: ({ data }) => ({
                ...data,
                derived: 'computed',
            }),
            pick: ['source', 'target', 'derived'],
        }));

        const data = callReverseMapper(result.current, {
            source: { id: 'a' },
            target: { id: 'b' },
            data: { source: 'a', target: 'b', label: 'hello' },
        });
        expect(data).toEqual({ source: 'a', target: 'b', derived: 'computed' });
        expect(data).not.toHaveProperty('label');
    });

    // ── Memoization ────────────────────────────────────────────────────────

    it('returns stable reference for static defaults', () => {
        const { result, rerender } = renderHook(() =>
            useFlatLinkData({ defaults: { color: 'red' } }),
        );
        const firstForward = result.current.mapDataToLinkAttributes;
        const firstReverse = result.current.mapLinkAttributesToData;
        rerender();
        expect(result.current.mapDataToLinkAttributes).toBe(firstForward);
        expect(result.current.mapLinkAttributesToData).toBe(firstReverse);
    });

    const stableCallback = (data: FlatLinkData) => ({
        color: data.source === 'a' ? 'red' : 'blue',
    });

    it('returns stable reference for callback defaults', () => {
        const { result, rerender } = renderHook(() =>
            useFlatLinkData({ defaults: stableCallback }),
        );
        const firstForward = result.current.mapDataToLinkAttributes;
        const firstReverse = result.current.mapLinkAttributesToData;
        rerender();
        expect(result.current.mapDataToLinkAttributes).toBe(firstForward);
        expect(result.current.mapLinkAttributesToData).toBe(firstReverse);
    });

    it('recreates mapper when deps change', () => {
        let color = 'red';
        const { result, rerender } = renderHook(() =>
            useFlatLinkData({ defaults: () => ({ color }) }, [color]),
        );
        const firstForward = result.current.mapDataToLinkAttributes;
        const firstReverse = result.current.mapLinkAttributesToData;

        rerender();
        expect(result.current.mapDataToLinkAttributes).toBe(firstForward);
        expect(result.current.mapLinkAttributesToData).toBe(firstReverse);

        color = 'blue';
        rerender();
        expect(result.current.mapDataToLinkAttributes).not.toBe(firstForward);
        expect(result.current.mapLinkAttributesToData).not.toBe(firstReverse);
    });
});
