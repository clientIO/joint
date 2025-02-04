import { dia } from '@joint/core'
import { BaseCell, RequiredCell } from '../../types/cell.types'

function defaultSelector<T extends RequiredCell>(cell: dia.Cell): T {
  const { x, y } = cell.get('position') as dia.Point
  return {
    id: cell.id,
    type: cell.get('type'),
    x,
    y,
    angle: cell.get('angle'),
    height: cell.get('size').height,
    width: cell.get('size').width,
  } as unknown as T
}

export function toBaseCell<T extends RequiredCell = BaseCell>(
  cells: dia.Cell,
  selector: (item: dia.Cell) => T = defaultSelector
): T {
  return selector(cells)
}

export function toBaseCells<T extends RequiredCell = BaseCell>(
  cells: dia.Cell[],
  selector: (item: dia.Cell) => T = defaultSelector
): T[] {
  return cells.map(selector)
}
