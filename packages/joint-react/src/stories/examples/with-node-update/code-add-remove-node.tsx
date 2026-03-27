/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import {
  GraphProvider,
  Paper,
  useElementId,
  useElements,
  useGraph,
  useMeasureNode,
  type FlatElementData,
  type FlatLinkData,
} from '@joint/react';
import '../index.css';
import { useRef } from 'react';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';

interface NodeData {
  readonly [key: string]: unknown;
  readonly label: string;
  readonly color: string;
}

const initialElements: Record<string, FlatElementData<NodeData>> = {
  '1': { data: { label: 'Node 1', color: '#ffffff' }, position: { x: 40, y: 70 }, size: { width: 120, height: 80 } },
  '2': { data: { label: 'Node 2', color: '#ffffff' }, position: { x: 170, y: 120 }, size: { width: 120, height: 80 } },
  '3': { data: { label: 'Node 2', color: '#ffffff' }, position: { x: 30, y: 180 }, size: { width: 120, height: 80 } },
};

const initialEdges: Record<string, FlatLinkData> = {
  'e1-1': {
    source: '1',
    target: '2',
    color: PRIMARY,
  },
};

function FlatElementData({ id, label }: Readonly<{ id: string; label: string }>) {
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
  const { graph } = useGraph();
  const id = useElementId();
  const elementRef = useRef<HTMLDivElement>(null);
  const { width, height } = useMeasureNode(elementRef);
  return (
    <foreignObject width={width} height={height}>
      <div ref={elementRef} className="node flex flex-1 justify-center items-center w-30">
        <div className="flex flex-1 justify-center items-center py-2 flex-col mx-4">
          <span className="mb-1 text-sm">{label}</span>
          <button
            onClick={() => {
              graph.getCell(id).remove();
            }}
            type="button"
            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
          >
            Remove
          </button>
        </div>
      </div>
    </foreignObject>
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
        defaultRouter={{ name: 'rightAngle', args: { margin: 40 } }}
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
        height={380}
        renderElement={RenderElement}
      />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {[...elements.entries()].map(([id, item]) => {
          return <FlatElementData key={id} id={id} label={item.data?.label as string} />;
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
