/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import {
  GraphProvider,
  Paper,
  type FlatLinkData,
  type RenderElement,
} from '@joint/react';
import { useCallback } from 'react';
import { HTMLNode } from 'storybook-config/decorators/with-simple-data';

const initialElements: Record<string, { label: string; x: number; y: number }> = {
  '1': { data: { label: 'Node 1' }, x: 100, y: 15 },
  '2': { data: { label: 'Node 2' }, x: 100, y: 200 },
};

const initialEdges: Record<string, FlatLinkData> = {
  'e1-2': {
    source: '1',
    target: '2',
    color: PRIMARY,
    width: 2,
    dasharray: '5,5',
  },
};

function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper className={PAPER_CLASSNAME} height={280} />
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
