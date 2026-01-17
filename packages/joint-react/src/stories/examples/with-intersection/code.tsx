/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import {
  createElements,
  GraphProvider,
  useElements,
  useGraph,
  Paper,
  useNodeSize,
  type InferElement,
} from '@joint/react';
import '../index.css';
import { useRef } from 'react';
import type { dia } from '@joint/core';
import { PAPER_CLASSNAME } from 'storybook-config/theme';

const initialElements = createElements([
  { id: '1', label: 'Node 1', x: 100, y: 0 },
  { id: '2', label: 'Node 2', x: 100, y: 200 },
  { id: '3', label: 'Node 3', x: 200, y: 100 },
  { id: '4', label: 'Node 4', x: 0, y: 100 },
]);

type BaseElementWithData = InferElement<typeof initialElements>;

function ResizableNode({ id, label }: Readonly<BaseElementWithData>) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const graph = useGraph();
  const element = graph.getCell(id) as dia.Element;

  const isIntersected = useElements(() => {
    return graph.findElementsUnderElement(element).length > 0;
  });

  const { width, height } = useNodeSize(nodeRef);

  return (
    <foreignObject width={width} height={height}>
      <div ref={nodeRef} className={`node ${isIntersected ? 'intersected' : ''}`}>
        {label}
      </div>
    </foreignObject>
  );
}

function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
      <Paper width="100%" className={PAPER_CLASSNAME} height={280} renderElement={ResizableNode} />
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider areBatchUpdatesDisabled elements={initialElements}>
      <Main />
    </GraphProvider>
  );
}
