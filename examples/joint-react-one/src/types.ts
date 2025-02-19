import { dia } from '@joint/core'
import { RequiredCell } from '@joint/react'

interface BaseElement extends RequiredCell {
  componentType: string
  id: dia.Cell.ID
}

export interface AlertElement extends BaseElement {
  componentType: 'alert'
  data: {
    textValue: string
    title: string
    subtitle: string
    isError: boolean
  }
}

export interface TableElement extends BaseElement {
  componentType: 'table'
  data: {
    columns: string[]
    rows: string[][]
  }
}

export type Element = AlertElement | TableElement

export function elementsSelector(items: dia.Element[]) {
  return items.map(
    (item): Element => ({
      componentType: item.get('componentType'),
      data: item.attributes.data,
      id: item.id,
    })
  )
}
