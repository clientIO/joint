/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-shadow */
/* eslint-disable sonarjs/pseudo-random */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import '../index.css';
import {
  GraphProvider,
  Paper,
  useElements,
  useGraph,
  useElementLayout,
  useElementsMeasuredEffect,
  type RenderElement,
} from '@joint/react';
import { useCallback, useId, useRef, useState } from 'react';
import type { dia } from '@joint/core';
import { PAPER_CLASSNAME } from 'storybook-config/theme';

const initialElements: Record<string, { label: string; width: number; height: number }> = {
  '1': { label: 'Node 1', width: 100, height: 50 },
  '2': { label: 'Node 2', width: 100, height: 50 },
  '3': { label: 'Node 3', width: 100, height: 50 },
  '4': { label: 'Node 4', width: 100, height: 50 },
  '5': { label: 'Node 5', width: 100, height: 50 },
  '6': { label: 'Node 6', width: 100, height: 50 },
  '7': { label: 'Node 7', width: 100, height: 50 },
  '8': { label: 'Node 8', width: 100, height: 50 },
  '9': { label: 'Node 9', width: 100, height: 50 },
};

type BaseElementWithData = (typeof initialElements)[string];

const INPUT_CLASSNAME =
  'block w-15 mr-2 p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500';
function RenderedRect({ label }: Readonly<BaseElementWithData>) {
  const elementRef = useRef<HTMLDivElement>(null);
  const { width, height } = useElementLayout();
  return (
    <foreignObject width={width} height={height}>
      <div ref={elementRef} className="node">
        {label}
      </div>
    </foreignObject>
  );
}

function Main() {
  const renderElement: RenderElement<BaseElementWithData> = useCallback(
    (props) => <RenderedRect {...props} />,
    []
  );
  const { graph } = useGraph();
  const { setElement } = useGraph();
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

  const makeLayout = useCallback(() => {
    makeLayoutWithGrid({ graph, gridXSize });
  }, [makeLayoutWithGrid, graph, gridXSize]);

  useElementsMeasuredEffect(paperId, makeLayout);

  const elementsLength = useElements((items) => Object.keys(items).length);
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
              label: `Node ${elementsLength + 1}`,
              width: 100,
              height: 50,
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
    <GraphProvider elements={initialElements}>
      <Main />
    </GraphProvider>
  );
}
