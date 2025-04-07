/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import {
  createElements,
  createLinks,
  GraphProvider,
  HTMLNode,
  Paper,
  useCellId,
  useElements,
  useGraph,
  useSetElement,
  type InferElement,
} from '@joint/react';
import '../index.css';
import { PRIMARY } from '.storybook/theme';

const initialElements = createElements([
  { id: '1', data: { label: 'Node 1', color: '#ffffff' }, x: 40, y: 70 },
  { id: '2', data: { label: 'Node 2', color: '#ffffff' }, x: 170, y: 120 },
  { id: '3', data: { label: 'Node 2', color: '#ffffff' }, x: 30, y: 180 },
]);
const initialEdges = createLinks([
  {
    id: 'e1-1',
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
      style={{ padding: 5, marginTop: 4 }}
      value={label}
      onChange={(event) => setElement({ ...data, label: event.target.value })}
      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
    />
  );
}

function RenderElement({ data: { label } }: BaseElementWithData) {
  const graph = useGraph();
  const id = useCellId();
  return (
    <HTMLNode className="node flex flex-1 justify-center items-center w-30">
      <div className="flex flex-1 justify-center items-center py-2 flex-col mx-4">
        <span className="mb-1 text-sm">{label}</span>
        <button
          onClick={() => {
            const cell = graph.getCell(id);
            graph.removeCells([cell]);
          }}
          type="button"
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
        >
          Remove
        </button>
      </div>
    </HTMLNode>
  );
}

function Main() {
  const elements = useElements<BaseElementWithData>();
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper
        clickThreshold={10}
        interactive={{ linkMove: false }}
        defaultRouter={{ name: 'rightAngle', args: { margin: 6 } }}
        defaultConnector={{
          name: 'straight',
          args: { cornerType: 'line', cornerPreserveAspectRatio: true },
        }}
        defaultConnectionPoint={{
          name: 'boundary',
          args: {
            offset: 10,
            extrapolate: true,
          },
        }}
        width={400}
        height={280}
        renderElement={RenderElement}
      />
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
