/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { LIGHT, PAPER_CLASSNAME, PRIMARY, TEXT } from 'storybook-config/theme';
import '../index.css';
import {
  GraphProvider,
  Paper,
  useNodeSize,
  type OnTransformElement,
  type RenderElement,
} from '@joint/react';
import { useCallback, useRef } from 'react';

const initialEdges: Record<string, { source: string; target: string; color: string }> = {
  'e1-2': {
    source: '1',
    target: '2',
    color: LIGHT,
  },
};

const initialElements: Record<string, { label: string; x: number; y: number }> = {
  '1': { label: 'Node 1', x: 100, y: 0 },
  '2': { label: 'Node 2', x: 100, y: 200 },
};

type BaseElementWithData = (typeof initialElements)[string];

function RenderedRect({ label }: Readonly<BaseElementWithData>) {
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

  const { width, height } = useNodeSize(textRef, { transform });

  return (
    <>
      <rect rx={cornerRadius} ry={cornerRadius} width={width} height={height} fill={PRIMARY} />
      <text
        ref={textRef}
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={TEXT}
        fontSize={14}
        fontWeight="bold"
      >
        {label}
      </text>
    </>
  );
}

function Main() {
  const renderElement: RenderElement<BaseElementWithData> = useCallback(
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
