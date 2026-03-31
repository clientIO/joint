import { renderHook } from '@testing-library/react';
import { useLinkDefaults } from '../use-link-defaults';
import { defaultLinkStyle, defaultLabelStyle } from '../../theme/link-theme';
import type { LinkRecord } from '../../types/data-types';

describe('useLinkDefaults', () => {
  const minimalLinkData: LinkRecord = {
    source: { id: 'a' },
    target: { id: 'b' },
  };

  function callForwardMapper(
    hook: ReturnType<typeof useLinkDefaults<any>>,
    link: LinkRecord = minimalLinkData
  ) {
    return hook.mapLinkToAttributes!({
      id: 'link-1',
      link,
    });
  }

  // ── No options ─────────────────────────────────────────────────────────

  it('returns mapper using internal defaults when no overrides given', () => {
    const { result } = renderHook(() => useLinkDefaults({}));
    const cellJson = callForwardMapper(result.current);

    // No style provided → no attrs built; CSS theme variables handle defaults
    expect(cellJson.attrs?.line?.style).toBeUndefined();
  });

  // ── Static defaults ─────────────────────────────────────────────────

  it('applies static line style defaults', () => {
    const { result } = renderHook(() => useLinkDefaults({ style: { color: 'red' } }));
    const cellJson = callForwardMapper(result.current);

    expect(cellJson.attrs?.line?.style?.stroke).toBe('red');
    expect(cellJson.attrs?.line?.style?.strokeWidth).toBe(defaultLinkStyle.width);
  });

  it('applies full line style override', () => {
    const fullOverride: Partial<LinkRecord> = {
      style: {
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
      },
    };
    const { result } = renderHook(() => useLinkDefaults(fullOverride));
    const cellJson = callForwardMapper(result.current);

    expect(cellJson.attrs?.line?.style?.stroke).toBe('#00ff00');
    expect(cellJson.attrs?.line?.style?.strokeWidth).toBe(5);
    expect(cellJson.attrs?.line?.style?.strokeDasharray).toBe('5,5');
    expect(cellJson.attrs?.line?.style?.strokeLinecap).toBe('round');
    expect(cellJson.attrs?.line?.style?.strokeLinejoin).toBe('bevel');
  });

  it('link data takes precedence over defaults', () => {
    const { result } = renderHook(() => useLinkDefaults({ style: { color: 'red', width: 5 } }));
    const cellJson = callForwardMapper(result.current, {
      source: { id: 'a' },
      target: { id: 'b' },
      style: { color: 'blue', width: 3 },
    });

    expect(cellJson.attrs?.line?.style?.stroke).toBe('blue');
    expect(cellJson.attrs?.line?.style?.strokeWidth).toBe(3);
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
    const cellJson = callForwardMapper(result.current, {
      source: { id: 'a' },
      target: { id: 'b' },
      labelMap: {
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
      useLinkDefaults({ labelStyle: { color: 'red', fontSize: 20 } })
    );
    const cellJson = callForwardMapper(result.current, {
      source: { id: 'a' },
      target: { id: 'b' },
      labelMap: {
        'lbl-1': { text: 'Hello', color: 'green' },
      },
    });

    const label = (cellJson.labels as Array<Record<string, unknown>>)?.[0];
    const labelText = (label?.attrs as Record<string, Record<string, any>>)?.labelText;
    expect(labelText?.style?.fill).toBe('green');
    expect(labelText?.style?.fontSize).toBe(20);
  });

  it('labels use internal defaults when no labelStyle given', () => {
    const { result } = renderHook(() => useLinkDefaults({}));
    const cellJson = callForwardMapper(result.current, {
      source: { id: 'a' },
      target: { id: 'b' },
      labelMap: { 'lbl-1': { text: 'Hello' } },
    });

    const label = (cellJson.labels as Array<Record<string, unknown>>)?.[0];
    const labelText = (label?.attrs as Record<string, Record<string, any>>)?.labelText;
    expect(labelText?.style?.fill).toBe(defaultLabelStyle.color);
    expect(labelText?.style?.fontSize).toBe(defaultLabelStyle.fontSize);
  });

  // ── Callback defaults ──────────────────────────────────────────────────

  it('applies per-link defaults via callback', () => {
    const { result } = renderHook(() =>
      useLinkDefaults(({ link }) => ({
        style: { color: link.source?.id === 'a' ? 'red' : 'blue' },
      }))
    );

    const fromA = callForwardMapper(result.current, { source: { id: 'a' }, target: { id: 'b' } });
    expect(fromA.attrs?.line?.style?.stroke).toBe('red');

    const fromX = callForwardMapper(result.current, { source: { id: 'x' }, target: { id: 'b' } });
    expect(fromX.attrs?.line?.style?.stroke).toBe('blue');
  });

  // ── Does not pollute cell.data ──────────────────────────────────────

  it('does not pollute cell.data with internally-defaulted values', () => {
    const { result } = renderHook(() => useLinkDefaults({}));
    const cellJson = callForwardMapper(result.current);
    const cellData = cellJson.data as Record<string, unknown>;

    expect(cellData).not.toHaveProperty('style');
    expect(cellData).not.toHaveProperty('color');
    expect(cellData).not.toHaveProperty('width');
  });

  it('does not pollute cell.data with default-provided keys', () => {
    const { result } = renderHook(() =>
      useLinkDefaults({
        style: { color: 'red', width: 3 },
        labelStyle: { color: '#fff', fontSize: 11 },
      })
    );
    const cellJson = callForwardMapper(result.current);
    const cellData = cellJson.data as Record<string, unknown>;

    expect(cellData).not.toHaveProperty('style');
    expect(cellData).not.toHaveProperty('labelStyle');
  });

  it('preserves user-provided presentation keys in cell.presentation', () => {
    const { result } = renderHook(() =>
      useLinkDefaults({
        style: { color: 'red', width: 3 },
      })
    );
    const cellJson = callForwardMapper(result.current, {
      source: { id: 'a' },
      target: { id: 'b' },
      style: { color: 'blue' },
    });
    const cellData = cellJson.data as Record<string, unknown>;

    // Explicitly provided style is stored directly on the cell attributes
    expect(cellJson).toHaveProperty('style', { color: 'blue' });
    // Style does not leak into data
    expect(cellData).not.toHaveProperty('style');
    expect(cellData).not.toHaveProperty('color');
    expect(cellData).not.toHaveProperty('width');
  });

  // ── Memoization ────────────────────────────────────────────────────────

  it('returns stable reference for static defaults', () => {
    const { result, rerender } = renderHook(() => useLinkDefaults({ style: { color: 'red' } }));
    const firstForward = result.current.mapLinkToAttributes;
    rerender();
    expect(result.current.mapLinkToAttributes).toBe(firstForward);
  });

  const stableCallback = ({ link }: { link: LinkRecord }) => ({
    style: { color: link.source?.id === 'a' ? 'red' : 'blue' },
  });

  it('returns stable reference for callback defaults', () => {
    const { result, rerender } = renderHook(() => useLinkDefaults(stableCallback));
    const firstForward = result.current.mapLinkToAttributes;
    rerender();
    expect(result.current.mapLinkToAttributes).toBe(firstForward);
  });

  it('recreates mapper when deps change', () => {
    let color = 'red';
    const { result, rerender } = renderHook(() =>
      useLinkDefaults(() => ({ style: { color } }), [color])
    );
    const firstForward = result.current.mapLinkToAttributes;

    rerender();
    expect(result.current.mapLinkToAttributes).toBe(firstForward);

    color = 'blue';
    rerender();
    expect(result.current.mapLinkToAttributes).not.toBe(firstForward);
  });

  // ── Defaults where result.data is falsy ─────────────────────────────

  it('handles defaults when linkToAttributes returns no data field', () => {
    const { result } = renderHook(() =>
      useLinkDefaults({ style: { color: 'red' } })
    );
    const cellJson = callForwardMapper(result.current, {
      source: { id: 'a' },
      target: { id: 'b' },
    });

    expect(cellJson.source).toBeDefined();
    expect(cellJson.target).toBeDefined();
  });

  // ── Color changes with defaults (integration-style) ─────────────────

  it('default color is applied when link data does not specify color', () => {
    const { result } = renderHook(() =>
      useLinkDefaults({ style: { color: '#ff0000' } })
    );
    const cellJson = callForwardMapper(result.current);

    expect(cellJson.attrs?.line?.style?.stroke).toBe('#ff0000');
  });

  it('link data color overrides default color', () => {
    const { result } = renderHook(() =>
      useLinkDefaults({ style: { color: '#ff0000' } })
    );
    const cellJson = callForwardMapper(result.current, {
      source: { id: 'a' },
      target: { id: 'b' },
      style: { color: '#00ff00' },
    });

    expect(cellJson.attrs?.line?.style?.stroke).toBe('#00ff00');
  });

  it('changing color via deps recreates mapper with new color', () => {
    let linkColor = 'red';
    const { result, rerender } = renderHook(() =>
      useLinkDefaults({ style: { color: linkColor } }, [linkColor])
    );

    // First render: red
    const redJson = callForwardMapper(result.current);
    expect(redJson.attrs?.line?.style?.stroke).toBe('red');

    // Change color and re-render
    linkColor = 'blue';
    rerender();

    const blueJson = callForwardMapper(result.current);
    expect(blueJson.attrs?.line?.style?.stroke).toBe('blue');
  });

  it('changing width via deps recreates mapper with new width', () => {
    let lineWidth = 2;
    const { result, rerender } = renderHook(() =>
      useLinkDefaults({ style: { width: lineWidth } }, [lineWidth])
    );

    const thinJson = callForwardMapper(result.current);
    expect(thinJson.attrs?.line?.style?.strokeWidth).toBe(2);

    lineWidth = 5;
    rerender();

    const thickJson = callForwardMapper(result.current);
    expect(thickJson.attrs?.line?.style?.strokeWidth).toBe(5);
  });

  // ── Forward round-trip ────────────────────────────────────────────

  it('forward mapper applies defaults correctly', () => {
    const { result } = renderHook(() =>
      useLinkDefaults({ style: { color: 'red', targetMarker: 'arrow' } })
    );

    const cellJson = callForwardMapper(result.current, {
      source: { id: 'node-1' },
      target: { id: 'node-2' },
    });
    expect(cellJson.attrs?.line?.style?.stroke).toBe('red');
  });

  // ── Callback defaults with color ────────────────────────────────────

  it('callback defaults apply different colors based on link data', () => {
    const { result } = renderHook(() =>
      useLinkDefaults(({ link }) => ({
        style: {
          color: link.source?.id === 'error-node' ? 'red' : 'green',
          width: link.source?.id === 'error-node' ? 3 : 1,
        },
      }))
    );

    const errorLink = callForwardMapper(result.current, {
      source: { id: 'error-node' },
      target: { id: 'b' },
    });
    expect(errorLink.attrs?.line?.style?.stroke).toBe('red');
    expect(errorLink.attrs?.line?.style?.strokeWidth).toBe(3);

    const normalLink = callForwardMapper(result.current, {
      source: { id: 'normal-node' },
      target: { id: 'b' },
    });
    expect(normalLink.attrs?.line?.style?.stroke).toBe('green');
    expect(normalLink.attrs?.line?.style?.strokeWidth).toBe(1);
  });
});
