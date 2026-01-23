/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import {
  GraphProvider,
  Paper,
  type GraphProps,
  type GraphElement,
  type GraphLink,
} from '@joint/react';

// define element type with custom properties
type CustomElement = GraphElement & { color: string };

// define initial elements
const initialElements: CustomElement[] = [
  { id: '1', color: PRIMARY, x: 100, y: 0, width: 100, height: 25 },
  { id: '2', color: PRIMARY, x: 100, y: 200, width: 100, height: 25 },
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

function RenderItem({ width, height, color }: CustomElement) {
  return <rect rx={10} ry={10} width={width} height={height} fill={color} />;
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
