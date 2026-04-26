/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-shadow */
/* eslint-disable sonarjs/pseudo-random */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import '../index.css';
import {
  GraphProvider,
  Paper,
  useGraph,
  useCells,
  HTMLBox,
  useNodesMeasuredEffect,
  type Cells,
} from '@joint/react';
import { useCallback, useId, useRef, useState } from 'react';
import type { dia } from '@joint/core';
import { PAPER_CLASSNAME } from 'storybook-config/theme';

const INPUT_CLASSNAME =
  'block w-15 mr-2 p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500';

type ElementData = { label: string };
const initialCells: Cells<ElementData> = [
  { id: '1', type: 'ElementModel', data: { label: 'Node 1' } },
  { id: '2', type: 'ElementModel', data: { label: 'Node 2' } },
  { id: '3', type: 'ElementModel', data: { label: 'Node 3' } },
  { id: '4', type: 'ElementModel', data: { label: 'Node 4' } },
  { id: '5', type: 'ElementModel', data: { label: 'Node 5' } },
  { id: '6', type: 'ElementModel', data: { label: 'Node 6' } },
  { id: '7', type: 'ElementModel', data: { label: 'Node 7' } },
  { id: '8', type: 'ElementModel', data: { label: 'Node 8' } },
  { id: '9', type: 'ElementModel', data: { label: 'Node 9' } },
];

function Main() {
  const { graph, addCell } = useGraph<ElementData>();
  const paperId = useId();
  const paperRef = useRef<dia.Paper | null>(null);

  // Number of elements per row
  const [gridXSize, setGridXSize] = useState(3);

  // Grid layout logic based on number of columns
  const makeLayoutWithGrid = useCallback(
    ({ graph, gridXSize }: { gridXSize: number; graph: dia.Graph }) => {
      const gap = 20;
      const cols = Math.max(1, gridXSize); // avoid divide by 0
      const elements = graph.getElements();

      for (const [index, element] of elements.entries()) {
        const col = index % cols;
        const row = Math.floor(index / cols);

        const { width, height } = element.size();
        const x = col * (width + gap);
        const y = row * (height + gap);
        element.position(gap + x, gap + y);
      }
    },
    []
  );

  useNodesMeasuredEffect(paperId, () => {
    makeLayoutWithGrid({ graph, gridXSize });
  }, []);

  const renderElement = useCallback((data: ElementData) => {
    return <HTMLBox className="flex items-center justify-center">{data.label}</HTMLBox>;
  }, []);

  const elementsLength = useCells<ElementData, unknown, number>((cells) => {
    let count = 0;
    for (const cell of cells) if (cell.type === 'ElementModel') count += 1;
    return count;
  });
  return (
    <div className="flex flex-col">
      <div className="mb-8 flex flex-row items-center">
        <label className="mr-2 text-sm font-medium text-gray-900 dark:text-white">
          Number of elements per row:
        </label>
        <input
          type="number"
          className={INPUT_CLASSNAME}
          placeholder="Grid X Size"
          value={gridXSize}
          onChange={(event) => {
            const gridXSize = Number(event.target.value);
            setGridXSize(gridXSize);
            makeLayoutWithGrid({ graph, gridXSize });
          }}
          min={0}
        />

        <button
          onClick={() => {
            const newId = `${Math.random()}`;
            addCell({
              id: newId,
              type: 'ElementModel',
              data: { label: `Node ${elementsLength + 1}` },
            });
          }}
          type="button"
          className="bg-blue-500 cursor-pointer hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Add Node
        </button>
      </div>
      <Paper
        ref={paperRef}
        id={paperId}
        className={PAPER_CLASSNAME}
        height={450}
        renderElement={renderElement}
      />
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider<ElementData> initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
