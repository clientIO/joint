/* eslint-disable @eslint-react/no-array-index-key */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */

import '../index.css';
import { useCallback, useRef, type PropsWithChildren } from 'react';
import {
  GraphProvider,
  Paper,
  useElement,
  useMeasureNode,
  type Cells,
  type ElementRecord,
  type OnTransformElement,
} from '@joint/react';
import { PAPER_CLASSNAME, PAPER_STYLE, PRIMARY } from 'storybook-config/theme';
import { useGraph } from '@joint/react';

interface ListNodeData {
  readonly label: string;
  readonly inputs: string[];
}

const initialCells: Cells<ListNodeData> = [
  {
    id: '1',
    type: 'ElementModel',
    data: { label: 'Node 1', inputs: [] },
    position: { x: 100, y: 15 },
  },
  {
    id: '2',
    type: 'ElementModel',
    data: { label: 'Node 2', inputs: [] },
    position: { x: 500, y: 200 },
  },
  {
    id: 'e1-2',
    type: 'LinkModel',
    source: { id: '1' },
    target: { id: '2' },
    style: { color: PRIMARY },
  },
];

function ListElement({ children, inputs }: PropsWithChildren<ListNodeData>) {
  const id = useElement((element) => element.id);
  const padding = 10;
  const headerHeight = 50;
  const elementRef = useRef<HTMLDivElement>(null);

  const transform: OnTransformElement = useCallback(
    ({ width: measuredWidth, height: measuredHeight }) => {
      const w = padding + measuredWidth + padding;
      const h = headerHeight + measuredHeight + padding;
      return {
        width: w,
        height: h,
      };
    },
    []
  );

  const { width, height } = useMeasureNode(elementRef, { transform });

  const { setCell } = useGraph<ListNodeData>();

  const addInput = () => {
    setCell((previous) => {
      const previousElement = previous as ElementRecord<ListNodeData>;
      const previousData = previousElement.data;
      const previousInputs = Array.isArray(previousData?.inputs) ? previousData.inputs : [];
      return {
        ...previousElement,
        id,
        data: { ...(previousData ?? { label: '', inputs: [] }), inputs: [...previousInputs, ''] },
      } as ElementRecord<ListNodeData>;
    });
  };

  return (
    <>
      <rect width={width} height={height} fill="#121826" stroke="#eee" strokeWidth="2"></rect>
      <text
        x={width / 2}
        y={headerHeight / 2}
        fontSize={20}
        textAnchor="middle"
        fill="#eee"
        dominantBaseline={'middle'}
      >
        {`${children}`}
      </text>
      <foreignObject
        x={padding}
        y={headerHeight}
        width={Math.max(width - 2 * padding, 0)}
        height={Math.max(height - headerHeight - padding, 0)}
      >
        <div ref={elementRef} className="absolute p-1 min-w-50">
          <button
            type="button"
            onClick={addInput}
            className={'p-1 bg-rose-600 rounded-[4px] text-white hover:opacity-65 mb-3 w-full'}
          >
            Add item
          </button>
          <ul className={'list-none'}>
            {inputs.map((input, index) => (
              <li key={index}>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Item {index + 1}
                </label>
                <input
                  type="text"
                  value={input}
                  className={
                    'block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
                  }
                  onChange={(event) => {
                    const newInputs = [...inputs];
                    newInputs[index] = event.target.value;
                    setCell((previous) => {
                      const previousElement = previous as ElementRecord<ListNodeData>;
                      const previousData = previousElement.data;
                      return {
                        ...previousElement,
                        id,
                        data: { ...(previousData ?? { label: '', inputs: [] }), inputs: newInputs },
                      } as ElementRecord<ListNodeData>;
                    });
                  }}
                />
              </li>
            ))}
          </ul>
          {inputs.length === 0 && <div className="text-gray-500 text-xs">No items</div>}
        </div>
      </foreignObject>
    </>
  );
}

const DEFAULT_LIST_NODE_DATA: ListNodeData = { label: '', inputs: [] };

function Main() {
  const renderElement = useCallback((data: ListNodeData | undefined) => {
    const { label, inputs } = data ?? DEFAULT_LIST_NODE_DATA;
    return (
      <ListElement label={label} inputs={inputs}>
        {label}
      </ListElement>
    );
  }, []);
  return (
    <Paper
      className={PAPER_CLASSNAME}
      height={500}
      renderElement={renderElement}
      style={PAPER_STYLE}
      drawGrid={false}
    />
  );
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
