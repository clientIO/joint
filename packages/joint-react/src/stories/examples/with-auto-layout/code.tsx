/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-shadow */
/* eslint-disable sonarjs/pseudo-random */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import '../index.css';
import {
  createElements,
  GraphProvider,
  MeasuredNode,
  Paper,
  useElements,
  useGraph,
  type InferElement,
  type OnLoadOptions,
  type RenderElement,
} from '@joint/react';
import { useCallback, useState } from 'react';
import { processElement } from '../../../utils/cell/set-cells';

const initialElements = createElements([
  { id: '1', data: { label: 'Node 1' } },
  { id: '2', data: { label: 'Node 2' } },
  { id: '3', data: { label: 'Node 3' } },
  { id: '4', data: { label: 'Node 4' } },
  { id: '5', data: { label: 'Node 5' } },
  { id: '6', data: { label: 'Node 6' } },
  { id: '7', data: { label: 'Node 7' } },
  { id: '8', data: { label: 'Node 8' } },
  { id: '9', data: { label: 'Node 9' } },
]);

type BaseElementWithData = InferElement<typeof initialElements>;

const INPUT_CLASSNAME =
  'block w-15 mr-2 p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500';
function RenderedRect({ width, height, data: { label } }: BaseElementWithData) {
  return (
    <foreignObject width={width} height={height}>
      <MeasuredNode>
        <div className="node">{label}</div>
      </MeasuredNode>
    </foreignObject>
  );
}

const PAPER_WIDTH = 1200;

function Main() {
  const renderElement: RenderElement<BaseElementWithData> = useCallback(
    (props) => <RenderedRect {...props} />,
    []
  );
  const graph = useGraph();

  // Number of elements per row
  const [gridXSize, setGridXSize] = useState(3);

  // Grid layout logic based on number of columns
  const makeLayout = useCallback(
    ({ graph }: OnLoadOptions) => {
      const gap = 20;
      const cols = Math.max(1, gridXSize); // avoid divide by 0
      const elements = graph.getElements();

      for (const [index, element] of elements.entries()) {
        const col = index % cols;
        const row = Math.floor(index / cols);

        const { width, height } = element.size();
        const x = col * (width + gap);
        const y = row * (height + gap);

        element.position(x, y);
      }
    },
    [gridXSize]
  );
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
            setGridXSize(Number(event.target.value));
          }}
          min={0}
        />

        <button
          onClick={() => {
            graph.addCell(
              processElement({
                id: `${Math.random()}`,
                data: { label: `Node ${elementsLength + 1}` },
              })
            );
          }}
          type="button"
          className="bg-blue-500 cursor-pointer hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Add Node
        </button>
      </div>
      <Paper
        width={PAPER_WIDTH}
        height={450}
        renderElement={renderElement}
        onElementSizeChange={makeLayout}
      />
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider defaultElements={initialElements}>
      <Main />
    </GraphProvider>
  );
}
