/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import {
  type CellRecord,
  GraphProvider,
  Paper,
  useCells,
  type ElementRecord,
  type Computed,
} from '@joint/react';
import '../index.css';
import { PAPER_CLASSNAME } from 'storybook-config/theme';
import { useGraph } from '@joint/react';

interface NodeData {
  readonly label: string;
  readonly color: string;
}

type MyElement = ElementRecord<NodeData>;
type MyResolvedElement = Computed<ElementRecord<NodeData>>;

const initialCells: ReadonlyArray<CellRecord<NodeData>> = [
  {
    id: '1',
    type: 'element',
    data: { label: 'Node 1', color: '#4f46e5' },
    position: { x: 100, y: 15 },
  },
  {
    id: '2',
    type: 'element',
    data: { label: 'Node 2', color: '#4f46e5' },
    position: { x: 100, y: 200 },
  },
  {
    id: 'e1-2',
    type: 'link',
    source: { id: '1' },
    target: { id: '2' },
  },
];

function LabelEditor({ id, label }: Readonly<{ id: string; label: string }>) {
  const { setCell } = useGraph<MyElement>();
  return (
    <input
      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
      style={{ padding: 5, marginTop: 4 }}
      value={label}
      onChange={(event) =>
        setCell((previous) => {
          const previousElement = previous as MyElement;
          return {
            ...previousElement,
            id,
            data: {
              ...(previousElement.data ?? { label: '', color: '#4f46e5' }),
              label: event.target.value,
            },
          } as MyElement;
        })
      }
    />
  );
}

function Main() {
  const { isElement } = useGraph<MyElement>();
  const elements = useCells<MyResolvedElement, readonly MyResolvedElement[]>((cells) =>
    cells.filter((cell) => isElement(cell))
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper className={PAPER_CLASSNAME} height={280} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {elements.map((element) => (
          <LabelEditor
            key={String(element.id)}
            id={String(element.id)}
            label={element.data.label}
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
