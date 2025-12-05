/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import {
  createElements,
  createLinks,
  GraphProvider,
  Paper,
  type GraphProps,
  type InferElement,
  type RenderElement,
} from '@joint/react';
import { useCallback } from 'react';
import { HTMLNode } from 'storybook-config/decorators/with-simple-data';
import type { dia } from '@joint/core';

const initialElements = createElements([
  { id: '1', label: 'Node 1', x: 100, y: 0 },
  { id: '2', label: 'Node 2', x: 100, y: 200 },
]);
const initialEdges = createLinks([
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    attrs: {
      line: {
        stroke: PRIMARY,
        strokeWidth: 2,
        strokeDasharray: '5,5',
      },
    },
  },
]);

type BaseElementWithData = InferElement<typeof initialElements>;
type CustomLink = (typeof initialEdges)[number];

function Main() {
  const renderElement: RenderElement<BaseElementWithData> = useCallback(
    (element) => <HTMLNode className="node">{element.label}</HTMLNode>,
    []
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper width="100%" className={PAPER_CLASSNAME} height={280} renderElement={renderElement} />
    </div>
  );
}

export default function App(
  props: Readonly<GraphProps<dia.Graph, BaseElementWithData, CustomLink>>
) {
  return (
    <GraphProvider {...props} links={initialEdges} elements={initialElements}>
      <Main />
    </GraphProvider>
  );
}
