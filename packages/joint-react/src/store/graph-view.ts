/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable jsdoc/require-jsdoc */
import { type dia } from '@joint/core';
import type {
  ElementJSONInit,
  LinkJSONInit,
  CellId,
  CellUnion,
} from '../types/cell.types';
import { mapAttributesToElement, mapAttributesToLink } from '../state/data-mapping';
import { graphChanges, type UpdateGraphOptions } from './graph-changes';
import { asReadonlyContainer, createContainer } from './state-container';
import { isShallowEqual, isPositionEqual, isSizeEqual } from '../utils/selector-utils';
import { ELEMENT_MODEL_TYPE } from '../models/element-model';
import { LINK_MODEL_TYPE } from '../models/link-model';

/** Incremental change set emitted by graphView after container commits. */
export interface IncrementalCellsChange<
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
> {
  readonly added: Map<CellId, CellUnion<Element, Link>>;
  readonly changed: Map<CellId, CellUnion<Element, Link>>;
  readonly removed: Set<CellId>;
}

interface GraphViewState<
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
> {
  readonly graph: dia.Graph;
  readonly onIncrementalChange?: (changes: IncrementalCellsChange<Element, Link>) => void;
  readonly onElementsSizeChange?: (id: CellId, size: { width: number; height: number }) => void;
}

/**
 * Merge a newly-mapped cell record with the previous one, preserving reference
 * identity wherever possible.
 *
 * - `data` / `position` / `size` sub-refs are reused when structurally equal.
 * - **Fast path:** when every top-level key also strict-equals the previous
 *   record, returns `previous` itself. The container then sees
 *   `isStrictEqual(previous, value) === true` and skips the subscriber fire
 *   altogether — no hook re-renders for "change" events that produced no
 *   actual change (e.g. a connected-link re-sync after an element moved, a
 *   JointJS attribute tick that didn't touch any user-visible field).
 *
 * Works for both element and link records — link records have no `position`
 * or `size`, so those equality checks collapse to `undefined === undefined`.
 * @param previous - previous record (may be undefined for the first write)
 * @param next - freshly mapped record from the graph
 * @returns merged record; may be `previous` itself when nothing changed
 */
function mergeCellUnion<Element extends ElementJSONInit, Link extends LinkJSONInit>(
  previous: CellUnion<Element, Link> | undefined,
  next: CellUnion<Element, Link>
): CellUnion<Element, Link> {
  if (!previous) return next;

  const previousData = previous.data as object | undefined;
  const nextData = next.data as object | undefined;
  const previousPosition = (previous as ElementJSONInit).position;
  const nextPosition = (next as ElementJSONInit).position;
  const previousSize = (previous as ElementJSONInit).size;
  const nextSize = (next as ElementJSONInit).size;

  const mergedData = isShallowEqual(previousData, nextData) ? previousData : nextData;
  const mergedPosition = isPositionEqual(previousPosition, nextPosition)
    ? previousPosition
    : nextPosition;
  const mergedSize = isSizeEqual(previousSize, nextSize) ? previousSize : nextSize;

  // Fast path: preserved sub-refs + every other top-level field strict-equal
  // → return `previous`. The container's `isStrictEqual` check short-circuits
  // without pushing to `changes` or notifying subscribers. This kills
  // spurious re-renders when JointJS re-syncs connected links after an
  // element move (the link record hasn't actually changed).
  if (
    mergedData === previousData &&
    mergedPosition === previousPosition &&
    mergedSize === previousSize
  ) {
    const previousKeys = Object.keys(previous);
    const nextKeys = Object.keys(next);
    if (previousKeys.length === nextKeys.length) {
      let allMatch = true;
      for (const key of nextKeys) {
        if (key === 'data' || key === 'position' || key === 'size') continue;
        if (previous[key] !== next[key]) {
          allMatch = false;
          break;
        }
      }
      if (allMatch) return previous;
    }
  }

  return {
    ...next,
    data: mergedData,
    position: mergedPosition,
    size: mergedSize,
  } as CellUnion<Element, Link>;
}

/**
 * Convert a JointJS cell to its CellRecord representation, routing by type:
 *  - Elements → element mapper, with id/type guaranteed AND
 *    `position`/`size`/`angle`/`data` normalised to non-undefined values so
 *    consumers can rely on `Computed<ElementRecord>`'s required-field contract.
 *  - Links → link mapper, with id/type/source/target/data normalised.
 *  - Anything else → pass-through of attributes
 * @param cell - graph cell
 * @returns CellRecord suitable for the cells container
 */
function toCellUnion<Element extends ElementJSONInit, Link extends LinkJSONInit>(
  cell: dia.Cell
): CellUnion<Element, Link> {
  if (cell.isElement()) {
    const record = mapAttributesToElement(cell.attributes);
    const previousPosition = record.position;
    const previousSize = record.size;
    const withDefaults = {
      ...record,
      id: cell.id,
      type: record.type ?? ELEMENT_MODEL_TYPE,
      position: {
        x: previousPosition?.x ?? 0,
        y: previousPosition?.y ?? 0,
      },
      size: {
        width: previousSize?.width ?? 0,
        height: previousSize?.height ?? 0,
      },
      angle: record.angle ?? 0,
      data: record.data ?? {},
    };
    return withDefaults as Element;
  }
  if (cell.isLink()) {
    const record = mapAttributesToLink(cell.attributes);
    const withDefaults = {
      ...record,
      id: cell.id,
      type: record.type ?? LINK_MODEL_TYPE,
      source: record.source ?? {},
      target: record.target ?? {},
      data: record.data ?? {},
    };
    return withDefaults as Link;
  }
  return { ...cell.attributes, id: cell.id } as CellUnion<Element, Link>;
}

