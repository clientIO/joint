import {
  type CellRecord,
  GraphProvider,
  HTMLBox,
  Paper,
  elementPorts,
  linkRoutingStraight,
} from '@joint/react';

const PRIMARY = '#ED2637';
const SECONDARY = '#FF9505';
const TERTIARY = '#3F84E5';
const QUATERNARY = '#17B890';

const PORT_SIZE = 32;
const HALF_PORT_SIZE = PORT_SIZE / 2;

// Path shapes are drawn around the port center.
const TRIANGLE_PATH = `M ${-HALF_PORT_SIZE} ${-HALF_PORT_SIZE} L ${HALF_PORT_SIZE} 0 L ${-HALF_PORT_SIZE} ${HALF_PORT_SIZE} Z`;
const DIAMOND_PATH = `M 0 ${-HALF_PORT_SIZE} L ${HALF_PORT_SIZE} 0 L 0 ${HALF_PORT_SIZE} L ${-HALF_PORT_SIZE} 0 Z`;

const STRAIGHT_LINKS = linkRoutingStraight();

const PORT_STYLE = { width: PORT_SIZE, height: PORT_SIZE, passive: true };

interface NodeData {
  readonly label: string;
}

// Each link ends on the boundary of the port shape it points to: the ellipse,
// the rectangle and the two paths - not on the bounding box of the port.
const initialCells: ReadonlyArray<CellRecord<NodeData>> = [
  {
    id: 'hub',
    type: 'element',
    data: { label: 'Drag me' },
    position: { x: 250, y: 190 },
    size: { width: 180, height: 100 },
    ports: elementPorts(
      {
        ellipse: { cx: 0, cy: 0, shape: 'ellipse', color: PRIMARY },
        rect: { cx: 'calc(w)', cy: 0, shape: 'rect', color: SECONDARY },
        triangle: { cx: 0, cy: 'calc(h)', shape: TRIANGLE_PATH, color: TERTIARY },
        diamond: { cx: 'calc(w)', cy: 'calc(h)', shape: DIAMOND_PATH, color: QUATERNARY },
      },
      PORT_STYLE
    ),
  },
  {
    id: 'a',
    type: 'element',
    data: { label: 'Ellipse' },
    position: { x: 40, y: 30 },
    size: { width: 100, height: 40 },
  },
  {
    id: 'b',
    type: 'element',
    data: { label: 'Rectangle' },
    position: { x: 540, y: 60 },
    size: { width: 100, height: 40 },
  },
  {
    id: 'c',
    type: 'element',
    data: { label: 'Triangle' },
    position: { x: 30, y: 400 },
    size: { width: 100, height: 40 },
  },
  {
    id: 'd',
    type: 'element',
    data: { label: 'Diamond' },
    position: { x: 520, y: 420 },
    size: { width: 100, height: 40 },
  },
  {
    id: 'a-hub',
    type: 'link',
    source: { id: 'a' },
    target: { id: 'hub', port: 'ellipse' },
    style: { color: PRIMARY, targetMarker: 'arrow' },
  },
  {
    id: 'b-hub',
    type: 'link',
    source: { id: 'b' },
    target: { id: 'hub', port: 'rect' },
    style: { color: SECONDARY, targetMarker: 'arrow' },
  },
  {
    id: 'c-hub',
    type: 'link',
    source: { id: 'c' },
    target: { id: 'hub', port: 'triangle' },
    style: { color: TERTIARY, targetMarker: 'arrow' },
  },
  {
    id: 'd-hub',
    type: 'link',
    source: { id: 'd' },
    target: { id: 'hub', port: 'diamond' },
    style: { color: QUATERNARY, targetMarker: 'arrow' },
  },
];

function RenderElement({ label }: Readonly<NodeData>) {
  return (
    <HTMLBox className="jj-node" useModelGeometry>
      {label}
    </HTMLBox>
  );
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Paper className="size-full" renderElement={RenderElement} linkRouting={STRAIGHT_LINKS} />
    </GraphProvider>
  );
}
