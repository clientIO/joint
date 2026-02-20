import { useCallback } from 'react';
import {
  type GraphElement,
  GraphProvider,
  Paper,
  type GraphLink,
  type RenderElement,
} from '@joint/react';
import { PAPER_CLASSNAME } from 'storybook-config/theme';
import '../index.css';

interface ShapeElement extends GraphElement {
  readonly label: string;
  readonly width: number;
  readonly height: number;
}

const initialElements: Record<string, ShapeElement> = {
  '1': { label: 'Node 1', x: 50, y: 50, width: 100, height: 40 },
  '2': { label: 'Node 2', x: 300, y: 50, width: 100, height: 40 },
  '3': { label: 'Node 3', x: 50, y: 200, width: 100, height: 40 },
  '4': { label: 'Node 4', x: 300, y: 200, width: 100, height: 40 },
};

const initialLinks: Record<string, GraphLink> = {
  'l1-2': {
    source: '1',
    target: '2',
    color: 'blue',
    targetMarker: 'arrow',
    labels: [
      {
        position: 0.5,
        text: 'Link 1-2',
        color: 'yellow',
        backgroundColor: 'gray',
        backgroundPadding: 10
      },
    ],
  },
  'l1-4': {
    source: '1',
    target: '4',
    labels: [{
      text: 'Link 1-4',
    }],
  },
  'l3-4': {
    source: '3',
    target: '4',
    labels: [{
      text: '+',
      position: 10,
    }, {
      text: '-',
      position: -10,
    }],
  }
};

function Shape({ label, width, height }: Readonly<ShapeElement>) {
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
  const renderElement: RenderElement<ShapeElement> = useCallback((data) => {
    return <Shape {...data} />;
  }, []);

  return (
    <Paper
      width="100%"
      height={350}
      className={PAPER_CLASSNAME}
      renderElement={renderElement}
      interactive={{
        labelMove: true
      }}
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
