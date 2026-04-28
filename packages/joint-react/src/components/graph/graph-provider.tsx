import type { dia } from '@joint/core';
import React, { useLayoutEffect, type Dispatch, type SetStateAction } from 'react';
import { useImperativeApi } from '../../hooks/use-imperative-api';
import { GraphStoreContext } from '../../context';
import { GraphStore } from '../../store';
import type { IncrementalCellsChange } from '../../store/graph-view';
import type { BaseElementRecord, BaseLinkRecord } from '../../types/cell.types';

/** Cells array accepted by GraphProvider. */
type ProviderCells<Element extends BaseElementRecord, Link extends BaseLinkRecord> = ReadonlyArray<
  Element | Link
>;

/**
 * Props common to every `GraphProvider` mode.
 * @template ElementData - User data attached to each element record.
 * @template LinkData - User data attached to each link record.
 */
interface GraphProviderBaseProps<
  Element extends BaseElementRecord = BaseElementRecord,
  Link extends BaseLinkRecord = BaseLinkRecord,
> {
  /**
   * Pre-existing JointJS graph instance to use. If omitted, GraphProvider
   * creates a fresh `new dia.Graph(...)`.
   * @see https://docs.jointjs.com/api/dia/Graph
   */
  readonly graph?: dia.Graph;
  /** React children rendered inside the provider — typically a `<Paper />`. */
  readonly children?: React.ReactNode;
  /**
   * Cell namespace passed through to `new dia.Graph`. Defaults to JointJS
   * built-in shapes plus the `@joint/react` ElementModel and LinkModel.
   */
  readonly cellNamespace?: unknown;
  /** Custom cell model used as the base class for all cells in the graph. */
  readonly cellModel?: typeof dia.Cell;
  /** Pre-built `GraphStore` instance. When provided, GraphProvider does not own its lifecycle. */
  readonly store?: GraphStore<Element, Link>;
  /**
   * Notification fired with granular `added` / `changed` / `removed` sets
   * after each commit. Independent of controlled/uncontrolled mode.
   */
  readonly onIncrementalCellsChange?: (changes: IncrementalCellsChange<Element, Link>) => void;
}

/**
 * Uncontrolled — parent provides seed cells only, JointJS drives the graph.
 * @template ElementData - user data on each element
 * @template LinkData - user data on each link
 */
interface GraphProviderUncontrolledProps<
  Element extends BaseElementRecord,
  Link extends BaseLinkRecord,
> extends GraphProviderBaseProps<Element, Link> {
  readonly initialCells?: ProviderCells<Element, Link>;
  readonly cells?: never;
  /** Notification-only callback — React state is NOT pushed back into the graph. */
  readonly onCellsChange?: (cells: ProviderCells<Element, Link>) => void;
}

/**
 * Controlled — parent is the source of truth; GraphProvider keeps the graph
 * synced to the `cells` prop.
 * @template ElementData - user data on each element
 * @template LinkData - user data on each link
 */
interface GraphProviderControlledProps<
  Element extends BaseElementRecord,
  Link extends BaseLinkRecord,
> extends GraphProviderBaseProps<Element, Link> {
  readonly cells: ProviderCells<Element, Link>;
  readonly initialCells?: never;
  /**
   * Fires whenever cells change. Consumers MUST update their React state
   * from this callback for the graph to reflect new data.
   */
  readonly onCellsChange?: Dispatch<SetStateAction<ProviderCells<Element, Link>>>;
}

/**
 * Props for `GraphProvider`. Cells are a single unified stream — either
 * `initialCells` (uncontrolled) or `cells` (controlled).
 *
 * **Modes:**
 * - **Uncontrolled:** Pass `initialCells`. JointJS owns the graph after mount.
 *   `onCellsChange` may still be passed as a notification-only callback.
 * - **Controlled:** Pass `cells` and `onCellsChange`. React owns the data.
 * @template ElementData - User data attached to each element record.
 * @template LinkData - User data attached to each link record.
 */
export type GraphProviderProps<
  Element extends BaseElementRecord = BaseElementRecord,
  Link extends BaseLinkRecord = BaseLinkRecord,
