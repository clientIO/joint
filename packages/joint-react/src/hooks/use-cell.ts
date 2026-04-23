import { useContext } from 'react';
import { CellIdContext } from '../context';
import { useCells } from './use-cells';
import type { CellRecord } from '../types/cell.types';

/**
 * Read the current cell from the closest `CellIdContext` — the id is provided
 * by `<Paper />` around `renderElement` / `renderLink`. Use this inside a
 * render callback (or a component mounted from one) to access the full cell
 * record.
 *
 * Throws when used outside of a Paper render context, or when the id no longer
 * resolves to a cell in the store (e.g. deleted mid-render).
 * @template ElementData - user data shape on elements (for narrowing)
 * @template LinkData - user data shape on links (for narrowing)
 * @returns the current cell record
 */
export function useCell<
  ElementData = unknown,
  LinkData = unknown,
>(): CellRecord<ElementData, LinkData> {
  const id = useContext(CellIdContext);
  if (id === undefined) {
    throw new Error('useCell() must be used inside renderElement or renderLink');
  }
  const cell = useCells<ElementData, LinkData>(id);
  if (cell === undefined) {
    throw new Error(`useCell(): no cell with id "${String(id)}"`);
  }
  return cell;
}
