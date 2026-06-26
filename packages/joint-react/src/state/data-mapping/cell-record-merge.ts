import type { dia } from '@joint/core';
import type { ElementJSONInit, LinkJSONInit, AnyCellRecord } from '../../types/cell.types';
import type { Container } from '../../store/state-container';
import { isShallowEqual, isPositionEqual, isSizeEqual } from '../../utils/selector-utils';
import { mapAttributesToElement } from './element-mapper';
import { mapAttributesToLink } from './link-mapper';

/* eslint-disable sonarjs/cognitive-complexity -- ref-identity fast paths are
   intentionally inlined here; splitting them would defeat the optimization. */
/**
 * Merge a newly-mapped cell record with the previous one, preserving reference
 * identity wherever possible.
 *
 * - `data` / `position` / `size` sub-refs are reused when structurally equal.
 * - **Fast path:** when every top-level key also strict-equals the previous
 *   record, returns `previous` itself. The container then sees
 *   `isStrictEqual(previous, value) === true` and skips the subscriber fire
 *   altogether.
 * @param previous - previous record (may be undefined for the first write)
 * @param next - freshly mapped record from the graph
 * @returns merged record; may be `previous` itself when nothing changed
 */
function mergeCellRecord<Element extends ElementJSONInit, Link extends LinkJSONInit>(
  previous: Element | Link | undefined,
  next: Element | Link
): Element | Link {
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
  } as Element | Link;
}
/* eslint-enable sonarjs/cognitive-complexity */

/**
 * Convert a JointJS cell to its CellRecord representation, routing by type.
 * @param cell - graph cell
 * @returns CellRecord suitable for the cells container
 */
export function toCellRecord<Element extends ElementJSONInit, Link extends LinkJSONInit>(
  cell: dia.Cell
): Element | Link {
  return cell.isElement()
    ? (mapAttributesToElement(cell.attributes) as Element)
    : (mapAttributesToLink(cell.attributes) as Link);
}

/**
 * Write a cell into a records container via `mergeCellRecord`, preserving
 * sub-ref identity. The merge fast-path returns `previous` itself when
 * nothing observable changed; the container then skips notifying subscribers.
 * @param container - destination records container
 * @param cell - graph cell to write
 * @returns the merged record (may be the previous reference when unchanged)
 */
export function writeCellToContainer<Cell extends AnyCellRecord>(
  container: Container<Cell>,
  cell: dia.Cell
): Cell {
  container.set(cell.id, (previous) => {
    const next = toCellRecord(cell);
    return mergeCellRecord(previous, next as Cell) as Cell;
  });
  return container.get(cell.id) as Cell;
}
