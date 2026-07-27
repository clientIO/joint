import { type CellRecord, GraphProvider, Paper } from '@joint/react';

// Colors — unified dark diagram palette.
const PRIMARY = '#ED2637';
const SECONDARY = '#FF9505';
const TEXT_COLOR = '#DDE6ED';
const LABEL_BACKGROUND_COLOR = '#1c2836';
const LABEL_OUTLINE_COLOR = '#3c4f63';
const LINK_COLOR = '#8697A6';

interface ShapeData {
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
    style: { color: LINK_COLOR, targetMarker: 'arrow' },
    labelMap: {
      main: {
        position: 0.5,
        text: 'Link 1-2',
        color: TEXT_COLOR,
        backgroundShape: 'ellipse',
        backgroundColor: LABEL_BACKGROUND_COLOR,
        backgroundOutline: LABEL_OUTLINE_COLOR,
        backgroundPadding: { horizontal: 12, vertical: 6 },
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
        color: TEXT_COLOR,
        backgroundShape: 'M -10 -10 L 10 -10 L 10 10 L -10 10 Z',
        backgroundOutline: SECONDARY,
        backgroundOutlineWidth: 2,
        backgroundColor: LABEL_BACKGROUND_COLOR,
      },
      minus: {
        text: '-',
        position: -15,
        color: TEXT_COLOR,
        backgroundShape: 'M -10 -10 L 10 -10 L 10 10 L -10 10 Z',
        backgroundOutline: PRIMARY,
        backgroundOutlineWidth: 2,
        backgroundColor: LABEL_BACKGROUND_COLOR,
      },
    },
  },
];

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Paper className="size-full" interactive={INTERACTIVE_OPTIONS} />
    </GraphProvider>
  );
}
