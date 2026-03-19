import { renderHook } from '@testing-library/react';
import { useThemeLinkMapper } from '../use-theme-link-mapper';
import { defaultLinkTheme } from '../../theme/link-theme';
import type { FlatLinkData } from '../../types/link-types';

describe('useThemeLinkMapper', () => {

    const minimalLinkData: FlatLinkData = {
        source: 'a',
        target: 'b',
    };

    function callMapper(
        hook: ReturnType<typeof useThemeLinkMapper>,
        data: FlatLinkData = minimalLinkData,
    ) {
        return hook.mapDataToLinkAttributes!({
            id: 'link-1',
            data,
            // graph and toAttributes are unused by the hook's mapper
            graph: {} as never,
            toAttributes: (() => ({})) as never,
        });
    }

    it('returns mapper using defaultLinkTheme when no overrides given', () => {
        const { result } = renderHook(() => useThemeLinkMapper());
        const cellJson = callMapper(result.current);

        // Default color is applied via attrs.line.stroke
        expect(cellJson.attrs?.line?.stroke).toBe(defaultLinkTheme.color);
        expect(cellJson.attrs?.line?.strokeWidth).toBe(defaultLinkTheme.width);
    });

    it('applies partial theme override', () => {
        const { result } = renderHook(() => useThemeLinkMapper({ color: 'red' }));
        const cellJson = callMapper(result.current);

        expect(cellJson.attrs?.line?.stroke).toBe('red');
        // Other defaults preserved
        expect(cellJson.attrs?.line?.strokeWidth).toBe(defaultLinkTheme.width);
    });

    it('applies full theme override', () => {
        const fullOverride = {
            color: '#00ff00',
            width: 5,
            sourceMarker: 'arrow' as const,
            targetMarker: 'circle' as const,
            wrapperBuffer: 12,
            wrapperColor: 'blue',
            wrapperClassName: 'my-wrapper',
            className: 'my-line',
            pattern: '5,5',
            lineCap: 'round' as const,
            lineJoin: 'bevel' as const,
            labelColor: '#ff0000',
            labelFontSize: 16,
            labelFontFamily: 'monospace',
            labelBackgroundColor: '#eeeeee',
            labelBackgroundStroke: '#aaaaaa',
            labelBackgroundStrokeWidth: 2,
            labelBackgroundBorderRadius: 8,
            labelBackgroundPadding: { x: 10, y: 5 } as const,
            labelPosition: 0.75,
        };
        const { result } = renderHook(() => useThemeLinkMapper(fullOverride));
        const cellJson = callMapper(result.current);

        expect(cellJson.attrs?.line?.stroke).toBe('#00ff00');
        expect(cellJson.attrs?.line?.strokeWidth).toBe(5);
        expect(cellJson.attrs?.line?.strokeDasharray).toBe('5,5');
        expect(cellJson.attrs?.line?.strokeLinecap).toBe('round');
        expect(cellJson.attrs?.line?.strokeLinejoin).toBe('bevel');
    });

    it('returns stable reference when theme values do not change', () => {
        const { result, rerender } = renderHook(() => useThemeLinkMapper({ color: 'red' }));
        const first = result.current.mapDataToLinkAttributes;
        rerender();
        expect(result.current.mapDataToLinkAttributes).toBe(first);
    });

    it('does not pollute cell.data with theme-defaulted values', () => {
        const { result } = renderHook(() => useThemeLinkMapper({ color: 'red' }));
        const cellJson = callMapper(result.current);
        const cellData = cellJson.data as Record<string, unknown>;

        // color was not in the input data, so should not appear in cell.data
        expect(cellData).not.toHaveProperty('color');
        // width was not in input data either
        expect(cellData).not.toHaveProperty('width');
    });

    it('labels use theme styling', () => {
        const { result } = renderHook(() =>
            useThemeLinkMapper({
                labelColor: '#ff0000',
                labelFontSize: 20,
                labelFontFamily: 'monospace',
            })
        );
        const cellJson = callMapper(result.current, {
            source: 'a',
            target: 'b',
            labels: {
                'lbl-1': { text: 'Hello' },
            },
        });

        const label = (cellJson.labels as Array<Record<string, unknown>>)?.[0];
        expect(label).toBeDefined();
        const labelText = (label?.attrs as Record<string, Record<string, unknown>>)?.labelText;
        expect(labelText?.fill).toBe('#ff0000');
        expect(labelText?.fontSize).toBe(20);
        expect(labelText?.fontFamily).toBe('monospace');
    });
});
