/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import {
  GraphProvider,
  Paper,
  type GraphProps,
  type FlatElementData,
  type FlatLinkData,
} from '@joint/react';

// define element type with custom properties
type CustomElement = FlatElementData & { color: string };

// define initial elements as Record
const initialElements: Record<string, CustomElement> = {
  '1': { color: PRIMARY, x: 100, y: 15, width: 100, height: 25 },
  '2': { color: PRIMARY, x: 100, y: 200, width: 100, height: 25 },
};

// define initial edges as Record
const initialEdges: Record<string, FlatLinkData> = {
  'e1-2': {
    source: '1',
    target: '2',
    color: PRIMARY,
    width: 2,
  },
};

function RenderItem({ width, height, color }: CustomElement) {
  return <rect rx={10} ry={10} width={width} height={height} fill={color} />;
}

function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper className={PAPER_CLASSNAME} height={280} renderElement={RenderItem} />
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
