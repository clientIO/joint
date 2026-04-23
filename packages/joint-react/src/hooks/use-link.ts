import { useContext } from 'react';
import { CellIdContext } from '../context';
import { useCells } from './use-cells';
import { useGraphStore } from './use-graph-store';
import { isLinkType } from '../utils/cell-type';
import type { LinkRecord } from '../types/cell.types';

/**
 * Read the current link record (context-scoped; requires `CellIdContext`).
 * @template LinkData - user data shape on this link
 * @returns full LinkRecord for the current id
 */
export function useLink<LinkData = unknown>(): LinkRecord<LinkData>;
/**
 * Read a selected slice from the current link record.
 * @template LinkData - user data shape on this link
 * @template Selected - selector return type
 * @param selector - derives a value from the current link record
 * @returns selected value
 */
export function useLink<LinkData, Selected>(
  selector: (link: LinkRecord<LinkData>) => Selected
): Selected;
export function useLink<LinkData, Selected>(
  selector?: (link: LinkRecord<LinkData>) => Selected
): LinkRecord<LinkData> | Selected {
  const id = useContext(CellIdContext);
  if (id === undefined) {
    throw new Error('useLink() must be used inside renderLink');
  }
  const cell = useCells<unknown, LinkData>(id);
  const { graph } = useGraphStore();
  if (!cell || !isLinkType(cell.type, graph)) {
    throw new Error(`useLink(): cell "${String(id)}" is not a link`);
  }
  const link = cell as LinkRecord<LinkData>;
  return selector ? selector(link) : link;
}
