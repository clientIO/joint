import type { CellId } from '../../../types/cell-id';

export function isCellSelected(
  cellId: CellId | null | undefined,
  selectedId: CellId | null
): boolean {
  if (cellId == null || selectedId == null) {
    return false;
  }
  return String(cellId) === String(selectedId);
}
