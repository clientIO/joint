/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable jsdoc/require-jsdoc */
import { type dia } from '@joint/core';
import type {
  BaseElementRecord,
  BaseLinkRecord,
  CellId,
} from '../types/cell.types';
import type { ElementPosition, ElementSize } from './../types/cell-data';
import {
  mapAttributesToElement,
  mapAttributesToLink,
  type MapAttributesToElement,
  type MapAttributesToLink,
} from '../state/data-mapping';
import { graphChanges, type UpdateGraphOptions } from './graph-changes';
import { asReadonlyContainer, createContainer } from './state-container';
import { isShallowEqual, isPositionEqual, isSizeEqual } from '../utils/selector-utils';
import { ELEMENT_MODEL_TYPE } from '../models/element-model';
import { LINK_MODEL_TYPE } from '../models/link-model';

/** Cell record union accepted by the unified cells stream. */
type GraphCellUnion<
  Element extends BaseElementRecord = BaseElementRecord,
  Link extends BaseLinkRecord = BaseLinkRecord,
> = Element | Link;

/** Incremental change set emitted by graphView after container commits. */
export interface IncrementalCellsChange<
  Element extends BaseElementRecord = BaseElementRecord,
  Link extends BaseLinkRecord = BaseLinkRecord,
> {
  readonly added: Map<CellId, GraphCellUnion<Element, Link>>;
  readonly changed: Map<CellId, GraphCellUnion<Element, Link>>;
  readonly removed: Set<CellId>;
}

interface GraphViewState<
  Element extends BaseElementRecord = BaseElementRecord,
  Link extends BaseLinkRecord = BaseLinkRecord,
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
function mergeCellRecord<
  Element extends BaseElementRecord,
  Link extends BaseLinkRecord,
>(
  previous: GraphCellUnion<Element, Link> | undefined,
  next: GraphCellUnion<Element, Link>
): GraphCellUnion<Element, Link> {
  if (!previous) return next;

  const previousRecord = previous as unknown as Record<string, unknown>;
  const nextRecord = next as unknown as Record<string, unknown>;

  const previousData = previousRecord.data as object | undefined;
  const nextData = nextRecord.data as object | undefined;
  const previousPosition = previousRecord.position as ElementPosition | undefined;
  const nextPosition = nextRecord.position as ElementPosition | undefined;
  const previousSize = previousRecord.size as ElementSize | undefined;
  const nextSize = nextRecord.size as ElementSize | undefined;

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
    const previousKeys = Object.keys(previousRecord);
    const nextKeys = Object.keys(nextRecord);
    if (previousKeys.length === nextKeys.length) {
      let allMatch = true;
      for (const key of nextKeys) {
        if (key === 'data' || key === 'position' || key === 'size') continue;
        if (previousRecord[key] !== nextRecord[key]) {
          allMatch = false;
          break;
        }
      }
      if (allMatch) return previous;
    }
  }

  return {
    ...nextRecord,
    data: mergedData,
    position: mergedPosition,
    size: mergedSize,
  } as unknown as GraphCellUnion<Element, Link>;
}

/**
 * Convert a JointJS cell to its CellRecord representation, routing by type:
 *  - Elements → element mapper, with id/type guaranteed AND
 *    `position`/`size`/`angle`/`data` normalised to non-undefined values so
 *    consumers can rely on `ResolvedElementRecord`'s required-field contract.
 *  - Links → link mapper, with id/type/source/target/data normalised.
 *  - Anything else → pass-through of attributes
 * @param cell - graph cell
 * @returns CellRecord suitable for the cells container
 */
function toCellRecord<
  Element extends BaseElementRecord,
  Link extends BaseLinkRecord,
>(cell: dia.Cell): GraphCellUnion<Element, Link> {
  if (cell.isElement()) {
    type ElementData = Element['data'];
    const record = (mapAttributesToElement as MapAttributesToElement<ElementData>)(cell.attributes);
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
      data: (record.data ?? {}) as ElementData,
    };
    return withDefaults as unknown as GraphCellUnion<Element, Link>;
  }
  if (cell.isLink()) {
    type LinkData = Link['data'];
    const record = (mapAttributesToLink as MapAttributesToLink<LinkData>)(cell.attributes);
    const withDefaults = {
      ...record,
      id: cell.id,
      type: record.type ?? LINK_MODEL_TYPE,
      source: record.source ?? {},
      target: record.target ?? {},
      data: (record.data ?? {}) as LinkData,
    };
    return withDefaults as unknown as GraphCellUnion<Element, Link>;
  }
  return { ...cell.attributes, id: cell.id } as unknown as GraphCellUnion<Element, Link>;
}

export function graphView<
  Element extends BaseElementRecord = BaseElementRecord,
  Link extends BaseLinkRecord = BaseLinkRecord,
>(options: GraphViewState<Element, Link>) {
  const { graph, onIncrementalChange, onElementsSizeChange } = options;

  const cells = createContainer<GraphCellUnion<Element, Link>>('Cells');

  const trackChanges = onIncrementalChange !== undefined;
  const added = trackChanges ? new Map<CellId, GraphCellUnion<Element, Link>>() : undefined;
  const changed = trackChanges ? new Map<CellId, GraphCellUnion<Element, Link>>() : undefined;
  const removed = trackChanges ? new Set<CellId>() : undefined;

  /**
   * Write a cell into the container via `mergeCellRecord`, preserving sub-ref
   * identity and short-circuiting the subscriber fire when nothing actually
   * changed (the merge's fast path returns `previous` itself, which the
   * container's `isStrictEqual` check then skips).
   * @param cell - graph cell
   * @returns the merged record (may be the previous reference when unchanged)
   */
  function writeCell(cell: dia.Cell): GraphCellUnion<Element, Link> {
    cells.set(cell.id, (previous) => {
      const next = toCellRecord<Element, Link>(cell);
      return mergeCellRecord<Element, Link>(previous, next);
    });
    return cells.get(cell.id)!;
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
  Element extends BaseElementRecord = BaseElementRecord,
  Link extends BaseLinkRecord = BaseLinkRecord,
> = ReturnType<typeof graphView<Element, Link>>;
