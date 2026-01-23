/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import React from 'react';
import {
  GraphProvider,
  Paper,
  type GraphProps,
  type GraphElement,
  type GraphLink,
  useNodeSize,
} from '@joint/react';
import '../../examples/index.css';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';

// define element type with custom properties
type CustomElement = GraphElement & { label: string };

// define initial elements
const initialElements: CustomElement[] = [
  { id: '1', label: 'Hello', x: 100, y: 0, width: 100, height: 50 },
  { id: '2', label: 'World', x: 100, y: 200, width: 100, height: 50 },
];

// define initial edges
const initialEdges: GraphLink[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'standard.Link', // if define type, it provide intellisense support
    attrs: {
      line: {
        stroke: PRIMARY,
        strokeWidth: 2,
      },
    },
  },
];
function RenderItem(props: CustomElement) {
  const { label, width, height } = props;
  const elementRef = React.useRef<HTMLDivElement>(null);
  useNodeSize(elementRef);
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
      <Paper width="100%" className={PAPER_CLASSNAME} height={280} renderElement={RenderItem} />
    </div>
  );
}

export default function App(props: Readonly<GraphProps>) {
  return (
    <GraphProvider {...props} links={initialEdges} elements={initialElements}>
      <Main />
    </GraphProvider>
  );
}
