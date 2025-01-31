/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable no-console */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */

import type { Cell } from '../../types/cell.types'
import type { Meta, StoryObj } from '@storybook/react'
import type { dia } from '@joint/core'

import { shapes } from '@joint/core'
import { useState } from 'react'
import { GraphProvider } from '../graph-provider'
import { PaperProvider } from '../paper-provider'
import { Paper } from '../paper'
import { useGraph } from '../../hooks/use-graph'
import { useGraphCells } from '../../hooks/use-graph-cells'
import { CellsExplorer } from './cell-explorer'
import { ReactElement } from '../../models/react-element'

const paperOptions: dia.Paper.Options = {
  width: 400,
  height: 400,
  background: { color: '#f8f9fa' },
  gridSize: 10,
}
// json representation of the cells
const CELLS: Array<Cell<'1' | '2'>> = [
  {
    id: '1',
    type: 'standard.Rectangle',
    position: { x: 0, y: 100 },
    size: { width: 100, height: 40 },
    attrs: {
      label: { text: 'test-rectangle1' },
      body: { fill: 'blue', stroke: 'black' },
    },
  },
  {
    id: '2',
    type: 'standard.Rectangle',
    position: { x: 100, y: 300 },
    size: { width: 100, height: 40 },
    attrs: {
      label: { text: 'test-rectangle2' },
      body: { fill: 'red' },
    },
  },
  {
    id: '3',
    type: 'standard.Link',
    source: { id: '1' },
    target: { id: '2' },
    attrs: {
      line: { stroke: 'blue', targetMarker: { name: 'classic', size: 8 } },
    },
  },
]

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
  const graph = useGraph()

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
type Story = StoryObj<typeof Paper>

export const WithCellsAsReactState: Story = {
  args: {
    style: { border: '1px solid #ccc' },
  },
  render: () => {
    const [cells, setCells] = useState([...CELLS])

    return (
      <GraphProvider
        onCellsChange={(changedCells) => {
          setCells(changedCells)
        }}
        cells={cells}
      >
        <div>Updating cells via react state</div>
        <button onClick={() => setCells([])}>Remove all cells</button>
        <button onClick={() => setCells((previous) => previous.filter((cell) => cell.id !== '1'))}>
          Remove rect 1
        </button>
        <button onClick={() => setCells((previous) => previous.filter((cell) => cell.id !== '2'))}>
          Remove rect 2
        </button>
        <button onClick={() => setCells((previous) => previous.filter((cell) => cell.id !== '3'))}>
          Remove link
        </button>

        <button
          onClick={() =>
            setCells((previpis) => {
              const newCells = [...previpis]
              newCells[0] = { ...newCells[0], position: { x: 100, y: 100 } }
              return newCells
            })
          }
        >
          Change position
        </button>
        <button onClick={() => setCells([...CELLS])}>Add all cells</button>
        <UpdateCellsViaGraphApi />
        <PaperProvider {...paperOptions}>
          <Paper />
        </PaperProvider>

        {cells.map((cell) => {
          return <div key={cell.id}>{JSON.stringify(cell)}</div>
        })}
      </GraphProvider>
    )
  },
}

function CellsExplorerViaHook() {
  const [cells, setCells] = useGraphCells()
  return <CellsExplorer cells={cells} onChange={setCells} />
}

export const WithHooksAPI: Story = {
  args: {
    style: { border: '1px solid #ccc' },
  },
  render: () => {
    console.log('re-render WithHooksAPI')
    return (
      <GraphProvider>
        <UpdateCellsViaGraphApi />
        <div style={{ display: 'flex', flex: 1 }}>
          <PaperProvider {...paperOptions}>
            <Paper />
          </PaperProvider>
          {/* <Paper {...paperOptions} /> */}
          <CellsExplorerViaHook />
        </div>
      </GraphProvider>
    )
  },
}

export const WithHooksAPIAndRenderElement: Story = {
  args: {
    style: { border: '1px solid #ccc' },
  },
  render: () => {
    console.log('re-render WithHooksAPI')
    return (
      <GraphProvider cellNamespace={{ ...shapes, ReactElement }}>
        <UpdateCellsViaGraphApi />
        <div style={{ display: 'flex', flex: 1 }}>
          <PaperProvider {...paperOptions}>
            <Paper
              renderElement={(element) => (
                <div onClick={() => console.log('CLICK')}>{JSON.stringify(element)}</div>
              )}
            />
          </PaperProvider>
          {/* <Paper {...paperOptions} /> */}
          <CellsExplorerViaHook />
        </div>
      </GraphProvider>
    )
  },
}
