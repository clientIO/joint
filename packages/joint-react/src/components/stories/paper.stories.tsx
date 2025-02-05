/* eslint-disable sonarjs/no-small-switch */

/* eslint-disable no-console */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */

import type { Meta, StoryObj } from '@storybook/react'
import type { dia } from '@joint/core'

import { shapes } from '@joint/core'
import { GraphProvider } from '../graph-provider'
import { PaperProvider } from '../paper-provider'
import { Paper } from '../paper'
import { useGraphStore } from '../../hooks/use-graph-store'
import { useGraphCells } from '../../hooks/use-graph-cells'
import { CellsExplorer } from './cell-explorer'
import { ReactElement } from '../../models/react-element'

import { useSetGraphCells } from '../../hooks/use-set-graph-cells'

const paperStoryOptions: dia.Paper.Options = {
  width: 400,
  height: 400,
  background: { color: '#f8f9fa' },
  gridSize: 2,
}

// elements to add to the graph
const ELEMENTS = () => {
  return [
    new shapes.standard.Rectangle({
      id: '1',
      position: { x: 100, y: 30 },
      size: { width: 100, height: 40 },
      attrs: {
        label: { text: 'rect-1' },
        body: { fill: 'blue' },
      },
    }),
    new shapes.standard.Rectangle({
      id: '2',
      position: { x: 100, y: 100 },
      size: { width: 100, height: 40 },
      attrs: {
        label: { text: 'rect-2' },
        body: { fill: 'red' },
      },
    }),
    new shapes.standard.Link({
      source: { id: '1' },
      target: { id: '2' },
      attrs: {
        line: { stroke: 'blue', targetMarker: { name: 'classic', size: 8 } },
      },
    }),
    new ReactElement({
      id: '3',
      position: { x: 100, y: 200 },
      size: { width: 100, height: 40 },
      attrs: {
        body: { fill: 'green' },
      },
    }),

    new ReactElement({
      id: '4',
      position: { x: 100, y: 300 },
      size: { width: 100, height: 40 },
      attrs: {
        body: { fill: 'green' },
      },
    }),
  ]
}
function UpdateCellsViaGraphApi() {
  const { graph } = useGraphStore()

  return (
    <div>
      <div>Updating cells via graph API</div>
      <button onClick={() => graph.clear()}>Remove all cells</button>
      <button onClick={() => graph.addCells(ELEMENTS())}>Add all cells</button>
    </div>
  )
}

const meta: Meta<typeof Paper> = {
  title: 'Components/Paper',
  component: Paper,
}

export default meta
export type PaperStory = StoryObj<typeof Paper>

function CellsExplorerViaHook() {
  const cells = useGraphCells((cell) => cell.toJSON())
  const setCells = useSetGraphCells()
  return <CellsExplorer cells={cells} onChange={setCells} />
}

export const WithHooksAPI: PaperStory = {
  args: {
    style: { border: '1px solid #ccc' },
  },
  render: () => {
    console.log('re-render WithHooksAPI')
    return (
      <GraphProvider>
        <UpdateCellsViaGraphApi />
        <div style={{ display: 'flex', flex: 1 }}>
          <PaperProvider {...paperStoryOptions}>
            <Paper
              elementSelector={(cell) => {
                switch (cell instanceof ReactElement) {
                  case true: {
                    return { id: cell.id, x: cell.attributes.position?.x }
                  }
                  default: {
                    return {
                      id: cell.id,
                    }
                  }
                }
              }}
              renderElement={(cell) => (
                <div style={{ width: '100%', height: '10%' }} onClick={() => console.log('CLICK')}>
                  x: {cell.x}
                </div>
              )}
            />
          </PaperProvider>
          <CellsExplorerViaHook />
        </div>
      </GraphProvider>
    )
  },
}

export { PaperStressTestNative, PaperStressTestReact } from './paper-stress'
