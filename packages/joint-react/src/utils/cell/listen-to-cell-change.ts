import { mvc, type dia } from '@joint/core';

export type ChangeEvent = 'change' | 'add' | 'remove' | 'reset';

/**
 * JointJS options object passed through events.
 * Contains flags like `isUpdateFromReact` to detect update sources.
 */
export interface JointJSEventOptions {
  readonly isUpdateFromReact?: boolean;
  readonly [key: string]: unknown;
}

interface OnChangeOptionsBase {
  readonly type: ChangeEvent;
  readonly cells?: dia.Cell[];
  readonly cell?: dia.Cell;
  readonly options?: JointJSEventOptions;
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
  controller.listenTo(graph, 'change', (cell: dia.Cell, options: JointJSEventOptions) =>
    handleCellsChange({ type: 'change', cell, options })
  );
  controller.listenTo(
    graph,
    'add',
    (cell: dia.Cell, _collection: mvc.Collection<dia.Cell>, options: JointJSEventOptions) =>
      handleCellsChange({ type: 'add', cell, options })
  );
  controller.listenTo(
    graph,
    'remove',
    (cell: dia.Cell, _collection: mvc.Collection<dia.Cell>, options: JointJSEventOptions) =>
      handleCellsChange({ type: 'remove', cell, options })
  );
  controller.listenTo(
    graph,
    'reset',
    (collection: mvc.Collection<dia.Cell>, options: JointJSEventOptions) =>
      handleCellsChange({ type: 'reset', cells: collection.models, options })
  );

  return () => controller.stopListening();
}
