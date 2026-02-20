/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import '../index.css';
import { useCallback, useRef } from 'react';
import { GraphProvider, Paper, useNodeSize, type RenderElement } from '@joint/react';
import { PRIMARY, SECONDARY, LIGHT, PAPER_CLASSNAME } from 'storybook-config/theme';

const initialElements: Record<
  string,
  { label: string; color: string; x: number; y: number; width: number; height: number }
> = {
  '1': { label: 'Node 1', color: PRIMARY, x: 100, y: 10, width: 100, height: 50 },
  '2': { label: 'Node 2', color: SECONDARY, x: 100, y: 200, width: 100, height: 50 },
};
const initialEdges: Record<string, { source: string; target: string; color: string }> = {
  'e1-2': {
    source: '1',
    target: '2',
    color: LIGHT,
  },
};

type BaseElementWithData = (typeof initialElements)[string];

function MiniMap() {
  const renderElement: RenderElement<BaseElementWithData> = useCallback(
    ({ width, height, color }) => (
      <rect width={width} height={height} fill={color} rx={10} ry={10} />
    ),
    []
  );

  return (
    <div className="absolute bottom-4 right-6 w-[200px] h-[150px] border border-[#dde6ed] rounded-lg overflow-hidden">
      <Paper
        id="minimap"
        interactive={false}
        scale={0.4}
        className={PAPER_CLASSNAME}
        height="100%"
        renderElement={renderElement}
      />
    </div>
  );
}

function RenderElement({ width, height, label, color }: Readonly<BaseElementWithData>) {
  const elementRef = useRef<HTMLDivElement>(null);
  useNodeSize(elementRef);
  return (
    <foreignObject width={width} height={height}>
      <div
        ref={elementRef}
        className="flex flex-col items-center rounded-sm"
        style={{ background: color }}
      >
        Example
        <div>{label}</div>
      </div>
    </foreignObject>
  );
}
function Main() {
  return (
    <div className="flex flex-row relative">
      <Paper
        id="main-view"
        className={PAPER_CLASSNAME}
        height={280}
        renderElement={RenderElement}
      />
      <MiniMap />
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
