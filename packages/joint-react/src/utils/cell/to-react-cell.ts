import type { dia } from '@joint/core'
import type { BaseElement, BaseLink } from '../../types/cell.types'

export function defaultElementSelector<T>(cell: dia.Cell): T {
  const position: dia.Point = cell.get('position')

  const { x, y } = position

  const size: dia.Size = cell.get('size')
  return {
    id: cell.id,
    type: cell.get('type'),
    x,
    y,
    angle: cell.get('angle'),
    height: size?.height,
    width: size?.width,
  } as unknown as T
}

export function toBaseElement<T = BaseElement>(
  cells: dia.Cell,
  selector: (item: dia.Cell) => T = defaultElementSelector
): T {
  return selector(cells)
}

export function toBaseElements<T = BaseElement>(
  cells: dia.Cell[],
  selector: (item: dia.Cell) => T = defaultElementSelector
): T[] {
  return cells.map(selector)
}

export function defaultLinkSelector<T>(cell: dia.Cell): T {
  return {
    id: cell.id,
    target: cell.get('target'),
    source: cell.get('source'),
  } as unknown as T
}

export function toBaseLink<T = BaseElement>(
  cells: dia.Cell,
  selector: (item: dia.Cell) => T = defaultLinkSelector
): T {
  return selector(cells)
}

export function toBaseLinks<T = BaseLink>(
  cells: dia.Cell[],
  selector: (item: dia.Cell) => T = defaultLinkSelector
): T[] {
  return cells.map(selector)
}
