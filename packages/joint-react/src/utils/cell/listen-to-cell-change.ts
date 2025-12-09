import { mvc, type dia } from '@joint/core';

export type ChangeEvent = 'change' | 'add' | 'remove' | 'reset';

interface OnChangeOptionsBase {
  readonly type: ChangeEvent;
  readonly cells?: dia.Cell[];
  readonly cell?: dia.Cell;
}
interface OnChangeOptionsUpdate extends OnChangeOptionsBase {
  readonly type: 'change' | 'add' | 'remove';
  readonly cell: dia.Cell;
}
interface OnResetOptionsReset extends OnChangeOptionsBase {
  readonly type: 'reset';
  readonly cells: dia.Cell[];
}
export type OnChangeOptions = OnChangeOptionsUpdate | OnResetOptionsReset;

type OnChangeHandler = (options: OnChangeOptions) => void;

/**
 * Listens to changes in the graph's cells and triggers the provided callback.
 * @group Cell
 * @param graph The JointJS graph instance.
 * @param handleCellsChange The callback function to handle cell changes.
 * @returns A function to stop listening to cell changes.
 */
export function listenToCellChange(
  graph: dia.Graph,
  handleCellsChange: OnChangeHandler
): () => void {
  const controller = new mvc.Listener();
  controller.listenTo(graph, 'change', (cell: dia.Cell) =>
    handleCellsChange({ type: 'change', cell })
  );
  controller.listenTo(graph, 'add', (cell: dia.Cell) => handleCellsChange({ type: 'add', cell }));
  controller.listenTo(graph, 'remove', (cell: dia.Cell) =>
    handleCellsChange({ type: 'remove', cell })
  );
  controller.listenTo(graph, 'reset', (cells: dia.Cell[]) =>
    handleCellsChange({ type: 'reset', cells })
  );

  return () => controller.stopListening();
}
