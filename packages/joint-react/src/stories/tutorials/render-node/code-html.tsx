/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import {
  createElements,
  createLinks,
  GraphProvider,
  MeasuredNode,
  Paper,
  type GraphProps,
  type InferElement,
} from '@joint/react';
import '../../examples/index.css';
import { PRIMARY } from 'storybook/theme';
// define initial elements
const initialElements = createElements([
  { id: '1', data: { label: 'Hello' }, x: 100, y: 0, width: 100, height: 25 },
  { id: '2', data: { label: 'World' }, x: 100, y: 200, width: 100, height: 25 },
]);

// define initial edges
const initialEdges = createLinks([
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
]);

// infer element type from the initial elements (this type can be used for later usage like RenderItem props)
type CustomElement = InferElement<typeof initialElements>;

function RenderItem({ data: { label }, width, height }: CustomElement) {
  return (
    <foreignObject width={width} height={height}>
      <MeasuredNode>
        <div className="node">{label}</div>
      </MeasuredNode>
    </foreignObject>
  );
}

function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper width={400} height={280} renderElement={RenderItem} />
    </div>
  );
}

export default function App(props: Readonly<GraphProps>) {
  return (
    <GraphProvider {...props} defaultLinks={initialEdges} defaultElements={initialElements}>
      <Main />
    </GraphProvider>
  );
}
