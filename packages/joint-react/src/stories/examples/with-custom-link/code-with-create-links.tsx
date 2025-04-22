/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { PRIMARY } from 'storybook-config/theme';
import { shapes, util } from '@joint/core';
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

const initialElements = createElements([
  { id: '1', data: { label: 'Node 1' }, x: 100, y: 0 },
  { id: '2', data: { label: 'Node 2' }, x: 100, y: 200 },
]);
const initialEdges = createLinks([
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'LinkModel',
    attrs: {
      line: {
        stroke: PRIMARY,
      },
    },
  },
]);

class LinkModel extends shapes.standard.Link {
  defaults() {
    return util.defaultsDeep(super.defaults, {
      type: 'asd',
      attrs: {
        line: {
          stroke: PRIMARY, // Set stroke color
          strokeWidth: 10, // Set stroke width
          strokeDasharray: '5,5', // Makes the line da
        },
      },
    });
  }
}

type BaseElementWithData = InferElement<typeof initialElements>;

function Main() {
  const renderElement: RenderElement<BaseElementWithData> = useCallback(
    (element) => <HTMLNode className="node">{element.data.label}</HTMLNode>,
    []
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper
        defaultLink={() => new LinkModel()}
        width={400}
        height={280}
        renderElement={renderElement}
      />
    </div>
  );
}

export default function App(props: Readonly<GraphProps>) {
  return (
    <GraphProvider
      {...props}
      defaultLinks={initialEdges}
      defaultElements={initialElements}
      cellNamespace={{ LinkModel }}
    >
      <Main />
    </GraphProvider>
  );
}
