import type { dia } from '@joint/core';

export function isCellSelected(
  cellId: dia.Cell.ID | null | undefined,
  selectedId: dia.Cell.ID | null
): boolean {
  if (cellId == null || selectedId == null) {
    return false;
  }
  return String(cellId) === String(selectedId);
}
