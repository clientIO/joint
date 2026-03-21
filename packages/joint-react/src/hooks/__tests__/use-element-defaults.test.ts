import { renderHook } from '@testing-library/react';
import { useElementDefaults } from '../use-element-defaults';
import { defaultPortStyle } from '../../theme/element-theme';
import type { FlatElementData } from '../../types/data-types';

describe('useElementDefaults', () => {

    const minimalElementData: FlatElementData = {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
    };

    function callMapper(
        hook: ReturnType<typeof useElementDefaults>,
        data: FlatElementData = minimalElementData,
    ) {
        return hook.mapDataToElementAttributes!({
            id: 'el-1',
            data,
            graph: {} as never,
            toAttributes: (() => ({})) as never,
        });
    }

    // ── No defaults ────────────────────────────────────────────────────────

    it('returns default mapper when no defaults given', () => {
        const { result } = renderHook(() => useElementDefaults());
        const cellJson = callMapper(result.current);
        expect(cellJson.position).toEqual({ x: 10, y: 20 });
        expect(cellJson.size).toEqual({ width: 100, height: 50 });
    });

    // ── Static portDefaults ─────────────────────────────────────────────

    it('applies static portDefaults to ports', () => {
        const { result } = renderHook(() => useElementDefaults({
            portStyle: { color: 'red' },
        }));
        const cellJson = callMapper(result.current, {
            ...minimalElementData,
            ports: { p1: { cx: 0, cy: 0 } },
        });

        const portItem = (cellJson.ports as { items: Array<Record<string, unknown>> })?.items[0];
        const portBody = (portItem?.attrs as Record<string, Record<string, any>>)?.portBody;
        expect(portBody?.style?.fill).toBe('red');
        expect(portBody?.style?.strokeWidth).toBe(defaultPortStyle.outlineWidth);
    });

    // ── Static data defaults ───────────────────────────────────────────────

    it('applies static data defaults (ports, dimensions)', () => {
        const { result } = renderHook(() => useElementDefaults({
            width: 200,
            height: 80,
            ports: {
                out: { cx: 'calc(w)', cy: 'calc(0.5*h)' },
            },
        }));
        // Element data has no ports or dimensions — defaults fill in
        const cellJson = callMapper(result.current, { x: 50, y: 50 });

        expect(cellJson.size).toEqual({ width: 200, height: 80 });
        const portItem = (cellJson.ports as { items: Array<Record<string, unknown>> })?.items[0];
        expect(portItem).toBeDefined();
    });

    it('element data takes precedence over static data defaults', () => {
        const { result } = renderHook(() => useElementDefaults({ width: 200, height: 80 }));
        const cellJson = callMapper(result.current, {
            x: 10,
            y: 20,
            width: 300,
            height: 100,
        });

        expect(cellJson.size).toEqual({ width: 300, height: 100 });
    });

    // ── portDefaults applies to all ports ────────────────────────────────

    it('applies portDefaults to all ports', () => {
        const { result } = renderHook(() => useElementDefaults({
            width: 120,
            height: 60,
            ports: { p1: { cx: 0, cy: 0 } },
            portStyle: { color: 'blue', width: 16 },
        }));
        const cellJson = callMapper(result.current, { x: 0, y: 0 });

        expect(cellJson.size).toEqual({ width: 120, height: 60 });
        const portItem = (cellJson.ports as { items: Array<Record<string, unknown>> })?.items[0];
        const portBody = (portItem?.attrs as Record<string, Record<string, any>>)?.portBody;
        expect(portBody?.style?.fill).toBe('blue');
        expect(portItem?.size).toEqual({ width: 16, height: defaultPortStyle.height });
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
        const { result } = renderHook(() => useElementDefaults((data) => {
            const ports = portsByKind[data.kind as string] ?? defaultPorts;
            return {
                ports,
                portStyle: { color: data.kind === 'start' ? 'green' : 'orange' },
            };
        }));

        // "start" element — 1 port, green
        const startJson = callMapper(result.current, { ...minimalElementData, kind: 'start' });
        const startPorts = (startJson.ports as { items: Array<Record<string, unknown>> })?.items;
        expect(startPorts).toHaveLength(1);
        const startBody = (startPorts[0]?.attrs as Record<string, Record<string, any>>)?.portBody;
        expect(startBody?.style?.fill).toBe('green');

        // Other element — 2 ports, orange
        const otherJson = callMapper(result.current, { ...minimalElementData, kind: 'process' });
        const otherPorts = (otherJson.ports as { items: Array<Record<string, unknown>> })?.items;
        expect(otherPorts).toHaveLength(2);
        const otherBody = (otherPorts[0]?.attrs as Record<string, Record<string, any>>)?.portBody;
        expect(otherBody?.style?.fill).toBe('orange');
    });

    // ── Round-trip pollution ────────────────────────────────────────────────

    it('does not pollute cell.data with default-provided keys', () => {
        const { result } = renderHook(() => useElementDefaults({
            portStyle: { color: 'red' },
            ports: { p1: { cx: 0, cy: 0 } },
        }));
        const cellJson = callMapper(result.current, {
            x: 10, y: 20, width: 100, height: 50,
        });
        const cellData = cellJson.data as Record<string, unknown>;

        // portStyle and ports came from defaults, not user data — must be stripped
        expect(cellData).not.toHaveProperty('portStyle');
        expect(cellData).not.toHaveProperty('ports');
    });

    it('preserves user-provided keys that overlap with defaults in cell.data', () => {
        const { result } = renderHook(() => useElementDefaults({
            portStyle: { color: 'red' },
        }));
        const cellJson = callMapper(result.current, {
            x: 10, y: 20, width: 100, height: 50,
            portStyle: { color: 'blue' },
        });
        const cellData = cellJson.data as Record<string, unknown>;

        // portStyle was in user data — must be preserved
        expect(cellData).toHaveProperty('portStyle');
    });

    // ── Memoization ────────────────────────────────────────────────────────

    it('returns stable reference for static defaults', () => {
        const { result, rerender } = renderHook(() =>
            useElementDefaults({ portStyle: { color: 'blue' } }),
        );
        const first = result.current.mapDataToElementAttributes;
        rerender();
        expect(result.current.mapDataToElementAttributes).toBe(first);
    });

    const stableCallback = (data: FlatElementData) => ({
        portStyle: { color: data.kind === 'a' ? 'red' : 'blue' },
    });

    it('returns stable reference for callback defaults', () => {
        const { result, rerender } = renderHook(() => useElementDefaults(stableCallback));
        const first = result.current.mapDataToElementAttributes;
        rerender();
        expect(result.current.mapDataToElementAttributes).toBe(first);
    });

    it('recreates mapper when deps change', () => {
        let color = 'red';
        const { result, rerender } = renderHook(() =>
            useElementDefaults(() => ({ portStyle: { color } }), [color]),
        );
        const first = result.current.mapDataToElementAttributes;

        // Same deps — stable
        rerender();
        expect(result.current.mapDataToElementAttributes).toBe(first);

        // Deps change — new reference
        color = 'blue';
        rerender();
        expect(result.current.mapDataToElementAttributes).not.toBe(first);
    });
});
