import type { dia } from '@joint/core';
import React, { useLayoutEffect, type Dispatch, type SetStateAction } from 'react';
import { useImperativeApi } from '../../hooks/use-imperative-api';
import { GraphStoreContext } from '../../context';
import { GraphStore } from '../../store';
import type { IncrementalCellsChange } from '../../store/graph-view';
import type { Cells } from '../../types/cell.types';

/**
 * Props common to every `GraphProvider` mode.
 * @template ElementData - User data attached to each element record.
 * @template LinkData - User data attached to each link record.
 */
interface GraphProviderBaseProps<
  ElementData extends object = Record<string, unknown>,
  LinkData extends object = Record<string, unknown>,
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
  readonly store?: GraphStore<ElementData, LinkData>;
  /**
   * Notification fired with granular `added` / `changed` / `removed` sets
   * after each commit. Independent of controlled/uncontrolled mode.
   */
  readonly onIncrementalCellsChange?: (
    changes: IncrementalCellsChange<ElementData, LinkData>
  ) => void;
}

/**
 * Uncontrolled — parent provides seed cells only, JointJS drives the graph.
 * @template ElementData - user data on each element
 * @template LinkData - user data on each link
 */
interface GraphProviderUncontrolledProps<
  ElementData extends object,
  LinkData extends object,
> extends GraphProviderBaseProps<ElementData, LinkData> {
  readonly initialCells?: Cells<ElementData, LinkData>;
  readonly cells?: never;
  /** Notification-only callback — React state is NOT pushed back into the graph. */
  readonly onCellsChange?: (cells: Cells<ElementData, LinkData>) => void;
}

/**
 * Controlled — parent is the source of truth; GraphProvider keeps the graph
 * synced to the `cells` prop.
 * @template ElementData - user data on each element
 * @template LinkData - user data on each link
 */
interface GraphProviderControlledProps<
  ElementData extends object,
  LinkData extends object,
> extends GraphProviderBaseProps<ElementData, LinkData> {
  readonly cells: Cells<ElementData, LinkData>;
  readonly initialCells?: never;
  /**
   * Fires whenever cells change. Consumers MUST update their React state
   * from this callback for the graph to reflect new data.
   */
  readonly onCellsChange?: Dispatch<SetStateAction<Cells<ElementData, LinkData>>>;
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
  ElementData extends object = Record<string, unknown>,
  LinkData extends object = Record<string, unknown>,
> =
  | GraphProviderUncontrolledProps<ElementData, LinkData>
  | GraphProviderControlledProps<ElementData, LinkData>;

/**
 * Internal generic base component for GraphProvider.
 * @param props - GraphProvider props including optional forwarded ref.
 * @returns The rendered graph context provider or null while loading.
 */
function GraphBase<
  ElementData extends object = Record<string, unknown>,
  LinkData extends object = Record<string, unknown>,
>(props: GraphProviderProps<ElementData, LinkData> & { ref?: React.Ref<dia.Graph | null> }) {
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

  const { isReady, ref } = useImperativeApi<GraphStore<ElementData, LinkData>, dia.Graph>(
    {
      instanceSelector: (instance) => instance.graph,
      forwardedRef,
      onLoad() {
        const graphStore =
          store ??
          (isControlled
            ? new GraphStore<ElementData, LinkData>({
                graph,
                cellNamespace,
                cellModel,
                cells: cellsProperty,
                onCellsChange: onCellsChange as
                  | ((cells: Cells<ElementData, LinkData>) => void)
                  | undefined,
                onIncrementalCellsChange,
              })
            : new GraphStore<ElementData, LinkData>({
                graph,
                cellNamespace,
                cellModel,
                initialCells,
                onCellsChange: onCellsChange as
                  | ((cells: Cells<ElementData, LinkData>) => void)
                  | undefined,
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
 * const [cells, setCells] = useState<Cells>([...]);
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
  ElementData extends object = Record<string, unknown>,
  LinkData extends object = Record<string, unknown>,
>(
  props: GraphProviderProps<ElementData, LinkData> & {
    ref?: React.Ref<dia.Graph | null>;
  }
) => ReturnType<typeof GraphBase>;
