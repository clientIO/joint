import { dia } from '@joint/core'
export interface RequiredCell {
  readonly id: dia.Cell.ID
}
export interface BaseCell extends RequiredCell {
  readonly type: string
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly angle: number
}