> = GraphProviderUncontrolledProps<Element, Link> | GraphProviderControlledProps<Element, Link>;

/**
 * Provider props normalised to the unparameterised base shape.
 *
 * Internally GraphProvider stores the `GraphStore` with default generics
 * (`BaseElementRecord` / `BaseLinkRecord`). Each `useGraphStore<E, L>()` call
 * re-binds the generics on read — the runtime instance is the same.
 */
type GraphProviderBaseInternalProps = GraphProviderProps<BaseElementRecord, BaseLinkRecord> & {
  ref?: React.Ref<dia.Graph | null>;
};

/**
 * Internal base component for GraphProvider.
 *
 * Operates exclusively on the base record shape so the runtime instance can
 * flow into the unparameterised `GraphStoreContext` without a variance cast.
 * The exported `GraphProvider` re-types this base to the caller's `<Element,
 * Link>` parameters.
 * @param props - GraphProvider props including optional forwarded ref.
 * @returns The rendered graph context provider or null while loading.
 */
function GraphBase(props: GraphProviderBaseInternalProps) {
  const {
    children,
    store,
    onIncrementalCellsChange,
    onCellsChange,
    ref: forwardedRef,
    graph,
    cellNamespace,
    cellModel,
  } = props;

  const cellsProperty = 'cells' in props ? props.cells : undefined;
  const initialCells = 'initialCells' in props ? props.initialCells : undefined;
  const isControlled = cellsProperty !== undefined;

  const { isReady, ref } = useImperativeApi<
    GraphStore<BaseElementRecord, BaseLinkRecord>,
    dia.Graph
  >(
    {
      instanceSelector: (instance) => instance.graph,
      forwardedRef,
      onLoad() {
        const graphStore =
          store ??
          (isControlled
            ? new GraphStore<BaseElementRecord, BaseLinkRecord>({
                graph,
                cellNamespace,
                cellModel,
                cells: cellsProperty,
                onCellsChange,
                onIncrementalCellsChange,
              })
            : new GraphStore<BaseElementRecord, BaseLinkRecord>({
                graph,
                cellNamespace,
                cellModel,
                initialCells,
                onCellsChange,
                onIncrementalCellsChange,
              }));

        return {
          cleanup() {
            if (store) return;
            graphStore.destroy(!!graph);
          },
          instance: graphStore,
        };
      },
    },
    []
  );

  useLayoutEffect(() => {
    if (!isControlled || !isReady || !ref.current) return;
    ref.current.applyControlled(cellsProperty ?? []);
  }, [cellsProperty, isControlled, isReady, ref]);

  if (!isReady) {
    return null;
  }

  return <GraphStoreContext.Provider value={ref.current}>{children}</GraphStoreContext.Provider>;
}

/**
 * GraphProvider supplies graph context to its children.
 *
 * **Modes of operation:**
 *
 * 1. **Uncontrolled** (JointJS owns the graph after mount):
 * ```tsx
 * <GraphProvider initialCells={[...]}>
 *   <Paper />
 * </GraphProvider>
 * ```
 *
 * 2. **Controlled** (React owns the cells array):
 * ```tsx
 * const [cells, setCells] = useState<readonly CellRecord[]>([...]);
 * <GraphProvider cells={cells} onCellsChange={setCells}>
 *   <Paper />
 * </GraphProvider>
 * ```
 *
 * 3. **Incremental-notification** (external store, Redux/Zustand):
 * ```tsx
 * <GraphProvider onIncrementalCellsChange={(c) => dispatch(c)}>
 *   <Paper />
 * </GraphProvider>
 * ```
 * @see GraphProviderProps for all available props
 */
export const GraphProvider = GraphBase as <
  Element extends BaseElementRecord = BaseElementRecord,
  Link extends BaseLinkRecord = BaseLinkRecord,
>(
  props: GraphProviderProps<Element, Link> & {
    ref?: React.Ref<dia.Graph | null>;
  }
) => ReturnType<typeof GraphBase>;
