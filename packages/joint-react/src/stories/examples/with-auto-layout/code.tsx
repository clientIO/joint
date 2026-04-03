/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-shadow */
/* eslint-disable sonarjs/pseudo-random */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import '../index.css';
import { GraphProvider, Paper, useGraph, type ElementRecord, useElements, HTMLBox } from '@joint/react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { dia } from '@joint/core';
import { PAPER_CLASSNAME } from 'storybook-config/theme';

const INPUT_CLASSNAME =
  'block w-15 mr-2 p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500';

type ElementData = { label: string };
const initialElements: Record<string, ElementRecord<ElementData>> = {
  '1': { data: { label: 'Node 1' }, size: { width: 100, height: 50 } },
  '2': { data: { label: 'Node 2' }, size: { width: 100, height: 50 } },
  '3': { data: { label: 'Node 3' }, size: { width: 100, height: 50 } },
  '4': { data: { label: 'Node 4' }, size: { width: 100, height: 50 } },
  '5': { data: { label: 'Node 5' }, size: { width: 100, height: 50 } },
  '6': { data: { label: 'Node 6' }, size: { width: 100, height: 50 } },
  '7': { data: { label: 'Node 7' }, size: { width: 100, height: 50 } },
  '8': { data: { label: 'Node 8' }, size: { width: 100, height: 50 } },
  '9': { data: { label: 'Node 9' }, size: { width: 100, height: 50 } },
};

function Main() {
  const { graph } = useGraph();
  const { setElement } = useGraph<ElementData>();
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

  useEffect(() => {
    makeLayoutWithGrid({ graph, gridXSize });
    // make layout on load!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderElement = useCallback((data: { label: string }) => {
    return <HTMLBox useModelGeometry>{data.label}</HTMLBox>;
  }, []);

  const elementsLength = useElements((items) => items.size);
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
            setElement(newId, {
              data: { label: `Node ${elementsLength + 1}` },
              size: { width: 100, height: 50 },
            });
            makeLayoutWithGrid({ graph, gridXSize });
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
    <GraphProvider elements={initialElements}>
      <Main />
    </GraphProvider>
  );
}
