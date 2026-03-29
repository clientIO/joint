/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { PAPER_CLASSNAME } from 'storybook-config/theme';
import '../index.css';
import {
  GraphProvider,
  Paper,
  useMeasureNode,
  type PortalElementRecord,
  type PortalLinkRecord,
  type OnTransformElement,
  type RenderElement,
} from '@joint/react';
import { useCallback, useRef } from 'react';

const initialEdges: Record<string, PortalLinkRecord> = {
  'e1-2': {
    source: { id: '1' },
    target: { id: '2' },
  },
};

interface NodeData {
  readonly [key: string]: unknown;
  readonly label: string;
}

const initialElements: Record<string, PortalElementRecord<NodeData>> = {
  '1': { data: { label: 'Node 1' }, position: { x: 100, y: 15 } },
  '2': { data: { label: 'Node 2' }, position: { x: 100, y: 200 } },
};

function RenderedRect({ label }: Readonly<NodeData>) {
  const textMargin = 20;
  const cornerRadius = 5;
  const textRef = useRef<SVGTextElement>(null);

  const transform: OnTransformElement = useCallback(
    ({ width: measuredWidth, height: measuredHeight }) => {
      return {
        width: measuredWidth + textMargin,
        height: measuredHeight + textMargin,
      };
    },
    [textMargin]
  );

  const { width, height } = useMeasureNode(textRef, { transform });

  return (
    <>
      <rect
        rx={cornerRadius}
        ry={cornerRadius}
        width={width}
        height={height}
        stroke={'black'}
        fill={'white'}
      />
      <text
        ref={textRef}
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={'black'}
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
    (props) => <RenderedRect {...props} />,
    []
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
      <Paper className={PAPER_CLASSNAME} height={280} renderElement={renderElement} />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
        }}
      ></div>
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider elements={initialElements} links={initialEdges}>
      <Main />
    </GraphProvider>
  );
}
