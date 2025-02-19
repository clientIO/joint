import type { BaseElement, BaseLink } from '../types/cell.types'

/**
 * Sugar function to provide typing for create initial / default elements
 */
export function createElements<T>(data: BaseElement<T>[]) {
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
