/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import '../index.css';
import { useCallback } from 'react';
import type { InferElement } from '../../../utils/create';
import { createElements, createLinks } from '../../../utils/create';
import { useUpdateNodeSize } from '../../../hooks/use-update-node-size';
import { GraphProvider, Paper, type RenderElement } from '../../..';

const initialEdges = createLinks([{ id: 'e1-2', source: '1', target: '2' }]);

const initialElements = createElements([
  { id: '1', data: { label: 'Node 1' }, x: 100, y: 0 },
  { id: '2', data: { label: 'Node 2' }, x: 100, y: 200 },
]);

type BaseElementWithData = InferElement<typeof initialElements>;

function RenderedRect() {
  const rectRef = useUpdateNodeSize<SVGRectElement>();
  return <rect ref={rectRef} joint-selector="fo" width={50} height={50} fill="red" />;
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
