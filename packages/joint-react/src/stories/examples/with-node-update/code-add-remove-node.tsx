/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import {
  GraphProvider,
  Paper,
  useCellId,
  useElements,
  useGraph,
  useNodeSize,
  type GraphLink,
} from '@joint/react';
import '../index.css';
import { useRef } from 'react';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { useCellActions } from '../../../hooks/use-cell-actions';

const initialElements: Record<string, { label: string; color: string; x: number; y: number; width: number; height: number }> = {
  '1': { label: 'Node 1', color: '#ffffff', x: 40, y: 70, width: 120, height: 80 },
  '2': { label: 'Node 2', color: '#ffffff', x: 170, y: 120, width: 120, height: 80 },
  '3': { label: 'Node 2', color: '#ffffff', x: 30, y: 180, width: 120, height: 80 },
};

const initialEdges: Record<string, GraphLink> = {
  'e1-1': {
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

interface ElementInputProps extends BaseElementWithData {
  readonly id: string;
}

function ElementInput({ id, label }: Readonly<ElementInputProps>) {
  const { set } = useCellActions<BaseElementWithData>();
  return (
    <input
      style={{ padding: 5, marginTop: 4 }}
      value={label}
      onChange={(event) => set(id, (previous) => ({ ...previous, label: event.target.value }))}
      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
    />
  );
}

function RenderElement({ label }: Readonly<BaseElementWithData>) {
  const graph = useGraph();
  const id = useCellId();
  const elementRef = useRef<HTMLDivElement>(null);
  const { width, height } = useNodeSize(elementRef);
  return (
    <foreignObject width={width} height={height}>
      <div ref={elementRef} className="node flex flex-1 justify-center items-center w-30">
        <div className="flex flex-1 justify-center items-center py-2 flex-col mx-4">
          <span className="mb-1 text-sm">{label}</span>
          <button
            onClick={() => {
              graph.getCell(id).remove();
            }}
            type="button"
            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
          >
            Remove
          </button>
        </div>
      </div>
    </foreignObject>
  );
}

function Main() {
  const elements = useElements<BaseElementWithData>();
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper
        width="100%"
        className={PAPER_CLASSNAME}
        clickThreshold={10}
        interactive={{ linkMove: false }}
        defaultRouter={{ name: 'rightAngle', args: { margin: 40 } }}
        defaultConnector={{
          name: 'straight',
          args: { cornerType: 'line', cornerPreserveAspectRatio: true },
        }}
        defaultConnectionPoint={{
          name: 'boundary',
          args: {
            offset: 10,
            extrapolate: true,
          },
        }}
        height={380}
        renderElement={RenderElement}
      />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {Object.entries(elements).map(([id, item]) => {
          return <ElementInput key={id} id={id} {...item} />;
        })}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider elements={initialElements} links={initialEdges}>
      <Main />
    </GraphProvider>
  );
}
