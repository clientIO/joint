import type { BaseElement, BaseLink } from '../types/cell.types'

/**
 * Create elements with precise types based on input
 */
export function createElements<T, E extends BaseElement<T>>(data: E[]): E[] {
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
