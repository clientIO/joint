import { renderHook } from '@testing-library/react';
import { useElementDefaults } from '../use-element-defaults';
import { defaultPortStyle } from '../../theme/element-theme';
import type { ElementRecord } from '../../types/data-types';

describe('useElementDefaults', () => {
  const minimalElementData: ElementRecord = {
    data: {},
    position: { x: 10, y: 20 },
    size: { width: 100, height: 50 },
  };

  function callForwardMapper(
    hook: ReturnType<typeof useElementDefaults<any>>,
    element: ElementRecord = minimalElementData
  ) {
    return hook.mapElementToAttributes!({
      id: 'el-1',
      element,
    });
  }

  // ── No options ─────────────────────────────────────────────────────────

  it('returns passthrough flat mapper when no options given', () => {
    const { result } = renderHook(() => useElementDefaults({}));
    const cellJson = callForwardMapper(result.current);
    expect(cellJson.position).toEqual({ x: 10, y: 20 });
    expect(cellJson.size).toEqual({ width: 100, height: 50 });
  });

  // ── Defaults only ──────────────────────────────────────────────────────

  it('applies static portDefaults to ports', () => {
    const { result } = renderHook(() =>
      useElementDefaults({ portStyle: { color: 'red' } })
    );
    const cellJson = callForwardMapper(result.current, {
      ...minimalElementData,
      portMap: { p1: { cx: 0, cy: 0 } },
    });

    const portItem = (cellJson.ports as { items: Array<Record<string, unknown>> })?.items[0];
    const portBody = (portItem?.attrs as Record<string, Record<string, any>>)?.portBody;
    expect(portBody?.style?.fill).toBe('red');
    expect(portBody?.style?.strokeWidth).toBe(defaultPortStyle.outlineWidth);
  });

  it('applies static data defaults (ports, dimensions)', () => {
    const { result } = renderHook(() =>
      useElementDefaults({
        size: { width: 200, height: 80 },
        portMap: {
          out: { cx: 'calc(w)', cy: 'calc(0.5*h)' },
        },
      })
    );
    const cellJson = callForwardMapper(result.current, { data: {}, position: { x: 50, y: 50 } });

    expect(cellJson.size).toEqual({ width: 200, height: 80 });
    const portItem = (cellJson.ports as { items: Array<Record<string, unknown>> })?.items[0];
    expect(portItem).toBeDefined();
  });

  it('element data takes precedence over static data defaults', () => {
    const { result } = renderHook(() =>
      useElementDefaults({ size: { width: 200, height: 80 } })
    );
    const cellJson = callForwardMapper(result.current, {
      data: {},
      position: { x: 10, y: 20 },
      size: { width: 300, height: 100 },
    });

    expect(cellJson.size).toEqual({ width: 300, height: 100 });
  });

  it('applies portDefaults to all ports', () => {
    const { result } = renderHook(() =>
      useElementDefaults({
        size: { width: 120, height: 60 },
        portMap: { p1: { cx: 0, cy: 0 } },
        portStyle: { color: 'blue', width: 16 },
      })
    );
    const cellJson = callForwardMapper(result.current, { data: {}, position: { x: 0, y: 0 } });

    expect(cellJson.size).toEqual({ width: 120, height: 60 });
    const portItem = (cellJson.ports as { items: Array<Record<string, unknown>> })?.items[0];
    const portBody = (portItem?.attrs as Record<string, Record<string, any>>)?.portBody;
    expect(portBody?.style?.fill).toBe('blue');
    expect(portItem?.size).toEqual({ width: 16, height: defaultPortStyle.height });
  });

  // ── Defaults with size ──────────────────────────────────────────

  it('defaults with size produce correct size and are not in result.data', () => {
    const { result } = renderHook(() =>
      useElementDefaults({ size: { width: 150, height: 75 } })
    );
    const cellJson = callForwardMapper(result.current, { data: {}, position: { x: 10, y: 20 } });

    expect(cellJson.size).toEqual({ width: 150, height: 75 });
    const cellData = cellJson.data as Record<string, unknown>;
    expect(cellData).not.toHaveProperty('size');
  });

  // ── Callback defaults ──────────────────────────────────────────────────

  it('applies per-element defaults via callback', () => {
    const { result } = renderHook(() =>
      useElementDefaults(({ data: element }) => {
        const kind = (element.data as Record<string, unknown>)?.kind as string | undefined;
        return {
          portStyle: { color: kind === 'start' ? 'green' : 'orange' },
        };
      })
    );

    // "start" element — gets green port color
    const startJson = callForwardMapper(result.current, {
      ...minimalElementData,
      data: { kind: 'start' },
      portMap: { out: { cx: 'calc(w)', cy: 'calc(0.5*h)' } },
    });
    const startPorts = (startJson.ports as { items: Array<Record<string, unknown>> })?.items;
    expect(startPorts).toHaveLength(1);
    const startBody = (startPorts[0]?.attrs as Record<string, Record<string, any>>)?.portBody;
    expect(startBody?.style?.fill).toBe('green');

    // Other element — gets orange port color
    const otherJson = callForwardMapper(result.current, {
      ...minimalElementData,
      data: { kind: 'process' },
      portMap: {
        in: { cx: 0, cy: 'calc(0.5*h)' },
        out: { cx: 'calc(w)', cy: 'calc(0.5*h)' },
      },
    });
    const otherPorts = (otherJson.ports as { items: Array<Record<string, unknown>> })?.items;
    expect(otherPorts).toHaveLength(2);
    const otherBody = (otherPorts[0]?.attrs as Record<string, Record<string, any>>)?.portBody;
    expect(otherBody?.style?.fill).toBe('orange');
  });

  // ── Round-trip pollution (defaults) ─────────────────────────────────────

  it('does not pollute cell.data with default-provided keys', () => {
    const { result } = renderHook(() =>
      useElementDefaults({
        portStyle: { color: 'red' },
        portMap: { p1: { cx: 0, cy: 0 } },
      })
    );
    const cellJson = callForwardMapper(result.current, {
      data: {},
      position: { x: 10, y: 20 },
      size: { width: 100, height: 50 },
    });
    const cellData = cellJson.data as Record<string, unknown>;

    expect(cellData).not.toHaveProperty('portStyle');
    expect(cellData).not.toHaveProperty('portMap');
  });

  it('preserves user-provided style when it overlaps with defaults', () => {
    const { result } = renderHook(() =>
      useElementDefaults({ portStyle: { color: 'red' } })
    );
    const cellJson = callForwardMapper(result.current, {
      data: {},
      position: { x: 10, y: 20 },
      size: { width: 100, height: 50 },
      portStyle: { color: 'blue' },
    });

    expect(cellJson.portStyle).toMatchObject({ color: 'blue' });
  });

  // ── Memoization ────────────────────────────────────────────────────────

  it('returns stable reference for static defaults', () => {
    const { result, rerender } = renderHook(() =>
      useElementDefaults({ portStyle: { color: 'blue' } })
    );
    const firstForward = result.current.mapElementToAttributes;
    rerender();
    expect(result.current.mapElementToAttributes).toBe(firstForward);
  });

  const stableCallback = ({ data: element }: { data: ElementRecord }) => ({
    portStyle: { color: (element.data as Record<string, unknown>)?.kind === 'a' ? 'red' : 'blue' },
  });

  it('returns stable reference for callback defaults', () => {
    const { result, rerender } = renderHook(() => useElementDefaults(stableCallback));
    const firstForward = result.current.mapElementToAttributes;
    rerender();
    expect(result.current.mapElementToAttributes).toBe(firstForward);
  });

  it('recreates mapper when deps change', () => {
    let color = 'red';
    const { result, rerender } = renderHook(() =>
      useElementDefaults(() => ({ portStyle: { color } }), [color])
    );
    const firstForward = result.current.mapElementToAttributes;

    // Same deps — stable
    rerender();
    expect(result.current.mapElementToAttributes).toBe(firstForward);

    // Deps change — new reference
    color = 'blue';
    rerender();
    expect(result.current.mapElementToAttributes).not.toBe(firstForward);
  });

  // ── Defaults where result.data is falsy ─────────────────────────────

  it('handles defaults when elementToAttributes returns no data field', () => {
    const { result } = renderHook(() =>
      useElementDefaults({ position: { x: 5, y: 10 } })
    );
    const cellJson = callForwardMapper(result.current, {
      position: { x: 50, y: 60 },
      size: { width: 100, height: 50 },
    });

    expect(cellJson.position).toEqual({ x: 50, y: 60 });
  });

  // ── Color changes with defaults (integration-style) ─────────────────

  it('default color is applied when element data does not specify color', () => {
    const { result } = renderHook(() =>
      useElementDefaults({ portStyle: { color: '#ff0000' } })
    );
    const cellJson = callForwardMapper(result.current, {
      ...minimalElementData,
      portMap: { p1: { cx: 0, cy: 0 } },
    });

    const portItem = (cellJson.ports as { items: Array<Record<string, unknown>> })?.items[0];
    const portBody = (portItem?.attrs as Record<string, Record<string, any>>)?.portBody;
    expect(portBody?.style?.fill).toBe('#ff0000');
  });

  it('element data color overrides default color', () => {
    const { result } = renderHook(() =>
      useElementDefaults({ portStyle: { color: '#ff0000' } })
    );
    const cellJson = callForwardMapper(result.current, {
      ...minimalElementData,
      portStyle: { color: '#00ff00' }, portMap: { p1: { cx: 0, cy: 0 } },
    });

    const portItem = (cellJson.ports as { items: Array<Record<string, unknown>> })?.items[0];
    const portBody = (portItem?.attrs as Record<string, Record<string, any>>)?.portBody;
    expect(portBody?.style?.fill).toBe('#00ff00');
  });

  it('changing color via deps recreates mapper with new color', () => {
    let portColor = 'red';
    const { result, rerender } = renderHook(() =>
      useElementDefaults(
        { portStyle: { color: portColor } },
        [portColor]
      )
    );

    // First render: red
    const redJson = callForwardMapper(result.current, {
      ...minimalElementData,
      portMap: { p1: { cx: 0, cy: 0 } },
    });
    const redPort = (redJson.ports as { items: Array<Record<string, unknown>> })?.items[0];
    const redBody = (redPort?.attrs as Record<string, Record<string, any>>)?.portBody;
    expect(redBody?.style?.fill).toBe('red');

    // Change color and re-render
    portColor = 'blue';
    rerender();

    const blueJson = callForwardMapper(result.current, {
      ...minimalElementData,
      portMap: { p1: { cx: 0, cy: 0 } },
    });
    const bluePort = (blueJson.ports as { items: Array<Record<string, unknown>> })?.items[0];
    const blueBody = (bluePort?.attrs as Record<string, Record<string, any>>)?.portBody;
    expect(blueBody?.style?.fill).toBe('blue');
  });

  // ── Forward round-trip ────────────────────────────────────────────

  it('forward mapper applies defaults correctly', () => {
    const { result } = renderHook(() =>
      useElementDefaults({ size: { width: 200, height: 100 } })
    );

    // Forward: user data → cell attributes
    const cellJson = callForwardMapper(result.current, {
      data: { label: 'my-node', kind: 'task' },
      position: { x: 30, y: 40 },
    });
    expect(cellJson.size).toEqual({ width: 200, height: 100 });
    expect(cellJson.position).toEqual({ x: 30, y: 40 });
  });
});
