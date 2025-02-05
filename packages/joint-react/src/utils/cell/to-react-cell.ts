import type { dia } from '@joint/core'
import type { BaseCell, RequiredCell } from '../../types/cell.types'

export function defaultCellSelector<T extends RequiredCell>(cell: dia.Cell): T {
  const position: dia.Point | undefined = cell.get('position')
  if (!position) {
    return { id: cell.id } as unknown as T
  }
  const { x, y } = position

  const size: dia.Size | undefined = cell.get('size')
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

export function toBaseCell<T extends RequiredCell = BaseCell>(
  cells: dia.Cell,
  selector: (item: dia.Cell) => T = defaultCellSelector
): T {
  return selector(cells)
}

export function toBaseCells<T extends RequiredCell = BaseCell>(
  cells: dia.Cell[],
  selector: (item: dia.Cell) => T = defaultCellSelector
): T[] {
  return cells.map(selector)
}
