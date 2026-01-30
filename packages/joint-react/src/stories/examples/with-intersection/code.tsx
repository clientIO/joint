/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { GraphProvider, useElements, useGraph, Paper, useNodeSize, useCellId } from '@joint/react';
import '../index.css';
import { useRef } from 'react';
import type { dia } from '@joint/core';
import { PAPER_CLASSNAME } from 'storybook-config/theme';

const initialElements: Record<string, { label: string; x: number; y: number }> = {
  '1': { label: 'Node 1', x: 100, y: 0 },
  '2': { label: 'Node 2', x: 100, y: 200 },
  '3': { label: 'Node 3', x: 200, y: 100 },
  '4': { label: 'Node 4', x: 0, y: 100 },
};

type BaseElementWithData = (typeof initialElements)[string];

function ResizableNode({ label }: Readonly<BaseElementWithData>) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const graph = useGraph();
  const id = useCellId();
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
    <GraphProvider elements={initialElements}>
      <Main />
    </GraphProvider>
  );
}
