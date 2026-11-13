import { type dia, g } from '@joint/core';
import { type CellRecord, GraphProvider, Paper, linkRoutingStraight } from '@joint/react';

const NODE_WIDTH = 150;
const NODE_HEIGHT = 90;
const NODE_SIZE = { width: NODE_WIDTH, height: NODE_HEIGHT };

// Colors — unified dark diagram palette.
const NODE_FILL_COLOR = '#1c2836';
const NODE_STROKE_COLOR = '#3c4f63';
const TEXT_COLOR = '#DDE6ED';
const LINK_COLOR = '#ED2637';

const RHOMBUS_POINTS = [
  { x: NODE_WIDTH / 2, y: 0 },
  { x: NODE_WIDTH, y: NODE_HEIGHT / 2 },
  { x: NODE_WIDTH / 2, y: NODE_HEIGHT },
  { x: 0, y: NODE_HEIGHT / 2 },
];
const RHOMBUS_POINTS_ATTRIBUTE = RHOMBUS_POINTS.map(({ x, y }) => `${x},${y}`).join(' ');

const STRAIGHT_LINKS = linkRoutingStraight();

// Arrows on both ends show where each link meets the shape.
const LINK_STYLE = { color: LINK_COLOR, sourceMarker: 'arrow', targetMarker: 'arrow' } as const;

type NodeShape = 'ellipse' | 'rhombus' | 'rect';

interface NodeData {
  readonly label: string;
  readonly shape: NodeShape;
}

// The geometry is relative to the top-left corner of the element. Returning
// `null` keeps the default: the rectangle of the element.
function elementGeometry({ model, port }: dia.Graph.ElementGeometryCallbackArgs): g.Shape | null {
  if (port !== null) return null;
  const { shape } = model.get('data') as NodeData;
  const { width, height } = model.size();
  switch (shape) {
    case 'ellipse': {
      return g.Ellipse.fromRect(new g.Rect(0, 0, width, height));
    }
    case 'rhombus': {
      return new g.Polygon(RHOMBUS_POINTS);
    }
    default: {
      return null;
    }
  }
}

const initialCells: ReadonlyArray<CellRecord<NodeData>> = [
  {
    id: 'ellipse',
    type: 'element',
    data: { label: 'Ellipse', shape: 'ellipse' },
    position: { x: 60, y: 40 },
    size: NODE_SIZE,
  },
  {
    id: 'rhombus',
    type: 'element',
    data: { label: 'Rhombus', shape: 'rhombus' },
    position: { x: 430, y: 90 },
    size: NODE_SIZE,
  },
  {
    id: 'rect',
    type: 'element',
    data: { label: 'Rectangle', shape: 'rect' },
    position: { x: 90, y: 330 },
    size: NODE_SIZE,
  },
  {
    id: 'rotated',
    type: 'element',
    data: { label: 'Rotated', shape: 'rhombus' },
    position: { x: 420, y: 340 },
    size: NODE_SIZE,
    angle: 30,
  },
  { id: 'l1', type: 'link', source: { id: 'ellipse' }, target: { id: 'rhombus' }, style: LINK_STYLE },
  { id: 'l2', type: 'link', source: { id: 'ellipse' }, target: { id: 'rotated' }, style: LINK_STYLE },
  { id: 'l3', type: 'link', source: { id: 'rect' }, target: { id: 'rhombus' }, style: LINK_STYLE },
  { id: 'l4', type: 'link', source: { id: 'rect' }, target: { id: 'rotated' }, style: LINK_STYLE },
  { id: 'l5', type: 'link', source: { id: 'ellipse' }, target: { id: 'rect' }, style: LINK_STYLE },
];

function NodeBody({ shape }: Readonly<Pick<NodeData, 'shape'>>) {
  if (shape === 'ellipse') {
    return (
      <ellipse
        cx={NODE_WIDTH / 2}
        cy={NODE_HEIGHT / 2}
        rx={NODE_WIDTH / 2}
        ry={NODE_HEIGHT / 2}
        stroke={NODE_STROKE_COLOR}
        fill={NODE_FILL_COLOR}
      />
    );
  }
  if (shape === 'rhombus') {
    return <polygon points={RHOMBUS_POINTS_ATTRIBUTE} stroke={NODE_STROKE_COLOR} fill={NODE_FILL_COLOR} />;
  }
  return <rect width={NODE_WIDTH} height={NODE_HEIGHT} stroke={NODE_STROKE_COLOR} fill={NODE_FILL_COLOR} />;
}

function RenderElement({ label, shape }: Readonly<NodeData>) {
  return (
    <>
      <NodeBody shape={shape} />
      <text
        x={NODE_WIDTH / 2}
        y={NODE_HEIGHT / 2}
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

export default function App() {
  return (
    <GraphProvider initialCells={initialCells} elementGeometry={elementGeometry}>
      <Paper className="size-full" renderElement={RenderElement} linkRouting={STRAIGHT_LINKS} />
    </GraphProvider>
  );
}
