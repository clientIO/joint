/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import React from 'react';
import {
  GraphProvider,
  Paper,
  useElementSize,
  useMeasureNode,
  type Element,
  type Link,
} from '@joint/react';
import '../../examples/index.css';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';

// define element type with custom properties
type ElementData = { label: string };

// define initial elements as Record
const initialElements: Record<string, Element<ElementData>> = {
  '1': { data: { label: 'Hello' }, position: { x: 100, y: 15 }, size: { width: 100, height: 50 } },
  '2': { data: { label: 'World' }, position: { x: 100, y: 200 }, size: { width: 100, height: 50 } },
};

// define initial edges as Record
const initialEdges: Record<string, Link> = {
  'e1-2': {
    source: '1',
    target: '2',
    color: PRIMARY,
    width: 2,
  },
};
function RenderItem({ label }: Readonly<ElementData>) {
  const { width, height } = useElementSize();
  const elementRef = React.useRef<HTMLDivElement>(null);
  useMeasureNode(elementRef);
  return (
    <foreignObject width={width} height={height}>
      <div ref={elementRef} className="node">
        {label}
      </div>
    </foreignObject>
  );
}

function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper className={PAPER_CLASSNAME} height={280} renderElement={RenderItem} />
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider links={initialEdges} elements={initialElements}>
      <Main />
    </GraphProvider>
  );
}
