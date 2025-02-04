import { dia, shapes } from '@joint/core'
import { ReactElement } from '../../models/react-element'
import { GraphProvider } from '../graph-provider'
import { Paper } from '../paper'
import { PaperProvider } from '../paper-provider'
import { PaperStory, paperStoryOptions } from './paper.stories'
import { useGraphCells } from '../../hooks/use-graph-cells'

const graph = new dia.Graph({}, { cellNamespace: { ...shapes, ReactElement } })
function createElements(xCount: number, yCount: number) {
  const elements = []
  const ELEMENT_SIZE = 40
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
    }
  }
  return elements
}

graph.addCells(createElements(30, 30))
function RandomChange() {
  const cells = useGraphCells()
  // console.log('re-render Check with count:', cells.length)

  return (
    <button
      onClick={() => {
        // setCells((previousCells) =>
        //   previousCells.map((cell) => {
        //     cell.set({
        //       position: { x: Math.random() * 1000, y: Math.random() * 1000 },
        //     })
        //     return cell
        //   })
        // )
      }}
    >
      Random move {cells.length} elements
    </button>
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
          <PaperProvider {...paperStoryOptions}>
            <Paper
              renderElement={(element) => (
                <div style={{ fontSize: 10 }} onClick={() => console.log('Click from React')}>
                  {JSON.stringify(element)}
                </div>
              )}
            />
          </PaperProvider>
        </div>
      </GraphProvider>
    )
  },
}
