/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import type { Meta, StoryObj } from '@storybook/react/*';
import { GraphProvider } from '../../components/graph-provider';
import type { RenderElement } from '../../components/paper';
import { Paper } from '../../components/paper';
import { HtmlElement } from '../../components/html-element';
import { useCallback } from 'react';
import type { InferElement } from '../../utils/create';
import { createElements, createLinks } from '../../utils/create';
import './index.css';
import { shapes, util } from '@joint/core';

export type Story = StoryObj<typeof GraphProvider>;
const meta: Meta<typeof GraphProvider> = {
  title: 'Examples/With custom link',
  component: GraphProvider,
};
export default meta;

const initialElements = createElements([
  { id: '1', data: { label: 'Node 1' }, x: 100, y: 0 },
  { id: '2', data: { label: 'Node 2' }, x: 100, y: 200 },
]);
const initialEdges = createLinks([{ id: 'e1-2', source: '1', target: '2' }]);

type BaseElementWithData = InferElement<typeof initialElements>;

class LinkModel extends shapes.standard.Link {
  defaults() {
    return util.defaultsDeep(
      {
        type: 'Link',
        attrs: {
          line: {
            stroke: 'blue', // Set stroke color
            strokeWidth: 10, // Set stroke width
            strokeDasharray: '5,5', // Makes the line da
          },
        },
      },
      super.defaults
    );
  }
}
function Main() {
  const renderElement: RenderElement<BaseElementWithData> = useCallback(
    (element) => <HtmlElement className="node">{element.data.label}</HtmlElement>,
    []
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper defaultLink={() => new LinkModel()} width={400} renderElement={renderElement} />
    </div>
  );
}
export const Default: Story = {
  args: {
    defaultElements: initialElements,
    defaultLinks: initialEdges,
  },
  render: (props) => {
    return (
      <GraphProvider {...props}>
        <Main />
      </GraphProvider>
    );
  },
};
