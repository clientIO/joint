import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { dia, mvc } from '@joint/core';
import { GraphProvider } from '../../components/graph/graph-provider';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';
import type { ElementRecord } from '../../types/cell.types';
import type { GraphState } from '../../store/graph-state';
import { useCells } from '../use-cells';
import { useGraphState } from '../use-graph-state';
import { useOnCellsChange } from '../use-on-cells-change';
import { useOnGraphStateChange } from '../use-on-graph-state-change';
import { useGraphStore } from '../use-graph-store';

const element = (id: string, x: number): ElementRecord => ({
  id,
  type: ELEMENT_MODEL_TYPE,
  position: { x, y: 0 },
  size: { width: 10, height: 10 },
});
const INITIAL_CELLS = [
  element('a', 10),
  element('["a"]', 80),
  element('ids:["a"]', 120),
  element('id:ids:["a"]', 160),
];
function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  return <GraphProvider initialCells={INITIAL_CELLS}>{children}</GraphProvider>;
}
function selectX(source: unknown): number | undefined {
  const cell: unknown = Array.isArray(source) ? source[0] : source;
  if (!cell || typeof cell !== 'object' || !('position' in cell)) return undefined;
  const { position } = cell;
  if (!position || typeof position !== 'object' || !('x' in position)) return undefined;
  return typeof position.x === 'number' ? position.x : undefined;
}
const flushMutation = (mutate: () => void) => act(async () => {
  mutate();
  await new Promise<void>((resolve) => queueMicrotask(resolve));
});

it.each([false, true])('preserves the selector-free return shape when starting with array=%s', (arrayFirst) => {
  const initialTarget: string | readonly string[] = arrayFirst ? ['a'] : '["a"]';
  const nextTarget: string | readonly string[] = arrayFirst ? '["a"]' : ['a'];
  const { result, rerender } = renderHook(
    ({ target }: { readonly target: string | readonly string[] }) => ({
      // @ts-expect-error Each target is valid; the overloads cannot express their JavaScript union.
      value: useCells<ElementRecord>(target),
      cells: useGraphStore().graphProjection.cells,
    }),
    { wrapper, initialProps: { target: initialTarget } }
  );
  const arrayMember = result.current.cells.get('a');
  const scalarRecord = result.current.cells.get('["a"]');
  expect(Array.isArray(result.current.value)).toBe(arrayFirst);
  expect(result.current.value).toEqual(arrayFirst ? [arrayMember] : scalarRecord);

  rerender({ target: nextTarget });

  expect(Array.isArray(result.current.value)).toBe(!arrayFirst);
  if (arrayFirst) expect(result.current.value).toBe(scalarRecord);
  else expect(result.current.value).toEqual([arrayMember]);
  const selected = result.current.value;
  rerender({ target: nextTarget });
  expect(result.current.value).toBe(selected);
});

describe('serialized ids do not alias literal cell ids', () => {
  it.each([
    { scalar: '["a"]', scalarX: 80, arrayFirst: false },
    { scalar: '["a"]', scalarX: 80, arrayFirst: true },
    { scalar: 'ids:["a"]', scalarX: 120, arrayFirst: false },
    { scalar: 'ids:["a"]', scalarX: 120, arrayFirst: true },
    { scalar: 'id:ids:["a"]', scalarX: 160, arrayFirst: false },
    { scalar: 'id:ids:["a"]', scalarX: 160, arrayFirst: true },
  ])('retargets $scalar with array first=$arrayFirst', async ({ scalar, scalarX, arrayFirst }) => {
    const onChange = jest.fn();
    const initialTarget: string | readonly string[] = arrayFirst ? ['a'] : scalar;
    const nextTarget: string | readonly string[] = arrayFirst ? scalar : ['a'];
    const nextId = arrayFirst ? scalar : 'a';
    const oldId = arrayFirst ? 'a' : scalar;
    const { result, rerender } = renderHook(
      ({ target }: { readonly target: string | readonly string[] }) => {
        // @ts-expect-error Each target is valid; existing overloads cannot express this union.
        const value = useCells(target, selectX);
        // @ts-expect-error Exercise the same mounted watcher with either valid JavaScript target.
        useOnCellsChange(target, selectX, onChange);
        return { value, graph: useGraphStore().graph };
      },
      { wrapper, initialProps: { target: initialTarget } }
    );
    expect(result.current.value).toBe(arrayFirst ? 10 : scalarX);
    onChange.mockClear();

    rerender({ target: nextTarget });
    expect(result.current.value).toBe(arrayFirst ? scalarX : 10);
    expect(onChange.mock.calls).toEqual([[arrayFirst ? scalarX : 10]]);
    onChange.mockClear();

    await flushMutation(() => result.current.graph.getCell(oldId).set('position', { x: 99, y: 0 }));
    expect(onChange).not.toHaveBeenCalled();
    await flushMutation(() => result.current.graph.getCell(nextId).set('position', { x: 45, y: 0 }));
    expect(result.current.value).toBe(45);
    expect(onChange.mock.calls).toEqual([[45, arrayFirst ? scalarX : 10]]);
    onChange.mockClear();
    rerender({ target: arrayFirst ? scalar : ['a'] });
    expect(onChange).not.toHaveBeenCalled();
    expect(result.current.value).toBe(45);
  });
});

describe('same-id collection model replacement', () => {
  it.each([false, true])('reads replacement models while graph-bound=%s', async (bound) => {
    const id = bound ? 'a' : 'detached';
    const first = new dia.Element(element(id, 10));
    const collection = new mvc.Collection<dia.Cell>([first]);
    const onCellsChange = jest.fn();
    const onStateChange = jest.fn();
    const selectCollection = (state: GraphState) => state.getCells(collection);
    const selectCollectionX = (state: GraphState) => selectX(state.getCells(collection));
    const { result, rerender } = renderHook(() => {
      const cells = useCells(collection);
      const stateCells = useGraphState(selectCollection);
      useOnCellsChange(collection, selectX, onCellsChange);
      useOnGraphStateChange(selectCollectionX, onStateChange);
      return { cells, stateCells };
    }, { wrapper });
    expect(selectX(result.current.cells)).toBe(10);
    expect(selectX(result.current.stateCells)).toBe(10);
    onCellsChange.mockClear();
    onStateChange.mockClear();

    await flushMutation(() => collection.reset([new dia.Element(element(id, 80))]));

    expect(selectX(result.current.cells)).toBe(bound ? 10 : 80);
    expect(selectX(result.current.stateCells)).toBe(bound ? 10 : 80);
    expect(onCellsChange.mock.calls).toEqual(bound ? [] : [[80, 10]]);
    expect(onStateChange.mock.calls).toEqual(bound ? [] : [[80, 10]]);
    const previousCells = result.current.cells;
    const previousStateCells = result.current.stateCells;
    onCellsChange.mockClear();
    onStateChange.mockClear();

    rerender();

    expect(result.current.cells).toBe(previousCells);
    expect(result.current.stateCells).toBe(previousStateCells);
    expect(onCellsChange).not.toHaveBeenCalled();
    expect(onStateChange).not.toHaveBeenCalled();
  });
});
