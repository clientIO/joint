import { mvc, type dia } from '@joint/core';

export type ChangeEvent = 'change' | 'add' | 'remove';
/**
 * Listens to changes in the graph's cells and triggers the provided callback.
 * @group Cell
 * @param graph The JointJS graph instance.
 * @param handleCellsChange The callback function to handle cell changes.
 * @returns A function to stop listening to cell changes.
 */
export function listenToCellChange(
  graph: dia.Graph,
  handleCellsChange: (cell: dia.Cell, type: ChangeEvent) => void
): () => void {
  const controller = new mvc.Listener();
  controller.listenTo(graph, 'change', (cell: dia.Cell) => handleCellsChange(cell, 'change'));
  controller.listenTo(graph, 'add', (cell: dia.Cell) => handleCellsChange(cell, 'add'));
  controller.listenTo(graph, 'remove', (cell: dia.Cell) => handleCellsChange(cell, 'remove'));

  return () => controller.stopListening();
}
