import { useCallback, useRef, type ChangeEvent } from 'react';
import {
  GraphProvider,
  Paper,
  useCellId,
  useGraph,
  useMeasureElement,
  type CellRecord,
  type ElementRecord,
  type TransformElementLayout,
} from '@joint/react';

// Colors — unified dark diagram palette.
const PRIMARY = '#ED2637';
const NODE_BODY_COLOR = '#1c2836';
const NODE_STROKE_COLOR = '#3c4f63';
const TEXT_COLOR = '#DDE6ED';

const PADDING = 10;
const HEADER_HEIGHT = 50;

interface ListItem {
  readonly id: string;
  readonly value: string;
}

interface ListNodeData {
  readonly label: string;
  readonly inputs: readonly ListItem[];
}

let nextItemId = 0;
const createItemId = (): string => {
  nextItemId += 1;
  return `item-${nextItemId}`;
};

const initialCells: ReadonlyArray<CellRecord<ListNodeData>> = [
  {
    id: '1',
    type: 'element',
    data: { label: 'Node 1', inputs: [] },
    position: { x: 100, y: 15 },
  },
  {
    id: '2',
    type: 'element',
    data: { label: 'Node 2', inputs: [] },
    position: { x: 500, y: 200 },
  },
  {
    id: 'e1-2',
    type: 'link',
    source: { id: '1' },
    target: { id: '2' },
    style: { color: PRIMARY },
  },
];

// Grow the node around its measured content, leaving room for the header.
const transform: TransformElementLayout = ({ width, height }) => ({
  width: PADDING + width + PADDING,
  height: HEADER_HEIGHT + height + PADDING,
});

function ListNode({ label, inputs }: Readonly<ListNodeData>) {
  const id = useCellId();
  const contentRef = useRef<HTMLDivElement>(null);
  const { width, height } = useMeasureElement(contentRef, { transform });
  const { setCellData } = useGraph<ElementRecord<ListNodeData>>();

  const addItem = useCallback(() => {
    setCellData(id, (previous) => ({
      ...previous,
      inputs: [...previous.inputs, { id: createItemId(), value: '' }],
    }));
  }, [id, setCellData]);

  const handleItemChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { itemId } = event.currentTarget.dataset;
      const { value } = event.currentTarget;
      setCellData(id, (previous) => ({
        ...previous,
        inputs: previous.inputs.map((item) => (item.id === itemId ? { ...item, value } : item)),
      }));
    },
    [id, setCellData]
  );

  return (
    <>
      <rect
        width={width}
        height={height}
        fill={NODE_BODY_COLOR}
        stroke={NODE_STROKE_COLOR}
        strokeWidth="2"
      />
      <text
        x={width / 2}
        y={HEADER_HEIGHT / 2}
        fontSize={20}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={TEXT_COLOR}
      >
        {label}
      </text>
      <foreignObject
        x={PADDING}
        y={HEADER_HEIGHT}
        width={Math.max(width - 2 * PADDING, 0)}
        height={Math.max(height - HEADER_HEIGHT - PADDING, 0)}
      >
        <div ref={contentRef} className="absolute min-w-50 p-1">
          <button type="button" onClick={addItem} className="jj-btn jj-btn--primary mb-3 w-full">
            Add item
          </button>
          <ul className="list-none">
            {inputs.map((item, index) => (
              <li key={item.id} className="mb-2">
                <span className="jj-label mb-1 block text-xs">Item {index + 1}</span>
                <input
                  type="text"
                  value={item.value}
                  data-item-id={item.id}
                  onChange={handleItemChange}
                  className="jj-input w-full"
                />
              </li>
            ))}
          </ul>
          {inputs.length === 0 && <div className="jj-label text-xs">No items</div>}
        </div>
      </foreignObject>
    </>
  );
}

function Main() {
  const renderElement = useCallback(
    (data: ListNodeData) => <ListNode label={data.label} inputs={data.inputs} />,
    []
  );
  return <Paper className="size-full" renderElement={renderElement} />;
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
