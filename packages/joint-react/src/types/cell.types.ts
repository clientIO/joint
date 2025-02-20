import type { dia, shapes } from '@joint/core'
import { isDiaId } from '../utils/is'
export interface RequiredCell {
  readonly id: dia.Cell.ID
}

export interface Ports {
  readonly groups?: Record<string, dia.Element.PortGroup>
  readonly items?: dia.Element.Port[]
}
export interface BaseElement<T = unknown> extends RequiredCell {
  /**
   * @default 'react'
   */
  readonly type?: string
  readonly x: number
  readonly y: number
  readonly width?: number
  readonly height?: number
  readonly angle?: number
  readonly data: T extends undefined ? undefined : T
  readonly attrs?: dia.Element.Attributes['attrs']
  readonly ports?: Ports
}

export function isBaseElement(element: unknown): element is BaseElement {
  return (
    typeof element === 'object' &&
    element !== null &&
    'id' in element &&
    'x' in element &&
    'y' in element &&
    isDiaId(element.id) &&
    typeof element.x === 'number' &&
    typeof element.y === 'number'
  )
}

export function isReactElement(element: unknown): boolean {
  if (!isBaseElement(element)) {
    return false
  }
  return element.type === 'react' || element.type === undefined
}

export interface BaseLink extends RequiredCell {
  readonly source: dia.Cell.ID
  readonly target: dia.Cell.ID
  readonly attrs?: shapes.standard.LinkAttributes['attrs']
}

export function isBaseLink(link: unknown): link is BaseLink {
  return (
    typeof link === 'object' &&
    link !== null &&
    'id' in link &&
    'source' in link &&
    'target' in link &&
    isDiaId(link.id) &&
    typeof link.source === 'string' &&
    typeof link.target === 'string'
  )
}
