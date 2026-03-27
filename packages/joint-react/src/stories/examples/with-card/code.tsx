/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import '../index.css';
import { useCallback, useRef } from 'react';
import type { FlatElementData, OnTransformElement } from '@joint/react';
import {
  GraphProvider,
  Paper,
  useMeasureNode,
  type FlatLinkData,
  type RenderElement,
} from '@joint/react';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';

type Data = { label: string };
const initialElements: Record<string, FlatElementData<Data>> = {
  '1': { data: { label: 'Node 1' }, x: 100, y: 10 },
  '2': { data: { label: 'Node 2 with longer text' }, x: 250, y: 150 },
};

const initialEdges: Record<string, FlatLinkData> = {
  'e1-2': {
    source: '1',
    target: '2',
    color: PRIMARY,
  },
};

function Card({ label }: Readonly<Partial<Data>>) {
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
  const { width, height } = useMeasureNode(contentRef, {
    transform: transformSize,
  });

  const imageHeight = height - 2 * gap;
  const iconURL = `https://placehold.co/${imageWidth}x${imageHeight}`;
  const foWidth = Math.max(width - 2 * gap - imageWidth - gap, 0);
  const foHeight = Math.max(height - 2 * gap, 0);

  return (
    <>
      <rect width={width} height={height} fill="#999" stroke="#333" strokeWidth="2"></rect>
      {imageHeight > 0 && (
        <image href={iconURL} x={gap} y={gap} width={imageWidth} height={imageHeight} />
      )}
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
  const renderElement: RenderElement<Data> = useCallback((data) => {
    return <Card label={data.label} />;
  }, []);
  return <Paper className={PAPER_CLASSNAME} height={280} renderElement={renderElement} />;
}

export default function App() {
  return (
    <GraphProvider elements={initialElements} links={initialEdges}>
      <Main />
    </GraphProvider>
  );
}
