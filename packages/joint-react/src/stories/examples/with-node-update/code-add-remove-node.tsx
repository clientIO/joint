/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import {
  GraphProvider,
  Paper,
  useElementId,
  useElements,
  useGraph,
  HTMLHost,
  type ElementRecord,
  type LinkRecord,
} from '@joint/react';
import '../index.css';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { linkRoutingOrthogonal } from '@joint/react/presets';

const ORTHOGONAL_LINKS = linkRoutingOrthogonal({ cornerType: 'line', margin: 40, sourceOffset: 10, targetOffset: 10 });

interface NodeData {
  readonly [key: string]: unknown;
  readonly label: string;
  readonly color: string;
}

const initialElements: Record<string, ElementRecord<NodeData>> = {
  '1': {
    data: { label: 'Node 1', color: '#ffffff' },
    position: { x: 40, y: 70 },
  },
  '2': {
    data: { label: 'Node 2', color: '#ffffff' },
    position: { x: 270, y: 120 },
  },
  '3': {
    data: { label: 'Node 2', color: '#ffffff' },
    position: { x: 30, y: 180 },
  },
};

const initialEdges: Record<string, LinkRecord> = {
  'e1-1': {
    source: { id: '1' },
    target: { id: '2' },
    color: PRIMARY,
  },
};

function Element({ id, label }: Readonly<{ id: string; label: string }>) {
  const { setElement } = useGraph<NodeData>();
  return (
    <input
      style={{ padding: 5, marginTop: 4 }}
      value={label}
      onChange={(event) =>
        setElement(id, (previous) => ({
          ...previous,
          data: { ...(previous.data as unknown as NodeData), label: event.target.value },
        }))
      }
      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
    />
  );
}

function RenderElement({ label }: Readonly<NodeData>) {
  const { removeElement } = useGraph();
  const id = useElementId();
  return (
    <HTMLHost className="min-w-[120px] bg-white rounded-lg border border-gray-300 shadow-md">
      <div className="flex flex-1 justify-center items-center py-2 flex-col mx-4">
        <span className="mb-1 text-sm break-all text-black">{label}</span>
        <button
          onClick={() => removeElement(id)}
          type="button"
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
        >
          Remove
        </button>
      </div>
    </HTMLHost>
  );
}

function Main() {
  const elements = useElements<NodeData>();
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper
        className={PAPER_CLASSNAME}
        clickThreshold={10}
        interactive={{ linkMove: false }}
        {...ORTHOGONAL_LINKS}
        height={380}
        renderElement={RenderElement}
      />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {[...elements.entries()].map(([id, item]) => {
          return <Element key={id} id={id} label={item.data?.label as string} />;
        })}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider elements={initialElements} links={initialEdges}>
      <Main />
    </GraphProvider>
  );
}