export function graphView<
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
>(options: GraphViewState<Element, Link>) {
  const { graph, onIncrementalChange, onElementsSizeChange } = options;

  const cells = createContainer<CellUnion<Element, Link>>('Cells');

  const trackChanges = onIncrementalChange !== undefined;
  const added = trackChanges ? new Map<CellId, CellUnion<Element, Link>>() : undefined;
  const changed = trackChanges ? new Map<CellId, CellUnion<Element, Link>>() : undefined;
  const removed = trackChanges ? new Set<CellId>() : undefined;

  /**
   * Write a cell into the container via `mergeCellRecord`, preserving sub-ref
   * identity and short-circuiting the subscriber fire when nothing actually
   * changed (the merge's fast path returns `previous` itself, which the
   * container's `isStrictEqual` check then skips).
   * @param cell - graph cell
   * @returns the merged record (may be the previous reference when unchanged)
   */
  function writeCell(cell: dia.Cell): CellUnion<Element, Link> {
    cells.set(cell.id, (previous) => {
      const next = toCellUnion<Element, Link>(cell);
      return mergeCellUnion<Element, Link>(previous, next);
    });
    return cells.get(cell.id) as CellUnion<Element, Link>;
  }

  const graphChangesController = graphChanges({
    graph,
    onElementsSizeChange,
    onChanges: ({ changes, isInsideBatch }) => {
      let hasChange = false;

      for (const [id, change] of changes) {
        const { data, type } = change;
        switch (type) {
          case 'add':
          case 'change': {
            const isAdd = type === 'add';
            const record = writeCell(data);
            if (trackChanges) {
              if (isAdd) added!.set(id, record);
              else changed!.set(id, record);
            }
            hasChange = true;
            // Connected-links sweep is only needed on `change` (an element
            // moved or resized — its links' routes need re-snapshotting).
            // On `add`, the link gets its own change-set entry from JointJS
            // and will be written in this loop without re-ordering issues.
            if (!isAdd && data.isElement()) {
              for (const link of graph.getConnectedLinks(data)) {
                writeCell(link);
              }
            }
            break;
          }
          case 'remove': {
            if (!data) continue;
            cells.delete(id);
            if (trackChanges) removed!.add(id);
            hasChange = true;
            if (data.isElement()) {
              // Connected links are also removed by JointJS — mirror that.
              for (const link of graph.getConnectedLinks(data)) {
                const linkId = link.id;
                cells.delete(linkId);
                if (trackChanges) removed!.add(linkId);
              }
            }
            break;
          }
        }
      }

      if (hasChange) cells.commitChanges();

      const hasTrackedChanges =
        trackChanges &&
        !isInsideBatch &&
        (added!.size > 0 || changed!.size > 0 || removed!.size > 0);

      if (hasTrackedChanges) {
        onIncrementalChange!({ added: added!, changed: changed!, removed: removed! });
        added!.clear();
        changed!.clear();
        removed!.clear();
      }

      changes.clear();
    },
  });

  /**
   * Populate the cells container from current graph state. Called after
   * initial sync to seed state that was missed because graphChanges skips
   * events with `isUpdateFromReact`.
   */
  function syncFromGraph() {
    for (const cell of graph.getCells()) {
      writeCell(cell);
    }
    if (cells.getSize() > 0) cells.commitChanges();
  }

  return {
    cells: asReadonlyContainer(cells),
    syncFromGraph,
    updateGraph(update: UpdateGraphOptions<Element, Link>) {
      const { cellIds } = graphChangesController.updateGraph(update);
      if (update.flag !== 'updateFromReact') return;
      if (!update.cells) return;

      let hasChange = false;

      for (const id of cellIds) {
        const cell = graph.getCell(id);
        if (!cell) continue;
        writeCell(cell);
        hasChange = true;
      }

      // Fast path: if the container size already matches the user's cell
      // count, every container entry is a user cell and the prune scan below
      // would be a no-op — skip the O(n) `getAll()` walk and the `userIds`
      // Set allocation entirely. This is the steady-state path for
      // controlled components that update the same set of cells on every
      // React render.
      if (cells.getSize() > cellIds.length) {
        const userIds = new Set<CellId>(cellIds);
        for (const item of cells.getAll()) {
          // Items inside the container always have an id; the optionality on
          // `WithId.id` is only for input shapes.
          if (item.id === undefined) continue;
          if (!userIds.has(item.id)) {
            cells.delete(item.id);
            hasChange = true;
          }
        }
      }

      if (hasChange) cells.commitChanges();
    },
    destroy() {
      graphChangesController.destroy();
    },
  };
}

export type GraphView<
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
> = ReturnType<typeof graphView<Element, Link>>;
