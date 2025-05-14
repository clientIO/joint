/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import '../index.css';
import { useCallback } from 'react';
import {
  createElements,
  createLinks,
  GraphProvider,
  MeasuredNode,
  Paper,
  type InferElement,
  type RenderElement,
} from '@joint/react';
import { PRIMARY, SECONDARY, LIGHT, PAPER_CLASSNAME } from 'storybook-config/theme';

const initialElements = createElements([
  { id: '1', label: 'Node 1', color: PRIMARY, x: 100, y: 10, width: 100, height: 50 },
  { id: '2', label: 'Node 2', color: SECONDARY, x: 100, y: 200, width: 100, height: 50 },
]);
const initialEdges = createLinks([
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    attrs: {
      line: {
        stroke: LIGHT,
      },
    },
  },
]);

type BaseElementWithData = InferElement<typeof initialElements>;

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
        interactive={false}
        scale={0.4}
        width="100%"
        className={PAPER_CLASSNAME}
        height="100%"
        renderElement={renderElement}
      />
    </div>
  );
}

function RenderElement({ width, height, label, color }: Readonly<BaseElementWithData>) {
  return (
    <foreignObject width={width} height={height}>
      <MeasuredNode>
        <div className="flex flex-col items-center rounded-sm" style={{ background: color }}>
          Example
          <div>{label}</div>
        </div>
      </MeasuredNode>
    </foreignObject>
  );
}
function Main() {
  return (
    <div className="flex flex-row relative">
      <Paper width="100%" className={PAPER_CLASSNAME} height={280} renderElement={RenderElement} />
      <MiniMap />
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider initialElements={initialElements} initialLinks={initialEdges}>
      <Main />
    </GraphProvider>
  );
}
