import type { dia } from '@joint/core'

/**
 * Retrieves all cells from the graph and converts them to JSON format.
 * @param graph The JointJS graph instance.
 * @returns An array of cells in JSON format.
 */
export function getCells<
  K extends dia.Cell.Selectors = dia.Cell.Selectors,
  T extends dia.Cell.GenericAttributes<K> = dia.Cell.GenericAttributes<K>,
>(graph: dia.Graph): dia.Cell.JSON<K, T>[] {
  return graph.getCells().map((cell) => cell.toJSON()) as dia.Cell.JSON<K, T>[]
}
