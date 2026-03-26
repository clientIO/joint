import { useCallback } from 'react';
import {
  type FlatElementData,
  GraphProvider,
  Paper,
  useElementSize,
  type FlatLinkData,
  type RenderElement,
} from '@joint/react';
import { BG, LIGHT, PAPER_CLASSNAME, PRIMARY, SECONDARY } from 'storybook-config/theme';
import '../index.css';

interface ShapeData {
  readonly [key: string]: unknown;
  readonly label: string;
}

const INTERACTIVE_OPTIONS = { labelMove: true } as const;

const initialElements: Record<string, FlatElementData<ShapeData>> = {
  '1': { data: { label: 'Node 1' }, x: 50, y: 50, width: 100, height: 40 },
  '2': { data: { label: 'Node 2' }, x: 300, y: 50, width: 100, height: 40 },
  '3': { data: { label: 'Node 3' }, x: 50, y: 200, width: 100, height: 40 },
  '4': { data: { label: 'Node 4' }, x: 300, y: 200, width: 100, height: 40 },
};

const initialLinks: Record<string, FlatLinkData> = {
  'l1-2': {
    source: '1',
    target: '2',
    color: 'blue',
    targetMarker: 'arrow',
    labels: {
      main: {
        position: 0.5,
        text: 'Link 1-2',
        color: 'yellow',
        backgroundColor: 'gray',
        backgroundPadding: 10
      },
    },
  },
  'l1-4': {
    source: '1',
    target: '4',
    labels: {
      main: {
        text: 'Link 1-4',
      },
    },
  },
  'l3-4': {
    source: '3',
    target: '4',
    labels: {
      plus: {
        text: '+',
        position: 15,
        color: LIGHT,
        backgroundShape: 'M -10 -10 L 10 -10 L 10 10 L -10 10 Z',
        backgroundOutline: SECONDARY,
        backgroundOutlineWidth: 2,
        backgroundColor: BG,
      },
      minus: {
        text: '-',
        position: -15,
        color: LIGHT,
        backgroundShape: 'M -10 -10 L 10 -10 L 10 10 L -10 10 Z',
        backgroundOutline: PRIMARY,
        backgroundOutlineWidth: 2,
        backgroundColor: BG,
      },
    },
  }
};

function Shape({ label }: Readonly<ShapeData>) {
  const { width, height } = useElementSize();
  return (
    <>
      <rect width={width} height={height} rx={6} ry={6} fill="#ed2637" />
      <text
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#dde6ed"
        fontSize={13}
        fontFamily="sans-serif"
      >
        {label}
      </text>
    </>
  );
}

function Main() {
  const renderElement: RenderElement<ShapeData> = useCallback((data) => {
    return <Shape {...data} />;
  }, []);

  return (
    <Paper
      width="100%"
      height={350}
      className={PAPER_CLASSNAME}
      renderElement={renderElement}
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
