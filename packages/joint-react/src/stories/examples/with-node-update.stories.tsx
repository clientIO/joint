/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import type { Meta, StoryObj } from '@storybook/react/*'
import { GraphProvider } from '../../components/graph-provider'
import type { RenderElement } from '../../components/paper'
import { Paper } from '../../components/paper'
import { HtmlElement } from '../../components/html-element'
import { useSetElement } from '../../hooks/use-set-element'
import { useElements } from '../../hooks/use-elements'
import type { InferElement } from '../../utils/create'
import { createElements, createLinks } from '../../utils/create'
import './index.css'

export type Story = StoryObj<typeof GraphProvider>
const meta: Meta<typeof GraphProvider> = {
  title: 'Examples/With Node Update',
  component: GraphProvider,
}
export default meta

const initialElements = createElements([
  { id: '1', data: { label: 'Node 1', color: '#ffffff' }, x: 100, y: 0 },
  { id: '2', data: { label: 'Node 2', color: '#ffffff' }, x: 100, y: 200 },
])
const initialEdges = createLinks([{ id: 'e1-2', source: '1', target: '2' }])

type BaseElementWithData = InferElement<typeof initialElements>

function ElementInput({ id, data }: Readonly<BaseElementWithData>) {
  const { label } = data
  const setElement = useSetElement<BaseElementWithData>(id, 'data')
  return (
    <input value={label} onChange={(event) => setElement({ ...data, label: event.target.value })} />
  )
}

function RenderElement({ data: { label } }: Readonly<BaseElementWithData>) {
  return <HtmlElement className="node">{label}</HtmlElement>
}

function Main() {
  const elements = useElements<BaseElementWithData>()

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper width={400} renderElement={RenderElement} />
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

function RenderElementWithColorPicker({ data, id }: Readonly<BaseElementWithData>) {
  const setElement = useSetElement<BaseElementWithData>(id, 'data')
  return (
    <HtmlElement
      style={{
        backgroundColor: data.color,
      }}
      className="node"
    >
      <input
        className="nodrag"
        type="color"
        onChange={(event) => {
          setElement({ ...data, color: event.target.value })
        }}
        defaultValue={data.color}
      />
    </HtmlElement>
  )
}
function MainWithColor() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper width={400} renderElement={RenderElementWithColorPicker} />
      <div style={{ display: 'flex', flexDirection: 'column' }}></div>
    </div>
  )
}
export const WithColor: Story = {
  args: {
    defaultElements: initialElements,
    defaultLinks: initialEdges,
  },
  render: (props) => {
    return (
      <GraphProvider {...props}>
        <MainWithColor />
      </GraphProvider>
    )
  },
}
