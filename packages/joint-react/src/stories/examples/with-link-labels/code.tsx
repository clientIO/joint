import { useCallback } from 'react';
import {
  type PortalElementRecord,
  GraphProvider,
  Paper,
  useElementSize,
  type PortalLinkRecord,
  type RenderElement,
} from '@joint/react';
import { BG, LIGHT, PAPER_CLASSNAME, PRIMARY, SECONDARY } from 'storybook-config/theme';
import '../index.css';

interface ShapeData {
  readonly [key: string]: unknown;
  readonly label: string;
}

const INTERACTIVE_OPTIONS = { labelMove: true } as const;

const initialElements: Record<string, PortalElementRecord<ShapeData>> = {
  '1': { data: { label: 'Node 1' }, position: { x: 50, y: 50 }, size: { width: 100, height: 40 } },
  '2': { data: { label: 'Node 2' }, position: { x: 300, y: 50 }, size: { width: 100, height: 40 } },
  '3': { data: { label: 'Node 3' }, position: { x: 50, y: 200 }, size: { width: 100, height: 40 } },
  '4': {
    data: { label: 'Node 4' },
    position: { x: 300, y: 200 },
    size: { width: 100, height: 40 },
  },
};

const initialLinks: Record<string, PortalLinkRecord> = {
  'l1-2': {
    source: { id: '1' },
    target: { id: '2' },
    color: 'blue',
    targetMarker: 'arrow',
    labels: {
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
  'l1-4': {
    source: { id: '1' },
    target: { id: '4' },
    labels: {
      main: {
        text: 'Default style',
      },
    },
  },
  'l3-4': {
    source: { id: '3' },
    target: { id: '4' },
    labels: {
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
};

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
    <GraphProvider elements={initialElements} links={initialLinks}>
      <Main />
    </GraphProvider>
  );
}
