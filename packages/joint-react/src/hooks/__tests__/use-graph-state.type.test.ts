/* eslint-disable react-hooks/rules-of-hooks */
/**
 * Type-only tests for `useGraphState` / `useOnGraphStateChange`. If the file
 * compiles, the contract holds; the dummy `describe`/`it` exists only so Jest
 * does not error on a test file with no test cases.
 *
 * Locked patterns (DX contract):
 * - a shipped selector infers its return type
 * - an inline selector reads the default `GraphState`
 * - a selector annotated with `GraphState<MyCell>` types the cells it reads
 * - selectors compose: a custom selector can call a shipped one
 * - a graph state selector is NOT a `useCells` selector, which receives cells
 */
import { useGraphState } from '../use-graph-state';
import { useOnGraphStateChange } from '../use-on-graph-state-change';
import { useCells } from '../use-cells';
import { selectIsGraphSizingComplete, selectGraphSizingVersion } from '../../selectors';
import type { GraphState } from '../../store/graph-state';
import type { Computed, ElementRecord } from '../../types/cell.types';

type MyElement = ElementRecord<{ readonly label: string }>;

const expectType = <Expected>(_value: Expected): void => {};

export function typeContracts(): void {
  expectType<number>(useGraphState(selectGraphSizingVersion));
  expectType<boolean>(useGraphState(selectIsGraphSizingComplete));
  expectType<number>(useGraphState((state) => state.cells.length));
  expectType<boolean>(useGraphState((state) => selectGraphSizingVersion(state) > 1));
  expectType<ReadonlyArray<Computed<MyElement>>>(
    useGraphState((state: GraphState<MyElement>) => state.cells)
  );
  expectType<Computed<MyElement> | undefined>(
    useGraphState((state: GraphState<MyElement>) => state.getCell('a'))
  );
  expectType<ReadonlyArray<Computed<MyElement>>>(
    useGraphState((state: GraphState<MyElement>) => state.getCells(['a', 'b']))
  );

  useOnGraphStateChange(selectGraphSizingVersion, (sizingVersion, previousSizingVersion) => {
    expectType<number>(sizingVersion);
    expectType<number | undefined>(previousSizingVersion);
  });

  // @ts-expect-error -- a `useCells` selector receives the cells, not the graph state
  useCells(selectGraphSizingVersion);
  // @ts-expect-error -- the same in a target form
  useCells('a', selectIsGraphSizingComplete);
}

describe('useGraphState types', () => {
  it('compiles', () => {
    expect(typeof typeContracts).toBe('function');
  });
});
