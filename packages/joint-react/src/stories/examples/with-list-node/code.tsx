/* eslint-disable @eslint-react/no-array-index-key */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */

import '../index.css';
import React, { useCallback, useRef, type PropsWithChildren } from 'react';
import { GraphProvider, Paper, useNodeSize, type OnTransformElement, useCellId } from '@joint/react';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { useCellActions } from '../../../hooks/use-cell-actions';

const initialElements: Record<string, { label: string; inputs: string[]; x: number; y: number }> = {
  '1': { label: 'Node 1', inputs: [] as string[], x: 100, y: 0 },
  '2': { label: 'Node 2', inputs: [] as string[], x: 500, y: 200 },
};
const initialEdges: Record<string, { source: string; target: string; attrs: { line: { stroke: string } } }> = {
  'e1-2': {
    source: '1',
    target: '2',
    attrs: {
      line: {
        stroke: PRIMARY,
      },
    },
  },
};

type BaseElementWithData = (typeof initialElements)[string];

function ListElement({ children, inputs }: PropsWithChildren<BaseElementWithData>) {
  const id = useCellId();
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

  const { width, height } = useNodeSize(elementRef, { transform });

  const { set } = useCellActions<BaseElementWithData>();

  const addInput = () => {
    set(id, (previous) => ({ ...previous, inputs: [...previous.inputs, ''] }));
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
        width={width - 2 * padding}
        height={height - headerHeight - padding}
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
                    set(id, (previous) => ({ ...previous, inputs: newInputs }));
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
  const renderElement = useCallback((element: BaseElementWithData) => {
    return <ListElement {...element}>{element.label}</ListElement>;
  }, []);
  return (
    <Paper width="100%" className={PAPER_CLASSNAME} height={500} renderElement={renderElement} />
  );
}

export default function App() {
  return (
    <GraphProvider elements={initialElements} links={initialEdges}>
      <Main />
    </GraphProvider>
  );
}
