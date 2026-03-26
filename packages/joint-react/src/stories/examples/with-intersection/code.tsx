/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { GraphProvider, useElements, useGraph, Paper, useMeasureNode, useElementId, type FlatElementData } from '@joint/react';
import '../index.css';
import { useRef } from 'react';
import type { dia } from '@joint/core';
import { PAPER_CLASSNAME } from 'storybook-config/theme';

interface NodeData {
  readonly [key: string]: unknown;
  readonly label: string;
}

const initialElements: Record<string, FlatElementData<NodeData>> = {
  '1': { data: { label: 'Node 1' }, x: 100, y: 15 },
  '2': { data: { label: 'Node 2' }, x: 100, y: 200 },
  '3': { data: { label: 'Node 3' }, x: 200, y: 100 },
  '4': { data: { label: 'Node 4' }, x: 15, y: 100 },
};

function ResizableNode({ label }: Readonly<NodeData>) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const { graph } = useGraph();
  const id = useElementId();
  const element = graph.getCell(id) as dia.Element;

  const isIntersected = useElements(() => {
    return graph.findElementsUnderElement(element).length > 0;
  });

  const { width, height } = useMeasureNode(nodeRef);

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
      <Paper className={PAPER_CLASSNAME} renderElement={ResizableNode} />
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider elements={initialElements}>
      <Main />
    </GraphProvider>
  );
}
