/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import {
  GraphProvider,
  Paper,
  useElements,
  useMeasureNode,
  type FlatElementData,
  type FlatLinkData,
} from '@joint/react';
import '../index.css';
import { useRef } from 'react';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { useGraph } from '@joint/react';

interface NodeData {
  readonly [key: string]: unknown;
  readonly label: string;
  readonly color: string;
}

const initialElements: Record<string, FlatElementData<NodeData>> = {
  '1': { data: { label: 'Node 1', color: '#ffffff' }, x: 100, y: 15, width: 100, height: 50 },
  '2': { data: { label: 'Node 2', color: '#ffffff' }, x: 100, y: 200, width: 100, height: 50 },
};

const initialEdges: Record<string, FlatLinkData> = {
  'e1-2': {
    source: '1',
    target: '2',
    color: PRIMARY,
  },
};

function FlatElementData({ id, label }: Readonly<{ id: string; label: string }>) {
  const { setElement } = useGraph<NodeData>();
  return (
    <input
      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
      style={{ padding: 5, marginTop: 4 }}
      value={label}
      onChange={(event) =>
        setElement(id, (previous) => ({
          ...previous,
          data: { ...previous.data, label: event.target.value },
        }))
      }
    />
  );
}

function RenderElement({ label }: Readonly<NodeData>) {
  const elementRef = useRef<HTMLDivElement>(null);
  const { width, height } = useMeasureNode(elementRef);
  return (
    <foreignObject width={width} height={height}>
      <div ref={elementRef} className="node">
        {label}
      </div>
    </foreignObject>
  );
}

function Main() {
  const elements = useElements<NodeData>();
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper className={PAPER_CLASSNAME} height={280} renderElement={RenderElement} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {[...elements.entries()].map(([id, item]) => {
          return <FlatElementData key={id} id={id} label={item.data?.label ?? ''} />;
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
