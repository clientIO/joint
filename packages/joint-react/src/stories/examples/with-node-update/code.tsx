/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { GraphProvider, Paper, useElements, useNodeSize, type GraphLink } from '@joint/react';
import '../index.css';
import { useRef } from 'react';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { useCellActions } from '../../../hooks/use-cell-actions';

const initialElements: Record<
  string,
  { label: string; color: string; x: number; y: number; width: number; height: number }
> = {
  '1': { label: 'Node 1', color: '#ffffff', x: 100, y: 0, width: 100, height: 50 },
  '2': { label: 'Node 2', color: '#ffffff', x: 100, y: 200, width: 100, height: 50 },
};

const initialEdges: Record<string, GraphLink> = {
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

function ElementInput({ id, label }: Readonly<BaseElementWithData & { id: string }>) {
  const { set } = useCellActions<BaseElementWithData>();
  return (
    <input
      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
      style={{ padding: 5, marginTop: 4 }}
      value={label}
      onChange={(event) => set(id, (previous) => ({ ...previous, label: event.target.value }))}
    />
  );
}

function RenderElement({ label }: Readonly<BaseElementWithData>) {
  const elementRef = useRef<HTMLDivElement>(null);
  const { width, height } = useNodeSize(elementRef);
  return (
    <foreignObject width={width} height={height}>
      <div ref={elementRef} className="node">
        {label}
      </div>
    </foreignObject>
  );
}

function Main() {
  const elements = useElements<BaseElementWithData>();
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper width="100%" className={PAPER_CLASSNAME} height={280} renderElement={RenderElement} />
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
