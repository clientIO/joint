import type { dia, shapes } from '@joint/core'

type Elements = 'standard.Rectangle' | 'standard.Circle' | 'standard.Link'

type BaseElement<T extends Elements, S> = S & { type: T }

type Rect<Id extends dia.Cell.ID> = BaseElement<
  'standard.Rectangle',
  dia.Element.GenericAttributes<shapes.standard.RectangleSelectors>
> & {
  id: Id
}

type Link<Id extends dia.Cell.ID> = BaseElement<
  'standard.Link',
  dia.Link.GenericAttributes<shapes.standard.LinkSelectors>
> & {
  source: { id: Id } & dia.Link.EndJSON
  target: { id: Id } & dia.Link.EndJSON
}

export type Cell<Id extends dia.Cell.ID> = Rect<Id> | Link<Id>

// Type checking utility for `dia.Cell.JSON` objects.
export function isDiaCellJSON(cell: unknown): cell is dia.Cell.JSON {
  return typeof cell === 'object' && cell !== null && 'type' in cell
}

export function isDiaCellsJSON(cells: unknown): cells is dia.Cell.JSON[] {
  return Array.isArray(cells) && cells.every(isDiaCellJSON)
}
