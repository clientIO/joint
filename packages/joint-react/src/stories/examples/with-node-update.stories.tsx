/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import type { Meta, StoryObj } from '@storybook/react/*';
import { useSetElement } from '../../hooks/use-set-element';
import { useElements } from '../../hooks/use-elements';
import type { InferElement } from '../../utils/create';
import { createElements, createLinks } from '../../utils/create';
import './index.css';
import { GraphProvider } from '../../components/graph-provider/graph-provider';
import { HTMLNode } from '../../components/html-node/html-node';
import { Paper } from '../../components/paper/paper';

export type Story = StoryObj<typeof GraphProvider>;
const meta: Meta<typeof GraphProvider> = {
  title: 'Examples/With Node Update',
  component: GraphProvider,
};
export default meta;

const initialElements = createElements([
  { id: '1', data: { label: 'Node 1', color: '#ffffff' }, x: 100, y: 0 },
  { id: '2', data: { label: 'Node 2', color: '#ffffff' }, x: 100, y: 200 },
]);
const initialEdges = createLinks([{ id: 'e1-2', source: '1', target: '2' }]);

type BaseElementWithData = InferElement<typeof initialElements>;

function ElementInput({ id, data }: BaseElementWithData) {
  const { label } = data;
  const setElement = useSetElement<BaseElementWithData>(id, 'data');
  return (
    <input value={label} onChange={(event) => setElement({ ...data, label: event.target.value })} />
  );
}

function RenderElement({ data: { label } }: BaseElementWithData) {
  return <HTMLNode className="node">{label}</HTMLNode>;
}

function Main() {
  const elements = useElements<BaseElementWithData>();

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper width={400} renderElement={RenderElement} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {elements.map((item) => {
          return <ElementInput key={item.id} {...item} />;
        })}
      </div>
    </div>
  );
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
    );
  },
};

function RenderElementWithColorPicker({ data, id }: BaseElementWithData) {
  const setElement = useSetElement<BaseElementWithData>(id, 'data');
  return (
    <HTMLNode
      style={{
        backgroundColor: data.color,
      }}
      className="node"
    >
      <input
        className="nodrag"
        type="color"
        onChange={(event) => {
          setElement({ ...data, color: event.target.value });
        }}
        defaultValue={data.color}
      />
    </HTMLNode>
  );
}
function MainWithColor() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper width={400} renderElement={RenderElementWithColorPicker} />
      <div style={{ display: 'flex', flexDirection: 'column' }}></div>
    </div>
  );
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
    );
  },
};
