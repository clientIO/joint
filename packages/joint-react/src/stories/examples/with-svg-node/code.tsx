/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { PRIMARY } from 'storybook-config/theme';
import '../index.css';
import {
  createElements,
  createLinks,
  GraphProvider,
  MeasuredNode,
  Paper,
  type InferElement,
  type RenderElement,
} from '@joint/react';
import { useCallback } from 'react';

const initialEdges = createLinks([
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
]);

const initialElements = createElements([
  { id: '1', data: { label: 'Node 1' }, x: 100, y: 0 },
  { id: '2', data: { label: 'Node 2' }, x: 100, y: 200 },
]);

type BaseElementWithData = InferElement<typeof initialElements>;

function RenderedRect() {
  return (
    <MeasuredNode>
      <rect rx={10} ry={10} width={120} height={32} fill={PRIMARY} />
    </MeasuredNode>
  );
}

function Main() {
  const renderElement: RenderElement<BaseElementWithData> = useCallback(() => <RenderedRect />, []);
  return (
    <div style={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
      <Paper width={400} height={280} renderElement={renderElement} />
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
    <GraphProvider defaultElements={initialElements} defaultLinks={initialEdges}>
      <Main />
    </GraphProvider>
  );
}
