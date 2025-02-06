/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable sonarjs/pseudo-random */
/* eslint-disable no-console */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { dia, shapes } from '@joint/core'
import { ReactElement } from '../../models/react-element'
import { GraphProvider } from '../graph-provider'
import { Paper } from '../paper'
import { PaperProvider } from '../paper-provider'
import type { PaperStory } from './paper.stories'
import { useSetCells } from '../../hooks/use-set-cells'
import { updateGraph } from '../../utils/update-graph'
import { useElements } from '../../hooks/use-elements'

const paperStoryOptions: dia.Paper.Options = {
  width: 400,
  height: 400,
  background: { color: '#f8f9fa' },
  gridSize: 2,
}
const graph = new dia.Graph({}, { cellNamespace: { ...shapes, ReactElement } })
const notUsedGraph = new dia.Graph({}, { cellNamespace: { ...shapes, ReactElement } })
function createElements(xCount: number, yCount: number) {
  const elements = []
  const ELEMENT_SIZE = 50
  const MARGIN = 2
  for (let x = 0; x < xCount; x++) {
    for (let y = 0; y < yCount; y++) {
      elements.push(
        new ReactElement({
          id: `${x}-${y}`,
          position: { x: x * (ELEMENT_SIZE + MARGIN), y: y * (ELEMENT_SIZE + MARGIN) },
          size: { width: ELEMENT_SIZE, height: ELEMENT_SIZE },
          attrs: {
            label: { text: `${x}-${y}` },
            body: { fill: 'blue', stroke: 'black' },
          },
        })
      )
      // add a link to the previous element
      if (x > 0) {
        elements.push(
          new shapes.standard.Link({
            id: `${x - 1}-${y}-${x}-${y}`,
            source: { id: `${x - 1}-${y}` },
            target: { id: `${x}-${y}` },
          })
        )
      }
    }
  }
  return elements
}

graph.addCells(createElements(15, 30))
notUsedGraph.addCells(createElements(15, 30))
function RandomChange() {
  const elementsSize = useElements((items) => items.map((item) => item.id))
  const setCells = useSetCells()
  console.log('re-render RandomChange Component', elementsSize)
  return (
    <>
      <button
        onClick={() => {
          console.time('Random move')
          setCells((previousCells) =>
            previousCells.map((cell) => {
              if (cell instanceof ReactElement) {
                cell.set({
                  position: { x: Math.random() * 1000, y: Math.random() * 1000 },
                })
                return cell
              }
              return cell
            })
          )
          console.timeEnd('Random move')
        }}
      >
        {/* Random move {elementsSize.length} elements */}
      </button>

      <button
        onClick={() => {
          console.time('Random move with notUsedGraph')
          const oldCells = notUsedGraph.getCells()
          updateGraph(
            notUsedGraph,
            oldCells.map((cell) => {
              if (cell instanceof ReactElement) {
                cell.set({
                  position: { x: Math.random() * 1000, y: Math.random() * 1000 },
                })
                return cell
              }
              return cell
            })
          )
          console.timeEnd('Random move with notUsedGraph')
        }}
      >
        Random move with notUsedGraph - only prints console.logs
      </button>
    </>
  )
}

export const PaperStressTestNative: PaperStory = {
  args: {
    style: { border: '1px solid #ccc' },
  },
  render: () => {
    console.log('re-render WithHooksAPI')
    return (
      <GraphProvider graph={graph}>
        <RandomChange />
        <div style={{ display: 'flex', flex: 1 }}>
          <PaperProvider {...paperStoryOptions}>
            <Paper />
          </PaperProvider>
        </div>
      </GraphProvider>
    )
  },
}

export const PaperStressTestReact: PaperStory = {
  args: {
    style: { border: '1px solid #ccc' },
  },
  render: () => {
    console.log('re-render WithHooksAPI')
    return (
      <GraphProvider graph={graph}>
        <RandomChange />
        <div style={{ display: 'flex', flex: 1 }}>
          {/* <PaperProvider {...paperStoryOptions}> */}
          <Paper
            {...paperStoryOptions}
            // elementSelector={(cell) => {
            //   switch (cell instanceof ReactElement) {
            //     case true: {
            //       return { id: cell.id, xPosition: cell.attributes.position?.x }
            //     }
            //     default: {
            //       return {
            //         id: cell.id,
            //       }
            //     }
            //   }
            // }}
            renderElement={(element) => {
              console.log('re-render renderElement')
              return (
                <div style={{ fontSize: 12 }} onClick={() => console.log('Click from React')}>
                  {JSON.stringify(element.attributes.position)}
                </div>
              )
            }}
          />
          {/* </PaperProvider> */}
        </div>
      </GraphProvider>
    )
  },
}
