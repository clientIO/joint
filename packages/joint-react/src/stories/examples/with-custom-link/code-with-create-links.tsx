/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import {
  GraphProvider,
  Paper,
  type FlatLinkData,
  type GraphProps,
  type RenderElement,
} from '@joint/react';
import { useCallback } from 'react';
import { HTMLNode } from 'storybook-config/decorators/with-simple-data';

const initialElements: Record<string, { label: string; x: number; y: number }> = {
  '1': { label: 'Node 1', x: 100, y: 15 },
  '2': { label: 'Node 2', x: 100, y: 200 },
};

const initialEdges: Record<string, FlatLinkData> = {
  'e1-2': {
    source: '1',
    target: '2',
    color: PRIMARY,
    strokeWidth: 2,
    strokeDashArray: '5,5',
  },
};

type BaseElementWithData = (typeof initialElements)[string];

function Main() {
  const renderElement: RenderElement<BaseElementWithData> = useCallback(
    (element) => <HTMLNode className="node">{element.label}</HTMLNode>,
    []
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper className={PAPER_CLASSNAME} height={280} renderElement={renderElement} />
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
