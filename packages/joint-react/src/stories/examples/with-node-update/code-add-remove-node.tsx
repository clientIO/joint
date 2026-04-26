/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import {
  GraphProvider,
  HTMLHost,
  Paper,
  useCells,
  useElement,
  useGraph,
  type Cells,
  type ElementRecord,
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

const initialCells: Cells<NodeData> = [
  {
    id: '1',
    type: 'element',
    data: { label: 'Node 1', color: '#ffffff' },
    position: { x: 40, y: 70 },
  },
  {
    id: '2',
    type: 'element',
    data: { label: 'Node 2', color: '#ffffff' },
    position: { x: 270, y: 120 },
  },
  {
    id: '3',
    type: 'element',
    data: { label: 'Node 2', color: '#ffffff' },
    position: { x: 30, y: 180 },
  },
  {
    id: 'e1-1',
    type: 'link',
    source: { id: '1' },
    target: { id: '2' },
    color: PRIMARY,
  },
];

function LabelInput({ id, label }: Readonly<{ id: string; label: string }>) {
  const { setCell } = useGraph<NodeData>();
  return (
    <input
      style={{ padding: 5, marginTop: 4 }}
      value={label}
      onChange={(event) =>
        setCell((previous) => {
          const previousElement = previous as ElementRecord<NodeData>;
          return {
            ...previousElement,
            id,
            data: { ...(previousElement.data ?? { label: '', color: '#ffffff' }), label: event.target.value },
          } as ElementRecord<NodeData>;
        })
      }
      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
    />
  );
}

function RenderElement() {
  const element = useElement<NodeData>();
  const { removeCell } = useGraph();
  const label = element.data?.label ?? '';
  return (
    <HTMLHost className="min-w-[120px] bg-white rounded-lg border border-gray-300 shadow-md">
      <div className="flex flex-1 justify-center items-center py-2 flex-col mx-4">
        <span className="mb-1 text-sm break-all text-black">{label}</span>
        <button
          onClick={() => removeCell(element.id)}
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
  const { isElement } = useGraph<NodeData>();
  const elements = useCells<NodeData, unknown, ReadonlyArray<ElementRecord<NodeData>>>(
    (cells) => cells.filter((cell) => isElement(cell)) as ReadonlyArray<ElementRecord<NodeData>>
  );
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
        {elements.map((element) => (
          <LabelInput
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
