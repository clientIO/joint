/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import {
  GraphProvider,
  Paper,
  useCells,
  type Cells,
  type ElementRecord,
} from '@joint/react';
import '../index.css';
import { PAPER_CLASSNAME } from 'storybook-config/theme';
import { useGraph } from '@joint/react';

interface NodeData {
  readonly label: string;
  readonly color: string;
}

const initialCells: Cells<NodeData> = [
  {
    id: '1',
    type: 'ElementModel',
    data: { label: 'Node 1', color: '#4f46e5' },
    position: { x: 100, y: 15 },
  },
  {
    id: '2',
    type: 'ElementModel',
    data: { label: 'Node 2', color: '#4f46e5' },
    position: { x: 100, y: 200 },
  },
  {
    id: 'e1-2',
    type: 'LinkModel',
    source: { id: '1' },
    target: { id: '2' },
  },
];

function LabelEditor({ id, label }: Readonly<{ id: string; label: string }>) {
  const { setCell } = useGraph<NodeData>();
  return (
    <input
      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
      style={{ padding: 5, marginTop: 4 }}
      value={label}
      onChange={(event) =>
        setCell((previous) => {
          const previousElement = previous as ElementRecord<NodeData>;
          return {
            ...previousElement,
            id,
            data: {
              ...(previousElement.data ?? { label: '', color: '#4f46e5' }),
              label: event.target.value,
            },
          } as ElementRecord<NodeData>;
        })
      }
    />
  );
}

function Main() {
  const { isElement } = useGraph<NodeData>();
  const elements = useCells<NodeData, unknown, ReadonlyArray<ElementRecord<NodeData>>>(
    (cells) => cells.filter((cell) => isElement(cell)) as ReadonlyArray<ElementRecord<NodeData>>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper className={PAPER_CLASSNAME} height={280} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {elements.map((element) => (
          <LabelEditor
            key={String(element.id)}
            id={String(element.id)}
            label={element.data?.label ?? ''}
          />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
