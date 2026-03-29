/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import {
  GraphProvider,
  Paper,
  useElements,
  type PortalElementRecord,
  type PortalLinkRecord,
} from '@joint/react';
import '../index.css';
import { PAPER_CLASSNAME } from 'storybook-config/theme';
import { useGraph } from '@joint/react';

interface NodeData {
  readonly label: string;
  readonly color: string;
}

const initialElements: Record<string, PortalElementRecord<NodeData>> = {
  '1': {
    data: { label: 'Node 1', color: '#4f46e5' },
    position: { x: 100, y: 15 },
  },
  '2': {
    data: { label: 'Node 2', color: '#4f46e5' },
    position: { x: 100, y: 200 },
  },
};

const initialEdges: Record<string, PortalLinkRecord> = {
  'e1-2': {
    source: { id: '1' },
    target: { id: '2' },
  },
};

function LabelEditor({ id, label }: Readonly<{ id: string; label: string }>) {
  const { setElement } = useGraph<NodeData>();
  return (
    <input
      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
      style={{ padding: 5, marginTop: 4 }}
      value={label}
      onChange={(event) =>
        setElement(id, (previous) => ({
          ...previous,
          data: { ...previous.data!, label: event.target.value },
        }))
      }
    />
  );
}

function Main() {
  const elements = useElements<NodeData>();
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper className={PAPER_CLASSNAME} height={280} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {[...elements.entries()].map(([id, item]) => {
          return <LabelEditor key={id} id={id} label={item.data?.label ?? ''} />;
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
