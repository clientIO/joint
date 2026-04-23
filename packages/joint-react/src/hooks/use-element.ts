import { useContext } from 'react';
import { CellIdContext } from '../context';
import { useCells } from './use-cells';
import { useGraphStore } from './use-graph-store';
import { isElementType } from '../utils/cell-type';
import type { ElementRecord } from '../types/cell.types';

/**
 * Read the current element record (context-scoped; requires `CellIdContext`).
 * @template ElementData - user data shape on this element
 * @returns full ElementRecord for the current id
 */
export function useElement<ElementData = unknown>(): ElementRecord<ElementData>;
/**
 * Read a selected slice from the current element record.
 * @template ElementData - user data shape on this element
 * @template Selected - selector return type
 * @param selector - derives a value from the current element record
 * @returns selected value
 */
export function useElement<ElementData, Selected>(
  selector: (element: ElementRecord<ElementData>) => Selected
): Selected;
export function useElement<ElementData, Selected>(
  selector?: (element: ElementRecord<ElementData>) => Selected
): ElementRecord<ElementData> | Selected {
  const id = useContext(CellIdContext);
  if (id === undefined) {
    throw new Error('useElement() must be used inside renderElement');
  }
  const cell = useCells<ElementData, unknown>(id);
  const { graph } = useGraphStore();
  if (!cell || !isElementType(cell.type, graph)) {
    throw new Error(`useElement(): cell "${String(id)}" is not an element`);
  }
  const element = cell as ElementRecord<ElementData>;
  return selector ? selector(element) : element;
}
