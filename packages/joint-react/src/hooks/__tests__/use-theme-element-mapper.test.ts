import { renderHook } from '@testing-library/react';
import { useThemeElementMapper } from '../use-theme-element-mapper';
import { defaultElementTheme } from '../../theme/element-theme';
import type { FlatElementData } from '../../types/element-types';

describe('useThemeElementMapper', () => {

    const minimalElementData: FlatElementData = {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
    };

    function callMapper(
        hook: ReturnType<typeof useThemeElementMapper>,
        data: FlatElementData = minimalElementData,
    ) {
        return hook.mapDataToElementAttributes!({
            id: 'el-1',
            data,
            graph: {} as never,
            toAttributes: (() => ({})) as never,
        });
    }

    it('returns mapper using defaultElementTheme when no overrides given', () => {
        const { result } = renderHook(() => useThemeElementMapper());
        const cellJson = callMapper(result.current, {
            ...minimalElementData,
            ports: {
                p1: { cx: 0, cy: 0 },
            },
        });

        const portItem = (cellJson.ports as { items: Array<Record<string, unknown>> })?.items[0];
        expect(portItem).toBeDefined();
        const portBody = (portItem?.attrs as Record<string, Record<string, unknown>>)?.portBody;
        expect(portBody?.fill).toBe(defaultElementTheme.portColor);
    });

    it('applies partial theme override to ports', () => {
        const { result } = renderHook(() => useThemeElementMapper({ portColor: 'red' }));
        const cellJson = callMapper(result.current, {
            ...minimalElementData,
            ports: {
                p1: { cx: 0, cy: 0 },
            },
        });

        const portItem = (cellJson.ports as { items: Array<Record<string, unknown>> })?.items[0];
        const portBody = (portItem?.attrs as Record<string, Record<string, unknown>>)?.portBody;
        expect(portBody?.fill).toBe('red');
        // Other defaults preserved
        expect(portBody?.strokeWidth).toBe(defaultElementTheme.portStrokeWidth);
    });

    it('applies full theme override to ports', () => {
        const fullOverride = {
            portColor: '#00ff00',
            portWidth: 16,
            portHeight: 16,
            portShape: 'rect' as const,
            portStroke: '#ff0000',
            portStrokeWidth: 2,
            portPassive: true,
            portLabelPosition: 'inside',
            portLabelColor: '#0000ff',
        };
        const { result } = renderHook(() => useThemeElementMapper(fullOverride));
        const cellJson = callMapper(result.current, {
            ...minimalElementData,
            ports: {
                p1: { cx: 50, cy: 25 },
            },
        });

        const portItem = (cellJson.ports as { items: Array<Record<string, unknown>> })?.items[0];
        const portBody = (portItem?.attrs as Record<string, Record<string, unknown>>)?.portBody;
        expect(portBody?.fill).toBe('#00ff00');
        expect(portBody?.stroke).toBe('#ff0000');
        expect(portBody?.strokeWidth).toBe(2);
        expect(portBody?.magnet).toBe('passive');
        // rect shape uses width/height attributes
        expect(portBody?.width).toBe(16);
        expect(portBody?.height).toBe(16);
    });

    it('returns stable reference when theme values do not change', () => {
        const { result, rerender } = renderHook(() =>
            useThemeElementMapper({ portColor: 'blue' }),
        );
        const first = result.current.mapDataToElementAttributes;
        rerender();
        expect(result.current.mapDataToElementAttributes).toBe(first);
    });

    it('works without ports (theme is irrelevant)', () => {
        const { result } = renderHook(() => useThemeElementMapper({ portColor: 'red' }));
        const cellJson = callMapper(result.current);

        expect(cellJson.position).toEqual({ x: 10, y: 20 });
        expect(cellJson.size).toEqual({ width: 100, height: 50 });
        expect(cellJson.ports).toBeUndefined();
    });

    it('port label uses theme labelColor', () => {
        const { result } = renderHook(() =>
            useThemeElementMapper({ portLabelColor: '#ff00ff' }),
        );
        const cellJson = callMapper(result.current, {
            ...minimalElementData,
            ports: {
                p1: { cx: 0, cy: 0, label: 'in' },
            },
        });

        const portItem = (cellJson.ports as { items: Array<Record<string, unknown>> })?.items[0];
        const portLabel = portItem?.label as Record<string, unknown>;
        const labelMarkup = portLabel?.markup as Array<Record<string, unknown>>;
        expect(labelMarkup?.[0]?.attributes).toEqual({ fill: '#ff00ff' });
    });
});
