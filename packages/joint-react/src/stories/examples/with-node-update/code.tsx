/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import {
  createElements,
  createLinks,
  GraphProvider,
  HTMLNode,
  Paper,
  useElements,
  useSetElement,
  type InferElement,
} from '@joint/react';
import '../index.css';
import { PRIMARY } from '.storybook/theme';

const initialElements = createElements([
  { id: '1', data: { label: 'Node 1', color: '#ffffff' }, x: 100, y: 0 },
  { id: '2', data: { label: 'Node 2', color: '#ffffff' }, x: 100, y: 200 },
]);
const initialEdges = createLinks([
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    attrs: {
      line: {
        stroke: PRIMARY,
      },
    },
  },
]);

type BaseElementWithData = InferElement<typeof initialElements>;

function ElementInput({ id, data }: BaseElementWithData) {
  const { label } = data;
  const setElement = useSetElement<BaseElementWithData>(id, 'data');
  return (
    <input
      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
      style={{ padding: 5, marginTop: 4 }}
      value={label}
      onChange={(event) => setElement({ ...data, label: event.target.value })}
    />
  );
}

function RenderElement({ data: { label } }: BaseElementWithData) {
  return <HTMLNode className="node">{label}</HTMLNode>;
}

function Main() {
  const elements = useElements<BaseElementWithData>();
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper width={400} height={280} renderElement={RenderElement} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {elements.map((item) => {
          return <ElementInput key={item.id} {...item} />;
        })}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider defaultElements={initialElements} defaultLinks={initialEdges}>
      <Main />
    </GraphProvider>
  );
}
