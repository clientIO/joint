/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import '../index.css';
import { useCallback, useRef } from 'react';
import type { OnTransformElement } from '@joint/react';
import {
  GraphProvider,
  Paper,
  useNodeSize,
  type GraphLink,
  type RenderElement,
} from '@joint/react';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';

const initialElements = [
  { id: '1', label: 'Node 1', x: 100, y: 0 },
  { id: '2', label: 'Node 2 with longer text', x: 250, y: 150 },
];

const initialEdges: GraphLink[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    attrs: {
      line: {
        stroke: PRIMARY,
      },
    },
  },
];

type BaseElementWithData = (typeof initialElements)[number];

function Card({ label }: Readonly<Partial<BaseElementWithData>>) {
  const contentRef = useRef<HTMLDivElement>(null);
  const gap = 10;
  const imageWidth = 50;
  const transformSize: OnTransformElement = useCallback(
    ({ x, y, width: measuredWidth, height: measuredHeight }) => {
      return {
        width: gap + imageWidth + gap + measuredWidth + gap,
        height: gap + Math.max(measuredHeight, imageWidth) + gap,
        x,
        y,
      };
    },
    []
  );
  const { width, height } = useNodeSize(contentRef, {
    transform: transformSize,
  });

  const imageHeight = height - 2 * gap;
  const iconURL = `https://placehold.co/${imageWidth}x${imageHeight}`;
  const foWidth = width - 2 * gap - imageWidth - gap;
  const foHeight = height - 2 * gap;

  return (
    <>
      <rect width={width} height={height} fill="#333" stroke="#eee" strokeWidth="2"></rect>
      <image href={iconURL} x={gap} y={gap} width={imageWidth} height={imageHeight} />
      <foreignObject x={gap + imageWidth + gap} y={gap} width={foWidth} height={foHeight}>
        <div
          ref={contentRef}
          style={{
            position: 'absolute',
            color: '#eee',
            maxWidth: '100px',
            overflow: 'hidden',
            overflowWrap: 'break-word',
          }}
        >
          {label}
        </div>
      </foreignObject>
    </>
  );
}

function Main() {
  const renderElement: RenderElement<BaseElementWithData> = useCallback((data) => {
    return <Card label={data.label} />;
  }, []);
  return (
    <Paper width="100%" className={PAPER_CLASSNAME} height={280} renderElement={renderElement} />
  );
}

export default function App() {
  return (
    <GraphProvider elements={initialElements} links={initialEdges}>
      <Main />
    </GraphProvider>
  );
}
