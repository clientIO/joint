import { renderHook } from '@testing-library/react';
import { useLinkDefaults } from '../use-link-defaults';
import { defaultLinkStyle, defaultLabelStyle } from '../../theme/link-theme';
import type { FlatLinkData } from '../../types/link-types';

describe('useLinkDefaults', () => {

    const minimalLinkData: FlatLinkData = {
        source: 'a',
        target: 'b',
    };

    function callMapper(
        hook: ReturnType<typeof useLinkDefaults>,
        data: FlatLinkData = minimalLinkData,
    ) {
        return hook.mapDataToLinkAttributes!({
            id: 'link-1',
            data,
            graph: {} as never,
            toAttributes: (() => ({})) as never,
        });
    }

    // ── No defaults ────────────────────────────────────────────────────────

    it('returns mapper using internal defaults when no overrides given', () => {
        const { result } = renderHook(() => useLinkDefaults());
        const cellJson = callMapper(result.current);

        expect(cellJson.attrs?.line?.stroke).toBe(defaultLinkStyle.color);
        expect(cellJson.attrs?.line?.strokeWidth).toBe(defaultLinkStyle.width);
    });

    // ── Static defaults ─────────────────────────────────────────────────

    it('applies static line style defaults', () => {
        const { result } = renderHook(() => useLinkDefaults({ color: 'red' }));
        const cellJson = callMapper(result.current);

        expect(cellJson.attrs?.line?.stroke).toBe('red');
        expect(cellJson.attrs?.line?.strokeWidth).toBe(defaultLinkStyle.width);
    });

    it('applies full line style override', () => {
        const fullOverride: Partial<FlatLinkData> = {
            color: '#00ff00',
            width: 5,
            sourceMarker: 'arrow',
            targetMarker: 'circle',
            className: 'my-line',
            pattern: '5,5',
            lineCap: 'round',
            lineJoin: 'bevel',
            wrapperBuffer: 12,
            wrapperColor: 'blue',
            wrapperClassName: 'my-wrapper',
        };
        const { result } = renderHook(() => useLinkDefaults(fullOverride));
        const cellJson = callMapper(result.current);

        expect(cellJson.attrs?.line?.stroke).toBe('#00ff00');
        expect(cellJson.attrs?.line?.strokeWidth).toBe(5);
        expect(cellJson.attrs?.line?.strokeDasharray).toBe('5,5');
        expect(cellJson.attrs?.line?.strokeLinecap).toBe('round');
        expect(cellJson.attrs?.line?.strokeLinejoin).toBe('bevel');
    });

    it('link data takes precedence over defaults', () => {
        const { result } = renderHook(() => useLinkDefaults({ color: 'red', width: 5 }));
        const cellJson = callMapper(result.current, {
            source: 'a',
            target: 'b',
            color: 'blue',
        });

        expect(cellJson.attrs?.line?.stroke).toBe('blue');
        expect(cellJson.attrs?.line?.strokeWidth).toBe(5);
    });

    // ── labelStyle ──────────────────────────────────────────────────────

    it('applies labelStyle defaults to labels', () => {
        const { result } = renderHook(() =>
            useLinkDefaults({
                labelStyle: {
                    color: '#ff0000',
                    fontSize: 20,
                    fontFamily: 'monospace',
                },
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

    it('individual label properties override labelStyle', () => {
        const { result } = renderHook(() =>
            useLinkDefaults({
                labelStyle: { color: 'red', fontSize: 20 },
            })
        );
        const cellJson = callMapper(result.current, {
            source: 'a',
            target: 'b',
            labels: {
                'lbl-1': { text: 'Hello', color: 'green' },
            },
        });

        const label = (cellJson.labels as Array<Record<string, unknown>>)?.[0];
        const labelText = (label?.attrs as Record<string, Record<string, unknown>>)?.labelText;
        expect(labelText?.fill).toBe('green');
        expect(labelText?.fontSize).toBe(20);
    });

    it('labels use internal defaults when no labelStyle given', () => {
        const { result } = renderHook(() => useLinkDefaults());
        const cellJson = callMapper(result.current, {
            source: 'a',
            target: 'b',
            labels: { 'lbl-1': { text: 'Hello' } },
        });

        const label = (cellJson.labels as Array<Record<string, unknown>>)?.[0];
        const labelText = (label?.attrs as Record<string, Record<string, unknown>>)?.labelText;
        expect(labelText?.fill).toBe(defaultLabelStyle.color);
        expect(labelText?.fontSize).toBe(defaultLabelStyle.fontSize);
    });

    // ── Callback defaults ──────────────────────────────────────────────────

    it('applies per-link defaults via callback', () => {
        const { result } = renderHook(() => useLinkDefaults((data) => ({
            color: data.source === 'a' ? 'red' : 'blue',
        })));

        const fromA = callMapper(result.current, { source: 'a', target: 'b' });
        expect(fromA.attrs?.line?.stroke).toBe('red');

        const fromX = callMapper(result.current, { source: 'x', target: 'b' });
        expect(fromX.attrs?.line?.stroke).toBe('blue');
    });

    // ── Does not pollute cell.data ──────────────────────────────────────

    it('does not pollute cell.data with internally-defaulted values', () => {
        const { result } = renderHook(() => useLinkDefaults());
        const cellJson = callMapper(result.current);
        const cellData = cellJson.data as Record<string, unknown>;

        expect(cellData).not.toHaveProperty('color');
        expect(cellData).not.toHaveProperty('width');
    });

    it('does not pollute cell.data with default-provided keys', () => {
        const { result } = renderHook(() => useLinkDefaults({
            color: 'red',
            width: 3,
            labelStyle: { color: '#fff', fontSize: 11 },
        }));
        const cellJson = callMapper(result.current);
        const cellData = cellJson.data as Record<string, unknown>;

        // These came from defaults, not user data — must be stripped
        expect(cellData).not.toHaveProperty('color');
        expect(cellData).not.toHaveProperty('width');
        expect(cellData).not.toHaveProperty('labelStyle');
    });

    it('preserves user-provided keys that overlap with defaults in cell.data', () => {
        const { result } = renderHook(() => useLinkDefaults({
            color: 'red',
            width: 3,
        }));
        const cellJson = callMapper(result.current, {
            source: 'a',
            target: 'b',
            color: 'blue',
        });
        const cellData = cellJson.data as Record<string, unknown>;

        // color was in user data — must be preserved
        expect(cellData).toHaveProperty('color');
        // width was only in defaults — must be stripped
        expect(cellData).not.toHaveProperty('width');
    });

    // ── Memoization ────────────────────────────────────────────────────────

    it('returns stable reference for static defaults', () => {
        const { result, rerender } = renderHook(() =>
            useLinkDefaults({ color: 'red' }),
        );
        const first = result.current.mapDataToLinkAttributes;
        rerender();
        expect(result.current.mapDataToLinkAttributes).toBe(first);
    });

    const stableCallback = (data: FlatLinkData) => ({
        color: data.source === 'a' ? 'red' : 'blue',
    });

    it('returns stable reference for callback defaults', () => {
        const { result, rerender } = renderHook(() => useLinkDefaults(stableCallback));
        const first = result.current.mapDataToLinkAttributes;
        rerender();
        expect(result.current.mapDataToLinkAttributes).toBe(first);
    });

    it('recreates mapper when deps change', () => {
        let color = 'red';
        const { result, rerender } = renderHook(() =>
            useLinkDefaults(() => ({ color }), [color]),
        );
        const first = result.current.mapDataToLinkAttributes;

        rerender();
        expect(result.current.mapDataToLinkAttributes).toBe(first);

        color = 'blue';
        rerender();
        expect(result.current.mapDataToLinkAttributes).not.toBe(first);
    });
});
