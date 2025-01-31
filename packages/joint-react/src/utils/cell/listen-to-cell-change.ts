import { mvc, type dia } from '@joint/core'

/**
 * Listens to changes in the graph's cells and triggers the provided callback.
 * @param graph The JointJS graph instance.
 * @param handleCellsChange The callback function to handle cell changes.
 * @returns A function to stop listening to cell changes.
 */
export function listenToCellChange(graph: dia.Graph, handleCellsChange: () => void): () => void {
  const controller = new mvc.Listener()
  controller.listenTo(graph, 'change', handleCellsChange)
  controller.listenTo(graph, 'add', handleCellsChange)
  controller.listenTo(graph, 'remove', handleCellsChange)
  return () => controller.stopListening()
}
