/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import type { Meta, StoryObj } from '@storybook/react/*'
import { GraphProvider } from '../../components/graph-provider'
import { Paper } from '../../components/paper'
import { HtmlElement } from '../../components/html-element'
import type { InferElement } from '../../utils/create'
import { createElements, createLinks } from '../../utils/create'
import './index.css'
import { MaskHighlighter } from '../../components/mask-highlighter'
import { useState } from 'react'

export type Story = StoryObj<typeof GraphProvider>
const meta: Meta<typeof GraphProvider> = {
  title: 'Examples/With highlighter',
  component: GraphProvider,
}
export default meta

const initialElements = createElements([
  { id: '1', data: { label: 'Node 1' }, x: 100, y: 0 },
  { id: '2', data: { label: 'Node 2' }, x: 100, y: 200 },
])
const initialEdges = createLinks([{ id: 'e1-2', source: '1', target: '2' }])

type BaseElementWithData = InferElement<typeof initialElements>

function RenderItem({ data: { label } }: Readonly<BaseElementWithData>) {
  // return <rect joint-selector={'body'} className="node" width={100} height={100} />
  const [isHighlighted, setIsHighlighted] = useState(true)
  return (
    <HtmlElement
      onClick={() => setIsHighlighted(!isHighlighted)}
      joint-selector={'body'}
      className="node"
    >
      {label}
      {isHighlighted && <MaskHighlighter />}
    </HtmlElement>
  )
}
function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper width={400} renderElement={RenderItem} />
    </div>
  )
}
export const Default: Story = {
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
