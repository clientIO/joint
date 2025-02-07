import type { dia } from '@joint/core'
export interface RequiredCell {
  readonly id: dia.Cell.ID
}
export interface BaseElement extends RequiredCell {
  readonly type: string
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly angle: number
}

export interface BaseLink extends RequiredCell {
  readonly source: dia.Cell.ID
  readonly target: dia.Cell.ID
}
