/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import type { Meta, StoryObj } from '@storybook/react/*'
import './index.css'
import { GraphProvider } from '../../components/graph-provider'
import type { InferElement } from '../../utils/create'
import { createElements, createLinks } from '../../utils/create'
import { useSetElement } from '../../hooks/use-set-element'
import { HtmlElement } from '../../components/html-element'
import type { RenderElement } from '../../components/paper'
import { Paper } from '../../components/paper'
import { useElements } from '../../hooks/use-elements'
import { useCallback } from 'react'

export type Story = StoryObj<typeof GraphProvider>
const meta: Meta<typeof GraphProvider> = {
  title: 'Examples/With toolbar',
  component: GraphProvider,
}
export default meta

const initialElements = createElements([
  { id: '1', data: { label: 'Node 1' }, x: 100, y: 0, type: 'standard.Rectangle' },
  { id: '2', data: { label: 'Node 2' }, x: 100, y: 200 },
])
const initialEdges = createLinks([{ id: 'e1-2', source: '1', target: '2' }])

type BaseElementWithData = InferElement<typeof initialElements>

function ElementInput({ id, data }: Readonly<BaseElementWithData>) {
  const { label } = data
  const setElement = useSetElement<BaseElementWithData>(id, 'data')
  return <input value={label} onChange={(event) => setElement({ label: event.target.value })} />
}

function Main() {
  const elements = useElements<BaseElementWithData>()
  const renderElement: RenderElement<BaseElementWithData> = useCallback(
    (element) => <HtmlElement className="node">{element.data.label}</HtmlElement>,
    []
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper width={400} renderElement={renderElement} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {elements.map((item) => {
          return <ElementInput key={item.id} {...item} />
        })}
      </div>
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
