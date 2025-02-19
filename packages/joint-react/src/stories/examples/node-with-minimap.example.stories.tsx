/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import type { Meta, StoryObj } from '@storybook/react/*'
import { GraphProvider } from '../../components/graph-provider'
import type { RenderElement } from '../../components/paper'
import { Paper } from '../../components/paper'
import { AutoSizeDiv } from '../../components/auto-size-div'
import { useCallback } from 'react'
import type { InferElement } from '../../utils/create'
import { createElements, createLinks } from '../../utils/create'
import './index.css'

export type Story = StoryObj<typeof GraphProvider>
const meta: Meta<typeof GraphProvider> = {
  title: 'Examples/Node with minimap',
  component: GraphProvider,
}
export default meta

const initialElements = createElements([
  { id: '1', data: { label: 'Node 1' }, x: 100, y: 0 },
  { id: '2', data: { label: 'Node 2' }, x: 100, y: 200 },
])
const initialEdges = createLinks([{ id: 'e1-2', source: '1', target: '2' }])

type BaseElementWithData = InferElement<typeof initialElements>

function MiniMap() {
  const renderElement: RenderElement<BaseElementWithData> = useCallback(
    () => <div className="minimap-node" />,
    []
  )
  return (
    <div className="minimap">
      <Paper
        interactive={false}
        scale={0.4}
        width={'100%'}
        height={'100%'}
        renderElement={renderElement}
      />
    </div>
  )
}
function Main() {
  const renderElement: RenderElement<BaseElementWithData> = useCallback(
    (element) => <AutoSizeDiv className="node">{element.data.label}</AutoSizeDiv>,
    []
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper width={400} renderElement={renderElement} />
      <MiniMap />
    </div>
  )
}
export const Basic: Story = {
  args: {
    defaultElements: initialElements,
    defaultLinks: initialEdges,
  },
  render: (props) => {
    return (
      <GraphProvider {...props}>
        <Main />
      </GraphProvider>
    )
  },
}
