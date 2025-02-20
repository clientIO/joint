import type { dia } from '@joint/core'
import type { BaseElement, BaseLink } from '../types/cell.types'

/**
 * Validates that all elements have unique 'id's.
 * @param elements - Array of BaseElement objects to validate.
 * @throws Will throw an error if duplicate 'id's are found.
 */
function validateUniqueIds<T>(elements: BaseElement<T>[]): void {
  const seenIds = new Set<dia.Cell.ID>()
  for (const element of elements) {
    if (seenIds.has(element.id)) {
      throw new Error(`Duplicate id found: ${element.id}`)
    }
    seenIds.add(element.id)
  }
}

/**
 * Create elements with precise types based on input
 */
export function createElements<T, E extends BaseElement<T>>(data: E[]): E[] {
  validateUniqueIds(data)
  return data
}

/**
 * Infer element based on typeof createElements
 */
export type InferElement<T extends BaseElement[]> = T[0]

/**
 * Sugar function to provide typing for create initial / default links
 */
export function createLinks(data: BaseLink[]) {
  return data
}
