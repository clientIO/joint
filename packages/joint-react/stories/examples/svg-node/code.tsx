import {
  type CellRecord,
  GraphProvider,
  Paper,
  useMeasureElement,
  type TransformElementLayout,
  type RenderElement,
} from '@joint/react';
import { useCallback, useRef } from 'react';

const TEXT_MARGIN = 20;
const CORNER_RADIUS = 5;

// Colors — unified dark diagram palette.
const NODE_FILL_COLOR = '#1c2836';
const NODE_STROKE_COLOR = '#3c4f63';
const TEXT_COLOR = '#DDE6ED';

interface NodeData {
  readonly label: string;
}

const initialCells: ReadonlyArray<CellRecord<NodeData>> = [
  { id: '1', type: 'element', data: { label: 'Node 1' }, position: { x: 100, y: 15 } },
  { id: '2', type: 'element', data: { label: 'Node 2' }, position: { x: 100, y: 200 } },
  { id: 'e1-2', type: 'link', source: { id: '1' }, target: { id: '2' } },
];

const growAroundText: TransformElementLayout = ({ width, height }) => ({
  width: width + TEXT_MARGIN,
  height: height + TEXT_MARGIN,
});

function RenderedRect({ label }: Readonly<NodeData>) {
  const textRef = useRef<SVGTextElement>(null);
  const { width, height } = useMeasureElement(textRef, { transform: growAroundText });

  return (
    <>
      <rect
        rx={CORNER_RADIUS}
        ry={CORNER_RADIUS}
        width={width}
        height={height}
        stroke={NODE_STROKE_COLOR}
        fill={NODE_FILL_COLOR}
      />
      <text
        ref={textRef}
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={TEXT_COLOR}
        fontSize={14}
        fontWeight="bold"
      >
        {label}
      </text>
    </>
  );
}

function Main() {
  const renderElement: RenderElement<NodeData> = useCallback(
    (data) => <RenderedRect label={data.label ?? ''} />,
    []
  );
  return <Paper className="size-full" renderElement={renderElement} />;
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
