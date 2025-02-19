import { shapes, util } from '@joint/core'
import { ReactElement } from '@joint/react'
import { Element } from './types'

export const PRIMARY_COLOR = '#ed2637'
export const SECONDARY_COLOR = '#2c3e50'
const LINK_ATTRIBUTES = {
  line: {
    stroke: PRIMARY_COLOR,
    strokeWidth: 2, // Set stroke width
    strokeDasharray: '5,5', // Makes the line da
  },
}

export class LinkModel extends shapes.standard.Link {
  defaults() {
    return util.defaultsDeep(
      {
        type: 'LinkModel',
        attrs: LINK_ATTRIBUTES,
      },
      super.defaults
    )
  }
}

export const defaultLinks = [
  new LinkModel({
    source: { id: 1 },
    target: { id: 2 },
  }),
  new LinkModel({
    source: { id: 2 },
    target: { id: 3 },
  }),
]
export const defaultElements = [
  // NATIVE ELEMENT _ to show we can still use jointjs elements
  new shapes.standard.Rectangle({
    id: 1,
    componentType: 'native',
    position: { x: 15, y: 5 },
    size: { width: 150, height: 40 },
    attrs: {
      body: {
        fill: SECONDARY_COLOR,
        stroke: PRIMARY_COLOR,
        strokeWidth: 2,
      },
      label: {
        text: 'Native element',
        stroke: PRIMARY_COLOR,
        fill: PRIMARY_COLOR,
        fontSize: 18,
        fontWeight: 'bold',
      },
    },
  }),
  new ReactElement<Element>({
    id: 2,
    position: { x: 100, y: 100 },
    componentType: 'alert',
    // size: { width: 500, height: 200 },
    data: {
      title: 'Warning text',
      subtitle: 'This is a subtitle for the warning',
      textValue: 'hello',
      isError: false,
    },
  }),
  new ReactElement<Element>({
    id: 3,
    position: { x: 550, y: 300 },
    componentType: 'alert',
    // size: { width: 250, height: 200 },
    data: {
      title: 'Error text',
      subtitle: 'This is a subtitle for the error',
      textValue: 'hello',
      isError: true,
    },
  }),

  new ReactElement<Element>({
    id: 4,
    position: { x: 100, y: 400 },
    componentType: 'table',
    data: {
      columns: ['Column 1', 'Column 2', 'Column 3'],
      rows: [
        // ['Row 1', 'Row 1', 'Row 1'],
        // ['Row 2', 'Row 2', 'Row 2'],
        // ['Row 3', 'Row 3', 'Row 3'],
      ],
    },
  }),

  new ReactElement<Element>({
    id: 5,
    position: { x: 500, y: 0 },
    componentType: 'table',
    data: {
      columns: ['Column 1', 'Column 2', 'Column 3'],
      rows: [
        // ['Row 1', 'Row 1', 'Row 1'],
        // ['Row 2', 'Row 2', 'Row 2'],
        // ['Row 3', 'Row 3', 'Row 3'],
      ],
    },
  }),
]
