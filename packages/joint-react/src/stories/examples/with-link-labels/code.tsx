import { type CellRecord, GraphProvider, Paper } from '@joint/react';
import { LIGHT, PAPER_CLASSNAME, PRIMARY, SECONDARY } from 'storybook-config/theme';
import '../index.css';

interface ShapeData {
  readonly [key: string]: unknown;
  readonly label: string;
}

const INTERACTIVE_OPTIONS = { labelMove: true } as const;

const initialCells: ReadonlyArray<CellRecord<ShapeData>> = [
  { id: '1', type: 'element', data: { label: 'Node 1' }, position: { x: 50, y: 50 }, size: { width: 100, height: 40 } },
  { id: '2', type: 'element', data: { label: 'Node 2' }, position: { x: 300, y: 50 }, size: { width: 100, height: 40 } },
  { id: '3', type: 'element', data: { label: 'Node 3' }, position: { x: 50, y: 200 }, size: { width: 100, height: 40 } },
  {
    id: '4',
    type: 'element',
    data: { label: 'Node 4' },
    position: { x: 300, y: 200 },
    size: { width: 100, height: 40 },
  },
  {
    id: 'l1-2',
    type: 'link',
    source: { id: '1' },
    target: { id: '2' },
    style: { color: 'blue', targetMarker: 'arrow' },
    labelMap: {
      main: {
        position: 0.5,
        text: 'Link 1-2',
        color: 'blue',
        backgroundShape: 'rect',
        backgroundColor: 'white',
        backgroundOutline: 'none',
        backgroundPadding: 5,
      },
    },
  },
  {
    id: 'l1-4',
    type: 'link',
    source: { id: '1' },
    target: { id: '4' },
    labelMap: {
      main: {
        text: 'Default style',
      },
    },
  },
  {
    id: 'l3-4',
    type: 'link',
    source: { id: '3' },
    target: { id: '4' },
    labelMap: {
      plus: {
        text: '+',
        position: 15,
        color: 'black',
        backgroundShape: 'M -10 -10 L 10 -10 L 10 10 L -10 10 Z',
        backgroundOutline: SECONDARY,
        backgroundOutlineWidth: 2,
        backgroundColor: LIGHT,
      },
      minus: {
        text: '-',
        position: -15,
        color: 'black',
        backgroundShape: 'M -10 -10 L 10 -10 L 10 10 L -10 10 Z',
        backgroundOutline: PRIMARY,
        backgroundOutlineWidth: 2,
        backgroundColor: LIGHT,
      },
    },
  },
];

function Main() {
  return (
    <Paper
      width="100%"
      height={350}
      className={PAPER_CLASSNAME}
      interactive={INTERACTIVE_OPTIONS}
    />
  );
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
