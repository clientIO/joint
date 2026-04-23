import {
  GraphProvider,
  Paper,
  HTMLBox,
  type Cells,
} from '@joint/react';
import { elementPort } from '@joint/react/presets';
import { PAPER_CLASSNAME, PRIMARY, SECONDARY } from 'storybook-config/theme';
import '../index.css';

const PORT_SIZE = 12;

const inPort = elementPort({ width: PORT_SIZE, height: PORT_SIZE, color: SECONDARY, passive: true });
const outPort = elementPort({ width: PORT_SIZE, height: PORT_SIZE, color: PRIMARY });

interface NodeData {
  readonly label: string;
}

const initialCells: Cells<NodeData> = [
  {
    id: 'a',
    type: 'ElementModel',
    data: { label: 'Node A' },
    position: { x: 50, y: 80 },
    size: { width: 120, height: 60 },
    ports: {
      groups: {
        in: { position: { name: 'left' }, ...inPort },
        out: { position: { name: 'right' }, ...outPort },
      },
      items: [
        { id: 'in1', group: 'in' },
        { id: 'in2', group: 'in' },
        { id: 'out1', group: 'out' },
      ],
    },
  },
  {
    id: 'b',
    type: 'ElementModel',
    data: { label: 'Node B' },
    position: { x: 350, y: 50 },
    size: { width: 120, height: 80 },
    ports: {
      groups: {
        in: { position: { name: 'left' }, ...inPort },
        out: { position: { name: 'right' }, ...outPort },
      },
      items: [
        { id: 'in1', group: 'in' },
        { id: 'out1', group: 'out' },
        { id: 'out2', group: 'out' },
      ],
    },
  },
  {
    id: 'c',
    type: 'ElementModel',
    data: { label: 'Node C' },
    position: { x: 350, y: 220 },
    size: { width: 120, height: 60 },
    ports: {
      groups: {
        in: { position: { name: 'left' }, ...inPort },
        out: { position: { name: 'right' }, ...outPort },
      },
      items: [
        { id: 'in1', group: 'in' },
        { id: 'out1', group: 'out' },
      ],
    },
  },
  {
    id: 'a-b',
    type: 'LinkModel',
    source: { id: 'a', port: 'out1' },
    target: { id: 'b', port: 'in1' },
    style: { color: PRIMARY, targetMarker: 'arrow' },
  },
  {
    id: 'b-c',
    type: 'LinkModel',
    source: { id: 'b', port: 'out1' },
    target: { id: 'c', port: 'in1' },
    style: { color: SECONDARY, targetMarker: 'arrow' },
  },
];

function RenderElement(data: NodeData | undefined) {
  return <HTMLBox useModelGeometry>{data?.label}</HTMLBox>;
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Paper
        className={PAPER_CLASSNAME}
        height={380}
        renderElement={RenderElement}
      />
    </GraphProvider>
  );
}
