/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable @eslint-react/no-array-index-key */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */

import '../index.css';
import { useCallback, useRef, type PropsWithChildren } from 'react';
import {
  GraphProvider,
  Paper,
  useMeasureNode,
  type OnTransformElement,
  type ElementRecord,
  type LinkRecord,
  useElementId,
} from '@joint/react';
import { BG, PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { useGraph } from '@joint/react';

interface ListNodeData {
  readonly label: string;
  readonly inputs: string[];
}

const initialElements: Record<string, ElementRecord<ListNodeData>> = {
  '1': { data: { label: 'Node 1', inputs: [] }, position: { x: 100, y: 15 } },
  '2': { data: { label: 'Node 2', inputs: [] }, position: { x: 500, y: 200 } },
};
const initialEdges: Record<string, LinkRecord> = {
  'e1-2': {
    source: { id: '1' },
    target: { id: '2' },
    style: { color: PRIMARY },
  },
};

function ListElement({ children, inputs }: PropsWithChildren<ListNodeData>) {
  const id = useElementId();
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

  const { setElement } = useGraph<ListNodeData>();

  const addInput = () => {
    setElement(id, (previous) => {
      const previousData = previous.data as unknown as ListNodeData;
      const previousInputs = Array.isArray(previousData?.inputs) ? previousData.inputs : [];
      return { ...previous, data: { ...previousData, inputs: [...previousInputs, ''] } };
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
                    setElement(id, (previous) => {
                      const previousData = previous.data as unknown as ListNodeData;
                      return { ...previous, data: { ...previousData, inputs: newInputs } };
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

function Main() {
  const renderElement = useCallback(({ label, inputs }: ListNodeData) => {
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
      style={{ backgroundColor: BG }}
      drawGrid={false}
    />
  );
}

export default function App() {
  return (
    <GraphProvider elements={initialElements} links={initialEdges}>
      <Main />
    </GraphProvider>
  );
}
