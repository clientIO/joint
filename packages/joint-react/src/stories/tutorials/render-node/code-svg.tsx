/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import { PRIMARY } from 'storybook-config/theme';
import {
  createElements,
  createLinks,
  GraphProvider,
  Paper,
  type GraphProps,
  type InferElement,
} from '@joint/react';

// define initial elements
const initialElements = createElements([
  { id: '1', data: { color: PRIMARY }, x: 100, y: 0, width: 100, height: 25 },
  { id: '2', data: { color: PRIMARY }, x: 100, y: 200, width: 100, height: 25 },
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

function RenderItem({ width, height, data: { color } }: CustomElement) {
  return <rect rx={10} ry={10} width={width} height={height} fill={color} />;
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
